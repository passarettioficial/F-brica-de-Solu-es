import { Router, type IRouter, type Request, type Response } from "express";
import { eq, sql } from "drizzle-orm";
import { db, usersTable, couponsTable, couponRedemptionsTable } from "@workspace/db";
import { stripe, PLANS, getPlanConfig, getOrCreateStripeCustomer, getPriceId, getOrCreateStripeCoupon, normalizePlanId, type PlanId } from "../lib/stripe";
import { requireAuth, ensureUser } from "../lib/auth";
import { validateCoupon } from "../lib/coupons";
import { auditLog } from "../lib/audit";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:80";

// GET /billing/plans — public endpoint with plan info
router.get("/billing/plans", async (_req: Request, res: Response): Promise<void> => {
  const plans = [
    {
      id: "founder",
      name: "Founder",
      price: "R$197",
      period: "/mês",
      priceYearly: "R$1.970",
      periodYearly: "/ano",
      description: "O plano completo para founders sérios validando ou lançando um MVP.",
      highlight: true,
      badge: "Mais escolhido",
      features: [
        "30 execuções de IA por dia",
        "Até 5 projetos ativos",
        "Todos os artefatos das 7 fases",
        "Cópia, download e impressão",
        "🤖 AI Advisor — consultor de IA sobre seu produto",
        "Análise estratégica, técnica e de go-to-market",
        "Modelo GPT-4.1 prioritário",
        "Suporte por e-mail",
      ],
      limitations: [],
    },
    {
      id: "studio",
      name: "Studio",
      price: "R$697",
      period: "/mês",
      priceYearly: "R$6.970",
      periodYearly: "/ano",
      description: "Para serial founders, consultores e pequenas equipes de produto.",
      highlight: false,
      badge: "Premium",
      features: [
        "IA praticamente ilimitada (999/dia)",
        "Projetos ilimitados",
        "Até 3 seats incluídos",
        "Tudo do Founder + exportação white-label",
        "🤖 AI Advisor com prioridade",
        "Suporte prioritário com SLA",
        "Onboarding 1:1 com nosso time",
        "Acesso antecipado a novidades",
      ],
      limitations: [],
    },
  ];

  res.json(plans);
});

// GET /billing/me — current user plan info
router.get("/billing/me", async (req: Request, res: Response): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  await ensureUser(userId);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  const plan = getPlanConfig(user.plan, user.isSuperuser);

  res.json({
    plan: user.isSuperuser ? "studio" : plan.id,
    planName: plan.name,
    isAdmin: user.isAdmin,
    isSuperuser: user.isSuperuser,
    stripeCustomerId: user.stripeCustomerId,
    stripeSubscriptionId: user.stripeSubscriptionId,
    stripeSubscriptionStatus: user.stripeSubscriptionStatus,
    permissions: {
      canCopy: plan.canCopy,
      canDownload: plan.canDownload,
      canPrint: plan.canPrint,
      hasAiAdvisor: plan.hasAiAdvisor,
      aiDailyLimit: plan.aiDailyLimit,
      maxProjects: plan.maxProjects,
    },
  });
});

// POST /billing/checkout — create checkout session
router.post("/billing/checkout", async (req: Request, res: Response): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  if (!stripe) { res.status(503).json({ error: "Pagamentos não configurados" }); return; }

  const { planId, billingCycle, couponCode } = req.body as { planId: PlanId; billingCycle?: "monthly" | "yearly"; couponCode?: string };
  const plan = PLANS[planId];
  if (!plan || planId === "free") { res.status(400).json({ error: "Plano inválido" }); return; }
  const cycle = billingCycle === "yearly" ? "yearly" : "monthly";

  await ensureUser(userId);

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user) { res.status(404).json({ error: "User not found" }); return; }

  // Get email from request body (optional — frontend can pass it)
  const email: string | undefined = (req.body as any).email ?? undefined;

  const customerId = await getOrCreateStripeCustomer(userId, email, user.stripeCustomerId);

  // Save customer ID if new
  if (!user.stripeCustomerId) {
    await db.update(usersTable)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(usersTable.clerkId, userId));
  }

  const lookupKey = cycle === "yearly" ? plan.lookupKeyYearly : plan.lookupKey;
  const priceId = await getPriceId(lookupKey);
  if (!priceId) {
    res.status(503).json({ error: "Preço não configurado. Execute o setup do Stripe." });
    return;
  }

  // Optional coupon — validate against our DB, then map to a Stripe coupon.
  let discounts: { coupon: string }[] | undefined;
  let appliedCouponCode: string | undefined;
  if (couponCode && couponCode.trim()) {
    const result = await validateCoupon(couponCode, planId, userId);
    if (!result.ok) { res.status(result.status).json({ error: result.error }); return; }
    const stripeCouponId = await getOrCreateStripeCoupon(result.coupon);
    if (!stripeCouponId) { res.status(503).json({ error: "Não foi possível aplicar o cupom. Tente novamente." }); return; }
    discounts = [{ coupon: stripeCouponId }];
    appliedCouponCode = result.coupon.code;
  }

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    ...(discounts ? { discounts } : {}),
    success_url: `${BASE_URL}/billing?success=1&plan=${planId}`,
    cancel_url: `${BASE_URL}/pricing?canceled=1`,
    metadata: { clerkId: userId, planId, billingCycle: cycle, ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}) },
    subscription_data: {
      metadata: { clerkId: userId, planId, billingCycle: cycle, ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}) },
    },
  });

  res.json({ url: session.url });
});

