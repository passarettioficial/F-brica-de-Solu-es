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

export async function checkAndIncrementAiUsage(clerkId: string): Promise<{ allowed: boolean; limit: number; plan: string; used: number }> {
  const today = new Date().toISOString().split("T")[0];
  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));

  if (!user) return { allowed: false, limit: 0, plan: "free", used: 0 };

  if (user.isSuperuser) return { allowed: true, limit: 999999, plan: user.plan, used: 0 };

  const plan = getPlanConfig(user.plan);
  const dailyLimit = plan.aiDailyLimit;

  // Reset counter atomically if it's a new day
  if (user.dailyAiResetDate !== today) {
    await db.update(usersTable)
      .set({ dailyAiUsage: 1, dailyAiResetDate: today, updatedAt: new Date() })
      .where(eq(usersTable.clerkId, clerkId));
    return { allowed: true, limit: dailyLimit, plan: user.plan, used: 1 };
  }

  // Atomic increment: only succeeds if usage is still below limit
  const [updated] = await db.update(usersTable)
    .set({ dailyAiUsage: sql`${usersTable.dailyAiUsage} + 1`, updatedAt: new Date() })
    .where(and(
      eq(usersTable.clerkId, clerkId),
      lt(usersTable.dailyAiUsage, dailyLimit),
    ))
    .returning();

  if (!updated) return { allowed: false, limit: dailyLimit, plan: user.plan, used: user.dailyAiUsage };
  return { allowed: true, limit: dailyLimit, plan: user.plan, used: updated.dailyAiUsage };
}

/** Build a structured 429 payload for AI daily limit exceeded. Frontend reads `code` to open the paywall modal. */
export function aiLimitPayload(opts: { limit: number; plan: string; used: number; context?: string }) {
  return {
    error: `Limite diário de ${opts.limit} execuções de IA atingido. Tente novamente amanhã ou faça upgrade do plano.`,
    code: "AI_LIMIT_EXCEEDED" as const,
    limit: opts.limit,
    used: opts.used,
    plan: opts.plan,
    context: opts.context ?? null,
  };
}
