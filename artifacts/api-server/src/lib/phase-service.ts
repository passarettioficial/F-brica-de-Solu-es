import { eq, and, inArray, desc, isNull } from "drizzle-orm";
import type { Request } from "express";
import {
  db, projectsTable, phasesTable, phaseArtifactsTable, artifactVersionsTable, usersTable, artifactFeedbackTable,
  type Project, type Phase, type PhaseArtifact,
} from "@workspace/db";
import { generatePhaseArtifacts, type PhaseAIResult } from "./ai";
import { logEvent } from "./events";
import { checkAndIncrementAiUsage, aiLimitPayload, trialExpiredPayload } from "./auth";
import { auditLog } from "./audit";
import { createNotification } from "./notifications";
import { getPlanConfig } from "./stripe";
import { snapshotArtifact, snapshotAllPhaseArtifacts } from "./artifact-versions";

/**
 * Business logic for phase execution, gating, artifacts, and versioning — kept separate
 * from the Express route handlers in routes/phases.ts. Routes stay thin: parse the request,
 * call one of these, translate the result to an HTTP response. The one exception is the SSE
 * generation stream itself (progress/done/error events), which stays in the route since
 * writing to `res` is inherently an HTTP transport concern.
 */

export type ServiceResult<T> =
  | { ok: true; data: T }
  | { ok: false; status: number; error: string; code?: string; body?: Record<string, unknown> };

// Phase 3 (Segurança & LGPD) gating: free plan only unlocks POLITICA_PRIVACIDADE.
// Strips content/contentJson server-side from the other 7 artifacts and marks locked.
// Apply to ALL endpoints that return artifact rows so locking can't be bypassed via alternate routes.
export async function applyPhase3FreeGate<T extends { artifactKey: string; content?: string | null; contentJson?: unknown }>(
  clerkId: string,
  phaseNumber: number,
  artifacts: T[],
): Promise<(T & { locked?: boolean })[]> {
  if (phaseNumber !== 3) return artifacts;
  const [userForPlan] = await db
    .select({ plan: usersTable.plan, isSuperuser: usersTable.isSuperuser })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));
  const planCfg = getPlanConfig(userForPlan?.plan ?? "free", userForPlan?.isSuperuser ?? false);
  if (planCfg.id !== "free") return artifacts;
  return artifacts.map((a) =>
    a.artifactKey === "POLITICA_PRIVACIDADE"
      ? a
      : { ...a, content: "", contentJson: null, locked: true },
  );
}

export function isPhase3GatedKey(artifactKey: string): boolean {
  return artifactKey !== "POLITICA_PRIVACIDADE";
}

async function isFreePlan(clerkId: string): Promise<boolean> {
  const [userForPlan] = await db
    .select({ plan: usersTable.plan, isSuperuser: usersTable.isSuperuser })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));
  const planCfg = getPlanConfig(userForPlan?.plan ?? "free", userForPlan?.isSuperuser ?? false);
  return planCfg.id === "free";
}

// Escopo de ownership padrão: projeto pertence ao usuário E não está na lixeira.
// Projetos soft-deleted não devem continuar gerando IA, completando fases, sendo
// editados ou recebendo feedback — a lixeira precisa ser uma lixeira de verdade.
function ownedActiveProject(projectId: number, clerkId: string) {
  return and(
    eq(projectsTable.id, projectId),
    eq(projectsTable.clerkId, clerkId),
    isNull(projectsTable.deletedAt),
  );
}

async function requireProjectAndPhase(clerkId: string, projectId: number, phaseNumber: number): Promise<ServiceResult<{ project: Project; phase: Phase }>> {
  const [project] = await db.select().from(projectsTable).where(
    ownedActiveProject(projectId, clerkId),
  );
  if (!project) return { ok: false, status: 404, error: "Project not found" };

  const [phase] = await db.select().from(phasesTable).where(
    and(eq(phasesTable.projectId, projectId), eq(phasesTable.phaseNumber, phaseNumber)),
  );
  if (!phase) return { ok: false, status: 404, error: "Phase not found" };

  return { ok: true, data: { project, phase } };
}

