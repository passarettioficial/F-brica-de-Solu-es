import { db, phasesTable, phaseArtifactsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

/**
 * Builds a flattened text context of every non-empty artifact in a project,
 * grouped by phase. Used by coherence/potential analyses that need to feed
 * the LLM a digest of the project so far.
 */
export async function buildProjectArtifactContext(projectId: number, charLimit = 1500): Promise<string> {
  const phases = await db.select().from(phasesTable).where(eq(phasesTable.projectId, projectId));
  const lines: string[] = [];
  for (const phase of phases.sort((a, b) => a.phaseNumber - b.phaseNumber)) {
    const artifacts = await db.select().from(phaseArtifactsTable).where(eq(phaseArtifactsTable.phaseId, phase.id));
    const filled = artifacts.filter((a) => a.content?.trim());
    if (filled.length === 0) continue;
    lines.push(`=== FASE ${phase.phaseNumber} ===`);
    for (const a of filled) {
      lines.push(`[${a.artifactKey}]\n${a.content.slice(0, charLimit)}`);
    }
  }
  return lines.join("\n\n");
}
