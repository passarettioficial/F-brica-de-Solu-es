import { eq, and, count, isNull, isNotNull, lt, inArray } from "drizzle-orm";
import type { Request } from "express";
import { db, projectsTable, phasesTable, phaseArtifactsTable, usersTable, type Project, type Phase, type PhaseArtifact } from "@workspace/db";
import { ensureUser, checkAndIncrementAiUsage, aiLimitPayload, trialExpiredPayload } from "./auth";
import { getPlanConfig } from "./stripe";
import { auditLog } from "./audit";
import { analyzeProjectCoherence, analyzeMarketPotential } from "./ai";
import { logEvent } from "./events";
import { seedDemoProject } from "./demoSeed";
import { buildProjectArtifactContext } from "./project-context";

/**
 * Business logic for the project lifecycle (CRUD, trash, sharing, export, AI scoring),
 * kept separate from the Express route handlers in routes/projects.ts. Routes stay thin:
 * parse the request, call one of these, translate the result to an HTTP response.
 */

export const TRASH_RETENTION_DAYS = 30;

export type ServiceResult<T> =
  | { ok: true; data: T }
  // `body`, when present, is sent to the client verbatim — used by error payloads that carry
  // extra fields beyond error/code (e.g. aiLimitPayload/trialExpiredPayload add plan/context/limit/used).
  | { ok: false; status: number; error: string; code?: string; body?: Record<string, unknown> };

function planLimitError(status: number, planName: string, maxProjects: number, message: string): ServiceResult<never> {
  return { ok: false, status, error: message.replace("{plan}", planName).replace("{max}", String(maxProjects)), code: "PROJECT_LIMIT_REACHED" };
}

async function countActiveProjects(clerkId: string): Promise<number> {
  const [{ count: n }] = await db.select({ count: count() }).from(projectsTable)
    .where(and(eq(projectsTable.clerkId, clerkId), isNull(projectsTable.deletedAt)));
  return Number(n);
}

async function getUserPlan(clerkId: string) {
  const [userFull] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  return { userFull, plan: getPlanConfig(userFull?.plan ?? "free", userFull?.isSuperuser ?? false) };
}

// ─── Dashboard / listing ────────────────────────────────────────────────────

export interface DashboardSummary {
  projects: Array<{
    projectId: number;
    name: string;
    currentPhase: number;
    completedPhases: number;
    allGatesChecked: boolean;
    phaseStatuses: string[];
  }>;
  totalProjects: number;
  dailyAiUsage: number;
  dailyAiLimit: number;
}

function summarizePhases(phases: Phase[]) {
  const sorted = [...phases].sort((a, b) => a.phaseNumber - b.phaseNumber);
  const completedPhases = sorted.filter((p) => p.status === "completed").length;
  const activePhase = sorted.find((p) => p.status === "active");
  const allGatesChecked = activePhase
    ? activePhase.gate1Checked && activePhase.gate2Checked && activePhase.gate3Checked
    : false;
  return { sorted, completedPhases, allGatesChecked };
}

export async function getDashboardSummary(clerkId: string): Promise<DashboardSummary> {
  await ensureUser(clerkId);

  const [userRecord] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  const plan = userRecord ? getPlanConfig(userRecord.plan, userRecord.isSuperuser ?? false) : getPlanConfig("free");

  const projects = await db.select().from(projectsTable)
    .where(and(eq(projectsTable.clerkId, clerkId), isNull(projectsTable.deletedAt)));

  const projectIds = projects.map((p) => p.id);
  const allPhases = projectIds.length > 0
    ? await db.select().from(phasesTable).where(inArray(phasesTable.projectId, projectIds))
    : [];

  const phasesByProject = allPhases.reduce((acc, phase) => {
    (acc[phase.projectId] ??= []).push(phase);
    return acc;
  }, {} as Record<number, typeof allPhases>);

  const summaries = projects.map((project) => {
    const { sorted, completedPhases, allGatesChecked } = summarizePhases(phasesByProject[project.id] ?? []);
    return {
      projectId: project.id,
      name: project.name,
      currentPhase: project.currentPhase,
      completedPhases,
      allGatesChecked,
      phaseStatuses: sorted.map((p) => p.status),
    };
  });

  return {
    projects: summaries,
    totalProjects: projects.length,
    dailyAiUsage: userRecord?.dailyAiUsage ?? 0,
    dailyAiLimit: plan.aiDailyLimit,
  };
}

export interface TrashedProject {
  id: number;
  name: string;
  deletedAt: Date | null;
  daysRemaining: number;
}

