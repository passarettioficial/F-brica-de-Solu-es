import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { stripe, PLANS, getPlanConfig, getOrCreateStripeCustomer, getPriceId, normalizePlanId, type PlanId } from "../lib/stripe";
import { ensureUser } from "../lib/auth";
import { logger } from "../lib/logger";

const router: IRouter = Router();

const BASE_URL = process.env.APP_BASE_URL ?? "http://localhost:80";

function requireAuth(req: Request) {
  const auth = getAuth(req);
  return auth?.userId ?? null;
}

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

  const { planId, billingCycle } = req.body as { planId: PlanId; billingCycle?: "monthly" | "yearly" };
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

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${BASE_URL}/billing?success=1&plan=${planId}`,
    cancel_url: `${BASE_URL}/pricing?canceled=1`,
    metadata: { clerkId: userId, planId, billingCycle: cycle },
    subscription_data: {
      metadata: { clerkId: userId, planId, billingCycle: cycle },
    },
  });

  res.json({ url: session.url });
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

  const sig = req.headers["stripe-signature"] as string;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: import("stripe").Stripe.Event;

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(req.body as Buffer, sig, webhookSecret);
    } else {
      event = JSON.parse((req.body as Buffer).toString()) as import("stripe").Stripe.Event;
    }
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
          await db.update(usersTable)
            .set({
              plan: planId,
              stripeSubscriptionId: subscriptionId,
              stripeSubscriptionStatus: "active",
              updatedAt: new Date(),
            })
            .where(eq(usersTable.clerkId, clerkId));

          logger.info({ clerkId, planId }, "Subscription activated");
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
    }

    res.status(200).json({ received: true });
  } catch (err) {
    logger.error({ err, eventType: event.type }, "Stripe webhook handler error");
    res.status(500).json({ error: "Webhook processing error" });
  }
}

export default router;
