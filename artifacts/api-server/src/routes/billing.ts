import { Router, type IRouter, type Request, type Response } from "express";
import { eq } from "drizzle-orm";
import { getAuth } from "@clerk/express";
import { db, usersTable } from "@workspace/db";
import { stripe, PLANS, getPlanConfig, getOrCreateStripeCustomer, getPriceId, type PlanId } from "../lib/stripe";
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
      id: "basic",
      name: "Básico",
      price: "R$49",
      period: "/mês",
      description: "Leia os artefatos gerados por IA diretamente na plataforma.",
      highlight: false,
      features: [
        "5 execuções de IA por dia",
        "Até 3 projetos simultâneos",
        "Todos os artefatos de cada fase",
        "Leitura na plataforma",
        "Portões de qualidade por fase",
      ],
      limitations: [
        "Sem cópia de conteúdo",
        "Sem download de artefatos",
        "Sem impressão",
        "Sem AI Advisor",
      ],
    },
    {
      id: "pro",
      name: "Pro",
      price: "R$149",
      period: "/mês",
      description: "O plano completo para founders construindo produtos sérios.",
      highlight: true,
      badge: "Mais popular",
      features: [
        "20 execuções de IA por dia",
        "Até 10 projetos simultâneos",
        "Todos os artefatos de cada fase",
        "Cópia e edição de conteúdo",
        "Download de artefatos em Markdown",
        "Portões de qualidade por fase",
      ],
      limitations: [
        "Sem AI Advisor",
      ],
    },
    {
      id: "advanced",
      name: "Avançado",
      price: "R$349",
      period: "/mês",
      description: "Para founders que querem um parceiro de IA exclusivo para seu produto.",
      highlight: false,
      badge: "Premium",
      features: [
        "IA ilimitada por dia",
        "Projetos ilimitados",
        "Todos os artefatos de cada fase",
        "Cópia e edição de conteúdo",
        "Download de artefatos em Markdown",
        "Impressão habilitada",
        "🤖 AI Advisor — chat com IA sobre seu produto",
        "Contexto completo dos artefatos gerados",
        "Perguntas estratégicas, técnicas e de negócio",
        "Modelo GPT-4.1 prioritário",
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
    plan: user.isSuperuser ? "advanced" : user.plan,
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

  const { planId } = req.body as { planId: PlanId };
  const plan = PLANS[planId];
  if (!plan || planId === "free") { res.status(400).json({ error: "Plano inválido" }); return; }

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

  const priceId = await getPriceId(plan.lookupKey);
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
    metadata: { clerkId: userId, planId },
    subscription_data: {
      metadata: { clerkId: userId, planId },
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
        const planId = session.metadata?.planId as PlanId;
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
        const planId = sub.metadata?.planId as PlanId;

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
