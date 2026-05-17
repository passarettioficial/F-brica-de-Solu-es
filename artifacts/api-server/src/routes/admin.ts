import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, count, sql, gte, and, isNull } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, usersTable, couponsTable, settingsTable, projectsTable, auditLogsTable } from "@workspace/db";
import { requireAdmin } from "../lib/adminAuth";
import { logger } from "../lib/logger";
import { auditLog } from "../lib/audit";

const router: IRouter = Router();

// ─── Admin Identity ───────────────────────────────────────────────────────────

router.get("/admin/me", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  res.json({ isAdmin: admin.isAdmin, isSuperuser: admin.isSuperuser });
});

// ─── Stats Overview ───────────────────────────────────────────────────────────

router.get("/admin/stats", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const [userCount] = await db.select({ count: count() }).from(usersTable);
    const [projectCount] = await db.select({ count: count() }).from(projectsTable).where(isNull(projectsTable.deletedAt));
    const [trashedCount] = await db.select({ count: count() }).from(projectsTable).where(sql`${projectsTable.deletedAt} IS NOT NULL`);
    const [adminCount] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.isAdmin, true));
    const [superuserCount] = await db.select({ count: count() }).from(usersTable).where(eq(usersTable.isSuperuser, true));
    const [couponCount] = await db.select({ count: count() }).from(couponsTable).where(eq(couponsTable.active, true));

    const planStats = await db
      .select({ plan: usersTable.plan, count: count() })
      .from(usersTable)
      .groupBy(usersTable.plan);

    // Paid plans
    const paidPlans = ["starter", "basic", "pro", "advanced"];
    const paidUsers = planStats.filter(p => paidPlans.includes(p.plan)).reduce((s, p) => s + Number(p.count), 0);

    // New users last 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [newUsersResult] = await db
      .select({ count: count() })
      .from(usersTable)
      .where(gte(usersTable.createdAt, thirtyDaysAgo));

    // New signups per day (last 30 days)
    const signupsPerDay = await db.execute(sql`
      SELECT DATE(created_at AT TIME ZONE 'UTC') as day, COUNT(*)::int as count
      FROM users
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY day
      ORDER BY day ASC
    `);

    // AI usage per day (last 30 days) - approximation from audit logs
    const aiPerDay = await db.execute(sql`
      SELECT DATE(created_at AT TIME ZONE 'UTC') as day, COUNT(*)::int as count
      FROM audit_logs
      WHERE event_type = 'user.ai.used'
        AND created_at >= NOW() - INTERVAL '30 days'
      GROUP BY day
      ORDER BY day ASC
    `);

    // Inactive users (no activity in 30 days = no updatedAt in 30 days)
    const [inactive30] = await db
      .select({ count: count() })
      .from(usersTable)
      .where(sql`${usersTable.updatedAt} < NOW() - INTERVAL '30 days'`);

    const [inactive14] = await db
      .select({ count: count() })
      .from(usersTable)
      .where(sql`${usersTable.updatedAt} < NOW() - INTERVAL '14 days'`);

    res.json({
      users: userCount?.count ?? 0,
      projects: projectCount?.count ?? 0,
      trashedProjects: trashedCount?.count ?? 0,
      admins: adminCount?.count ?? 0,
      superusers: superuserCount?.count ?? 0,
      activeCoupons: couponCount?.count ?? 0,
      paidUsers,
      newUsers30d: newUsersResult?.count ?? 0,
      inactiveUsers30d: inactive30?.count ?? 0,
      inactiveUsers14d: inactive14?.count ?? 0,
      planBreakdown: planStats,
      signupsPerDay: signupsPerDay.rows,
      aiPerDay: aiPerDay.rows,
    });
  } catch (err) {
    logger.error({ err }, "Admin stats error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// ─── Users ────────────────────────────────────────────────────────────────────

router.get("/admin/users", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const page = parseInt(String(req.query.page ?? "1"), 10);
    const limit = 50;
    const offset = (page - 1) * limit;
    const search = String(req.query.search ?? "");

    const users = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt)).limit(limit).offset(offset);

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

    // Audit log
    if (plan !== undefined) {
      await auditLog({ eventType: "admin.user.plan_changed", actorClerkId: admin.clerkId, actorName: admin.displayName, targetClerkId: clerkId, targetName: updated.displayName, meta: { plan }, req });
    }
    if (isAdmin !== undefined) {
      await auditLog({ eventType: "admin.user.admin_toggled", actorClerkId: admin.clerkId, actorName: admin.displayName, targetClerkId: clerkId, targetName: updated.displayName, meta: { isAdmin }, req });
    }
    if (isSuperuser !== undefined) {
      await auditLog({ eventType: "admin.user.superuser_toggled", actorClerkId: admin.clerkId, actorName: admin.displayName, targetClerkId: clerkId, targetName: updated.displayName, meta: { isSuperuser }, req });
    }

    res.json({ user: updated });
  } catch (err) {
    logger.error({ err }, "Admin update user error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// ─── Coupons ──────────────────────────────────────────────────────────────────

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

    await auditLog({ eventType: "admin.coupon.created", actorClerkId: admin.clerkId, actorName: admin.displayName, meta: { code: coupon.code, discountType, discountValue, maxUses, expiresAt }, req });

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

    await auditLog({ eventType: "admin.coupon.updated", actorClerkId: admin.clerkId, actorName: admin.displayName, meta: { id, ...updates }, req });

    res.json({ coupon: updated });
  } catch (err) {
    logger.error({ err }, "Admin update coupon error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.delete("/admin/coupons/:id", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const id = parseInt(String(req.params.id), 10);
  try {
    const [updated] = await db.update(couponsTable).set({ active: false, updatedAt: new Date() }).where(eq(couponsTable.id, id)).returning();
    if (!updated) { res.status(404).json({ error: "Cupom não encontrado" }); return; }

    await auditLog({ eventType: "admin.coupon.deleted", actorClerkId: admin.clerkId, actorName: admin.displayName, meta: { id, code: updated.code }, req });

    res.json({ coupon: updated });
  } catch (err) {
    logger.error({ err }, "Admin delete coupon error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// ─── Settings ─────────────────────────────────────────────────────────────────

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

    await auditLog({ eventType: "admin.settings.updated", actorClerkId: admin.clerkId, actorName: admin.displayName, meta: { keys: settings.map(s => s.key) }, req });

    res.json({ settings: updated });
  } catch (err) {
    logger.error({ err }, "Admin update settings error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// ─── Deliverables ─────────────────────────────────────────────────────────────

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

    await auditLog({ eventType: "admin.deliverable.toggled", actorClerkId: admin.clerkId, actorName: admin.displayName, meta: { deliverables }, req });

    const settings = await db.select().from(settingsTable).where(eq(settingsTable.category, "deliverable"));
    const map: Record<string, boolean> = {};
    for (const s of settings) map[s.key] = s.value === "true";
    res.json({ deliverables: map });
  } catch (err) {
    logger.error({ err }, "Admin update deliverables error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// ─── Coupon Validate (user-facing) ────────────────────────────────────────────

router.post("/admin/coupons/validate", async (req: Request, res: Response): Promise<void> => {
  const auth = getAuth(req);
  if (!auth?.userId) { res.status(401).json({ error: "Unauthorized" }); return; }

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

// ─── Audit Log ────────────────────────────────────────────────────────────────

router.get("/admin/audit", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    const page = parseInt(String(req.query.page ?? "1"), 10);
    const limit = 50;
    const offset = (page - 1) * limit;
    const eventType = req.query.eventType ? String(req.query.eventType) : null;
    const actor = req.query.actor ? String(req.query.actor) : null;
    const days = parseInt(String(req.query.days ?? "30"), 10);
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    let rows = await db
      .select()
      .from(auditLogsTable)
      .where(gte(auditLogsTable.createdAt, since))
      .orderBy(desc(auditLogsTable.createdAt))
      .limit(limit)
      .offset(offset);

    if (eventType) rows = rows.filter(r => r.eventType === eventType || r.eventType.startsWith(eventType));
    if (actor) rows = rows.filter(r =>
      (r.actorClerkId ?? "").includes(actor) ||
      (r.actorName ?? "").toLowerCase().includes(actor.toLowerCase())
    );

    const [total] = await db.select({ count: count() }).from(auditLogsTable).where(gte(auditLogsTable.createdAt, since));

    res.json({ logs: rows, total: total?.count ?? 0, page, pages: Math.ceil(Number(total?.count ?? 0) / limit) });
  } catch (err) {
    logger.error({ err }, "Admin audit error");
    res.status(500).json({ error: "Erro interno" });
  }
});

export default router;
