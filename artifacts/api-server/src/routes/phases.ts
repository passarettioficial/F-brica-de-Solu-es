import { Router, type IRouter } from "express";
import { eq, and, inArray, desc } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, projectsTable, phasesTable, phaseArtifactsTable, artifactVersionsTable, usersTable, artifactFeedbackTable } from "@workspace/db";
import {
  UpdatePhaseGatesBody,
  UpdateArtifactBody,
} from "@workspace/api-zod";
import { z } from "zod/v4";

const ArtifactFeedbackBody = z.object({
  rating: z.enum(["up", "down"]),
  comment: z.string().trim().max(500).nullish(),
});
import { generatePhaseArtifacts } from "../lib/ai";
import { logEvent } from "../lib/events";
import { checkAndIncrementAiUsage, aiLimitPayload, trialExpiredPayload } from "../lib/auth";
import { auditLog } from "../lib/audit";
import { createNotification } from "../lib/notifications";
import { getPlanConfig } from "../lib/stripe";
import { snapshotArtifact, snapshotAllPhaseArtifacts } from "../lib/artifact-versions";

const router: IRouter = Router();

function requireAuth(req: any) {
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

// Phase 3 (Segurança & LGPD) gating: free plan only unlocks POLITICA_PRIVACIDADE.
// Strips content/contentJson server-side from the other 7 artifacts and marks locked.
// Apply to ALL endpoints that return artifact rows so locking can't be bypassed via alternate routes.
async function applyPhase3FreeGate<T extends { artifactKey: string; content?: string | null; contentJson?: unknown }>(
  userId: string,
  phaseNumber: number,
  artifacts: T[],
): Promise<(T & { locked?: boolean })[]> {
  if (phaseNumber !== 3) return artifacts;
  const [userForPlan] = await db
    .select({ plan: usersTable.plan, isSuperuser: usersTable.isSuperuser })
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId));
  const planCfg = getPlanConfig(userForPlan?.plan ?? "free", userForPlan?.isSuperuser ?? false);
  if (planCfg.id !== "free") return artifacts;
  return artifacts.map((a) =>
    a.artifactKey === "POLITICA_PRIVACIDADE"
      ? a
      : { ...a, content: "", contentJson: null, locked: true },
  );
}

function isPhase3GatedKey(artifactKey: string): boolean {
  return artifactKey !== "POLITICA_PRIVACIDADE";
}

async function isFreePlan(userId: string): Promise<boolean> {
  const [userForPlan] = await db
    .select({ plan: usersTable.plan, isSuperuser: usersTable.isSuperuser })
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId));
  const planCfg = getPlanConfig(userForPlan?.plan ?? "free", userForPlan?.isSuperuser ?? false);
  return planCfg.id === "free";
}


// GET /projects/:projectId/phases/:phaseNumber
router.get("/projects/:projectId/phases/:phaseNumber", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const phaseNumber = parseInt(Array.isArray(req.params.phaseNumber) ? req.params.phaseNumber[0] : req.params.phaseNumber, 10);
  if (isNaN(projectId) || isNaN(phaseNumber)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, projectId), eq(projectsTable.clerkId, userId))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [phase] = await db.select().from(phasesTable).where(
    and(eq(phasesTable.projectId, projectId), eq(phasesTable.phaseNumber, phaseNumber))
  );
  if (!phase) { res.status(404).json({ error: "Phase not found" }); return; }

  const artifacts = await db.select().from(phaseArtifactsTable).where(eq(phaseArtifactsTable.phaseId, phase.id));
  const visibleArtifacts = await applyPhase3FreeGate(userId, phaseNumber, artifacts);

  res.json({ ...phase, artifacts: visibleArtifacts });
});

// PATCH /projects/:projectId/phases/:phaseNumber/gates
router.patch("/projects/:projectId/phases/:phaseNumber/gates", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const phaseNumber = parseInt(Array.isArray(req.params.phaseNumber) ? req.params.phaseNumber[0] : req.params.phaseNumber, 10);

  const parsed = UpdatePhaseGatesBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, projectId), eq(projectsTable.clerkId, userId))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [phase] = await db.update(phasesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(phasesTable.projectId, projectId), eq(phasesTable.phaseNumber, phaseNumber)))
    .returning();

  if (!phase) { res.status(404).json({ error: "Phase not found" }); return; }
  res.json(phase);
});

