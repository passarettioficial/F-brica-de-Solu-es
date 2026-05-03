import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, count, sql } from "drizzle-orm";
import { db, usersTable, couponsTable, settingsTable, projectsTable } from "@workspace/db";
import { requireAdmin } from "../lib/adminAuth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

// GET /admin/me — check if caller is admin
router.get("/admin/me", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  res.json({ isAdmin: admin.isAdmin, isSuperuser: admin.isSuperuser });
});

// GET /admin/stats — overview dashboard stats
router.get("/admin/stats", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const [userCount] = await db.select({ count: count() }).from(usersTable);
    const [projectCount] = await db.select({ count: count() }).from(projectsTable);
    const [adminCount] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.isAdmin, true));
    const [superuserCount] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.isSuperuser, true));
    const [couponCount] = await db.select({ count: count() }).from(couponsTable).where(eq(couponsTable.active, true));

    const planStats = await db
      .select({ plan: usersTable.plan, count: count() })
      .from(usersTable)
      .groupBy(usersTable.plan);

    res.json({
      users: userCount?.count ?? 0,
      projects: projectCount?.count ?? 0,
      admins: adminCount?.count ?? 0,
      superusers: superuserCount?.count ?? 0,
      activeCoupons: couponCount?.count ?? 0,
      planBreakdown: planStats,
    });
  } catch (err) {
    logger.error({ err }, "Admin stats error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// GET /admin/users — list all users
router.get("/admin/users", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const page = parseInt(String(req.query.page ?? "1"), 10);
    const limit = 50;
    const offset = (page - 1) * limit;
    const search = String(req.query.search ?? "");

    let query = db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);
    const users = await query;

    const filtered = search
      ? users.filter(u =>
          (u.clerkId ?? "").toLowerCase().includes(search.toLowerCase()) ||
          (u.displayName ?? "").toLowerCase().includes(search.toLowerCase())
        )
      : users;

    res.json({ users: filtered });
  } catch (err) {
    logger.error({ err }, "Admin users error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// PATCH /admin/users/:clerkId — update a user (plan, isAdmin, isSuperuser)
router.patch("/admin/users/:clerkId", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { clerkId } = req.params as { clerkId: string };
  const { plan, isAdmin, isSuperuser, displayName } = req.body as {
    plan?: string;
    isAdmin?: boolean;
    isSuperuser?: boolean;
    displayName?: string;
  };

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (plan !== undefined) updates.plan = plan;
    if (isAdmin !== undefined) updates.isAdmin = isAdmin;
    if (isSuperuser !== undefined) updates.isSuperuser = isSuperuser;
    if (displayName !== undefined) updates.displayName = displayName;

    const [updated] = await db
      .update(usersTable)
      .set(updates)
      .where(eq(usersTable.clerkId, clerkId))
      .returning();

    if (!updated) { res.status(404).json({ error: "Usuário não encontrado" }); return; }
    res.json({ user: updated });
  } catch (err) {
    logger.error({ err }, "Admin update user error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// GET /admin/coupons — list coupons
router.get("/admin/coupons", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const coupons = await db.select().from(couponsTable).orderBy(desc(couponsTable.createdAt));
    res.json({ coupons });
  } catch (err) {
    logger.error({ err }, "Admin coupons error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// POST /admin/coupons — create coupon
router.post("/admin/coupons", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { code, discountType, discountValue, maxUses, expiresAt, appliesTo, description } = req.body as {
    code: string;
    discountType: "percent" | "fixed";
    discountValue: number;
    maxUses?: number;
    expiresAt?: string;
    appliesTo?: string;
    description?: string;
  };

  if (!code || !discountType || discountValue === undefined) {
    res.status(400).json({ error: "Campos obrigatórios: code, discountType, discountValue" });
    return;
  }

  try {
    const [coupon] = await db.insert(couponsTable).values({
      code: code.toUpperCase().trim(),
      discountType,
      discountValue,
      maxUses: maxUses ?? null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      appliesTo: appliesTo ?? null,
      description: description ?? null,
      active: true,
      usesCount: 0,
    }).returning();

    res.status(201).json({ coupon });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && (err as any).code === "23505") {
      res.status(409).json({ error: "Código de cupom já existe" });
      return;
    }
    logger.error({ err }, "Admin create coupon error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// PATCH /admin/coupons/:id — update coupon
router.patch("/admin/coupons/:id", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const id = parseInt(String(req.params.id), 10);
  const { code, discountType, discountValue, maxUses, expiresAt, appliesTo, description, active } = req.body as {
    code?: string;
    discountType?: "percent" | "fixed";
    discountValue?: number;
    maxUses?: number | null;
    expiresAt?: string | null;
    appliesTo?: string | null;
    description?: string | null;
    active?: boolean;
  };

  try {
    const updates: Record<string, unknown> = { updatedAt: new Date() };
    if (code !== undefined) updates.code = code.toUpperCase().trim();
    if (discountType !== undefined) updates.discountType = discountType;
    if (discountValue !== undefined) updates.discountValue = discountValue;
    if (maxUses !== undefined) updates.maxUses = maxUses;
    if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (appliesTo !== undefined) updates.appliesTo = appliesTo;
    if (description !== undefined) updates.description = description;
    if (active !== undefined) updates.active = active;

    const [updated] = await db.update(couponsTable).set(updates).where(eq(couponsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Cupom não encontrado" }); return; }
    res.json({ coupon: updated });
  } catch (err) {
    logger.error({ err }, "Admin update coupon error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// DELETE /admin/coupons/:id — deactivate coupon
router.delete("/admin/coupons/:id", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const id = parseInt(String(req.params.id), 10);
  try {
    const [updated] = await db.update(couponsTable).set({ active: false, updatedAt: new Date() }).where(eq(couponsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Cupom não encontrado" }); return; }
    res.json({ coupon: updated });
  } catch (err) {
    logger.error({ err }, "Admin delete coupon error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// GET /admin/settings — get all settings
router.get("/admin/settings", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const settings = await db.select().from(settingsTable).orderBy(settingsTable.category);
    res.json({ settings });
  } catch (err) {
    logger.error({ err }, "Admin get settings error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// PUT /admin/settings — upsert settings in bulk
router.put("/admin/settings", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { settings } = req.body as { settings: Array<{ key: string; value: string; label?: string; category?: string }> };
  if (!Array.isArray(settings)) { res.status(400).json({ error: "settings deve ser um array" }); return; }

  try {
    for (const s of settings) {
      await db
        .insert(settingsTable)
        .values({ key: s.key, value: s.value, label: s.label ?? s.key, category: s.category ?? "general" })
        .onConflictDoUpdate({ target: settingsTable.key, set: { value: s.value, updatedAt: new Date() } });
    }
    const updated = await db.select().from(settingsTable).orderBy(settingsTable.category);
    res.json({ settings: updated });
  } catch (err) {
    logger.error({ err }, "Admin update settings error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// GET /admin/deliverables — get deliverable enable/disable config from settings
router.get("/admin/deliverables", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const settings = await db.select().from(settingsTable).where(eq(settingsTable.category, "deliverable"));
  const map: Record<string, boolean> = {};
  for (const s of settings) {
    map[s.key] = s.value === "true";
  }
  res.json({ deliverables: map });
});

// PUT /admin/deliverables — batch update deliverable enabled flags
router.put("/admin/deliverables", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const { deliverables } = req.body as { deliverables: Record<string, boolean> };
  if (!deliverables || typeof deliverables !== "object") {
    res.status(400).json({ error: "deliverables deve ser um objeto" });
    return;
  }

  try {
    for (const [key, enabled] of Object.entries(deliverables)) {
      await db
        .insert(settingsTable)
        .values({ key, value: String(enabled), label: key, category: "deliverable" })
        .onConflictDoUpdate({ target: settingsTable.key, set: { value: String(enabled), updatedAt: new Date() } });
    }
    const settings = await db.select().from(settingsTable).where(eq(settingsTable.category, "deliverable"));
    const map: Record<string, boolean> = {};
    for (const s of settings) map[s.key] = s.value === "true";
    res.json({ deliverables: map });
  } catch (err) {
    logger.error({ err }, "Admin update deliverables error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// POST /api/admin/coupons/validate — validate a coupon code (public-ish, for checkout)
router.post("/admin/coupons/validate", async (req: Request, res: Response): Promise<void> => {
  const { code, planId } = req.body as { code: string; planId?: string };
  if (!code) { res.status(400).json({ error: "Código obrigatório" }); return; }

  const [coupon] = await db.select().from(couponsTable).where(eq(couponsTable.code, code.toUpperCase().trim()));
  if (!coupon || !coupon.active) { res.status(404).json({ error: "Cupom inválido ou inativo" }); return; }
  if (coupon.expiresAt && coupon.expiresAt < new Date()) { res.status(400).json({ error: "Cupom expirado" }); return; }
  if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) { res.status(400).json({ error: "Cupom esgotado" }); return; }
  if (coupon.appliesTo && planId && !coupon.appliesTo.split(",").map(p => p.trim()).includes(planId)) {
    res.status(400).json({ error: "Cupom não aplicável a este plano" });
    return;
  }

  res.json({
    valid: true,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    description: coupon.description,
  });
});

export default router;
