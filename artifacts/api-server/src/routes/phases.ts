import { Router, type IRouter, type Response } from "express";
import {
  UpdatePhaseGatesBody,
  UpdateArtifactBody,
} from "@workspace/api-zod";
import { z } from "zod/v4";
import { requireAuth } from "../lib/auth";
import {
  getPhaseWithArtifacts,
  listPhaseArtifacts,
  updatePhaseGates,
  completePhase,
  updateArtifact,
  listArtifactVersions,
  restoreArtifactVersion,
  markArtifactDownloaded,
  submitArtifactFeedback,
  prepareExecution,
  finalizeExecutionSuccess,
  releaseExecutionLock,
  generatePhaseArtifacts,
} from "../lib/phase-service";

const ArtifactFeedbackBody = z.object({
  rating: z.enum(["up", "down"]),
  comment: z.string().trim().max(500).nullish(),
});

const router: IRouter = Router();

function parseIntParam(raw: string | string[] | undefined): number {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value ? parseInt(value, 10) : NaN;
}

function stringParam(raw: string | string[] | undefined): string {
  return Array.isArray(raw) ? raw[0]! : raw!;
}

function sendServiceError(res: Response, result: { status: number; error: string; code?: string; body?: Record<string, unknown> }) {
  res.status(result.status).json(result.body ?? { error: result.error, ...(result.code ? { code: result.code } : {}) });
}

// GET /projects/:projectId/phases/:phaseNumber
router.get("/projects/:projectId/phases/:phaseNumber", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseIntParam(req.params.projectId);
  const phaseNumber = parseIntParam(req.params.phaseNumber);
  if (isNaN(projectId) || isNaN(phaseNumber)) { res.status(400).json({ error: "Invalid id" }); return; }

  const result = await getPhaseWithArtifacts(userId, projectId, phaseNumber);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

// PATCH /projects/:projectId/phases/:phaseNumber/gates
router.patch("/projects/:projectId/phases/:phaseNumber/gates", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseIntParam(req.params.projectId);
  const phaseNumber = parseIntParam(req.params.phaseNumber);

  const parsed = UpdatePhaseGatesBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const result = await updatePhaseGates(userId, projectId, phaseNumber, parsed.data);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

// POST /projects/:projectId/phases/:phaseNumber/complete
router.post("/projects/:projectId/phases/:phaseNumber/complete", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseIntParam(req.params.projectId);
  const phaseNumber = parseIntParam(req.params.phaseNumber);

  const result = await completePhase(userId, projectId, phaseNumber);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

// GET /projects/:projectId/phases/:phaseNumber/artifacts
router.get("/projects/:projectId/phases/:phaseNumber/artifacts", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseIntParam(req.params.projectId);
  const phaseNumber = parseIntParam(req.params.phaseNumber);

  const result = await listPhaseArtifacts(userId, projectId, phaseNumber);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

// PATCH /projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey
router.patch("/projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseIntParam(req.params.projectId);
  const phaseNumber = parseIntParam(req.params.phaseNumber);
  const artifactKey = stringParam(req.params.artifactKey);

  const parsed = UpdateArtifactBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const result = await updateArtifact(userId, projectId, phaseNumber, artifactKey, parsed.data);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

// GET /projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/versions
router.get("/projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/versions", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseIntParam(req.params.projectId);
  const phaseNumber = parseIntParam(req.params.phaseNumber);
  const artifactKey = stringParam(req.params.artifactKey);

  const result = await listArtifactVersions(userId, projectId, phaseNumber, artifactKey);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

// POST /projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/versions/:versionId/restore
router.post("/projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/versions/:versionId/restore", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseIntParam(req.params.projectId);
  const phaseNumber = parseIntParam(req.params.phaseNumber);
  const artifactKey = stringParam(req.params.artifactKey);
  const versionId = parseIntParam(req.params.versionId);
  if (isNaN(versionId)) { res.status(400).json({ error: "Invalid versionId" }); return; }

  const result = await restoreArtifactVersion(userId, projectId, phaseNumber, artifactKey, versionId);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

// PATCH /projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/download
router.patch("/projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/download", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseIntParam(req.params.projectId);
  const phaseNumber = parseIntParam(req.params.phaseNumber);
  const artifactKey = stringParam(req.params.artifactKey);

  const result = await markArtifactDownloaded(userId, projectId, phaseNumber, artifactKey);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

// POST /projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/feedback
router.post("/projects/:projectId/phases/:phaseNumber/artifacts/:artifactKey/feedback", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseIntParam(req.params.projectId);
  const phaseNumber = parseIntParam(req.params.phaseNumber);
  const artifactKey = stringParam(req.params.artifactKey);
  if (isNaN(projectId) || isNaN(phaseNumber) || !artifactKey) { res.status(400).json({ error: "Invalid params" }); return; }

  const parsed = ArtifactFeedbackBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: "Invalid body", issues: parsed.error.issues }); return; }
  const { rating } = parsed.data;
  const comment = parsed.data.comment && parsed.data.comment.length > 0 ? parsed.data.comment : null;

  const result = await submitArtifactFeedback(userId, projectId, phaseNumber, artifactKey, rating, comment);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

// POST /projects/:projectId/phases/:phaseNumber/execute (SSE)
router.post("/projects/:projectId/phases/:phaseNumber/execute", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projectId = parseIntParam(req.params.projectId);
  const phaseNumber = parseIntParam(req.params.phaseNumber);

  const prep = await prepareExecution(userId, projectId, phaseNumber, req);
  if (!prep.ok) { sendServiceError(res, prep); return; }
  const { project, phase, founderProfile, previousArtifacts, suppressProgressContent } = prep.data;

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
        // Phase 3 free gating: suppress raw token streaming so locked artifact content
        // never leaves the server in the SSE progress channel. We still emit a generic
        // status ping so the UI shows movement.
        if (suppressProgressContent) {
          res.write(`data: ${JSON.stringify({ type: "progress", content: "" })}\n\n`);
          return;
        }
        res.write(`data: ${JSON.stringify({ type: "progress", content: text })}\n\n`);
      },
      founderProfile ?? undefined,
    );

    const visibleSaved = await finalizeExecutionSuccess(userId, phase, phaseNumber, projectId, results);

    clearInterval(heartbeat);
    res.write(`data: ${JSON.stringify({ type: "done", artifacts: visibleSaved })}\n\n`);
    res.end();
  } catch (error) {
    clearInterval(heartbeat);
    await releaseExecutionLock(phase.id);
    req.log.error({ err: error, userId, projectId, phaseNumber }, "AI generation failed");
    res.write(`data: ${JSON.stringify({ type: "error", message: "Erro ao gerar artefatos" })}\n\n`);
    res.end();
  }
});

export default router;