// POST /projects/:projectId/phases/:phaseNumber/complete
router.post("/projects/:projectId/phases/:phaseNumber/complete", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const phaseNumber = parseInt(Array.isArray(req.params.phaseNumber) ? req.params.phaseNumber[0] : req.params.phaseNumber, 10);

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, projectId), eq(projectsTable.clerkId, userId))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [phase] = await db.select().from(phasesTable).where(
    and(eq(phasesTable.projectId, projectId), eq(phasesTable.phaseNumber, phaseNumber))
  );
  if (!phase) { res.status(404).json({ error: "Phase not found" }); return; }

  if (!phase.gate1Checked || !phase.gate2Checked || !phase.gate3Checked) {
    res.status(400).json({ error: "All gates must be checked before completing the phase" });
    return;
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

  void logEvent(userId, "phase_completed", { projectId, phaseId: phase.id });

  if (phaseNumber === 7) {
    void logEvent(userId, "project_completed", { projectId });
    void createNotification(
      userId,
      "PROJECT_COMPLETED",
      "Produto completo! O que fazer agora",
      `Parabéns! Você concluiu todas as 7 fases de ${project.name}. Veja os próximos passos.`,
      `/projects/${projectId}`
    );
  } else {
    void createNotification(
      userId,
      "PHASE_COMPLETED",
      `Fase ${phaseNumber} concluída`,
      `Excelente! Você concluiu a Fase ${phaseNumber} de ${project.name}. A Fase ${phaseNumber + 1} está desbloqueada.`,
      `/projects/${projectId}/phases/${phaseNumber + 1}`
    );
  }

  res.json(updatedPhase);
});

// GET /projects/:projectId/phases/:phaseNumber/artifacts
router.get("/projects/:projectId/phases/:phaseNumber/artifacts", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const phaseNumber = parseInt(Array.isArray(req.params.phaseNumber) ? req.params.phaseNumber[0] : req.params.phaseNumber, 10);

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, projectId), eq(projectsTable.clerkId, userId))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [phase] = await db.select().from(phasesTable).where(
    and(eq(phasesTable.projectId, projectId), eq(phasesTable.phaseNumber, phaseNumber))
  );
  if (!phase) { res.status(404).json({ error: "Phase not found" }); return; }

  const artifacts = await db.select().from(phaseArtifactsTable).where(eq(phaseArtifactsTable.phaseId, phase.id));
  const visibleArtifacts = await applyPhase3FreeGate(userId, phaseNumber, artifacts);
  res.json(visibleArtifacts);
});

// PATCH /projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey
router.patch("/projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const phaseNumber = parseInt(Array.isArray(req.params.phaseNumber) ? req.params.phaseNumber[0] : req.params.phaseNumber, 10);
  const artifactKey = Array.isArray(req.params.artifactKey) ? req.params.artifactKey[0] : req.params.artifactKey;

  const parsed = UpdateArtifactBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, projectId), eq(projectsTable.clerkId, userId))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [userForPlan] = await db
    .select({ plan: usersTable.plan, isSuperuser: usersTable.isSuperuser })
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId));
  const planCfg = getPlanConfig(userForPlan?.plan ?? "free", userForPlan?.isSuperuser ?? false);
  if (!planCfg.canCopy) {
    res.status(402).json({
      error: "A edição de artefatos requer um plano pago.",
      requiresUpgrade: true,
      code: "EDIT_REQUIRES_PAID_PLAN",
    });
    return;
  }

  const [phase] = await db.select().from(phasesTable).where(
    and(eq(phasesTable.projectId, projectId), eq(phasesTable.phaseNumber, phaseNumber))
  );
  if (!phase) { res.status(404).json({ error: "Phase not found" }); return; }

  const artifact = await db.transaction(async (tx) => {
    await snapshotArtifact(tx, phase.id, artifactKey, "manual_edit", userId);
    const [row] = await tx.update(phaseArtifactsTable)
      .set({ content: parsed.data.content, contentJson: parsed.data.contentJson ?? null, updatedAt: new Date() })
      .where(and(eq(phaseArtifactsTable.phaseId, phase.id), eq(phaseArtifactsTable.artifactKey, artifactKey)))
      .returning();
    return row;
  });

  if (!artifact) { res.status(404).json({ error: "Artifact not found" }); return; }
  res.json(artifact);
});

