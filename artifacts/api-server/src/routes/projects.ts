import { Router, type IRouter } from "express";
import { eq, and, count, isNull, isNotNull, lt, inArray } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, projectsTable, phasesTable, phaseArtifactsTable, usersTable } from "@workspace/db";
import {
  CreateProjectBody,
  UpdateProjectBody,
} from "@workspace/api-zod";
import { ensureUser, checkAndIncrementAiUsage } from "../lib/auth";
import { getPlanConfig } from "../lib/stripe";
import { auditLog } from "../lib/audit";
import { analyzeProjectCoherence, analyzeMarketPotential } from "../lib/ai";
import { logEvent } from "../lib/events";
import { createNotification } from "../lib/notifications";
import { seedDemoProject } from "../lib/demoSeed";

const router: IRouter = Router();

const TRASH_RETENTION_DAYS = 30;

// GET /projects/dashboard
router.get("/projects/dashboard", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  await ensureUser(userId);

  const [userRecord] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  const plan = userRecord ? getPlanConfig(userRecord.plan, userRecord.isSuperuser ?? false) : getPlanConfig("free");

  const projects = await db.select().from(projectsTable).where(
    and(eq(projectsTable.clerkId, userId), isNull(projectsTable.deletedAt))
  );

  const projectIds = projects.map(p => p.id);
  const allPhases = projectIds.length > 0
    ? await db.select().from(phasesTable).where(inArray(phasesTable.projectId, projectIds))
    : [];

  const phasesByProject = allPhases.reduce((acc, phase) => {
    (acc[phase.projectId] ??= []).push(phase);
    return acc;
  }, {} as Record<number, typeof allPhases>);

  const summaries = projects.map((project) => {
    const phases = (phasesByProject[project.id] ?? []).sort((a, b) => a.phaseNumber - b.phaseNumber);
    const completedPhases = phases.filter(p => p.status === "completed").length;
    const activePhase = phases.find(p => p.status === "active");
    const allGatesChecked = activePhase
      ? (activePhase.gate1Checked && activePhase.gate2Checked && activePhase.gate3Checked)
      : false;
    return {
      projectId: project.id,
      name: project.name,
      currentPhase: project.currentPhase,
      completedPhases,
      allGatesChecked,
      phaseStatuses: phases.map(p => p.status),
    };
  });

  res.json({
    projects: summaries,
    totalProjects: projects.length,
    dailyAiUsage: userRecord?.dailyAiUsage ?? 0,
    dailyAiLimit: plan.aiDailyLimit,
  });
});

// GET /projects/trash — list soft-deleted projects (auto-purge >30 days)
router.get("/projects/trash", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const cutoff = new Date(Date.now() - TRASH_RETENTION_DAYS * 24 * 60 * 60 * 1000);

  // Auto-purge projects older than 30 days
  await db.delete(projectsTable).where(
    and(
      eq(projectsTable.clerkId, userId),
      isNotNull(projectsTable.deletedAt),
      lt(projectsTable.deletedAt, cutoff),
    )
  );

  const trashed = await db.select().from(projectsTable).where(
    and(eq(projectsTable.clerkId, userId), isNotNull(projectsTable.deletedAt))
  );

  const now = Date.now();
  res.json(trashed.map(p => ({
    id: p.id,
    name: p.name,
    deletedAt: p.deletedAt,
    daysRemaining: Math.max(0, TRASH_RETENTION_DAYS - Math.floor((now - p.deletedAt!.getTime()) / (1000 * 60 * 60 * 24))),
  })));
});

// GET /projects
router.get("/projects", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projects = await db.select().from(projectsTable).where(
    and(eq(projectsTable.clerkId, userId), isNull(projectsTable.deletedAt))
  );
  res.json(projects);
});

