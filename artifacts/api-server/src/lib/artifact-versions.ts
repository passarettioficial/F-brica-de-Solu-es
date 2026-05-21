import { artifactVersionsTable, phaseArtifactsTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";

export const MAX_VERSIONS_PER_ARTIFACT = 20;

export type VersionSource = "ai_regen" | "manual_edit" | "restore";

type TxOrDb = {
  select: any;
  insert: any;
  delete: any;
  execute: any;
};

async function pruneOldVersions(
  tx: TxOrDb,
  phaseId: number,
  artifactKey: string,
): Promise<void> {
  await tx.execute(sql`
    DELETE FROM artifact_versions
    WHERE id IN (
      SELECT id FROM (
        SELECT id, ROW_NUMBER() OVER (
          PARTITION BY phase_id, artifact_key
          ORDER BY created_at DESC, id DESC
        ) AS rn
        FROM artifact_versions
        WHERE phase_id = ${phaseId} AND artifact_key = ${artifactKey}
      ) ranked
      WHERE rn > ${MAX_VERSIONS_PER_ARTIFACT}
    )
  `);
}

export async function snapshotArtifact(
  tx: TxOrDb,
  phaseId: number,
  artifactKey: string,
  source: VersionSource,
  clerkId: string,
): Promise<void> {
  const [existing] = await tx
    .select({ content: phaseArtifactsTable.content, contentJson: phaseArtifactsTable.contentJson })
    .from(phaseArtifactsTable)
    .where(and(eq(phaseArtifactsTable.phaseId, phaseId), eq(phaseArtifactsTable.artifactKey, artifactKey)));
  if (!existing || !existing.content?.trim()) return;
  await tx.insert(artifactVersionsTable).values({
    phaseId,
    artifactKey,
    content: existing.content,
    contentJson: existing.contentJson ?? null,
    source,
    createdByClerkId: clerkId,
  });
  await pruneOldVersions(tx, phaseId, artifactKey);
}

export async function snapshotAllPhaseArtifacts(
  tx: TxOrDb,
  phaseId: number,
  source: VersionSource,
  clerkId: string,
): Promise<void> {
  const existing = await tx
    .select({ artifactKey: phaseArtifactsTable.artifactKey, content: phaseArtifactsTable.content, contentJson: phaseArtifactsTable.contentJson })
    .from(phaseArtifactsTable)
    .where(eq(phaseArtifactsTable.phaseId, phaseId));
  const nonEmpty = existing.filter((a: { content: string }) => a.content?.trim());
  if (nonEmpty.length === 0) return;
  await tx.insert(artifactVersionsTable).values(
    nonEmpty.map((a: { artifactKey: string; content: string; contentJson: string | null }) => ({
      phaseId,
      artifactKey: a.artifactKey,
      content: a.content,
      contentJson: a.contentJson ?? null,
      source,
      createdByClerkId: clerkId,
    })),
  );
  for (const a of nonEmpty) {
    await pruneOldVersions(tx, phaseId, a.artifactKey);
  }
}
