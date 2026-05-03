import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { getPlanConfig } from "./stripe";

export async function ensureUser(clerkId: string) {
  const existing = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId)).limit(1);

  // Check if this clerkId is in ADMIN_CLERK_IDS or SUPERUSER_CLERK_IDS env vars
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
  // Auto-promote if env var grants higher access
  if ((shouldBeAdmin && !user.isAdmin) || (shouldBeSuperuser && !user.isSuperuser)) {
    const [updated] = await db.update(usersTable)
      .set({ isAdmin: shouldBeAdmin || user.isAdmin, isSuperuser: shouldBeSuperuser || user.isSuperuser, updatedAt: new Date() })
      .where(eq(usersTable.clerkId, clerkId))
      .returning();
    return updated ?? null;
  }

  return user;
}

export async function checkAndIncrementAiUsage(clerkId: string): Promise<boolean> {
  const today = new Date().toISOString().split("T")[0];
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));

  if (!user) return false;

  // Superusers have unlimited AI usage
  if (user.isSuperuser) return true;

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