// POST /projects/demo — seed pre-populated demo project (idempotent)
router.post("/projects/demo", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  await ensureUser(userId);

  // Plan limit check — only counts toward limit if a NEW demo is being created
  const [userFull] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  const plan = getPlanConfig(userFull?.plan ?? "free", userFull?.isSuperuser ?? false);

  const [{ count: existingDemoCount }] = await db.select({ count: count() }).from(projectsTable).where(
    and(eq(projectsTable.clerkId, userId), eq(projectsTable.isDemo, true), isNull(projectsTable.deletedAt))
  );

  if (Number(existingDemoCount) === 0) {
    const [{ count: projectCount }] = await db.select({ count: count() }).from(projectsTable).where(
      and(eq(projectsTable.clerkId, userId), isNull(projectsTable.deletedAt))
    );
    if (Number(projectCount) >= plan.maxProjects) {
      res.status(403).json({
        error: `Limite de ${plan.maxProjects} projeto(s) atingido para o plano ${plan.name}. Apague um projeto para carregar o demo.`,
        code: "PROJECT_LIMIT_REACHED",
      });
      return;
    }
  }

  const { created, project } = await seedDemoProject(userId);
  if (created) {
    await auditLog({ eventType: "user.project.demo_seeded", actorClerkId: userId, meta: { projectId: project.id }, req });
    void logEvent(userId, "project_created", { projectId: project.id, demo: true });
  }
  res.status(created ? 201 : 200).json({ ...project, alreadyExisted: !created });
});

// POST /projects
router.post("/projects", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  await ensureUser(userId);

  // Enforce plan project limit (only count active, non-deleted projects)
  const [userFull] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  const plan = getPlanConfig(userFull?.plan ?? "free", userFull?.isSuperuser ?? false);
  const [{ count: projectCount }] = await db.select({ count: count() }).from(projectsTable).where(
    and(eq(projectsTable.clerkId, userId), isNull(projectsTable.deletedAt))
  );
  if (Number(projectCount) >= plan.maxProjects) {
    res.status(403).json({
      error: `Limite de ${plan.maxProjects} projeto(s) atingido para o plano ${plan.name}. Faça upgrade para criar mais projetos.`,
      code: "PROJECT_LIMIT_REACHED",
    });
    return;
  }

  const [project] = await db.insert(projectsTable).values({
    clerkId: userId,
    name: parsed.data.name,
    briefing: parsed.data.briefing,
    currentPhase: 1,
  }).returning();

  // Create all 7 phases for this project
  const phaseValues = [1, 2, 3, 4, 5, 6, 7].map(num => ({
    projectId: project.id,
    phaseNumber: num,
    status: (num === 1 ? "active" : "locked") as "active" | "locked" | "completed",
    gate1Checked: false,
    gate2Checked: false,
    gate3Checked: false,
  }));
  await db.insert(phasesTable).values(phaseValues);

  await auditLog({ eventType: "user.project.created", actorClerkId: userId, meta: { projectId: project.id, name: project.name }, req });
  void logEvent(userId, "project_created", { projectId: project.id });
  res.status(201).json(project);
});

// GET /projects/:id
router.get("/projects/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.clerkId, userId), isNull(projectsTable.deletedAt))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const phases = await db.select().from(phasesTable).where(eq(phasesTable.projectId, id));

  res.json({ ...project, phases: phases.sort((a, b) => a.phaseNumber - b.phaseNumber) });
});

// PATCH /projects/:id
router.patch("/projects/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const [project] = await db.update(projectsTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, userId), isNull(projectsTable.deletedAt)))
    .returning();

  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  res.json(project);
});

// DELETE /projects/:id — soft delete (move to trash)
router.delete("/projects/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.update(projectsTable)
    .set({ deletedAt: new Date(), updatedAt: new Date() })
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, userId), isNull(projectsTable.deletedAt)))
    .returning();

  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  await auditLog({ eventType: "user.project.deleted", actorClerkId: userId, meta: { projectId: id, name: project.name }, req });
  res.json({ id: project.id, deletedAt: project.deletedAt });
});

