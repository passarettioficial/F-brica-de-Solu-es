import { Router, type IRouter } from "express";
import {
  CreateProjectBody,
  UpdateProjectBody,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import {
  getDashboardSummary,
  purgeAndListTrash,
  listActiveProjects,
  seedDemo,
  createProject,
  getProjectWithPhases,
  updateProject,
  softDeleteProject,
  restoreProject,
  permanentlyDeleteProject,
  enableSharing,
  disableSharing,
  getProjectSummary,
  getExportData,
  logProjectExport,
  getBenchmarks,
  analyzeCoherence,
  analyzePotential,
  PHASE_NAMES,
} from "../lib/project-service";

const router: IRouter = Router();

function parseId(raw: string | string[] | undefined): number | null {
  const value = Array.isArray(raw) ? raw[0] : raw;
  const id = value ? parseInt(value, 10) : NaN;
  return isNaN(id) ? null : id;
}

function sendServiceError(res: import("express").Response, result: { status: number; error: string; code?: string; body?: Record<string, unknown> }) {
  res.status(result.status).json(result.body ?? { error: result.error, ...(result.code ? { code: result.code } : {}) });
}

// GET /projects/dashboard
router.get("/projects/dashboard", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  res.json(await getDashboardSummary(userId));
});

// GET /projects/trash — list soft-deleted projects (auto-purge >30 days)
router.get("/projects/trash", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  res.json(await purgeAndListTrash(userId));
});

// GET /projects
router.get("/projects", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  res.json(await listActiveProjects(userId));
});

// POST /projects/demo — seed pre-populated demo project (idempotent)
router.post("/projects/demo", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const result = await seedDemo(userId, req);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.status(result.data.alreadyExisted ? 200 : 201).json(result.data);
});

// POST /projects
router.post("/projects", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const result = await createProject(userId, parsed.data, req);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.status(201).json(result.data);
});

// GET /projects/:id
router.get("/projects/:id", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseId(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const result = await getProjectWithPhases(userId, id);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

// PATCH /projects/:id
router.patch("/projects/:id", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseId(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const parsed = UpdateProjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const result = await updateProject(userId, id, parsed.data);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

// DELETE /projects/:id — soft delete (move to trash)
router.delete("/projects/:id", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseId(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const result = await softDeleteProject(userId, id, req);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

// POST /projects/:id/restore — restore from trash (checks plan limit)
router.post("/projects/:id/restore", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseId(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const result = await restoreProject(userId, id, req);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

// DELETE /projects/:id/permanent — hard delete (irreversible)
router.delete("/projects/:id/permanent", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseId(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const result = await permanentlyDeleteProject(userId, id, req);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.sendStatus(204);
});

// POST /projects/:id/share — enable public sharing (generates shareId)
router.post("/projects/:id/share", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseId(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const result = await enableSharing(userId, id, req);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

// DELETE /projects/:id/share — revoke public sharing
router.delete("/projects/:id/share", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseId(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const result = await disableSharing(userId, id, req);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

// GET /projects/:id/summary
router.get("/projects/:id/summary", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseId(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const result = await getProjectSummary(userId, id);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

router.get("/projects/:id/export.md", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseId(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const result = await getExportData(userId, id);
  if (!result.ok) { sendServiceError(res, result); return; }
  const { project, sortedPhases, artifactsByPhase } = result.data;

  const completed = sortedPhases.filter((p) => p.status === "completed").length;
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

  let artifactCount = 0;
  for (const phase of sortedPhases) {
    if (truncated) break;
    const phaseArts = (artifactsByPhase.get(phase.id) ?? []).filter((a) => a.content?.trim());
    if (phaseArts.length === 0) continue;
    const statusEmoji = phase.status === "completed" ? "✅" : phase.status === "active" ? "🔵" : "⚪";
    const gatesDone = [phase.gate1Checked, phase.gate2Checked, phase.gate3Checked].filter(Boolean).length;
    writeChunk(`---\n\n## ${statusEmoji} Fase ${phase.phaseNumber} — ${PHASE_NAMES[phase.phaseNumber] ?? ""}\n\n`);
    writeChunk(`*Status: ${phase.status} · Gates: ${gatesDone}/3*\n\n`);
    for (const art of phaseArts) {
      if (truncated) break;
      artifactCount += 1;
      let body = art.content.trim();
      if (body.length > MAX_ARTIFACT_CHARS) {
        body = body.slice(0, MAX_ARTIFACT_CHARS) + `\n\n> ⚠ Artefato truncado em ${MAX_ARTIFACT_CHARS} caracteres.`;
      }
      writeChunk(`### ${art.artifactKey}\n\n${body}\n\n`);
    }
  }

  writeChunk(`---\n\n*Gerado por FoundersFlow · foundersflow.com.br*\n`);
  res.end();

  await logProjectExport(userId, id, artifactCount, req);
});

// GET /projects/:id/export.json — full project tree for client-side PDF rendering
router.get("/projects/:id/export.json", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseId(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const result = await getExportData(userId, id);
  if (!result.ok) { sendServiceError(res, result); return; }
  const { project, sortedPhases, artifactsByPhase } = result.data;

  const MAX_ARTIFACT_CHARS = 200_000;
  res.json({
    id: project.id,
    name: project.name,
    briefing: project.briefing,
    phases: sortedPhases.map((p) => ({
      phaseNumber: p.phaseNumber,
      status: p.status,
      artifacts: (artifactsByPhase.get(p.id) ?? []).map((a) => {
        const content = a.content ?? "";
        const isTruncated = content.length > MAX_ARTIFACT_CHARS;
        return {
          artifactKey: a.artifactKey,
          content: isTruncated
            ? content.slice(0, MAX_ARTIFACT_CHARS) + `\n\n> Artefato truncado em ${MAX_ARTIFACT_CHARS} caracteres.`
            : content,
        };
      }),
    })),
  });
});

// GET /benchmarks — platform aggregate metrics for cross-project comparison
router.get("/benchmarks", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  res.json(await getBenchmarks(userId));
});

// POST /projects/:id/coherence/analyze
router.post("/projects/:id/coherence/analyze", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseId(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const result = await analyzeCoherence(userId, id);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

// POST /projects/:id/potential/analyze
router.post("/projects/:id/potential/analyze", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const id = parseId(req.params.id);
  if (id === null) { res.status(400).json({ error: "Invalid id" }); return; }

  const result = await analyzePotential(userId, id);
  if (!result.ok) { sendServiceError(res, result); return; }
  res.json(result.data);
});

export default router;