async function requireEditPlan(clerkId: string, deniedMessage: string): Promise<ServiceResult<never> | null> {
  const [userForPlan] = await db
    .select({ plan: usersTable.plan, isSuperuser: usersTable.isSuperuser })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));
  const planCfg = getPlanConfig(userForPlan?.plan ?? "free", userForPlan?.isSuperuser ?? false);
  if (planCfg.canCopy) return null;
  const body = { error: deniedMessage, requiresUpgrade: true, code: "EDIT_REQUIRES_PAID_PLAN" };
  return { ok: false, status: 402, error: body.error, code: body.code, body };
}

// ─── Phase + artifacts ───────────────────────────────────────────────────────

export async function getPhaseWithArtifacts(clerkId: string, projectId: number, phaseNumber: number): Promise<ServiceResult<Phase & { artifacts: unknown[] }>> {
  const ctx = await requireProjectAndPhase(clerkId, projectId, phaseNumber);
  if (!ctx.ok) return ctx;

  const artifacts = await db.select().from(phaseArtifactsTable).where(eq(phaseArtifactsTable.phaseId, ctx.data.phase.id));
  const visibleArtifacts = await applyPhase3FreeGate(clerkId, phaseNumber, artifacts);
  return { ok: true, data: { ...ctx.data.phase, artifacts: visibleArtifacts } };
}

export async function listPhaseArtifacts(clerkId: string, projectId: number, phaseNumber: number): Promise<ServiceResult<unknown[]>> {
  const ctx = await requireProjectAndPhase(clerkId, projectId, phaseNumber);
  if (!ctx.ok) return ctx;

  const artifacts = await db.select().from(phaseArtifactsTable).where(eq(phaseArtifactsTable.phaseId, ctx.data.phase.id));
  const visibleArtifacts = await applyPhase3FreeGate(clerkId, phaseNumber, artifacts);
  return { ok: true, data: visibleArtifacts };
}

export async function updatePhaseGates(clerkId: string, projectId: number, phaseNumber: number, data: Record<string, unknown>): Promise<ServiceResult<Phase>> {
  const [project] = await db.select().from(projectsTable).where(ownedActiveProject(projectId, clerkId));
  if (!project) return { ok: false, status: 404, error: "Project not found" };

  const [phase] = await db.update(phasesTable)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(phasesTable.projectId, projectId), eq(phasesTable.phaseNumber, phaseNumber)))
    .returning();

  if (!phase) return { ok: false, status: 404, error: "Phase not found" };
  return { ok: true, data: phase };
}

export async function completePhase(clerkId: string, projectId: number, phaseNumber: number): Promise<ServiceResult<Phase>> {
  const ctx = await requireProjectAndPhase(clerkId, projectId, phaseNumber);
  if (!ctx.ok) return ctx;
  const { project, phase } = ctx.data;

  if (!phase.gate1Checked || !phase.gate2Checked || !phase.gate3Checked) {
    return { ok: false, status: 400, error: "All gates must be checked before completing the phase" };
  }

  const [updatedPhase] = await db.update(phasesTable)
    .set({ status: "completed", updatedAt: new Date() })
    .where(eq(phasesTable.id, phase.id))
    .returning();

  if (phaseNumber < 7) {
    await db.update(phasesTable)
      .set({ status: "active", updatedAt: new Date() })
      .where(and(eq(phasesTable.projectId, projectId), eq(phasesTable.phaseNumber, phaseNumber + 1)));

    await db.update(projectsTable)
      .set({ currentPhase: phaseNumber + 1, updatedAt: new Date() })
      .where(eq(projectsTable.id, projectId));
  }

  void logEvent(clerkId, "phase_completed", { projectId, phaseId: phase.id });

  if (phaseNumber === 7) {
    void logEvent(clerkId, "project_completed", { projectId });
    void createNotification(
      clerkId,
      "PROJECT_COMPLETED",
      "Produto completo! O que fazer agora",
      `Parabéns! Você concluiu todas as 7 fases de ${project.name}. Veja os próximos passos.`,
      `/projects/${projectId}`,
    );
  } else {
    void createNotification(
      clerkId,
      "PHASE_COMPLETED",
      `Fase ${phaseNumber} concluída`,
      `Excelente! Você concluiu a Fase ${phaseNumber} de ${project.name}. A Fase ${phaseNumber + 1} está desbloqueada.`,
      `/projects/${projectId}/phases/${phaseNumber + 1}`,
    );
  }

  return { ok: true, data: updatedPhase! };
}

