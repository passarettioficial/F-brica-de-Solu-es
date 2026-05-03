import Stripe from "stripe";
import { logger } from "./logger";

if (!process.env.STRIPE_SECRET_KEY) {
  logger.warn("STRIPE_SECRET_KEY not set — billing features disabled");
}

export const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2026-04-22.dahlia" })
  : null;

export type PlanId = "free" | "basic" | "pro" | "advanced";

export interface PlanConfig {
  id: PlanId;
  name: string;
  lookupKey: string;
  aiDailyLimit: number;
  canCopy: boolean;
  canDownload: boolean;
  canPrint: boolean;
  hasAiAdvisor: boolean;
  maxProjects: number;
}

export const PLANS: Record<PlanId, PlanConfig> = {
  free: {
    id: "free",
    name: "Gratuito",
    lookupKey: "",
    aiDailyLimit: 2,
    canCopy: false,
    canDownload: false,
    canPrint: false,
    hasAiAdvisor: false,
    maxProjects: 1,
  },
  basic: {
    id: "basic",
    name: "Básico",
    lookupKey: "basic_monthly",
    aiDailyLimit: 5,
    canCopy: false,
    canDownload: false,
    canPrint: false,
    hasAiAdvisor: false,
    maxProjects: 3,
  },
  pro: {
    id: "pro",
    name: "Pro",
    lookupKey: "pro_monthly",
    aiDailyLimit: 20,
    canCopy: true,
    canDownload: true,
    canPrint: false,
    hasAiAdvisor: false,
    maxProjects: 10,
  },
  advanced: {
    id: "advanced",
    name: "Avançado",
    lookupKey: "advanced_monthly",
    aiDailyLimit: 999,
    canCopy: true,
    canDownload: true,
    canPrint: true,
    hasAiAdvisor: true,
    maxProjects: 999,
  },
};

export function getPlanConfig(planId: string, isSuperuser = false): PlanConfig {
  if (isSuperuser) {
    return {
      id: "advanced" as PlanId,
      name: "Superuser",
      lookupKey: "",
      aiDailyLimit: 999999,
      canCopy: true,
      canDownload: true,
      canPrint: true,
      hasAiAdvisor: true,
      maxProjects: 999999,
    };
  }
  return PLANS[planId as PlanId] ?? PLANS.free;
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