export async function purgeAndListTrash(clerkId: string): Promise<TrashedProject[]> {
  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  // Auto-purge projects older than the retention window.
  await db.delete(projectsTable).where(
    and(eq(projectsTable.clerkId, clerkId), isNotNull(projectsTable.deletedAt), lt(projectsTable.deletedAt, cutoff)),
  );

  const trashed = await db.select().from(projectsTable)
    .where(and(eq(projectsTable.clerkId, clerkId), isNotNull(projectsTable.deletedAt)));

  const now = Date.now();
  return trashed.map((p) => ({
    id: p.id,
    name: p.name,
    deletedAt: p.deletedAt,
    daysRemaining: Math.max(0, TRASH_RETENTION_DAYS - Math.floor((now - p.deletedAt!.getTime()) / (1000 * 60 * 60 * 24))),
  }));
}

export async function listActiveProjects(clerkId: string): Promise<Project[]> {
  return db.select().from(projectsTable).where(and(eq(projectsTable.clerkId, clerkId), isNull(projectsTable.deletedAt)));
}

// ─── Create / demo ──────────────────────────────────────────────────────────

export async function seedDemo(clerkId: string, req?: Request): Promise<ServiceResult<Project & { alreadyExisted: boolean }>> {
  await ensureUser(clerkId);

  const { plan } = await getUserPlan(clerkId);

  const [{ count: existingDemoCount }] = await db.select({ count: count() }).from(projectsTable)
    .where(and(eq(projectsTable.clerkId, clerkId), eq(projectsTable.isDemo, true), isNull(projectsTable.deletedAt)));

  if (Number(existingDemoCount) === 0) {
    const activeCount = await countActiveProjects(clerkId);
    if (activeCount >= plan.maxProjects) {
      return planLimitError(403, plan.name, plan.maxProjects, "Limite de {max} projeto(s) atingido para o plano {plan}. Apague um projeto para carregar o demo.");
    }
  }

  const { created, project } = await seedDemoProject(clerkId);
  if (created) {
    await auditLog({ eventType: "user.project.demo_seeded", actorClerkId: clerkId, meta: { projectId: project.id }, req });
    void logEvent(clerkId, "project_created", { projectId: project.id, demo: true });
  }
  return { ok: true, data: { ...project, alreadyExisted: !created } };
}

export async function createProject(clerkId: string, data: { name: string; briefing: string }, req?: Request): Promise<ServiceResult<Project>> {
  await ensureUser(clerkId);

  const { plan } = await getUserPlan(clerkId);
  const activeCount = await countActiveProjects(clerkId);
  if (activeCount >= plan.maxProjects) {
    return planLimitError(403, plan.name, plan.maxProjects, "Limite de {max} projeto(s) atingido para o plano {plan}. Faça upgrade para criar mais projetos.");
  }

  const [project] = await db.insert(projectsTable).values({
    clerkId,
    name: data.name,
    briefing: data.briefing,
    currentPhase: 1,
  }).returning();

  const phaseValues = [1, 2, 3, 4, 5, 6, 7].map((num) => ({
    projectId: project.id,
    phaseNumber: num,
    status: (num === 1 ? "active" : "locked") as "active" | "locked" | "completed",
    gate1Checked: false,
    gate2Checked: false,
    gate3Checked: false,
  }));
  await db.insert(phasesTable).values(phaseValues);

  await auditLog({ eventType: "user.project.created", actorClerkId: clerkId, meta: { projectId: project.id, name: project.name }, req });
  void logEvent(clerkId, "project_created", { projectId: project.id });
  return { ok: true, data: project };
}

// ─── Single project CRUD ────────────────────────────────────────────────────

export async function getProjectWithPhases(clerkId: string, id: number): Promise<ServiceResult<Project & { phases: Phase[] }>> {
  const [project] = await db.select().from(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, clerkId), isNull(projectsTable.deletedAt)));
  if (!project) return { ok: false, status: 404, error: "Project not found" };

  const phases = await db.select().from(phasesTable).where(eq(phasesTable.projectId, id));
  return { ok: true, data: { ...project, phases: phases.sort((a, b) => a.phaseNumber - b.phaseNumber) } };
}

export async function updateProject(clerkId: string, id: number, data: Partial<Pick<Project, "name" | "briefing">>): Promise<ServiceResult<Project>> {
  const [project] = await db.update(projectsTable)
    .set({ ...data, updatedAt: new Date() })
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, clerkId), isNull(projectsTable.deletedAt)))
    .returning();

  if (!project) return { ok: false, status: 404, error: "Project not found" };
  return { ok: true, data: project };
}

