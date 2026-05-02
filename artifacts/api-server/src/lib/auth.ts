import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getPlanConfig } from "./stripe";

export async function ensureUser(clerkId: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);
  if (existing.length === 0) {
    await db.insert(usersTable).values({
      clerkId,
      plan: "free",
      dailyAiUsage: 0,
      dailyAiResetDate: new Date().toISOString().split("T")[0],
    });
  }
  return existing[0] ?? null;
}

export async function checkAndIncrementAiUsage(clerkId: string): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));

  if (!user) return false;

  const plan = getPlanConfig(user.plan);
  const dailyLimit = plan.aiDailyLimit;

  // Reset if new day
  if (user.dailyAiResetDate !== today) {
    await db.update(usersTable)
      .set({ dailyAiUsage: 1, dailyAiResetDate: today, updatedAt: new Date() })
      .where(eq(usersTable.clerkId, clerkId));
    return true;
  }

  if (user.dailyAiUsage >= dailyLimit) return false;

  await db.update(usersTable)
    .set({ dailyAiUsage: user.dailyAiUsage + 1, updatedAt: new Date() })
    .where(eq(usersTable.clerkId, clerkId));

  return true;
}