// GET /projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/versions
router.get("/projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/versions", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const phaseNumber = parseInt(Array.isArray(req.params.phaseNumber) ? req.params.phaseNumber[0] : req.params.phaseNumber, 10);
  const artifactKey = Array.isArray(req.params.artifactKey) ? req.params.artifactKey[0] : req.params.artifactKey;

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, projectId), eq(projectsTable.clerkId, userId))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [phase] = await db.select().from(phasesTable).where(
    and(eq(phasesTable.projectId, projectId), eq(phasesTable.phaseNumber, phaseNumber))
  );
  if (!phase) { res.status(404).json({ error: "Phase not found" }); return; }

  const rows = await db
    .select()
    .from(artifactVersionsTable)
    .where(and(eq(artifactVersionsTable.phaseId, phase.id), eq(artifactVersionsTable.artifactKey, artifactKey)))
    .orderBy(desc(artifactVersionsTable.createdAt));

  // Phase 3 free gating: hide version history content for locked artifacts.
  let visibleRows: any[] = rows;
  if (phaseNumber === 3 && isPhase3GatedKey(artifactKey) && (await isFreePlan(userId))) {
    visibleRows = rows.map((r) => ({ ...r, content: "", contentJson: null, locked: true }));
  }

  res.json(visibleRows);
});

// POST /projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/versions/:versionId/restore
router.post("/projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/versions/:versionId/restore", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const phaseNumber = parseInt(Array.isArray(req.params.phaseNumber) ? req.params.phaseNumber[0] : req.params.phaseNumber, 10);
  const artifactKey = Array.isArray(req.params.artifactKey) ? req.params.artifactKey[0] : req.params.artifactKey;
  const versionId = parseInt(Array.isArray(req.params.versionId) ? req.params.versionId[0] : req.params.versionId, 10);
  if (isNaN(versionId)) { res.status(400).json({ error: "Invalid versionId" }); return; }

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, projectId), eq(projectsTable.clerkId, userId))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [userForPlan] = await db
    .select({ plan: usersTable.plan, isSuperuser: usersTable.isSuperuser })
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId));
  const planCfg = getPlanConfig(userForPlan?.plan ?? "free", userForPlan?.isSuperuser ?? false);
  if (!planCfg.canCopy) {
    res.status(402).json({ error: "Restaurar versões requer um plano pago.", requiresUpgrade: true, code: "EDIT_REQUIRES_PAID_PLAN" });
    return;
  }

  const [phase] = await db.select().from(phasesTable).where(
    and(eq(phasesTable.projectId, projectId), eq(phasesTable.phaseNumber, phaseNumber))
  );
  if (!phase) { res.status(404).json({ error: "Phase not found" }); return; }

  const [version] = await db.select().from(artifactVersionsTable).where(
    and(
      eq(artifactVersionsTable.id, versionId),
      eq(artifactVersionsTable.phaseId, phase.id),
      eq(artifactVersionsTable.artifactKey, artifactKey),
    )
  );
  if (!version) { res.status(404).json({ error: "Version not found" }); return; }

  const artifact = await db.transaction(async (tx) => {
    await snapshotArtifact(tx, phase.id, artifactKey, "restore", userId);
    const [row] = await tx.update(phaseArtifactsTable)
      .set({ content: version.content, contentJson: version.contentJson ?? null, updatedAt: new Date() })
      .where(and(eq(phaseArtifactsTable.phaseId, phase.id), eq(phaseArtifactsTable.artifactKey, artifactKey)))
      .returning();
    return row;
  });

  if (!artifact) { res.status(404).json({ error: "Artifact not found" }); return; }
  res.json(artifact);
});