// POST /billing/validate-coupon — user-facing coupon validation for checkout
router.post("/billing/validate-coupon", async (req: Request, res: Response): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  const { code, planId } = req.body as { code?: string; planId?: string };
  if (!code) { res.status(400).json({ error: "Código obrigatório" }); return; }

  const result = await validateCoupon(code, planId, userId);
  if (!result.ok) { res.status(result.status).json({ error: result.error }); return; }

  const c = result.coupon;
  res.json({
    valid: true,
    code: c.code,
    discountType: c.discountType,
    discountValue: c.discountValue,
    description: c.description,
    appliesTo: c.appliesTo,
  });
});

// POST /billing/portal — customer portal
router.post("/billing/portal", async (req: Request, res: Response): Promise<void> => {
  const userId = requireAuth(req);
  if (!userId) { res.status(401).json({ error: "Unauthorized" }); return; }

  if (!stripe) { res.status(503).json({ error: "Pagamentos não configurados" }); return; }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, userId));
  if (!user?.stripeCustomerId) {
    res.status(400).json({ error: "Sem assinatura ativa" });
    return;
  }

  const session = await stripe.billingPortal.sessions.create({
    customer: user.stripeCustomerId,
    return_url: `${BASE_URL}/billing`,
  });

  res.json({ url: session.url });
});