export async function softDeleteProject(clerkId: string, id: number, req?: Request): Promise<ServiceResult<{ id: number; deletedAt: Date | null }>> {
  const [project] = await db.update(projectsTable)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, clerkId), isNull(projectsTable.deletedAt)))
    .returning();

  if (!project) return { ok: false, status: 404, error: "Project not found" };
  await auditLog({ eventType: "user.project.deleted", actorClerkId: clerkId, meta: { projectId: id, name: project.name }, req });
  return { ok: true, data: { id: project.id, deletedAt: project.deletedAt } };
}

export async function restoreProject(clerkId: string, id: number, req?: Request): Promise<ServiceResult<Project>> {
  const { plan } = await getUserPlan(clerkId);
  const activeCount = await countActiveProjects(clerkId);
  if (activeCount >= plan.maxProjects) {
    return planLimitError(403, plan.name, plan.maxProjects, "Limite de {max} projeto(s) atingido para o plano {plan}. Apague um projeto ativo ou faça upgrade antes de restaurar.");
  }

  const [project] = await db.update(projectsTable)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, clerkId), isNotNull(projectsTable.deletedAt)))
    .returning();

  if (!project) return { ok: false, status: 404, error: "Project not found in trash" };
  await auditLog({ eventType: "user.project.restored", actorClerkId: clerkId, meta: { projectId: id, name: project.name }, req });
  return { ok: true, data: project };
}

export async function permanentlyDeleteProject(clerkId: string, id: number, req?: Request): Promise<ServiceResult<{ id: number }>> {
  const [project] = await db.delete(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, clerkId), isNotNull(projectsTable.deletedAt)))
    .returning();

  if (!project) return { ok: false, status: 404, error: "Project not found in trash" };
  await auditLog({ eventType: "user.project.permanent_deleted", actorClerkId: clerkId, meta: { projectId: id, name: project.name }, req });
  return { ok: true, data: { id: project.id } };
}

// ─── Sharing ─────────────────────────────────────────────────────────────────

export async function enableSharing(clerkId: string, id: number, req?: Request): Promise<ServiceResult<{ shareId: string | null; sharedAt: Date | null }>> {
  const { randomBytes } = await import("node:crypto");
  const candidateShareId = randomBytes(9).toString("base64url");
  const now = new Date();

  // Atomic: only assign shareId if it is currently NULL (prevents concurrent overwrite).
  const [updated] = await db.update(projectsTable)
    .set({ shareId: candidateShareId, sharedAt: now, updatedAt: now })
    .where(and(
      eq(projectsTable.id, id),
      eq(projectsTable.clerkId, clerkId),
      isNull(projectsTable.deletedAt),
      isNull(projectsTable.shareId),
    ))
    .returning();

  if (updated) {
    await auditLog({ eventType: "user.project.shared", actorClerkId: clerkId, meta: { projectId: id }, req });
    return { ok: true, data: { shareId: updated.shareId, sharedAt: updated.sharedAt } };
  }

  // Either the project doesn't exist for this user, or sharing is already enabled — re-read to disambiguate.
  const [existing] = await db.select().from(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, clerkId), isNull(projectsTable.deletedAt)));
  if (!existing) return { ok: false, status: 404, error: "Project not found" };
  return { ok: true, data: { shareId: existing.shareId, sharedAt: existing.sharedAt } };
}

export async function disableSharing(clerkId: string, id: number, req?: Request): Promise<ServiceResult<{ ok: true }>> {
  const [updated] = await db.update(projectsTable)
    .set({ shareId: null, sharedAt: null, updatedAt: new Date() })
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, clerkId), isNull(projectsTable.deletedAt)))
    .returning();

  if (!updated) return { ok: false, status: 404, error: "Project not found" };
  await auditLog({ eventType: "user.project.unshared", actorClerkId: clerkId, meta: { projectId: id }, req });
  return { ok: true, data: { ok: true } };
}

// ─── Summary ─────────────────────────────────────────────────────────────────

export interface ProjectSummary {
  projectId: number;
  name: string;
  currentPhase: number;
  completedPhases: number;
  allGatesChecked: boolean;
  phaseStatuses: string[];
}

