import { sql } from "drizzle-orm";
import { db } from "@workspace/db";
import { logger } from "./logger";

/**
 * Runs `fn` only if this process wins a Postgres advisory lock for `lockName`. Under
 * autoscale, every instance runs the same setInterval tick; this keeps just one instance's
 * tick actually executing the job body at a time. The lock is scoped to the wrapping
 * transaction (`pg_try_advisory_xact_lock`) so it always auto-releases when the transaction
 * ends — a crashed process can never leave it stuck.
 */
export async function withAdvisoryLock(lockName: string, fn: () => Promise<void>): Promise<void> {
  await db.transaction(async (tx) => {
    const [row] = await tx.execute(sql`SELECT pg_try_advisory_xact_lock(hashtext(${lockName})) AS acquired`)
      .then((r) => r.rows as Array<{ acquired: boolean }>);

    if (!row?.acquired) {
      logger.info({ lockName }, "Skipping job tick — lock held by another instance");
      return;
    }

    await fn();
  });
}