// POST /billing/webhook — Stripe webhook (raw body needed, registered before express.json)
export async function handleStripeWebhook(req: Request, res: Response): Promise<void> {
  if (!stripe) { res.status(200).send("ok"); return; }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    // Fail closed: never accept an unsigned payload as a real Stripe event.
    logger.error("STRIPE_WEBHOOK_SECRET não configurado — rejeitando webhook (fail-closed)");
    res.status(500).send("Webhook not configured");
    return;
  }

  const sig = req.headers["stripe-signature"] as string | undefined;
  if (!sig) {
    logger.warn("Stripe webhook recebido sem header stripe-signature");
    res.status(400).send("Missing signature");
    return;
  }

  let event: import("stripe").Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
  } catch (err) {
    logger.error({ err }, "Stripe webhook signature verification failed");
    res.status(400).send("Webhook error");
    return;
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as import("stripe").Stripe.Checkout.Session;
        const clerkId = session.metadata?.clerkId;
        const rawPlanId = session.metadata?.planId;
        const planId = rawPlanId ? normalizePlanId(rawPlanId) : null;
        const subscriptionId = session.subscription as string;

        if (clerkId && planId && subscriptionId) {
          const [existing] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
          // Idempotency: Stripe may redeliver this event. Only act once per subscription.
          const alreadyProcessed = existing?.stripeSubscriptionId === subscriptionId;

          await db.update(usersTable)
            .set({
              plan: planId,
              stripeSubscriptionId: subscriptionId,
              stripeSubscriptionStatus: "active",
              updatedAt: new Date(),
            })
            .where(eq(usersTable.clerkId, clerkId));

          logger.info({ clerkId, planId }, "Subscription activated");

          const couponCode = session.metadata?.couponCode;
          if (couponCode && !alreadyProcessed) {
            // Bounded increment: never let concurrent redemptions exceed maxUses.
            const [redeemed] = await db.update(couponsTable)
              .set({ usesCount: sql`${couponsTable.usesCount} + 1`, updatedAt: new Date() })
              .where(sql`${couponsTable.code} = ${couponCode} AND (${couponsTable.maxUses} IS NULL OR ${couponsTable.usesCount} < ${couponsTable.maxUses})`)
              .returning();
            if (redeemed) {
              // One redemption per (coupon, user) — the unique index is the real enforcement;
              // onConflictDoNothing keeps a webhook redelivery from erroring on the duplicate.
              await db.insert(couponRedemptionsTable)
                .values({ couponId: redeemed.id, clerkId })
                .onConflictDoNothing();
              await auditLog({ eventType: "user.coupon.redeemed", actorClerkId: clerkId, meta: { code: couponCode, planId } });
              logger.info({ clerkId, couponCode }, "Coupon redeemed");
            }
          }
        }
        break;
      }

      case "customer.subscription.updated": {
        const sub = event.data.object as import("stripe").Stripe.Subscription;
        const clerkId = sub.metadata?.clerkId;
        const rawPlanId = sub.metadata?.planId;
        const planId = rawPlanId ? normalizePlanId(rawPlanId) : null;

        if (clerkId) {
          const updates: Record<string, unknown> = {
            stripeSubscriptionStatus: sub.status,
            updatedAt: new Date(),
          };
          if (planId) updates.plan = planId;

          await db.update(usersTable)
            .set(updates)
            .where(eq(usersTable.clerkId, clerkId));
        }
        break;
      }

      case "customer.subscription.deleted": {
        const sub = event.data.object as import("stripe").Stripe.Subscription;
        const clerkId = sub.metadata?.clerkId;

        if (clerkId) {
          await db.update(usersTable)
            .set({
              plan: "free",
              stripeSubscriptionId: null,
              stripeSubscriptionStatus: "canceled",
              updatedAt: new Date(),
            })
            .where(eq(usersTable.clerkId, clerkId));

          logger.info({ clerkId }, "Subscription canceled — reverted to free");
        }
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as import("stripe").Stripe.Invoice;
        const customerId = invoice.customer as string;

        if (customerId) {
          await db.update(usersTable)
            .set({ stripeSubscriptionStatus: "past_due", updatedAt: new Date() })
            .where(eq(usersTable.stripeCustomerId, customerId));
        }
        break;
      }

      case "charge.refunded": {
        const charge = event.data.object as import("stripe").Stripe.Charge;
        const customerId = charge.customer as string | null;
        const isFullRefund = charge.amount_refunded >= charge.amount;

        if (customerId) {
          const [user] = await db.select().from(usersTable).where(eq(usersTable.stripeCustomerId, customerId));
          if (user) {
            await auditLog({
              eventType: "user.payment.refunded",
              actorClerkId: user.clerkId,
              meta: { chargeId: charge.id, amountRefunded: charge.amount_refunded, amount: charge.amount, fullRefund: isFullRefund },
            });

            // Only a full refund revokes paid access — a partial/goodwill refund keeps the plan intact.
            if (isFullRefund) {
              if (user.stripeSubscriptionId) {
                try {
                  await stripe.subscriptions.cancel(user.stripeSubscriptionId);
                } catch (err) {
                  logger.error({ err, subscriptionId: user.stripeSubscriptionId }, "Failed to cancel subscription after full refund");
                }
              }
              await db.update(usersTable)
                .set({ plan: "free", stripeSubscriptionStatus: "refunded", updatedAt: new Date() })
                .where(eq(usersTable.clerkId, user.clerkId));
              logger.warn({ clerkId: user.clerkId, chargeId: charge.id }, "Full refund processed — plan downgraded to free");
            }
          }
        }
        break;
      }

      case "charge.dispute.created": {
        const dispute = event.data.object as import("stripe").Stripe.Dispute;
        const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id;

        let customerId: string | null = null;
        try {
          const charge = await stripe.charges.retrieve(chargeId);
          customerId = charge.customer as string | null;
        } catch (err) {
          logger.error({ err, chargeId }, "Failed to retrieve charge for dispute");
        }

        if (customerId) {
          const [user] = await db.select().from(usersTable).where(eq(usersTable.stripeCustomerId, customerId));
          if (user) {
            await auditLog({
              eventType: "user.payment.disputed",
              actorClerkId: user.clerkId,
              meta: { disputeId: dispute.id, chargeId, amount: dispute.amount, reason: dispute.reason },
            });
            // Chargebacks are flagged for manual review, not auto-revoked: Stripe already
            // withholds the disputed funds, and a customer disputing in good faith shouldn't
            // instantly lose access before support has a chance to respond.
            logger.warn({ clerkId: user.clerkId, disputeId: dispute.id, reason: dispute.reason }, "Chargeback/dispute opened — flagged for manual review");
          }
        }
        break;
      }
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err, eventType: event.type }, "Stripe webhook handler error");
    res.status(500).json({ error: "Webhook processing error" });
  }
}

export default router;
