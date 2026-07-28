import { Router, type IRouter } from "express";
import { eq, sql } from "drizzle-orm";
import { z } from "zod/v4";
import { db, usersTable } from "@workspace/db";
import { UpdateUserSettingsBody } from "@workspace/api-zod";
import { requireAuth, ensureUser } from "../lib/auth";
import { getPlanConfig } from "../lib/stripe";

const PROFILE_VALUES = {
  estagio: ["ideia", "prototipo", "mvp", "tracao"],
  setor: ["saas", "marketplace", "fintech", "healthtech", "edtech", "outro"],
  equipe: ["solo", "cofundadores", "time_pequeno", "time_grande"],
  cargo: ["ceo", "cto", "solo_founder", "produto", "outro"],
  modeloNegocio: ["b2b", "b2c", "b2b2c", "marketplace", "outro"],
  prazoLancamento: ["ja_lancado", "ate_30d", "30_90d", "90_180d", "mais_180d", "indefinido"],
  faturamentoMensal: ["zero", "ate_10k", "10k_50k", "50k_200k", "mais_200k"],
  orcamentoFerramentas: ["ate_100", "100_500", "500_2k", "mais_2k"],
} as const;

const ProfilePatchSchema = z.object({
  founderProfile: z.object({
    estagio: z.enum(PROFILE_VALUES.estagio).optional(),
    setor: z.enum(PROFILE_VALUES.setor).optional(),
    equipe: z.enum(PROFILE_VALUES.equipe).optional(),
    cargo: z.enum(PROFILE_VALUES.cargo).optional(),
    modeloNegocio: z.enum(PROFILE_VALUES.modeloNegocio).optional(),
    prazoLancamento: z.enum(PROFILE_VALUES.prazoLancamento).optional(),
    faturamentoMensal: z.enum(PROFILE_VALUES.faturamentoMensal).optional(),
    orcamentoFerramentas: z.enum(PROFILE_VALUES.orcamentoFerramentas).optional(),
    principalDesafio: z.string().trim().max(500).optional(),
  }).partial(),
  profileStage: z.number().int().min(0).max(3).optional(),
});

const router: IRouter = Router();

router.get("/users/me", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
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
    founderProfile: user.founderProfile ?? null,
    profileStage: user.profileStage ?? 0,
    permissions: {
      canCopy: plan.canCopy,
      canDownload: plan.canDownload,
      canPrint: plan.canPrint,
      hasAiAdvisor: plan.hasAiAdvisor,
    },
  });
});

router.patch("/users/me/settings", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
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

router.patch("/users/me/profile", async (req, res): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const parsed = ProfilePatchSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ error: parsed.error.message }); return; }

  await ensureUser(userId);

  // Atomic merge: jsonb concatenation in a single UPDATE avoids lost-update
  // race conditions when two PATCHes arrive concurrently.
  const incoming: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(parsed.data.founderProfile)) {
    if (v !== undefined && v !== "") incoming[k] = v;
  }
  const patchJson = JSON.stringify(incoming);
  const incomingStage = parsed.data.profileStage ?? 0;

  const [updated] = await db.update(usersTable)
    .set({
      founderProfile: sql`COALESCE(${usersTable.founderProfile}, '{}'::jsonb) || ${patchJson}::jsonb`,
      profileStage: sql`GREATEST(${usersTable.profileStage}, ${incomingStage})`,
      updatedAt: new Date(),
    })
    .where(eq(usersTable.clerkId, userId))
    .returning();

  if (!updated) { res.status(404).json({ error: "User not found" }); return; }
  res.json({ ok: true, founderProfile: updated.founderProfile, profileStage: updated.profileStage });
});

export default router;
