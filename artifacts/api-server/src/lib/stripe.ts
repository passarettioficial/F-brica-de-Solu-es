import Stripe from "stripe";
import { logger } from "./logger";

if (!process.env.STRIPE_SECRET_KEY) {
  logger.warn("STRIPE_SECRET_KEY not set — billing features disabled");
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" })
  : null;

export type PlanId = "free" | "founder" | "studio";
export type BillingCycle = "monthly" | "yearly";

export interface PlanConfig {
  id: PlanId;
  name: string;
  lookupKey: string;
  lookupKeyYearly: string;
  priceMonthly: number;
  priceYearly: number;
  aiDailyLimit: number;
  canCopy: boolean;
  canDownload: boolean;
  canPrint: boolean;
  hasAiAdvisor: boolean;
  maxProjects: number;
  maxSeats: number;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Explorar",
    lookupKey: "",
    lookupKeyYearly: "",
    priceMonthly: 0,
    priceYearly: 0,
    aiDailyLimit: 3,
    canCopy: false,
    canDownload: false,
    canPrint: false,
    hasAiAdvisor: false,
    maxProjects: 1,
    maxSeats: 1,
  },
  founder: {
    id: "founder",
    name: "Founder",
    lookupKey: "founder_monthly",
    lookupKeyYearly: "founder_yearly",
    priceMonthly: 19700, // R$197,00
    priceYearly: 197000, // R$1.970,00 (10 meses, ~17% off)
    aiDailyLimit: 30,
    canCopy: true,
    canDownload: true,
    canPrint: true,
    hasAiAdvisor: true,
    maxProjects: 5,
    maxSeats: 1,
  },
  studio: {
    id: "studio",
    name: "Studio",
    lookupKey: "studio_monthly",
    lookupKeyYearly: "studio_yearly",
    priceMonthly: 69700, // R$697,00
    priceYearly: 697000, // R$6.970,00 (10 meses, ~17% off)
    aiDailyLimit: 999,
    canCopy: true,
    canDownload: true,
    canPrint: true,
    hasAiAdvisor: true,
    maxProjects: 999,
    maxSeats: 3,
  },
};

// Legacy plan IDs (basic/pro/advanced) — map to new plans for backward compatibility
const LEGACY_PLAN_MAP: Record<string, PlanId> = {
  basic: "founder",
  pro: "founder",
  advanced: "studio",
  starter: "founder",
};

export function normalizePlanId(planId: string): PlanId {
  if (planId in PLANS) return planId as PlanId;
  return LEGACY_PLAN_MAP[planId] ?? "free";
}

export function getPlanConfig(planId: string, isSuperuser = false): PlanConfig {
  if (isSuperuser) {
    return {
      id: "studio" as PlanId,
      name: "Superuser",
      lookupKey: "",
      lookupKeyYearly: "",
      priceMonthly: 0,
      priceYearly: 0,
      aiDailyLimit: 999999,
      canCopy: true,
      canDownload: true,
      canPrint: true,
      hasAiAdvisor: true,
      maxProjects: 999999,
      maxSeats: 999999,
    };
  }
  const normalized = normalizePlanId(planId);
  return PLANS[normalized];
}

export async function getOrCreateStripeCustomer(
  clerkId: string,
  email: string | undefined,
  stripeCustomerId: string | null
): Promise<string> {
  if (!stripe) throw new Error("Stripe not configured");

  if (stripeCustomerId) {
    return stripeCustomerId;
  }

  const customer = await stripe.customers.create({
    email,
    metadata: { clerkId },
  });

  return customer.id;
}

export async function getPriceId(lookupKey: string): Promise<string | null> {
  if (!stripe || !lookupKey) return null;
  try {
    const prices = await stripe.prices.list({ lookup_keys: [lookupKey], limit: 1 });
    return prices.data[0]?.id ?? null;
  } catch {
    return null;
  }
}
