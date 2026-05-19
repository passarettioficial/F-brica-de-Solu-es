import { Router, type IRouter } from "express";
import { eq, and, inArray } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, projectsTable, phasesTable, phaseArtifactsTable, usersTable } from "@workspace/db";
import {
  UpdatePhaseGatesBody,
  UpdateArtifactBody,
} from "@workspace/api-zod";
import { generatePhaseArtifacts } from "../lib/ai";
import { logEvent } from "../lib/events";
import { checkAndIncrementAiUsage } from "../lib/auth";
import { auditLog } from "../lib/audit";

const router: IRouter = Router();

function requireAuth(req: any) {
  const auth = getAuth(req);
  return auth?.userId ?? null;
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

  res.json({ ...phase, artifacts });
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
  if (phaseNumber === 7) void logEvent(userId, "project_completed", { projectId });
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
  res.json(artifacts);
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

  const [phase] = await db.select().from(phasesTable).where(
    and(eq(phasesTable.projectId, projectId), eq(phasesTable.phaseNumber, phaseNumber))
  );
  if (!phase) { res.status(404).json({ error: "Phase not found" }); return; }

  const [artifact] = await db.update(phaseArtifactsTable)
    .set({ content: parsed.data.content, contentJson: parsed.data.contentJson ?? null, updatedAt: new Date() })
    .where(and(eq(phaseArtifactsTable.phaseId, phase.id), eq(phaseArtifactsTable.artifactKey, artifactKey)))
    .returning();

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
  res.json(artifact);
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

  const { allowed, limit } = await checkAndIncrementAiUsage(userId);
  if (!allowed) {
    await db.update(phasesTable).set({ isGenerating: false }).where(eq(phasesTable.id, phase.id));
    await auditLog({ eventType: "security.rate_limited", actorClerkId: userId, meta: { reason: "ai_daily_limit", limit, phaseNumber, projectId }, req });
    res.status(429).json({ error: `Limite diário de ${limit} execuções de IA atingido. Tente novamente amanhã ou faça upgrade do plano.` });
    return;
  }
  await auditLog({ eventType: "user.ai.used", actorClerkId: userId, meta: { projectId, phaseNumber, projectName: project.name }, req });

  // Fetch founder profile for personalized AI context
  const [userRecord] = await db.select({ founderProfile: usersTable.founderProfile })
    .from(usersTable).where(eq(usersTable.clerkId, userId));
  const founderProfile = (userRecord?.founderProfile ?? null) as Record<string, string> | null;

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

  try {
    const results = await generatePhaseArtifacts(
      phaseNumber,
      project.name,
      project.briefing,
      previousArtifacts,
      (text) => {
        res.write(`data: ${JSON.stringify({ type: "progress", content: text })}\n\n`);
      },
      founderProfile ?? undefined
    );

    // Atomic upsert: delete + insert in a single transaction
    await db.transaction(async (tx) => {
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

    clearInterval(heartbeat);
    await db.update(phasesTable).set({ isGenerating: false }).where(eq(phasesTable.id, phase.id));
    void logEvent(userId, "ai_generated", { projectId, phaseId: phase.id, artifactCount: saved.length });
    res.write(`data: ${JSON.stringify({ type: "done", artifacts: saved })}\n\n`);
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