// POST /projects/:id/restore — restore from trash (checks plan limit)
router.post("/projects/:id/restore", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  // Check plan limit before restoring
  const [userFull] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  const plan = getPlanConfig(userFull?.plan ?? "free", userFull?.isSuperuser ?? false);
  const [{ count: activeCount }] = await db.select({ count: count() }).from(projectsTable).where(
    and(eq(projectsTable.clerkId, userId), isNull(projectsTable.deletedAt))
  );
  if (Number(activeCount) >= plan.maxProjects) {
    res.status(403).json({
      error: `Limite de ${plan.maxProjects} projeto(s) atingido para o plano ${plan.name}. Apague um projeto ativo ou faça upgrade antes de restaurar.`,
      code: "PROJECT_LIMIT_REACHED",
    });
    return;
  }

  const [project] = await db.update(projectsTable)
    .set({ deletedAt: null, updatedAt: new Date() })
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, userId), isNotNull(projectsTable.deletedAt)))
    .returning();

  if (!project) { res.status(404).json({ error: "Project not found in trash" }); return; }
  await auditLog({ eventType: "user.project.restored", actorClerkId: userId, meta: { projectId: id, name: project.name }, req });
  res.json(project);
});

// DELETE /projects/:id/permanent — hard delete (irreversible)
router.delete("/projects/:id/permanent", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.delete(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, userId), isNotNull(projectsTable.deletedAt)))
    .returning();

  if (!project) { res.status(404).json({ error: "Project not found in trash" }); return; }
  await auditLog({ eventType: "user.project.permanent_deleted", actorClerkId: userId, meta: { projectId: id, name: project.name }, req });
  res.sendStatus(204);
});

// POST /projects/:id/share — enable public sharing (generates shareId)
router.post("/projects/:id/share", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const { randomBytes } = await import("node:crypto");
  const candidateShareId = randomBytes(9).toString("base64url");
  const now = new Date();

  // Atomic: only assign shareId if it is currently NULL (prevents concurrent overwrite)
  const [updated] = await db.update(projectsTable)
    .set({ shareId: candidateShareId, sharedAt: now, updatedAt: now })
    .where(and(
      eq(projectsTable.id, id),
      eq(projectsTable.clerkId, userId),
      isNull(projectsTable.deletedAt),
      isNull(projectsTable.shareId),
    ))
    .returning();

  if (updated) {
    await auditLog({ eventType: "user.project.shared", actorClerkId: userId, meta: { projectId: id }, req });
    res.json({ shareId: updated.shareId, sharedAt: updated.sharedAt });
    return;
  }

  // Either project doesn't exist for this user, or share already enabled — re-read to disambiguate
  const [existing] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.clerkId, userId), isNull(projectsTable.deletedAt))
  );
  if (!existing) { res.status(404).json({ error: "Project not found" }); return; }
  res.json({ shareId: existing.shareId, sharedAt: existing.sharedAt });
});

// DELETE /projects/:id/share — revoke public sharing
router.delete("/projects/:id/share", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [updated] = await db.update(projectsTable)
    .set({ shareId: null, sharedAt: null, updatedAt: new Date() })
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, userId), isNull(projectsTable.deletedAt)))
    .returning();

  if (!updated) { res.status(404).json({ error: "Project not found" }); return; }
  await auditLog({ eventType: "user.project.unshared", actorClerkId: userId, meta: { projectId: id }, req });
  res.json({ ok: true });
});

// GET /projects/:id/summary
router.get("/projects/:id/summary", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.clerkId, userId), isNull(projectsTable.deletedAt))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const phases = await db.select().from(phasesTable).where(eq(phasesTable.projectId, id));
  const sorted = phases.sort((a, b) => a.phaseNumber - b.phaseNumber);
  const completedPhases = sorted.filter(p => p.status === "completed").length;
  const activePhase = sorted.find(p => p.status === "active");
  const allGatesChecked = activePhase
    ? (activePhase.gate1Checked && activePhase.gate2Checked && activePhase.gate3Checked)
    : false;

  res.json({
    projectId: project.id,
    name: project.name,
    currentPhase: project.currentPhase,
    completedPhases,
    allGatesChecked,
    phaseStatuses: sorted.map(p => p.status),
  });
});

