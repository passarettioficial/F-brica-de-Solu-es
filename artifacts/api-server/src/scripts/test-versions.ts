import { db, artifactVersionsTable, phaseArtifactsTable, projectsTable, phasesTable, usersTable } from "@workspace/db";
import { and, eq, sql } from "drizzle-orm";
import { snapshotArtifact, snapshotAllPhaseArtifacts, MAX_VERSIONS_PER_ARTIFACT } from "../lib/artifact-versions";

const CLERK_ID = "test_hist_user";
const ART_KEY = "LEAN_CANVAS";

function assert(cond: any, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exit(1);
  }
  console.log("PASS:", msg);
}

async function main() {
  await db.insert(usersTable).values({ clerkId: CLERK_ID, plan: "founder" }).onConflictDoNothing();

  await db.delete(projectsTable).where(eq(projectsTable.clerkId, CLERK_ID));
  const [proj] = await db.insert(projectsTable).values({ clerkId: CLERK_ID, name: "RegenTest", briefing: "t" }).returning();
  const [phase] = await db.insert(phasesTable).values({ projectId: proj.id, phaseNumber: 1, status: "active" }).returning();
  const phaseId = phase.id;

  await db.insert(phaseArtifactsTable).values({ phaseId, artifactKey: ART_KEY, content: "# v0" });

  // --- Test 1: snapshotArtifact creates a row
  await snapshotArtifact(db as any, phaseId, ART_KEY, "manual_edit", CLERK_ID);
  let rows = await db.select().from(artifactVersionsTable).where(and(eq(artifactVersionsTable.phaseId, phaseId), eq(artifactVersionsTable.artifactKey, ART_KEY)));
  assert(rows.length === 1, "snapshotArtifact creates 1 version");
  assert(rows[0].content === "# v0", "snapshot content matches current");
  assert(rows[0].source === "manual_edit", "snapshot source is manual_edit");
  assert(rows[0].createdByClerkId === CLERK_ID, "snapshot createdByClerkId set");

  // --- Test 2: snapshotArtifact no-op when artifact missing
  await snapshotArtifact(db as any, phaseId, "NONEXISTENT_KEY", "manual_edit", CLERK_ID);
  rows = await db.select().from(artifactVersionsTable).where(and(eq(artifactVersionsTable.phaseId, phaseId), eq(artifactVersionsTable.artifactKey, "NONEXISTENT_KEY")));
  assert(rows.length === 0, "snapshotArtifact no-ops on missing artifact");

  // --- Test 3: snapshotArtifact no-op when content empty/whitespace
  await db.insert(phaseArtifactsTable).values({ phaseId, artifactKey: "EMPTY_KEY", content: "   " });
  await snapshotArtifact(db as any, phaseId, "EMPTY_KEY", "manual_edit", CLERK_ID);
  rows = await db.select().from(artifactVersionsTable).where(and(eq(artifactVersionsTable.phaseId, phaseId), eq(artifactVersionsTable.artifactKey, "EMPTY_KEY")));
  assert(rows.length === 0, "snapshotArtifact no-ops on whitespace content");

  // --- Test 4: prune caps at MAX_VERSIONS_PER_ARTIFACT (20)
  // Add 24 more so we have 25 total
  for (let i = 1; i <= 24; i++) {
    await db.update(phaseArtifactsTable).set({ content: `# v${i}` }).where(and(eq(phaseArtifactsTable.phaseId, phaseId), eq(phaseArtifactsTable.artifactKey, ART_KEY)));
    await snapshotArtifact(db as any, phaseId, ART_KEY, "manual_edit", CLERK_ID);
  }
  rows = await db.select().from(artifactVersionsTable).where(and(eq(artifactVersionsTable.phaseId, phaseId), eq(artifactVersionsTable.artifactKey, ART_KEY))).orderBy(sql`created_at DESC, id DESC`);
  assert(rows.length === MAX_VERSIONS_PER_ARTIFACT, `prune caps at ${MAX_VERSIONS_PER_ARTIFACT} (got ${rows.length})`);
  // Newest should be v23 (last loop iter snapshotted current "v23" BEFORE setting to v24)
  assert(rows[0].content === "# v24", `newest preserved (got ${rows[0].content})`);
  // 25 total (v0..v24), pruned to 20 → oldest kept is v5
  assert(rows[rows.length - 1].content === "# v5", `oldest of kept-20 is v5 (got ${rows[rows.length - 1].content})`);

  // --- Test 5: prune is idempotent
  await db.execute(sql`SELECT 1`); // noop
  // Run prune again via another snapshot+overwrite cycle, then verify cap still holds
  await db.update(phaseArtifactsTable).set({ content: `# v25` }).where(and(eq(phaseArtifactsTable.phaseId, phaseId), eq(phaseArtifactsTable.artifactKey, ART_KEY)));
  await snapshotArtifact(db as any, phaseId, ART_KEY, "manual_edit", CLERK_ID);
  rows = await db.select().from(artifactVersionsTable).where(and(eq(artifactVersionsTable.phaseId, phaseId), eq(artifactVersionsTable.artifactKey, ART_KEY)));
  assert(rows.length === MAX_VERSIONS_PER_ARTIFACT, `still capped at ${MAX_VERSIONS_PER_ARTIFACT} after another snapshot`);

  // --- Test 6: concurrent snapshots — final count must NOT exceed cap
  const before = await db.select().from(artifactVersionsTable).where(and(eq(artifactVersionsTable.phaseId, phaseId), eq(artifactVersionsTable.artifactKey, ART_KEY)));
  // Fire 10 parallel snapshots inside transactions
  await Promise.all(
    Array.from({ length: 10 }, (_, i) =>
      db.transaction(async (tx) => {
        await tx.update(phaseArtifactsTable).set({ content: `# concurrent-${i}` }).where(and(eq(phaseArtifactsTable.phaseId, phaseId), eq(phaseArtifactsTable.artifactKey, ART_KEY)));
        await snapshotArtifact(tx as any, phaseId, ART_KEY, "manual_edit", CLERK_ID);
      })
    )
  );
  rows = await db.select().from(artifactVersionsTable).where(and(eq(artifactVersionsTable.phaseId, phaseId), eq(artifactVersionsTable.artifactKey, ART_KEY)));
  assert(rows.length <= MAX_VERSIONS_PER_ARTIFACT, `concurrent snapshots respect cap (got ${rows.length}, before=${before.length})`);

  // --- Test 7: snapshotAllPhaseArtifacts snapshots all non-empty
  await db.insert(phaseArtifactsTable).values({ phaseId, artifactKey: "OTHER_KEY", content: "# other" });
  const beforeAll = await db.select().from(artifactVersionsTable).where(eq(artifactVersionsTable.phaseId, phaseId));
  await snapshotAllPhaseArtifacts(db as any, phaseId, "ai_regen", CLERK_ID);
  const afterAll = await db.select().from(artifactVersionsTable).where(eq(artifactVersionsTable.phaseId, phaseId));
  const otherRows = afterAll.filter((r) => r.artifactKey === "OTHER_KEY");
  assert(otherRows.length === 1, "snapshotAllPhaseArtifacts created OTHER_KEY snapshot");
  assert(otherRows[0].source === "ai_regen", "OTHER_KEY snapshot source is ai_regen");
  // EMPTY_KEY should still be skipped
  const emptyRows = afterAll.filter((r) => r.artifactKey === "EMPTY_KEY");
  assert(emptyRows.length === 0, "snapshotAllPhaseArtifacts skipped EMPTY_KEY");
  console.log(`(snapshotAll: before=${beforeAll.length} after=${afterAll.length})`);

  // --- Test 8: tx rollback safety — snapshot rolls back if subsequent op fails
  const preTxCount = (await db.select().from(artifactVersionsTable).where(and(eq(artifactVersionsTable.phaseId, phaseId), eq(artifactVersionsTable.artifactKey, ART_KEY)))).length;
  try {
    await db.transaction(async (tx) => {
      await snapshotArtifact(tx as any, phaseId, ART_KEY, "manual_edit", CLERK_ID);
      throw new Error("forced rollback");
    });
  } catch {}
  const postTxCount = (await db.select().from(artifactVersionsTable).where(and(eq(artifactVersionsTable.phaseId, phaseId), eq(artifactVersionsTable.artifactKey, ART_KEY)))).length;
  assert(postTxCount === preTxCount, `tx rollback removes snapshot (pre=${preTxCount} post=${postTxCount})`);

  // Cleanup
  await db.delete(projectsTable).where(eq(projectsTable.clerkId, CLERK_ID));
  await db.delete(usersTable).where(eq(usersTable.clerkId, CLERK_ID));

  console.log("\n=== ALL TESTS PASSED ===");
  process.exit(0);
}

main().catch((e) => {
  console.error("Test error:", e);
  process.exit(1);
});
