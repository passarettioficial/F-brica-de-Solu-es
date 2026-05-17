import { Router, type IRouter } from "express";
import { eq, and, count } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, projectsTable, phasesTable, phaseArtifactsTable, usersTable } from "@workspace/db";
import {
  CreateProjectBody,
  UpdateProjectBody,
} from "@workspace/api-zod";
import { ensureUser } from "../lib/auth";
import { getPlanConfig } from "../lib/stripe";

const router: IRouter = Router();

// GET /projects/dashboard
router.get("/projects/dashboard", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  await ensureUser(userId);

  const [userRecord] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  const plan = userRecord ? getPlanConfig(userRecord.plan, userRecord.isSuperuser ?? false) : getPlanConfig("free");

  const projects = await db.select().from(projectsTable).where(eq(projectsTable.clerkId, userId));

  const summaries = await Promise.all(projects.map(async (project) => {
    const phases = await db.select().from(phasesTable).where(eq(phasesTable.projectId, project.id));
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
      phaseStatuses: phases.sort((a, b) => a.phaseNumber - b.phaseNumber).map(p => p.status),
    };
  }));

  res.json({
    projects: summaries,
    totalProjects: projects.length,
    dailyAiUsage: userRecord?.dailyAiUsage ?? 0,
    dailyAiLimit: plan.aiDailyLimit,
  });
});

// GET /projects
router.get("/projects", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const projects = await db.select().from(projectsTable).where(eq(projectsTable.clerkId, userId));
  res.json(projects);
});

// POST /projects
router.post("/projects", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = CreateProjectBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  const userRecord = await ensureUser(userId);

  // Enforce plan project limit
  const [userFull] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  const plan = getPlanConfig(userFull?.plan ?? "free", userFull?.isSuperuser ?? false);
  const [{ count: projectCount }] = await db.select({ count: count() }).from(projectsTable).where(eq(projectsTable.clerkId, userId));
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
    and(eq(projectsTable.id, id), eq(projectsTable.clerkId, userId))
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
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, userId)))
    .returning();

  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  res.json(project);
});

// DELETE /projects/:id
router.delete("/projects/:id", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const id = parseInt(raw, 10);
  if (isNaN(id)) { res.status(400).json({ error: "Invalid id" }); return; }

  const [project] = await db.delete(projectsTable)
    .where(and(eq(projectsTable.id, id), eq(projectsTable.clerkId, userId)))
    .returning();

  if (!project) { res.status(404).json({ error: "Project not found" }); return; }
  res.sendStatus(204);
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
    and(eq(projectsTable.id, id), eq(projectsTable.clerkId, userId))
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

export default router;