// PATCH /projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/download
router.patch("/projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/download", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const phaseNumber = parseInt(Array.isArray(req.params.phaseNumber) ? req.params.phaseNumber[0] : req.params.phaseNumber, 10);
  const artifactKey = Array.isArray(req.params.artifactKey) ? req.params.artifactKey[0] : req.params.artifactKey;

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, projectId), eq(projectsTable.clerkId, userId))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [phase] = await db.select().from(phasesTable).where(
    and(eq(phasesTable.projectId, projectId), eq(phasesTable.phaseNumber, phaseNumber))
  );
  if (!phase) { res.status(404).json({ error: "Phase not found" }); return; }

  const [artifact] = await db.update(phaseArtifactsTable)
    .set({ downloadedAt: new Date() })
    .where(and(eq(phaseArtifactsTable.phaseId, phase.id), eq(phaseArtifactsTable.artifactKey, artifactKey)))
    .returning();

  if (!artifact) { res.status(404).json({ error: "Artifact not found" }); return; }
  const [visibleArtifact] = await applyPhase3FreeGate(userId, phaseNumber, [artifact]);
  res.json(visibleArtifact);
});

// POST /projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/feedback
router.post("/projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/feedback", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const phaseNumber = parseInt(Array.isArray(req.params.phaseNumber) ? req.params.phaseNumber[0] : req.params.phaseNumber, 10);
  const artifactKey = Array.isArray(req.params.artifactKey) ? req.params.artifactKey[0] : req.params.artifactKey;
  if (isNaN(projectId) || isNaN(phaseNumber) || !artifactKey) { res.status(400).json({ error: "Invalid params" }); return; }

  const parsed = ArtifactFeedbackBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body", issues: parsed.error.issues }); return; }
  const { rating } = parsed.data;
  const comment = parsed.data.comment && parsed.data.comment.length > 0 ? parsed.data.comment : null;

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, projectId), eq(projectsTable.clerkId, userId))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [user] = await db.select({ id: usersTable.id }).from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  await db.insert(artifactFeedbackTable)
    .values({ userId: user.id, projectId, phaseNumber, artifactKey, rating, comment })
    .onConflictDoUpdate({
      target: [artifactFeedbackTable.userId, artifactFeedbackTable.projectId, artifactFeedbackTable.phaseNumber, artifactFeedbackTable.artifactKey],
      set: { rating, comment, updatedAt: new Date() },
    });

  void logEvent(userId, "artifact_feedback", { projectId, phaseNumber, artifactKey, rating, hasComment: !!comment });
  res.json({ ok: true });
});