// ─── Artifact editing / versioning ──────────────────────────────────────────

export async function updateArtifact(clerkId: string, projectId: number, phaseNumber: number, artifactKey: string, data: { content: string; contentJson?: string | null }): Promise<ServiceResult<PhaseArtifact>> {
  const [project] = await db.select().from(projectsTable).where(ownedActiveProject(projectId, clerkId));
  if (!project) return { ok: false, status: 404, error: "Project not found" };

  const denied = await requireEditPlan(clerkId, "A edição de artefatos requer um plano pago.");
  if (denied) return denied;

  const [phase] = await db.select().from(phasesTable).where(and(eq(phasesTable.projectId, projectId), eq(phasesTable.phaseNumber, phaseNumber)));
  if (!phase) return { ok: false, status: 404, error: "Phase not found" };

  const artifact = await db.transaction(async (tx) => {
    await snapshotArtifact(tx, phase.id, artifactKey, "manual_edit", clerkId);
    const [row] = await tx.update(phaseArtifactsTable)
      .set({ content: data.content, contentJson: data.contentJson ?? null, updatedAt: new Date() })
      .where(and(eq(phaseArtifactsTable.phaseId, phase.id), eq(phaseArtifactsTable.artifactKey, artifactKey)))
      .returning();
    return row;
  });

  if (!artifact) return { ok: false, status: 404, error: "Artifact not found" };
  return { ok: true, data: artifact };
}

export async function listArtifactVersions(clerkId: string, projectId: number, phaseNumber: number, artifactKey: string): Promise<ServiceResult<unknown[]>> {
  const ctx = await requireProjectAndPhase(clerkId, projectId, phaseNumber);
  if (!ctx.ok) return ctx;

  const rows = await db
    .select()
    .from(artifactVersionsTable)
    .where(and(eq(artifactVersionsTable.phaseId, ctx.data.phase.id), eq(artifactVersionsTable.artifactKey, artifactKey)))
    .orderBy(desc(artifactVersionsTable.createdAt));

  // Phase 3 free gating: hide version history content for locked artifacts.
  let visibleRows: unknown[] = rows;
  if (phaseNumber === 3 && isPhase3GatedKey(artifactKey) && (await isFreePlan(clerkId))) {
    visibleRows = rows.map((r) => ({ ...r, content: "", contentJson: null, locked: true }));
  }

  return { ok: true, data: visibleRows };
}

export async function restoreArtifactVersion(clerkId: string, projectId: number, phaseNumber: number, artifactKey: string, versionId: number): Promise<ServiceResult<PhaseArtifact>> {
  const [project] = await db.select().from(projectsTable).where(ownedActiveProject(projectId, clerkId));
  if (!project) return { ok: false, status: 404, error: "Project not found" };

  const denied = await requireEditPlan(clerkId, "Restaurar versões requer um plano pago.");
  if (denied) return denied;

  const [phase] = await db.select().from(phasesTable).where(and(eq(phasesTable.projectId, projectId), eq(phasesTable.phaseNumber, phaseNumber)));
  if (!phase) return { ok: false, status: 404, error: "Phase not found" };

  const [version] = await db.select().from(artifactVersionsTable).where(
    and(
      eq(artifactVersionsTable.id, versionId),
      eq(artifactVersionsTable.phaseId, phase.id),
      eq(artifactVersionsTable.artifactKey, artifactKey),
    ),
  );
  if (!version) return { ok: false, status: 404, error: "Version not found" };

  const artifact = await db.transaction(async (tx) => {
    await snapshotArtifact(tx, phase.id, artifactKey, "restore", clerkId);
    const [row] = await tx.update(phaseArtifactsTable)
      .set({ content: version.content, contentJson: version.contentJson ?? null, updatedAt: new Date() })
      .where(and(eq(phaseArtifactsTable.phaseId, phase.id), eq(phaseArtifactsTable.artifactKey, artifactKey)))
      .returning();
    return row;
  });

  if (!artifact) return { ok: false, status: 404, error: "Artifact not found" };
  return { ok: true, data: artifact };
}

