import { eq, sql } from "drizzle-orm";
import type Stripe from "stripe";
import { db, usersTable, couponsTable, couponRedemptionsTable } from "@workspace/db";
import { stripe, PLANS, getOrCreateStripeCustomer, getPriceId, getOrCreateStripeCoupon, normalizePlanId, type PlanId } from "./stripe";
import { validateCoupon } from "./coupons";
import { auditLog } from "./audit";
import { logger } from "./logger";

/**
 * Business logic for checkout/subscription/coupon lifecycle, kept separate from the Express
 * route handlers in routes/billing.ts. Routes stay thin: parse the request, call one of these,
 * translate the result to an HTTP response.
 */

export interface CreateCheckoutParams {
  clerkId: string;
  planId: PlanId;
  billingCycle: "monthly" | "yearly";
  couponCode?: string;
  email?: string;
  successUrl: string;
  cancelUrl: string;
}

export type CheckoutResult = { ok: true; url: string } | { ok: false; status: number; error: string };

export async function createCheckoutSession(params: CreateCheckoutParams): Promise<CheckoutResult> {
  if (!stripe) return { ok: false, status: 503, error: "Pagamentos não configurados" };

  const plan = PLANS[params.planId];
  if (!plan || params.planId === "free") return { ok: false, status: 400, error: "Plano inválido" };

  const [user] = await db.select().from(usersTable).where(eq(usersTable.clerkId, params.clerkId));
  if (!user) return { ok: false, status: 404, error: "User not found" };

  const customerId = await getOrCreateStripeCustomer(params.clerkId, params.email, user.stripeCustomerId);
  if (!user.stripeCustomerId) {
    await db.update(usersTable)
      .set({ stripeCustomerId: customerId, updatedAt: new Date() })
      .where(eq(usersTable.clerkId, params.clerkId));
  }

  const lookupKey = params.billingCycle === "yearly" ? plan.lookupKeyYearly : plan.lookupKey;
  const priceId = await getPriceId(lookupKey);
  if (!priceId) return { ok: false, status: 503, error: "Preço não configurado. Execute o setup do Stripe." };

  // Optional coupon — validate against our DB, then map to a Stripe coupon.
  let discounts: { coupon: string }[] | undefined;
  let appliedCouponCode: string | undefined;
  if (params.couponCode?.trim()) {
    const result = await validateCoupon(params.couponCode, params.planId, params.clerkId);
    if (!result.ok) return { ok: false, status: result.status, error: result.error };
    const stripeCouponId = await getOrCreateStripeCoupon(result.coupon);
    if (!stripeCouponId) return { ok: false, status: 503, error: "Não foi possível aplicar o cupom. Tente novamente." };
    discounts = [{ coupon: stripeCouponId }];
    appliedCouponCode = result.coupon.code;
  }

  const metadata = {
    clerkId: params.clerkId,
    planId: params.planId,
    billingCycle: params.billingCycle,
    ...(appliedCouponCode ? { couponCode: appliedCouponCode } : {}),
  };

  const session = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: "subscription",
    line_items: [{ price: priceId, quantity: 1 }],
    ...(discounts ? { discounts } : {}),
    success_url: params.successUrl,
    cancel_url: params.cancelUrl,
    metadata,
    subscription_data: { metadata },
  });

  return { ok: true, url: session.url! };
}

export async function activateSubscriptionFromCheckout(session: Stripe.Checkout.Session): Promise<void> {
  const clerkId = session.metadata?.clerkId;
  const rawPlanId = session.metadata?.planId;
  const planId = rawPlanId ? normalizePlanId(rawPlanId) : null;
  const subscriptionId = session.subscription as string;

  if (!clerkId || !planId || !subscriptionId) return;

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.clerkId, clerkId));
  // Idempotency: Stripe may redeliver this event. Only redeem the coupon once per subscription.
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
      // discountType/discountValue are snapshotted here (from the row we just updated)
      // so this ledger entry survives later edits to the coupon's configured value.
      await db.insert(couponRedemptionsTable)
        .values({
          couponId: redeemed.id,
          clerkId,
          planId,
          billingCycle: session.metadata?.billingCycle ?? "monthly",
          discountType: redeemed.discountType,
          discountValue: redeemed.discountValue,
        })
        .onConflictDoNothing();
      await auditLog({ eventType: "user.coupon.redeemed", actorClerkId: clerkId, meta: { code: couponCode, planId } });
      logger.info({ clerkId, couponCode }, "Coupon redeemed");
    }
  }
}