export async function getProjectSummary(clerkId: string, id: number): Promise<ServiceResult<ProjectSummary>> {
  const [project] = await db.select().from(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, clerkId), isNull(projectsTable.deletedAt)));
  if (!project) return { ok: false, status: 404, error: "Project not found" };

  const phases = await db.select().from(phasesTable).where(eq(phasesTable.projectId, id));
  const { sorted, completedPhases, allGatesChecked } = summarizePhases(phases);

  return {
    ok: true,
    data: {
      projectId: project.id,
      name: project.name,
      currentPhase: project.currentPhase,
      completedPhases,
      allGatesChecked,
      phaseStatuses: sorted.map((p) => p.status),
    },
  };
}

// ─── Export ──────────────────────────────────────────────────────────────────

export const PHASE_NAMES: Record<number, string> = {
  1: "IDEIA", 2: "PRD", 3: "SEGURANÇA & LGPD", 4: "SPEC",
  5: "IMPLEMENTAÇÃO", 6: "TESTE", 7: "DEPLOY",
};

export interface ExportData {
  project: Project;
  sortedPhases: Phase[];
  artifactsByPhase: Map<number, PhaseArtifact[]>;
}

/** Shared by both export formats: auth + plan-gate + fetch. Streaming/JSON shaping stays in the route. */
export async function getExportData(clerkId: string, id: number): Promise<ServiceResult<ExportData>> {
  const [project] = await db.select().from(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, clerkId), isNull(projectsTable.deletedAt)));
  if (!project) return { ok: false, status: 404, error: "Project not found" };

  const [userForPlan] = await db.select({ plan: usersTable.plan, isSuperuser: usersTable.isSuperuser })
    .from(usersTable).where(eq(usersTable.clerkId, clerkId));
  const planCfg = getPlanConfig(userForPlan?.plan ?? "free", userForPlan?.isSuperuser ?? false);
  if (!planCfg.canDownload) {
    const body = { error: "Exportar artefatos requer um plano pago.", requiresUpgrade: true, code: "EXPORT_REQUIRES_PAID_PLAN" };
    return { ok: false, status: 402, error: body.error, code: body.code, body };
  }

  const phases = await db.select().from(phasesTable).where(eq(phasesTable.projectId, id));
  const sortedPhases = [...phases].sort((a, b) => a.phaseNumber - b.phaseNumber);
  const phaseIds = sortedPhases.map((p) => p.id);
  const artifacts = phaseIds.length
    ? await db.select().from(phaseArtifactsTable).where(inArray(phaseArtifactsTable.phaseId, phaseIds))
    : [];

  const artifactsByPhase = new Map<number, PhaseArtifact[]>();
  for (const a of artifacts) {
    const arr = artifactsByPhase.get(a.phaseId) ?? [];
    arr.push(a);
    artifactsByPhase.set(a.phaseId, arr);
  }

  return { ok: true, data: { project, sortedPhases, artifactsByPhase } };
}

export async function logProjectExport(clerkId: string, id: number, artifactCount: number, req?: Request): Promise<void> {
  await auditLog({
    eventType: "user.project.exported",
    actorClerkId: clerkId,
    meta: { projectId: id, format: "markdown", artifacts: artifactCount },
    req,
  }).catch(() => { /* fire and forget */ });
}

// ─── Benchmarks ──────────────────────────────────────────────────────────────

export interface Benchmarks {
  platform: {
    totalProjects: number;
    avgCoherenceScore: number | null;
    avgMarketPotentialScore: number | null;
    avgCurrentPhase: number | null;
    completedProjects: number;
  };
  user: {
    totalProjects: number;
    avgCoherenceScore: number | null;
  };
}

export async function getBenchmarks(clerkId: string): Promise<Benchmarks> {
  const allProjects = await db.select({
    coherenceScore: projectsTable.coherenceScore,
    marketPotentialScore: projectsTable.marketPotentialScore,
    currentPhase: projectsTable.currentPhase,
  }).from(projectsTable).where(isNull(projectsTable.deletedAt));

  const withCoherence = allProjects.filter((p) => p.coherenceScore != null);
  const withPotential = allProjects.filter((p) => p.marketPotentialScore != null);

  const avgCoherence = withCoherence.length > 0
    ? Math.round(withCoherence.reduce((s, p) => s + (p.coherenceScore ?? 0), 0) / withCoherence.length)
    : null;
  const avgPotential = withPotential.length > 0
    ? Math.round(withPotential.reduce((s, p) => s + (p.marketPotentialScore ?? 0), 0) / withPotential.length)
    : null;
  const avgPhase = allProjects.length > 0
    ? Math.round((allProjects.reduce((s, p) => s + (p.currentPhase ?? 1), 0) / allProjects.length) * 10) / 10
    : null;
  const completedCount = allProjects.filter((p) => (p.currentPhase ?? 1) >= 7).length;

  const userProjects = await db.select().from(projectsTable)
    .where(and(eq(projectsTable.clerkId, clerkId), isNull(projectsTable.deletedAt)));
  const userWithCoherence = userProjects.filter((p) => p.coherenceScore != null);
  const userAvgCoherence = userWithCoherence.length > 0
    ? Math.round(userWithCoherence.reduce((s, p) => s + (p.coherenceScore ?? 0), 0) / userWithCoherence.length)
    : null;

  return {
    platform: {
      totalProjects: allProjects.length,
      avgCoherenceScore: avgCoherence,
      avgMarketPotentialScore: avgPotential,
      avgCurrentPhase: avgPhase,
      completedProjects: completedCount,
    },
    user: {
      totalProjects: userProjects.length,
      avgCoherenceScore: userAvgCoherence,
    },
  };
}