const PHASE_NAMES: Record<number, string> = {
  1: "IDEIA", 2: "PRD", 3: "SEGURANÇA & LGPD", 4: "SPEC",
  5: "IMPLEMENTAÇÃO", 6: "TESTE", 7: "DEPLOY",
};

router.get("/projects/:id/export.md", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.clerkId, userId), isNull(projectsTable.deletedAt))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [userForPlan] = await db
    .select({ plan: usersTable.plan, isSuperuser: usersTable.isSuperuser })
    .from(usersTable).where(eq(usersTable.clerkId, userId));
  const planCfg = getPlanConfig(userForPlan?.plan ?? "free", userForPlan?.isSuperuser ?? false);
  if (!planCfg.canDownload) {
    res.status(402).json({
      error: "Exportar artefatos requer um plano pago.",
      requiresUpgrade: true,
      code: "EXPORT_REQUIRES_PAID_PLAN",
    });
    return;
  }

  const phases = await db.select().from(phasesTable).where(eq(phasesTable.projectId, id));
  const sorted = phases.sort((a, b) => a.phaseNumber - b.phaseNumber);
  const phaseIds = sorted.map((p) => p.id);
  const artifacts = phaseIds.length
    ? await db.select().from(phaseArtifactsTable).where(inArray(phaseArtifactsTable.phaseId, phaseIds))
    : [];
  const byPhase = new Map<number, typeof artifacts>();
  for (const a of artifacts) {
    const arr = byPhase.get(a.phaseId) ?? [];
    arr.push(a);
    byPhase.set(a.phaseId, arr);
  }

  const completed = sorted.filter((p) => p.status === "completed").length;
  const exportDate = new Date().toISOString().slice(0, 10);
  const rawName = (project.name || "").replace(/[^a-z0-9\-_]+/gi, "-").toLowerCase().slice(0, 60).replace(/^-+|-+$/g, "");
  const safeName = rawName || "projeto";
  res.setHeader("Content-Type", "text/markdown; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="foundersflow-${safeName}-${exportDate}.md"`);

  const MAX_BYTES = 10 * 1024 * 1024; // 10 MB hard cap
  const MAX_ARTIFACT_CHARS = 200_000;  // ~200 KB per artifact
  let bytesWritten = 0;
  let truncated = false;
  const writeChunk = (chunk: string): boolean => {
    if (truncated) return false;
    const buf = Buffer.byteLength(chunk, "utf8");
    if (bytesWritten + buf > MAX_BYTES) {
      truncated = true;
      res.write(`\n\n> ⚠ Export truncado: limite de ${MAX_BYTES / 1024 / 1024} MB atingido.\n`);
      return false;
    }
    bytesWritten += buf;
    res.write(chunk);
    return true;
  };

  writeChunk(`# ${project.name}\n\n`);
  writeChunk(`> Export gerado em ${exportDate} via FoundersFlow — ${completed}/7 fases concluídas\n\n`);
  if (project.briefing?.trim()) {
    writeChunk(`## Briefing\n\n${project.briefing.trim()}\n\n`);
  }

  for (const phase of sorted) {
    if (truncated) break;
    const phaseArts = (byPhase.get(phase.id) ?? []).filter((a) => a.content?.trim());
    if (phaseArts.length === 0) continue;
    const statusEmoji = phase.status === "completed" ? "✅" : phase.status === "active" ? "🔵" : "⚪";
    const gatesDone = [phase.gate1Checked, phase.gate2Checked, phase.gate3Checked].filter(Boolean).length;
    writeChunk(`---\n\n## ${statusEmoji} Fase ${phase.phaseNumber} — ${PHASE_NAMES[phase.phaseNumber] ?? ""}\n\n`);
    writeChunk(`*Status: ${phase.status} · Gates: ${gatesDone}/3*\n\n`);
    for (const art of phaseArts) {
      if (truncated) break;
      let body = art.content.trim();
      if (body.length > MAX_ARTIFACT_CHARS) {
        body = body.slice(0, MAX_ARTIFACT_CHARS) + `\n\n> ⚠ Artefato truncado em ${MAX_ARTIFACT_CHARS} caracteres.`;
      }
      writeChunk(`### ${art.artifactKey}\n\n${body}\n\n`);
    }
  }

  writeChunk(`---\n\n*Gerado por FoundersFlow · foundersflow.com.br*\n`);
  res.end();

  await auditLog({
    eventType: "user.project.exported", actorClerkId: userId,
    meta: { projectId: id, format: "markdown", artifacts: artifacts.length }, req,
  }).catch(() => { /* fire and forget */ });
});

