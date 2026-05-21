import { Router, type IRouter, type Request, type Response } from "express";
import { eq, desc, count, sql, gte, and, isNull } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, usersTable, couponsTable, settingsTable, projectsTable, auditLogsTable, phasesTable, phaseArtifactsTable } from "@workspace/db";
import { requireAdmin } from "../lib/adminAuth";
import { logger } from "../lib/logger";
import { auditLog } from "../lib/audit";
import { getBudgetStatus, setBudget } from "../lib/openaiCost";

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
    const paidPlans = ["starter", "basic", "pro", "advanced", "founder", "studio"];
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

// ─── Insights (funnel, stuck phases, top deliverables, active users) ─────────

const PHASE_NAMES = [
  "Ideia", "PRD", "Segurança & LGPD", "Spec", "Implementação", "Teste", "Deploy",
];

router.get("/admin/insights", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  try {
    // Total active projects (not trashed)
    const [totalActive] = await db
      .select({ count: count() })
      .from(projectsTable)
      .where(isNull(projectsTable.deletedAt));
    const totalProjects = Number(totalActive?.count ?? 0);

    // Funnel: project count by currentPhase (where they are now)
    const funnelRows = await db
      .select({ phase: projectsTable.currentPhase, count: count() })
      .from(projectsTable)
      .where(isNull(projectsTable.deletedAt))
      .groupBy(projectsTable.currentPhase);
    const funnelByPhase = Array.from({ length: 7 }, (_, i) => {
      const row = funnelRows.find((r) => Number(r.phase) === i + 1);
      const c = Number(row?.count ?? 0);
      return {
        phase: i + 1,
        name: PHASE_NAMES[i] ?? `Fase ${i + 1}`,
        count: c,
        pct: totalProjects > 0 ? (c / totalProjects) * 100 : 0,
      };
    });

    // Completion rate per phase: count phases with status='completed' per phaseNumber
    const completedRows = await db.execute(sql`
      SELECT p.phase_number AS phase, COUNT(*)::int AS completed
      FROM ${phasesTable} p
      INNER JOIN ${projectsTable} pr ON pr.id = p.project_id
      WHERE pr.deleted_at IS NULL AND p.status = 'completed'
      GROUP BY p.phase_number
      ORDER BY p.phase_number ASC
    `);
    const completionByPhase = Array.from({ length: 7 }, (_, i) => {
      const r = (completedRows.rows as Array<{ phase: number; completed: number }>).find((x) => Number(x.phase) === i + 1);
      const c = Number(r?.completed ?? 0);
      return {
        phase: i + 1,
        name: PHASE_NAMES[i] ?? `Fase ${i + 1}`,
        completed: c,
        rate: totalProjects > 0 ? (c / totalProjects) * 100 : 0,
      };
    });

    // Stuck: avg days since updatedAt for ACTIVE phases per phaseNumber
    const stuckRows = await db.execute(sql`
      SELECT p.phase_number AS phase,
             COUNT(*)::int AS active_count,
             AVG(EXTRACT(EPOCH FROM (NOW() - p.updated_at)) / 86400)::float AS avg_days_stuck,
             MAX(EXTRACT(EPOCH FROM (NOW() - p.updated_at)) / 86400)::float AS max_days_stuck
      FROM ${phasesTable} p
      INNER JOIN ${projectsTable} pr ON pr.id = p.project_id
      WHERE pr.deleted_at IS NULL AND p.status = 'active'
      GROUP BY p.phase_number
      ORDER BY p.phase_number ASC
    `);
    const stuckByPhase = Array.from({ length: 7 }, (_, i) => {
      const r = (stuckRows.rows as Array<{ phase: number; active_count: number; avg_days_stuck: number; max_days_stuck: number }>)
        .find((x) => Number(x.phase) === i + 1);
      return {
        phase: i + 1,
        name: PHASE_NAMES[i] ?? `Fase ${i + 1}`,
        activeCount: Number(r?.active_count ?? 0),
        avgDaysStuck: r ? Math.round(Number(r.avg_days_stuck) * 10) / 10 : 0,
        maxDaysStuck: r ? Math.round(Number(r.max_days_stuck) * 10) / 10 : 0,
      };
    });

    // Top deliverables: most generated artifact keys
    const topDeliverables = await db.execute(sql`
      SELECT artifact_key AS key, COUNT(*)::int AS count
      FROM ${phaseArtifactsTable}
      WHERE content <> ''
      GROUP BY artifact_key
      ORDER BY count DESC
      LIMIT 12
    `);

    // Active users (DAU/WAU/MAU) based on audit logs
    const [dau] = await db.execute(sql`
      SELECT COUNT(DISTINCT actor_clerk_id)::int AS c
      FROM ${auditLogsTable}
      WHERE created_at >= NOW() - INTERVAL '1 day' AND actor_clerk_id IS NOT NULL
    `).then((r) => r.rows as Array<{ c: number }>);
    const [wau] = await db.execute(sql`
      SELECT COUNT(DISTINCT actor_clerk_id)::int AS c
      FROM ${auditLogsTable}
      WHERE created_at >= NOW() - INTERVAL '7 days' AND actor_clerk_id IS NOT NULL
    `).then((r) => r.rows as Array<{ c: number }>);
    const [mau] = await db.execute(sql`
      SELECT COUNT(DISTINCT actor_clerk_id)::int AS c
      FROM ${auditLogsTable}
      WHERE created_at >= NOW() - INTERVAL '30 days' AND actor_clerk_id IS NOT NULL
    `).then((r) => r.rows as Array<{ c: number }>);

    // Conversion funnel: signup → first project → phase 1 completed → phase 2 active+
    const [usersTotal] = await db.select({ count: count() }).from(usersTable);
    const [usersWithProject] = await db.execute(sql`
      SELECT COUNT(DISTINCT clerk_id)::int AS c
      FROM ${projectsTable}
      WHERE deleted_at IS NULL
    `).then((r) => r.rows as Array<{ c: number }>);
    const [usersPastPhase1] = await db.execute(sql`
      SELECT COUNT(DISTINCT pr.clerk_id)::int AS c
      FROM ${projectsTable} pr
      INNER JOIN ${phasesTable} p ON p.project_id = pr.id
      WHERE pr.deleted_at IS NULL AND p.phase_number = 1 AND p.status = 'completed'
    `).then((r) => r.rows as Array<{ c: number }>);
    const [usersPastPhase3] = await db.execute(sql`
      SELECT COUNT(DISTINCT pr.clerk_id)::int AS c
      FROM ${projectsTable} pr
      INNER JOIN ${phasesTable} p ON p.project_id = pr.id
      WHERE pr.deleted_at IS NULL AND p.phase_number = 3 AND p.status = 'completed'
    `).then((r) => r.rows as Array<{ c: number }>);
    const [usersDeployed] = await db.execute(sql`
      SELECT COUNT(DISTINCT pr.clerk_id)::int AS c
      FROM ${projectsTable} pr
      INNER JOIN ${phasesTable} p ON p.project_id = pr.id
      WHERE pr.deleted_at IS NULL AND p.phase_number = 7 AND p.status = 'completed'
    `).then((r) => r.rows as Array<{ c: number }>);

    const totalUsers = Number(usersTotal?.count ?? 0);
    const conversionFunnel = [
      { step: "Cadastrou", count: totalUsers, pct: 100 },
      { step: "Criou projeto", count: Number(usersWithProject?.c ?? 0), pct: totalUsers > 0 ? (Number(usersWithProject?.c ?? 0) / totalUsers) * 100 : 0 },
      { step: "Completou Fase 1", count: Number(usersPastPhase1?.c ?? 0), pct: totalUsers > 0 ? (Number(usersPastPhase1?.c ?? 0) / totalUsers) * 100 : 0 },
      { step: "Completou Fase 3 (Segurança)", count: Number(usersPastPhase3?.c ?? 0), pct: totalUsers > 0 ? (Number(usersPastPhase3?.c ?? 0) / totalUsers) * 100 : 0 },
      { step: "Deploy validado (Fase 7)", count: Number(usersDeployed?.c ?? 0), pct: totalUsers > 0 ? (Number(usersDeployed?.c ?? 0) / totalUsers) * 100 : 0 },
    ];

    // Bottleneck: phase with highest avgDaysStuck * activeCount (impact metric)
    const bottleneck = [...stuckByPhase]
      .map((s) => ({ ...s, impact: s.avgDaysStuck * s.activeCount }))
      .sort((a, b) => b.impact - a.impact)[0];

    res.json({
      totalProjects,
      funnelByPhase,
      completionByPhase,
      stuckByPhase,
      topDeliverables: topDeliverables.rows,
      activeUsers: {
        dau: Number(dau?.c ?? 0),
        wau: Number(wau?.c ?? 0),
        mau: Number(mau?.c ?? 0),
      },
      conversionFunnel,
      bottleneck: bottleneck && bottleneck.activeCount > 0 ? bottleneck : null,
    });
  } catch (err) {
    logger.error({ err }, "Admin insights error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// ─── OpenAI Budget ────────────────────────────────────────────────────────────

router.get("/admin/openai-budget", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  try {
    const status = await getBudgetStatus();
    res.json(status);
  } catch (err) {
    logger.error({ err }, "Admin openai-budget GET error");
    res.status(500).json({ error: "Erro interno" });
  }
});

router.patch("/admin/openai-budget", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;
  const { budgetBrl, usdBrlRate } = req.body as { budgetBrl?: number; usdBrlRate?: number };
  if (typeof budgetBrl !== "number" || !Number.isFinite(budgetBrl) || budgetBrl < 0) {
    res.status(400).json({ error: "budgetBrl deve ser um número finito >= 0" });
    return;
  }
  if (usdBrlRate !== undefined && (typeof usdBrlRate !== "number" || !Number.isFinite(usdBrlRate) || usdBrlRate <= 0)) {
    res.status(400).json({ error: "usdBrlRate deve ser um número finito > 0" });
    return;
  }
  try {
    await setBudget(budgetBrl, usdBrlRate);
    await auditLog({ eventType: "admin.openai_budget.updated", actorClerkId: admin.clerkId, actorName: admin.displayName, meta: { budgetBrl, usdBrlRate }, req });
    const status = await getBudgetStatus();
    res.json(status);
  } catch (err) {
    logger.error({ err }, "Admin openai-budget PATCH error");
    res.status(500).json({ error: "Erro interno" });
  }
});

// ─── Users export (CSV) ──────────────────────────────────────────────────────

const PROFILE_LABELS: Record<string, Record<string, string>> = {
  estagio: { ideia: "Ideia", prototipo: "Protótipo", mvp: "MVP", tracao: "Tração" },
  setor: { saas: "SaaS", marketplace: "Marketplace", fintech: "Fintech", healthtech: "Healthtech", edtech: "Edtech", outro: "Outro" },
  equipe: { solo: "Solo", cofundadores: "Co-fundadores", time_pequeno: "Time pequeno", time_grande: "Time maior" },
  cargo: { ceo: "CEO", cto: "CTO", solo_founder: "Solo founder", produto: "Produto", outro: "Outro" },
  modeloNegocio: { b2b: "B2B", b2c: "B2C", b2b2c: "B2B2C", marketplace: "Marketplace", outro: "Outro" },
  prazoLancamento: { ja_lancado: "Já lançado", ate_30d: "Próximos 30d", "30_90d": "30-90d", "90_180d": "90-180d", mais_180d: "180d+", indefinido: "Indefinido" },
  faturamentoMensal: { zero: "R$ 0", ate_10k: "Até R$ 10k", "10k_50k": "R$ 10k-50k", "50k_200k": "R$ 50k-200k", mais_200k: "R$ 200k+" },
  orcamentoFerramentas: { ate_100: "Até R$ 100", "100_500": "R$ 100-500", "500_2k": "R$ 500-2k", mais_2k: "R$ 2k+" },
};

function csvEscape(v: unknown): string {
  if (v === null || v === undefined) return "";
  let s = String(v);
  // CSV formula-injection mitigation: prefix dangerous leading chars with apostrophe
  // (Excel/Sheets execute leading =, +, -, @, tab, CR as formulas).
  if (s.length > 0 && /^[=+\-@\t\r]/.test(s)) s = "'" + s;
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

router.get("/admin/users/export.csv", async (req: Request, res: Response): Promise<void> => {
  const admin = await requireAdmin(req, res);
  if (!admin) return;

  const segment = String(req.query.segment ?? "all");
  try {
    const rows = await db.select().from(usersTable).orderBy(desc(usersTable.createdAt));
    const filtered = rows.filter(u => {
      if (segment === "all") return true;
      if (segment === "paid") return ["founder", "studio", "basic", "pro", "advanced"].includes(u.plan);
      if (segment === "free") return u.plan === "free";
      if (segment === "active_sub") return u.stripeSubscriptionStatus === "active";
      return true;
    });

    const headers = [
      "clerk_id", "display_name", "plan", "subscription_status", "is_admin", "is_superuser",
      "created_at", "profile_stage",
      "estagio", "setor", "equipe", "cargo", "modelo_negocio", "prazo_lancamento",
      "faturamento_mensal", "orcamento_ferramentas", "principal_desafio",
    ];

    const lines = [headers.join(",")];
    for (const u of filtered) {
      const p = (u.founderProfile as Record<string, string> | null) ?? {};
      const label = (field: string, key: string | undefined) =>
        key ? (PROFILE_LABELS[field]?.[key] ?? key) : "";
      lines.push([
        u.clerkId,
        u.displayName ?? "",
        u.plan,
        u.stripeSubscriptionStatus ?? "",
        u.isAdmin ? "true" : "false",
        u.isSuperuser ? "true" : "false",
        u.createdAt.toISOString(),
        String(u.profileStage),
        label("estagio", p.estagio),
        label("setor", p.setor),
        label("equipe", p.equipe),
        label("cargo", p.cargo),
        label("modeloNegocio", p.modeloNegocio),
        label("prazoLancamento", p.prazoLancamento),
        label("faturamentoMensal", p.faturamentoMensal),
        label("orcamentoFerramentas", p.orcamentoFerramentas),
        p.principalDesafio ?? "",
      ].map(csvEscape).join(","));
    }

    await auditLog({ eventType: "admin.users.exported", actorClerkId: admin.clerkId, actorName: admin.displayName, meta: { segment, count: filtered.length }, req });

    const filename = `users_${segment}_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    // BOM for Excel UTF-8 detection
    res.send("\uFEFF" + lines.join("\n"));
  } catch (err) {
    logger.error({ err }, "Admin users export error");
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