// ─── AI scoring ──────────────────────────────────────────────────────────────

async function requireProjectForAi(clerkId: string, id: number): Promise<ServiceResult<Project>> {
  const [project] = await db.select().from(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, clerkId), isNull(projectsTable.deletedAt)));
  if (!project) return { ok: false, status: 404, error: "Project not found" };
  return { ok: true, data: project };
}

export async function analyzeCoherence(clerkId: string, id: number): Promise<ServiceResult<unknown>> {
  const projectResult = await requireProjectForAi(clerkId, id);
  if (!projectResult.ok) return projectResult;
  const project = projectResult.data;

  const artifactContext = await buildProjectArtifactContext(id, 1500);
  if (!artifactContext.trim()) {
    return { ok: false, status: 400, error: "Nenhum artefato gerado para analisar. Execute a IA nas fases primeiro." };
  }

  const usage = await checkAndIncrementAiUsage(clerkId);
  if (!usage.allowed) {
    if (usage.reason === "trial_expired") {
      const payload = trialExpiredPayload({ plan: usage.plan, context: "Análise de coerência do projeto" });
      return { ok: false, status: 402, error: payload.error, code: payload.code, body: payload };
    }
    const payload = aiLimitPayload({ limit: usage.limit, plan: usage.plan, used: usage.used, context: "Análise de coerência do projeto" });
    return { ok: false, status: 429, error: payload.error, code: payload.code, body: payload };
  }

  try {
    const result = await analyzeProjectCoherence(project.name, project.briefing, artifactContext);
    await db.update(projectsTable)
      .set({ coherenceScore: result.score, coherenceData: result, coherenceUpdatedAt: new Date(), updatedAt: new Date() })
      .where(eq(projectsTable.id, id));
    void logEvent(clerkId, "coherence_analyzed", { projectId: id, score: result.score });
    return { ok: true, data: result };
  } catch {
    return { ok: false, status: 500, error: "Erro ao analisar coerência. Tente novamente." };
  }
}

export async function analyzePotential(clerkId: string, id: number): Promise<ServiceResult<unknown>> {
  const projectResult = await requireProjectForAi(clerkId, id);
  if (!projectResult.ok) return projectResult;
  const project = projectResult.data;

  const artifactContext = await buildProjectArtifactContext(id, 1200);
  if (!artifactContext.trim()) {
    return { ok: false, status: 400, error: "Nenhum artefato gerado para analisar. Execute a IA nas fases primeiro." };
  }

  const usage = await checkAndIncrementAiUsage(clerkId);
  if (!usage.allowed) {
    if (usage.reason === "trial_expired") {
      const payload = trialExpiredPayload({ plan: usage.plan, context: "Análise de potencial de mercado" });
      return { ok: false, status: 402, error: payload.error, code: payload.code, body: payload };
    }
    const payload = aiLimitPayload({ limit: usage.limit, plan: usage.plan, used: usage.used, context: "Análise de potencial de mercado" });
    return { ok: false, status: 429, error: payload.error, code: payload.code, body: payload };
  }

  try {
    const result = await analyzeMarketPotential(project.name, project.briefing, artifactContext);
    await db.update(projectsTable)
      .set({ marketPotentialScore: result.score, marketPotentialData: result, marketPotentialUpdatedAt: new Date(), updatedAt: new Date() })
      .where(eq(projectsTable.id, id));
    void logEvent(clerkId, "market_potential_analyzed", { projectId: id, score: result.score });
    return { ok: true, data: result };
  } catch {
    return { ok: false, status: 500, error: "Erro ao analisar potencial de mercado. Tente novamente." };
  }
}