// GET /projects/:id/export.json — full project tree for client-side PDF rendering
router.get("/projects/:id/export.json", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.clerkId, userId), isNull(projectsTable.deletedAt))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [userForPlan] = await db
    .select({ plan: usersTable.plan, isSuperuser: usersTable.isSuperuser })
    .from(usersTable).where(eq(usersTable.clerkId, userId));
  const planCfg = getPlanConfig(userForPlan?.plan ?? "free", userForPlan?.isSuperuser ?? false);
  if (!planCfg.canDownload) {
    res.status(402).json({
      error: "Exportar artefatos requer um plano pago.",
      requiresUpgrade: true,
      code: "EXPORT_REQUIRES_PAID_PLAN",
    });
    return;
  }

  const phases = await db.select().from(phasesTable).where(eq(phasesTable.projectId, id));
  const sorted = phases.sort((a, b) => a.phaseNumber - b.phaseNumber);
  const phaseIds = sorted.map((p) => p.id);
  const artifacts = phaseIds.length
    ? await db.select().from(phaseArtifactsTable).where(inArray(phaseArtifactsTable.phaseId, phaseIds))
    : [];
  const byPhase = new Map<number, typeof artifacts>();
  for (const a of artifacts) {
    const arr = byPhase.get(a.phaseId) ?? [];
    arr.push(a);
    byPhase.set(a.phaseId, arr);
  }

  const MAX_ARTIFACT_CHARS = 200_000;
  res.json({
    id: project.id,
    name: project.name,
    briefing: project.briefing,
    phases: sorted.map((p) => ({
      phaseNumber: p.phaseNumber,
      status: p.status,
      artifacts: (byPhase.get(p.id) ?? []).map((a) => {
        const content = (a.content ?? "");
        const truncated = content.length > MAX_ARTIFACT_CHARS;
        return {
          artifactKey: a.artifactKey,
          content: truncated
            ? content.slice(0, MAX_ARTIFACT_CHARS) + `\n\n> Artefato truncado em ${MAX_ARTIFACT_CHARS} caracteres.`
            : content,
        };
      }),
    })),
  });
});

// GET /benchmarks — platform aggregate metrics for cross-project comparison
router.get("/benchmarks", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  // Platform-wide stats
  const allProjects = await db.select({
    coherenceScore: projectsTable.coherenceScore,
    marketPotentialScore: projectsTable.marketPotentialScore,
    currentPhase: projectsTable.currentPhase,
  }).from(projectsTable).where(isNull(projectsTable.deletedAt));

  const withCoherence = allProjects.filter(p => p.coherenceScore != null);
  const withPotential = allProjects.filter(p => p.marketPotentialScore != null);

  const avgCoherence = withCoherence.length > 0
    ? Math.round(withCoherence.reduce((s, p) => s + (p.coherenceScore ?? 0), 0) / withCoherence.length)
    : null;
  const avgPotential = withPotential.length > 0
    ? Math.round(withPotential.reduce((s, p) => s + (p.marketPotentialScore ?? 0), 0) / withPotential.length)
    : null;
  const avgPhase = allProjects.length > 0
    ? Math.round((allProjects.reduce((s, p) => s + (p.currentPhase ?? 1), 0) / allProjects.length) * 10) / 10
    : null;
  const completedCount = allProjects.filter(p => (p.currentPhase ?? 1) >= 7).length;

  // User's own stats
  const userProjects = await db.select().from(projectsTable)
    .where(and(eq(projectsTable.clerkId, userId), isNull(projectsTable.deletedAt)));
  const userAvgCoherence = userProjects.filter(p => p.coherenceScore != null).length > 0
    ? Math.round(userProjects.filter(p => p.coherenceScore != null).reduce((s, p) => s + (p.coherenceScore ?? 0), 0) / userProjects.filter(p => p.coherenceScore != null).length)
    : null;

  res.json({
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
  });
});