export async function syncSubscriptionStatus(sub: Stripe.Subscription): Promise<void> {
  const clerkId = sub.metadata?.clerkId;
  const rawPlanId = sub.metadata?.planId;
  const planId = rawPlanId ? normalizePlanId(rawPlanId) : null;
  if (!clerkId) return;

  const updates: Record<string, unknown> = { stripeSubscriptionStatus: sub.status, updatedAt: new Date() };
  if (planId) updates.plan = planId;

  await db.update(usersTable).set(updates).where(eq(usersTable.clerkId, clerkId));
}

export async function cancelSubscription(sub: Stripe.Subscription): Promise<void> {
  const clerkId = sub.metadata?.clerkId;
  if (!clerkId) return;

  await db.update(usersTable)
    .set({ plan: "free", stripeSubscriptionId: null, stripeSubscriptionStatus: "canceled", updatedAt: new Date() })
    .where(eq(usersTable.clerkId, clerkId));

  logger.info({ clerkId }, "Subscription canceled — reverted to free");
}

export async function markInvoicePastDue(invoice: Stripe.Invoice): Promise<void> {
  const customerId = invoice.customer as string;
  if (!customerId) return;

  await db.update(usersTable)
    .set({ stripeSubscriptionStatus: "past_due", updatedAt: new Date() })
    .where(eq(usersTable.stripeCustomerId, customerId));
}

export async function processChargeRefund(charge: Stripe.Charge): Promise<void> {
  const customerId = charge.customer as string | null;
  const isFullRefund = charge.amount_refunded >= charge.amount;
  if (!customerId) return;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.stripeCustomerId, customerId));
  if (!user) return;

  await auditLog({
    eventType: "user.payment.refunded",
    actorClerkId: user.clerkId,
    meta: { chargeId: charge.id, amountRefunded: charge.amount_refunded, amount: charge.amount, fullRefund: isFullRefund },
  });

  // Only a full refund revokes paid access — a partial/goodwill refund keeps the plan intact.
  if (!isFullRefund) return;

  if (user.stripeSubscriptionId) {
    try {
      await stripe!.subscriptions.cancel(user.stripeSubscriptionId);
    } catch (err) {
      logger.error({ err, subscriptionId: user.stripeSubscriptionId }, "Failed to cancel subscription after full refund");
    }
  }
  await db.update(usersTable)
    .set({ plan: "free", stripeSubscriptionStatus: "refunded", updatedAt: new Date() })
    .where(eq(usersTable.clerkId, user.clerkId));
  logger.warn({ clerkId: user.clerkId, chargeId: charge.id }, "Full refund processed — plan downgraded to free");
}

export async function flagChargeDispute(dispute: Stripe.Dispute): Promise<void> {
  const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge.id;

  let customerId: string | null = null;
  try {
    const charge = await stripe!.charges.retrieve(chargeId);
    customerId = charge.customer as string | null;
  } catch (err) {
    logger.error({ err, chargeId }, "Failed to retrieve charge for dispute");
    return;
  }
  if (!customerId) return;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.stripeCustomerId, customerId));
  if (!user) return;

  await auditLog({
    eventType: "user.payment.disputed",
    actorClerkId: user.clerkId,
    meta: { disputeId: dispute.id, chargeId, amount: dispute.amount, reason: dispute.reason },
  });
  // Chargebacks are flagged for manual review, not auto-revoked: Stripe already withholds the
  // disputed funds, and a customer disputing in good faith shouldn't instantly lose access
  // before support has a chance to respond.
  logger.warn({ clerkId: user.clerkId, disputeId: dispute.id, reason: dispute.reason }, "Chargeback/dispute opened — flagged for manual review");
}
