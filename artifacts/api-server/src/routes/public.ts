import { Router, type IRouter, type Request } from "express";
import { eq, and, isNull, inArray } from "drizzle-orm";
import { db, projectsTable, phasesTable, phaseArtifactsTable, usersTable } from "@workspace/db";
import { getPlanConfig } from "../lib/stripe";

const router: IRouter = Router();

// GET /public/projects/:shareId — public read-only project view (no auth)
router.get("/public/projects/:shareId", async (req: Request, res): Promise<void> => {
  // Privacy: prevent search engine indexing + caching of shared content
  res.setHeader("X-Robots-Tag", "noindex, noarchive, nosnippet");
  res.setHeader("Cache-Control", "private, no-store");

  const raw = Array.isArray(req.params.shareId) ? req.params.shareId[0] : req.params.shareId;
  const shareId = String(raw || "").trim();
  if (!shareId || shareId.length < 8) { res.status(400).json({ error: "Invalid share id" }); return; }

  const [project] = await db.select({
    id: projectsTable.id,
    name: projectsTable.name,
    briefing: projectsTable.briefing,
    currentPhase: projectsTable.currentPhase,
    coherenceScore: projectsTable.coherenceScore,
    marketPotentialScore: projectsTable.marketPotentialScore,
    sharedAt: projectsTable.sharedAt,
    createdAt: projectsTable.createdAt,
    clerkId: projectsTable.clerkId,
  }).from(projectsTable).where(
    and(eq(projectsTable.shareId, shareId), isNull(projectsTable.deletedAt))
  );

  if (!project) { res.status(404).json({ error: "Projeto não encontrado ou link revogado" }); return; }

  // Phase 3 gating must follow the project OWNER's plan on public shares too —
  // a free founder cannot leak premium artifacts by toggling the share link on.
  const [owner] = await db
    .select({ plan: usersTable.plan, isSuperuser: usersTable.isSuperuser })
    .from(usersTable)
    .where(eq(usersTable.clerkId, project.clerkId));
  const ownerPlan = getPlanConfig(owner?.plan ?? "free", owner?.isSuperuser ?? false);
  const ownerIsFree = ownerPlan.id === "free";

  const phases = await db.select().from(phasesTable).where(eq(phasesTable.projectId, project.id));
  const sortedPhases = phases.sort((a, b) => a.phaseNumber - b.phaseNumber);

  const phaseIds = sortedPhases.map(p => p.id);
  const allArtifacts = phaseIds.length > 0
    ? await db.select().from(phaseArtifactsTable).where(inArray(phaseArtifactsTable.phaseId, phaseIds))
    : [];

  const artifactsByPhase = allArtifacts.reduce((acc, a) => {
    (acc[a.phaseId] ??= []).push(a);
    return acc;
  }, {} as Record<number, typeof allArtifacts>);

  const phasesWithArtifacts = sortedPhases.map(p => ({
    phaseNumber: p.phaseNumber,
    status: p.status,
    artifacts: (artifactsByPhase[p.id] ?? []).map(a => {
      const gated = ownerIsFree && p.phaseNumber === 3 && a.artifactKey !== "POLITICA_PRIVACIDADE";
      return {
        artifactKey: a.artifactKey,
        content: gated ? "" : a.content,
        ...(gated ? { locked: true } : {}),
      };
    }),
  }));

  res.json({
    name: project.name,
    briefing: project.briefing,
    currentPhase: project.currentPhase,
    coherenceScore: project.coherenceScore,
    marketPotentialScore: project.marketPotentialScore,
    sharedAt: project.sharedAt,
    createdAt: project.createdAt,
    phases: phasesWithArtifacts,
  });
});

export default router;
