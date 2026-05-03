import { Router, type IRouter } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { UpdateUserSettingsBody } from "@workspace/api-zod";
import { ensureUser } from "../lib/auth";
import { getPlanConfig } from "../lib/stripe";

const router: IRouter = Router();

router.get("/users/me", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  await ensureUser(userId);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const plan = getPlanConfig(user.plan, user.isSuperuser);

  res.json({
    clerkId: user.clerkId,
    displayName: user.displayName,
    dailyAiUsage: user.dailyAiUsage,
    dailyAiLimit: plan.aiDailyLimit,
    plan: user.plan,
    planName: plan.name,
    isAdmin: user.isAdmin,
    isSuperuser: user.isSuperuser,
    permissions: {
      canCopy: plan.canCopy,
      canDownload: plan.canDownload,
      canPrint: plan.canPrint,
      hasAiAdvisor: plan.hasAiAdvisor,
    },
  });
});

router.patch("/users/me/settings", async (req, res): Promise<void> => {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = UpdateUserSettingsBody.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  await ensureUser(userId);

  const [user] = await db.update(usersTable)
    .set({ displayName: parsed.data.displayName, updatedAt: new Date() })
    .where(eq(usersTable.clerkId, userId))
    .returning();

  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const plan = getPlanConfig(user.plan, user.isSuperuser);

  res.json({
    clerkId: user.clerkId,
    displayName: user.displayName,
    dailyAiUsage: user.dailyAiUsage,
    dailyAiLimit: plan.aiDailyLimit,
    plan: user.plan,
    planName: plan.name,
    isAdmin: user.isAdmin,
    isSuperuser: user.isSuperuser,
    permissions: {
      canCopy: plan.canCopy,
      canDownload: plan.canDownload,
      canPrint: plan.canPrint,
      hasAiAdvisor: plan.hasAiAdvisor,
    },
  });
});

export default router;
