import { db, phasesTable, projectsTable } from "@workspace/db";
import { and, eq, lt, isNull, gte, inArray } from "drizzle-orm";
import { createNotification } from "../lib/notifications";
import { logger } from "../lib/logger";
import { withAdvisoryLock } from "../lib/distributed-lock";
import { PHASE_NAMES_TITLE as PHASE_NAMES } from "../lib/phase-names";

export async function checkStalePhases(): Promise<void> {
  try {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const stalePhases = await db
      .select({
        phaseId: phasesTable.id,
        phaseNumber: phasesTable.phaseNumber,
        projectId: phasesTable.projectId,
      })
      .from(phasesTable)
      .where(and(eq(phasesTable.status, "active"), lt(phasesTable.updatedAt, threeDaysAgo)));

    if (stalePhases.length === 0) return;

    const projectIds = [...new Set(stalePhases.map(p => p.projectId))];
    const projects = await db
      .select({ id: projectsTable.id, clerkId: projectsTable.clerkId, name: projectsTable.name })
      .from(projectsTable)
      .where(and(inArray(projectsTable.id, projectIds), isNull(projectsTable.deletedAt)));

    const projectMap = Object.fromEntries(projects.map(p => [p.id, p]));

    for (const phase of stalePhases) {
      const project = projectMap[phase.projectId];
      if (!project) continue;
      const phaseName = PHASE_NAMES[phase.phaseNumber] ?? `Fase ${phase.phaseNumber}`;
      const link = `/projects/${project.id}/phases/${phase.phaseNumber}`;
      void createNotification(
        project.clerkId,
        "PHASE_REMINDER",
        `Fase ${phase.phaseNumber} esperando por você`,
        `${project.name} está na Fase ${phase.phaseNumber} — ${phaseName} há mais de 3 dias. Continue de onde parou.`,
        link
      );
    }
    logger.info({ count: stalePhases.length }, "checkStalePhases: notifications queued");
  } catch (err) {
    logger.error({ err }, "checkStalePhases failed");
  }
}

export async function checkStaleProjects(): Promise<void> {
  try {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const staleProjects = await db
      .select({
        id: projectsTable.id,
        clerkId: projectsTable.clerkId,
        name: projectsTable.name,
        currentPhase: projectsTable.currentPhase,
      })
      .from(projectsTable)
      .where(and(isNull(projectsTable.deletedAt), lt(projectsTable.updatedAt, sevenDaysAgo)));

    for (const project of staleProjects) {
      const phase = project.currentPhase ?? 1;
      const phaseName = PHASE_NAMES[phase] ?? `Fase ${phase}`;
      void createNotification(
        project.clerkId,
        "PROJECT_STALE",
        `${project.name} está esperando`,
        `Seu projeto está parado na Fase ${phase} — ${phaseName} há mais de 7 dias. Retome de onde parou e continue construindo.`,
        `/projects/${project.id}`
      );
    }
    logger.info({ count: staleProjects.length }, "checkStaleProjects: notifications queued");
  } catch (err) {
    logger.error({ err }, "checkStaleProjects failed");
  }
}

export async function checkInactiveUsers(): Promise<void> {
  try {
    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);

    const allUserProjects = await db
      .select({
        clerkId: projectsTable.clerkId,
        currentPhase: projectsTable.currentPhase,
        updatedAt: projectsTable.updatedAt,
      })
      .from(projectsTable)
      .where(isNull(projectsTable.deletedAt));

    // Find most recent project activity per user
    const userActivity: Record<string, { updatedAt: Date; currentPhase: number }> = {};
    for (const p of allUserProjects) {
      const prev = userActivity[p.clerkId];
      if (!prev || p.updatedAt > prev.updatedAt) {
        userActivity[p.clerkId] = { updatedAt: p.updatedAt, currentPhase: p.currentPhase ?? 1 };
      }
    }

    // Get users who were recently active (to exclude)
    const recentlyActiveClerkIds = new Set(
      allUserProjects
        .filter(p => p.updatedAt >= fourteenDaysAgo)
        .map(p => p.clerkId)
    );

    for (const [clerkId, activity] of Object.entries(userActivity)) {
      if (recentlyActiveClerkIds.has(clerkId)) continue;
      const phase = activity.currentPhase;
      const phaseName = PHASE_NAMES[phase] ?? `Fase ${phase}`;
      void createNotification(
        clerkId,
        "USER_INACTIVE",
        "Sentimos sua falta",
        `Você parou na Fase ${phase} — ${phaseName}. Founders que retomam regularmente lançam mais rápido. Volte e continue.`,
        "/dashboard"
      );
    }
    logger.info("checkInactiveUsers: notifications queued");
  } catch (err) {
    logger.error({ err }, "checkInactiveUsers failed");
  }
}

export function startRetentionJobs(): void {
  const SIX_HOURS = 6 * 60 * 60 * 1000;
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;
  const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

  // Every autoscale instance runs this same schedule — the advisory lock ensures only
  // one instance's tick actually executes each job, so notifications aren't queued N times.
  const runStalePhases = () => void withAdvisoryLock("retention:stale-phases", checkStalePhases);
  const runStaleProjects = () => void withAdvisoryLock("retention:stale-projects", checkStaleProjects);
  const runInactiveUsers = () => void withAdvisoryLock("retention:inactive-users", checkInactiveUsers);

  // Run once on startup (staggered to avoid startup spike)
  setTimeout(runStalePhases, 30_000);
  setTimeout(runStaleProjects, 60_000);
  setTimeout(runInactiveUsers, 90_000);

  // Then on intervals
  setInterval(runStalePhases, SIX_HOURS);
  setInterval(runStaleProjects, TWELVE_HOURS);
  setInterval(runInactiveUsers, TWENTY_FOUR_HOURS);

  logger.info("Retention jobs scheduled");
}
