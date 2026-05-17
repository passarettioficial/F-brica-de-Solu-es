import { db, usersTable } from "@workspace/db";
import { eq, and, lt, sql } from "drizzle-orm";
import { getPlanConfig } from "./stripe";

export async function ensureUser(clerkId: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);

  const adminIds = (process.env.ADMIN_CLERK_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const superuserIds = (process.env.SUPERUSER_CLERK_IDS ?? "").split(",").map(s => s.trim()).filter(Boolean);
  const shouldBeAdmin = adminIds.includes(clerkId) || superuserIds.includes(clerkId);
  const shouldBeSuperuser = superuserIds.includes(clerkId);

  if (existing.length === 0) {
    await db.insert(usersTable).values({
      clerkId,
      plan: "free",
      dailyAiUsage: 0,
      dailyAiResetDate: new Date().toISOString().split("T")[0],
      isAdmin: shouldBeAdmin,
      isSuperuser: shouldBeSuperuser,
    });
    return null;
  }

  const user = existing[0]!;
  if ((shouldBeAdmin && !user.isAdmin) || (shouldBeSuperuser && !user.isSuperuser)) {
    const [updated] = await db.update(usersTable)
      .set({ isAdmin: shouldBeAdmin || user.isAdmin, isSuperuser: shouldBeSuperuser || user.isSuperuser, updatedAt: new Date() })
      .where(eq(usersTable.clerkId, clerkId))
      .returning();
    return updated ?? null;
  }

  return user;
}

export async function checkAndIncrementAiUsage(clerkId: string): Promise<{ allowed: boolean; limit: number }> {
  const today = new Date().toISOString().split("T")[0];
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));

  if (!user) return { allowed: false, limit: 0 };

  if (user.isSuperuser) return { allowed: true, limit: 999999 };

  const plan = getPlanConfig(user.plan);
  const dailyLimit = plan.aiDailyLimit;

  // Reset counter atomically if it's a new day
  if (user.dailyAiResetDate !== today) {
    await db.update(usersTable)
      .set({ dailyAiUsage: 1, dailyAiResetDate: today, updatedAt: new Date() })
      .where(eq(usersTable.clerkId, clerkId));
    return { allowed: true, limit: dailyLimit };
  }

  // Atomic increment: only succeeds if usage is still below limit
  const [updated] = await db.update(usersTable)
    .set({ dailyAiUsage: sql`${usersTable.dailyAiUsage} + 1`, updatedAt: new Date() })
    .where(and(
      eq(usersTable.clerkId, clerkId),
      lt(usersTable.dailyAiUsage, dailyLimit),
    ))
    .returning();

  if (!updated) return { allowed: false, limit: dailyLimit };
  return { allowed: true, limit: dailyLimit };
}