export async function markArtifactDownloaded(clerkId: string, projectId: number, phaseNumber: number, artifactKey: string): Promise<ServiceResult<unknown>> {
  const ctx = await requireProjectAndPhase(clerkId, projectId, phaseNumber);
  if (!ctx.ok) return ctx;

  const [artifact] = await db.update(phaseArtifactsTable)
    .set({ downloadedAt: new Date() })
    .where(and(eq(phaseArtifactsTable.phaseId, ctx.data.phase.id), eq(phaseArtifactsTable.artifactKey, artifactKey)))
    .returning();

  if (!artifact) return { ok: false, status: 404, error: "Artifact not found" };
  const [visibleArtifact] = await applyPhase3FreeGate(clerkId, phaseNumber, [artifact]);
  return { ok: true, data: visibleArtifact };
}

export async function submitArtifactFeedback(
  clerkId: string, projectId: number, phaseNumber: number, artifactKey: string,
  rating: "up" | "down", comment: string | null,
): Promise<ServiceResult<{ ok: true }>> {
  const [project] = await db.select().from(projectsTable).where(ownedActiveProject(projectId, clerkId));
  if (!project) return { ok: false, status: 404, error: "Project not found" };

  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.clerkId, clerkId));
  if (!user) return { ok: false, status: 404, error: "User not found" };

  await db.insert(artifactFeedbackTable)
    .values({ userId: user.id, projectId, phaseNumber, artifactKey, rating, comment })
    .onConflictDoUpdate({
      target: [artifactFeedbackTable.userId, artifactFeedbackTable.projectId, artifactFeedbackTable.phaseNumber, artifactFeedbackTable.artifactKey],
      set: { rating, comment, updatedAt: new Date() },
    });

  void logEvent(clerkId, "artifact_feedback", { projectId, phaseNumber, artifactKey, rating, hasComment: !!comment });
  return { ok: true, data: { ok: true } };
}

// ─── AI generation (SSE) ─────────────────────────────────────────────────────

export interface ExecutionContext {
  project: Project;
  phase: Phase;
  founderProfile: Record<string, string> | null;
  previousArtifacts: Array<{ artifactKey: string; content: string }>;
  suppressProgressContent: boolean;
}

/**
 * Validates, acquires the atomic generation lock, checks/consumes AI usage, and gathers
 * everything generatePhaseArtifacts() needs. On any failure after the lock is acquired,
 * the lock is released before returning — callers never need to unlock on this function's
 * error path, only on their own generation failure (see releaseExecutionLock).
 */
