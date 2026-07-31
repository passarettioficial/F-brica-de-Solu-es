import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { db, usersTable, webhookEventsTable } from "@workspace/db";
import { stripe, getPlanConfig, type PlanId } from "../lib/stripe";
import { requireAuth, ensureUser } from "../lib/auth";
import { validateCoupon } from "../lib/coupons";
import { logger } from "../lib/logger";
import {
  createCheckoutSession,
  activateSubscriptionFromCheckout,
  syncSubscriptionStatus,
  cancelSubscription,
  markInvoicePastDue,
  processChargeRefund,
  flagChargeDispute,
  processDisputeClosed,
} from "../lib/billing-service";

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

  const { planId, billingCycle, couponCode, email } = req.body as {
    planId: PlanId;
    billingCycle?: "monthly" | "yearly";
    couponCode?: string;
    email?: string;
  };
  const cycle = billingCycle === "yearly" ? "yearly" : "monthly";

  await ensureUser(userId);

  const result = await createCheckoutSession({
    clerkId: userId,
    planId,
    billingCycle: cycle,
    couponCode,
    email,
    successUrl: `${BASE_URL}/billing?success=1&plan=${planId}`,
    cancelUrl: `${BASE_URL}/pricing?canceled=1`,
  });

  if (!result.ok) { res.status(result.status).json({ error: result.error }); return; }
  res.json({ url: result.url });
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

// POST /billing/webhook — Stripe webhook (raw body needed, registered before express.json).
// Thin dispatcher: verify the event, hand off to the matching billing-service function.
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

  // Deduplicação (F9): a Stripe pode reentregar um evento legítimo (retry, reenvio manual
  // pelo painel). Sem isso, um checkout.session.completed reentregue depois que o usuário já
  // cancelou reativaria o acesso pago. onConflictDoNothing() faz o INSERT falhar
  // silenciosamente na segunda vez pro mesmo event.id — 0 linhas retornadas = já processado.
  try {
    const [inserted] = await db.insert(webhookEventsTable)
      .values({ eventId: event.id, eventType: event.type })
      .onConflictDoNothing()
      .returning({ eventId: webhookEventsTable.eventId });

    if (!inserted) {
      logger.info({ eventId: event.id, eventType: event.type }, "Webhook Stripe reentregue — já processado, ignorando");
      res.status(200).json({ received: true, deduplicated: true });
      return;
    }
  } catch (err) {
    // Se a checagem de deduplicação falhar (ex: banco fora do ar), prosseguimos com o
    // processamento em vez de rejeitar o webhook — melhor arriscar reprocessar um evento
    // do que perder um evento real por uma falha de infraestrutura não relacionada.
    logger.error({ err, eventId: event.id }, "Falha ao registrar deduplicação de webhook — prosseguindo mesmo assim");
  }

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await activateSubscriptionFromCheckout(event.data.object as import("stripe").Stripe.Checkout.Session);
        break;
      case "customer.subscription.updated":
        await syncSubscriptionStatus(event.data.object as import("stripe").Stripe.Subscription);
        break;
      case "customer.subscription.deleted":
        await cancelSubscription(event.data.object as import("stripe").Stripe.Subscription);
        break;
      case "invoice.payment_failed":
        await markInvoicePastDue(event.data.object as import("stripe").Stripe.Invoice);
        break;
      case "charge.refunded":
        await processChargeRefund(event.data.object as import("stripe").Stripe.Charge);
        break;
      case "charge.dispute.created":
        await flagChargeDispute(event.data.object as import("stripe").Stripe.Dispute);
        break;
      case "charge.dispute.closed":
        await processDisputeClosed(event.data.object as import("stripe").Stripe.Dispute);
        break;
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err, eventType: event.type }, "Stripe webhook handler error");
    res.status(500).json({ error: "Webhook processing error" });
  }
}

export default router;