// POST /projects/:id/coherence/analyze
router.post("/projects/:id/coherence/analyze", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.clerkId, userId), isNull(projectsTable.deletedAt))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const phases = await db.select().from(phasesTable).where(eq(phasesTable.projectId, id));
  const lines: string[] = [];
  for (const phase of phases.sort((a, b) => a.phaseNumber - b.phaseNumber)) {
    const artifacts = await db.select().from(phaseArtifactsTable)
      .where(eq(phaseArtifactsTable.phaseId, phase.id));
    const filled = artifacts.filter(a => a.content?.trim());
    if (filled.length > 0) {
      lines.push(`=== FASE ${phase.phaseNumber} ===`);
      for (const a of filled) {
        lines.push(`[${a.artifactKey}]\n${a.content.slice(0, 1500)}`);
      }
    }
  }
  const artifactContext = lines.join("\n\n");

  if (!artifactContext.trim()) {
    res.status(400).json({ error: "Nenhum artefato gerado para analisar. Execute a IA nas fases primeiro." }); return;
  }

  const { allowed, limit } = await checkAndIncrementAiUsage(userId);
  if (!allowed) {
    res.status(429).json({ error: `Limite diário de ${limit} execuções de IA atingido. Tente novamente amanhã ou faça upgrade do plano.` }); return;
  }

  try {
    const result = await analyzeProjectCoherence(project.name, project.briefing, artifactContext);
    await db.update(projectsTable)
      .set({ coherenceScore: result.score, coherenceData: result, coherenceUpdatedAt: new Date(), updatedAt: new Date() })
      .where(eq(projectsTable.id, id));
    void logEvent(userId, "coherence_analyzed", { projectId: id, score: result.score });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Erro ao analisar coerência. Tente novamente." });
  }
});

// POST /projects/:id/potential/analyze
router.post("/projects/:id/potential/analyze", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, id), eq(projectsTable.clerkId, userId), isNull(projectsTable.deletedAt))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const phases = await db.select().from(phasesTable).where(eq(phasesTable.projectId, id));
  const lines: string[] = [];
  for (const phase of phases.sort((a, b) => a.phaseNumber - b.phaseNumber)) {
    const artifacts = await db.select().from(phaseArtifactsTable)
      .where(eq(phaseArtifactsTable.phaseId, phase.id));
    const filled = artifacts.filter(a => a.content?.trim());
    if (filled.length > 0) {
      lines.push(`=== FASE ${phase.phaseNumber} ===`);
      for (const a of filled) {
        lines.push(`[${a.artifactKey}]\n${a.content.slice(0, 1200)}`);
      }
    }
  }
  const artifactContext = lines.join("\n\n");

  if (!artifactContext.trim()) {
    res.status(400).json({ error: "Nenhum artefato gerado para analisar. Execute a IA nas fases primeiro." }); return;
  }

  const { allowed, limit } = await checkAndIncrementAiUsage(userId);
  if (!allowed) {
    res.status(429).json({ error: `Limite diário de ${limit} execuções de IA atingido.` }); return;
  }

  try {
    const result = await analyzeMarketPotential(project.name, project.briefing, artifactContext);
    await db.update(projectsTable)
      .set({ marketPotentialScore: result.score, marketPotentialData: result, marketPotentialUpdatedAt: new Date(), updatedAt: new Date() })
      .where(eq(projectsTable.id, id));
    void logEvent(userId, "market_potential_analyzed", { projectId: id, score: result.score });
    res.json(result);
  } catch {
    res.status(500).json({ error: "Erro ao analisar potencial de mercado. Tente novamente." });
  }
});

export default router;
