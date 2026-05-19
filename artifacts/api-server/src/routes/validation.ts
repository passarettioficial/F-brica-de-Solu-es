import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, projectsTable, phasesTable, phaseArtifactsTable, marketValidationsTable } from "@workspace/db";
import { generateInterviewScript, analyzeInterviewNotes } from "../lib/ai";
import { checkAndIncrementAiUsage } from "../lib/auth";

const router: IRouter = Router();

function requireAuth(req: any) {
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

async function getArtifactContext(projectId: number, phaseNumber?: number): Promise<string> {
  const phases = await db.select().from(phasesTable).where(eq(phasesTable.projectId, projectId));
  const filtered = phaseNumber
    ? phases.filter(p => p.phaseNumber <= phaseNumber)
    : phases;

  const lines: string[] = [];
  for (const phase of filtered.sort((a, b) => a.phaseNumber - b.phaseNumber)) {
    const artifacts = await db.select().from(phaseArtifactsTable)
      .where(eq(phaseArtifactsTable.phaseId, phase.id));
    const filled = artifacts.filter(a => a.content?.trim());
    if (filled.length > 0) {
      lines.push(`=== FASE ${phase.phaseNumber} ===`);
      for (const a of filled) {
        lines.push(`[${a.artifactKey}]\n${a.content.slice(0, 2000)}`);
      }
    }
  }
  return lines.join("\n\n");
}

// GET /projects/:projectId/validations
router.get("/projects/:projectId/validations", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, projectId), eq(projectsTable.clerkId, userId))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const validations = await db.select().from(marketValidationsTable)
    .where(eq(marketValidationsTable.projectId, projectId));

  res.json(validations);
});

// POST /projects/:projectId/validations — upsert (get or create) by phaseNumber
router.post("/projects/:projectId/validations", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const { phaseNumber } = req.body as { phaseNumber: number };

  if (!phaseNumber || phaseNumber < 1 || phaseNumber > 7) {
    res.status(400).json({ error: "phaseNumber must be 1-7" }); return;
  }

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, projectId), eq(projectsTable.clerkId, userId))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [existing] = await db.select().from(marketValidationsTable).where(
    and(eq(marketValidationsTable.projectId, projectId), eq(marketValidationsTable.phaseNumber, phaseNumber))
  );
  if (existing) { res.json(existing); return; }

  const [created] = await db.insert(marketValidationsTable).values({
    projectId,
    phaseNumber,
  }).returning();

  res.status(201).json(created);
});

// POST /projects/:projectId/validations/:validationId/generate-script (SSE)
router.post("/projects/:projectId/validations/:validationId/generate-script", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const validationId = parseInt(Array.isArray(req.params.validationId) ? req.params.validationId[0] : req.params.validationId, 10);

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, projectId), eq(projectsTable.clerkId, userId))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [validation] = await db.select().from(marketValidationsTable).where(
    and(eq(marketValidationsTable.id, validationId), eq(marketValidationsTable.projectId, projectId))
  );
  if (!validation) { res.status(404).json({ error: "Validation not found" }); return; }

  const artifactContext = await getArtifactContext(projectId, validation.phaseNumber);
  if (!artifactContext.trim()) {
    res.status(400).json({ error: "Nenhum artefato gerado para esta fase ainda." }); return;
  }

  const { allowed, limit } = await checkAndIncrementAiUsage(userId);
  if (!allowed) {
    res.status(429).json({ error: `Limite diário de ${limit} execuções de IA atingido. Tente novamente amanhã ou faça upgrade do plano.` }); return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    let fullScript = "";
    const script = await generateInterviewScript(
      validation.phaseNumber,
      project.name,
      artifactContext,
      (token) => {
        fullScript += token;
        res.write(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`);
      },
    );

    await db.update(marketValidationsTable)
      .set({ interviewScript: script, updatedAt: new Date() })
      .where(eq(marketValidationsTable.id, validationId));

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch {
    res.write(`data: ${JSON.stringify({ type: "error", message: "Erro ao gerar roteiro" })}\n\n`);
    res.end();
  }
});

// PATCH /projects/:projectId/validations/:validationId — save notes
router.patch("/projects/:projectId/validations/:validationId", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const validationId = parseInt(Array.isArray(req.params.validationId) ? req.params.validationId[0] : req.params.validationId, 10);
  const { interviewNotes } = req.body as { interviewNotes: string };

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, projectId), eq(projectsTable.clerkId, userId))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [updated] = await db.update(marketValidationsTable)
    .set({ interviewNotes, updatedAt: new Date() })
    .where(and(eq(marketValidationsTable.id, validationId), eq(marketValidationsTable.projectId, projectId)))
    .returning();

  if (!updated) { res.status(404).json({ error: "Validation not found" }); return; }
  res.json(updated);
});

// POST /projects/:projectId/validations/:validationId/analyze (SSE)
router.post("/projects/:projectId/validations/:validationId/analyze", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseInt(Array.isArray(req.params.projectId) ? req.params.projectId[0] : req.params.projectId, 10);
  const validationId = parseInt(Array.isArray(req.params.validationId) ? req.params.validationId[0] : req.params.validationId, 10);

  const [project] = await db.select().from(projectsTable).where(
    and(eq(projectsTable.id, projectId), eq(projectsTable.clerkId, userId))
  );
  if (!project) { res.status(404).json({ error: "Project not found" }); return; }

  const [validation] = await db.select().from(marketValidationsTable).where(
    and(eq(marketValidationsTable.id, validationId), eq(marketValidationsTable.projectId, projectId))
  );
  if (!validation) { res.status(404).json({ error: "Validation not found" }); return; }
  if (!validation.interviewNotes?.trim()) {
    res.status(400).json({ error: "Registre as notas das entrevistas antes de analisar." }); return;
  }

  const { allowed, limit } = await checkAndIncrementAiUsage(userId);
  if (!allowed) {
    res.status(429).json({ error: `Limite diário de ${limit} execuções de IA atingido. Tente novamente amanhã ou faça upgrade do plano.` }); return;
  }

  const artifactContext = await getArtifactContext(projectId, validation.phaseNumber);

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  try {
    const analysis = await analyzeInterviewNotes(
      project.name,
      artifactContext,
      validation.interviewNotes,
      (token) => {
        res.write(`data: ${JSON.stringify({ type: "token", content: token })}\n\n`);
      },
    );

    await db.update(marketValidationsTable)
      .set({ aiAnalysis: analysis, updatedAt: new Date() })
      .where(eq(marketValidationsTable.id, validationId));

    res.write(`data: ${JSON.stringify({ type: "done" })}\n\n`);
    res.end();
  } catch {
    res.write(`data: ${JSON.stringify({ type: "error", message: "Erro ao analisar notas" })}\n\n`);
    res.end();
  }
});

export default router;