// POST /projects/:projectId/phases/:phaseNumber/execute (SSE)
router.post("/projects/:projectId/phases/:phaseNumber/execute", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const phaseNumber = parseInt(Array.isArray(req.params.phaseNumber) ? req.params.phaseNumber[0] : req.params.phaseNumber, 10);

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, projectId), eq(projectsTable.clerkId, userId))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [phase] = await db.select().from(phasesTable).where(
    and(eq(phasesTable.projectId, projectId), eq(phasesTable.phaseNumber, phaseNumber))
  );
  if (!phase) { res.status(404).json({ error: "Phase not found" }); return; }

  if (phase.status === "locked") {
    res.status(400).json({ error: "Phase is locked" });
    return;
  }

  // S2.4 — Free plan: fases 1–3 gratuitas; fase 4+ requer upgrade
  const [userForPlan] = await db
    .select({ plan: usersTable.plan, isSuperuser: usersTable.isSuperuser, founderProfile: usersTable.founderProfile })
    .from(usersTable)
    .where(eq(usersTable.clerkId, userId));
  const planCfg = getPlanConfig(userForPlan?.plan ?? "free", userForPlan?.isSuperuser ?? false);
  if (planCfg.id === "free" && phaseNumber >= 4) {
    res.status(402).json({
      error: "As fases 4 a 7 requerem um plano pago. Complete as 3 primeiras fases gratuitamente e faça upgrade para continuar.",
      requiresUpgrade: true,
      code: "FREE_PHASE_LIMIT",
    });
    return;
  }

  // Atomic DB-level lock — race-free across multiple server instances
  // UPDATE...WHERE is_generating=false is a single atomic operation in PostgreSQL
  const lockResult = await db.update(phasesTable)
    .set({ isGenerating: true })
    .where(and(eq(phasesTable.id, phase.id), eq(phasesTable.isGenerating, false)))
    .returning({ id: phasesTable.id });
  if (lockResult.length === 0) {
    res.status(409).json({ error: "Geração já em andamento para esta fase. Aguarde a conclusão." });
    return;
  }

  const usage = await checkAndIncrementAiUsage(userId);
  if (!usage.allowed) {
    await db.update(phasesTable).set({ isGenerating: false }).where(eq(phasesTable.id, phase.id));
    if (usage.reason === "trial_expired") {
      await auditLog({ eventType: "security.rate_limited", actorClerkId: userId, meta: { reason: "free_trial_expired", phaseNumber, projectId }, req });
      res.status(402).json(trialExpiredPayload({ plan: usage.plan, context: `Geração da Fase ${phaseNumber}` }));
      return;
    }
    await auditLog({ eventType: "security.rate_limited", actorClerkId: userId, meta: { reason: "ai_daily_limit", limit: usage.limit, phaseNumber, projectId }, req });
    res.status(429).json(aiLimitPayload({ limit: usage.limit, plan: usage.plan, used: usage.used, context: `Geração da Fase ${phaseNumber}` }));
    return;
  }
  await auditLog({ eventType: "user.ai.used", actorClerkId: userId, meta: { projectId, phaseNumber, projectName: project.name }, req });

  // Founder profile already fetched in plan check above — reuse it
  const founderProfile = (userForPlan?.founderProfile ?? null) as Record<string, string> | null;

  // Fetch all previous phase artifacts for context
  const allPreviousPhases = await db.select().from(phasesTable).where(eq(phasesTable.projectId, projectId));
  const previousPhaseIds = allPreviousPhases
    .filter(p => p.phaseNumber < phaseNumber)
    .map(p => p.id);

  let previousArtifacts: Array<{ artifactKey: string; content: string }> = [];
  if (previousPhaseIds.length > 0) {
    const rawPrev = await db.select().from(phaseArtifactsTable).where(inArray(phaseArtifactsTable.phaseId, previousPhaseIds));
    previousArtifacts = rawPrev.map(a => ({ artifactKey: a.artifactKey, content: a.content }));
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  // SSE heartbeat — prevents load balancer timeouts on long generations
  const heartbeat = setInterval(() => {
    if (!res.writableEnded) {
      res.write(": heartbeat\n\n");
    }
  }, 15000);
  res.on("close", () => clearInterval(heartbeat));

  // Phase 3 free gating: suppress raw token streaming so locked artifact content
  // never leaves the server in the SSE progress channel. We still emit a generic
  // status ping so the UI shows movement.
  const suppressProgressContent = phaseNumber === 3 && (await isFreePlan(userId));

  try {
    const results = await generatePhaseArtifacts(
      phaseNumber,
      project.name,
      project.briefing,
      previousArtifacts,
      (text) => {
        if (suppressProgressContent) {
          res.write(`data: ${JSON.stringify({ type: "progress", content: "" })}\n\n`);
          return;
        }
        res.write(`data: ${JSON.stringify({ type: "progress", content: text })}\n\n`);
      },
      founderProfile ?? undefined
    );

    // Atomic upsert: snapshot existing + delete + insert in a single transaction
    await db.transaction(async (tx) => {
      await snapshotAllPhaseArtifacts(tx, phase.id, "ai_regen", userId);
      await tx.delete(phaseArtifactsTable).where(eq(phaseArtifactsTable.phaseId, phase.id));
      if (results.length > 0) {
        await tx.insert(phaseArtifactsTable).values(
          results.map(r => ({
            phaseId: phase.id,
            artifactKey: r.artifactKey,
            content: r.content,
            contentJson: r.contentJson ?? null,
          }))
        );
      }
    });

    const saved = await db.select().from(phaseArtifactsTable).where(eq(phaseArtifactsTable.phaseId, phase.id));
    const visibleSaved = await applyPhase3FreeGate(userId, phaseNumber, saved);

    clearInterval(heartbeat);
    await db.update(phasesTable).set({ isGenerating: false }).where(eq(phasesTable.id, phase.id));
    void logEvent(userId, "ai_generated", { projectId, phaseId: phase.id, artifactCount: saved.length });
    res.write(`data: ${JSON.stringify({ type: "done", artifacts: visibleSaved })}\n\n`);
    res.end();
  } catch (error) {
    clearInterval(heartbeat);
    await db.update(phasesTable).set({ isGenerating: false }).where(eq(phasesTable.id, phase.id));
    req.log.error({ err: error, userId, projectId, phaseNumber }, "AI generation failed");
    res.write(`data: ${JSON.stringify({ type: "error", message: "Erro ao gerar artefatos" })}\n\n`);
    res.end();
  }
});

export default router;