export async function prepareExecution(clerkId: string, projectId: number, phaseNumber: number, req?: Request): Promise<ServiceResult<ExecutionContext>> {
  const ctx = await requireProjectAndPhase(clerkId, projectId, phaseNumber);
  if (!ctx.ok) return ctx;
  const { project, phase } = ctx.data;

  if (phase.status === "locked") {
    return { ok: false, status: 400, error: "Phase is locked" };
  }

  // S2.4 — Free plan: fases 1–3 gratuitas; fase 4+ requer upgrade
  const [userForPlan] = await db
    .select({ plan: usersTable.plan, isSuperuser: usersTable.isSuperuser, founderProfile: usersTable.founderProfile })
    .from(usersTable)
    .where(eq(usersTable.clerkId, clerkId));
  const planCfg = getPlanConfig(userForPlan?.plan ?? "free", userForPlan?.isSuperuser ?? false);
  if (planCfg.id === "free" && phaseNumber >= 4) {
    const body = {
      error: "As fases 4 a 7 requerem um plano pago. Complete as 3 primeiras fases gratuitamente e faça upgrade para continuar.",
      requiresUpgrade: true,
      code: "FREE_PHASE_LIMIT",
    };
    return { ok: false, status: 402, error: body.error, code: body.code, body };
  }

  // Atomic DB-level lock — race-free across multiple server instances.
  // UPDATE...WHERE is_generating=false is a single atomic operation in PostgreSQL.
  const lockResult = await db.update(phasesTable)
    .set({ isGenerating: true })
    .where(and(eq(phasesTable.id, phase.id), eq(phasesTable.isGenerating, false)))
    .returning({ id: phasesTable.id });
  if (lockResult.length === 0) {
    return { ok: false, status: 409, error: "Geração já em andamento para esta fase. Aguarde a conclusão." };
  }

  const usage = await checkAndIncrementAiUsage(clerkId);
  if (!usage.allowed) {
    await db.update(phasesTable).set({ isGenerating: false }).where(eq(phasesTable.id, phase.id));
    if (usage.reason === "trial_expired") {
      await auditLog({ eventType: "security.rate_limited", actorClerkId: clerkId, meta: { reason: "free_trial_expired", phaseNumber, projectId }, req });
      const payload = trialExpiredPayload({ plan: usage.plan, context: `Geração da Fase ${phaseNumber}` });
      return { ok: false, status: 402, error: payload.error, code: payload.code, body: payload };
    }
    await auditLog({ eventType: "security.rate_limited", actorClerkId: clerkId, meta: { reason: "ai_daily_limit", limit: usage.limit, phaseNumber, projectId }, req });
    const payload = aiLimitPayload({ limit: usage.limit, plan: usage.plan, used: usage.used, context: `Geração da Fase ${phaseNumber}` });
    return { ok: false, status: 429, error: payload.error, code: payload.code, body: payload };
  }
  await auditLog({ eventType: "user.ai.used", actorClerkId: clerkId, meta: { projectId, phaseNumber, projectName: project.name }, req });

  // Founder profile already fetched in the plan check above — reuse it.
  const founderProfile = (userForPlan?.founderProfile ?? null) as Record<string, string> | null;

  // Fetch all previous phase artifacts for context.
  const allPreviousPhases = await db.select().from(phasesTable).where(eq(phasesTable.projectId, projectId));
  const previousPhaseIds = allPreviousPhases.filter((p) => p.phaseNumber < phaseNumber).map((p) => p.id);

  let previousArtifacts: Array<{ artifactKey: string; content: string }> = [];
  if (previousPhaseIds.length > 0) {
    const rawPrev = await db.select().from(phaseArtifactsTable).where(inArray(phaseArtifactsTable.phaseId, previousPhaseIds));
    previousArtifacts = rawPrev.map((a) => ({ artifactKey: a.artifactKey, content: a.content }));
  }

  const suppressProgressContent = phaseNumber === 3 && (await isFreePlan(clerkId));

  return { ok: true, data: { project, phase, founderProfile, previousArtifacts, suppressProgressContent } };
}

export async function releaseExecutionLock(phaseId: number): Promise<void> {
  await db.update(phasesTable).set({ isGenerating: false }).where(eq(phasesTable.id, phaseId));
}

/** Atomic upsert (snapshot + delete + insert) of freshly-generated artifacts, then unlocks. */
export async function finalizeExecutionSuccess(
  clerkId: string, phase: Phase, phaseNumber: number, projectId: number,
  results: PhaseAIResult[],
): Promise<unknown[]> {
  await db.transaction(async (tx) => {
    await snapshotAllPhaseArtifacts(tx, phase.id, "ai_regen", clerkId);
    await tx.delete(phaseArtifactsTable).where(eq(phaseArtifactsTable.phaseId, phase.id));
    if (results.length > 0) {
      await tx.insert(phaseArtifactsTable).values(
        results.map((r) => ({
          phaseId: phase.id,
          artifactKey: r.artifactKey,
          content: r.content,
          contentJson: r.contentJson ?? null,
        })),
      );
    }
  });

  const saved = await db.select().from(phaseArtifactsTable).where(eq(phaseArtifactsTable.phaseId, phase.id));
  const visibleSaved = await applyPhase3FreeGate(clerkId, phaseNumber, saved);

  await releaseExecutionLock(phase.id);
  void logEvent(clerkId, "ai_generated", { projectId, phaseId: phase.id, artifactCount: saved.length });

  return visibleSaved;
}

export { generatePhaseArtifacts };
