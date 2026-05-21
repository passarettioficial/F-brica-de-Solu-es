/**
 * One-time script to create Stripe products and prices.
 * Run with: npx tsx src/scripts/setup-stripe.ts
 */
import Stripe from "stripe";

const secretKey = process.env.STRIPE_SECRET_KEY;
if (!secretKey) {
  console.error("STRIPE_SECRET_KEY not set");
  process.exit(1);
}

const stripe = new Stripe(secretKey, { apiVersion: "2026-04-22.dahlia" });

const PRODUCTS = [
  {
    name: "FoundersFlow — Founder",
    description:
      "Plano completo para founders sérios. 30 execuções de IA/dia, 5 projetos, AI Advisor, export e impressão.",
    metadata: { plan: "founder" },
    prices: [
      { lookupKey: "founder_monthly", unitAmount: 19700, interval: "month" as const },
      { lookupKey: "founder_yearly", unitAmount: 197000, interval: "year" as const },
    ],
  },
  {
    name: "FoundersFlow — Studio",
    description:
      "Para serial founders, consultores e pequenas equipes. IA ilimitada, projetos ilimitados, 3 seats, white-label e suporte prioritário.",
    metadata: { plan: "studio" },
    prices: [
      { lookupKey: "studio_monthly", unitAmount: 69700, interval: "month" as const },
      { lookupKey: "studio_yearly", unitAmount: 697000, interval: "year" as const },
    ],
  },
];

async function main() {
  for (const p of PRODUCTS) {
    console.log(`Creating product: ${p.name}...`);

    const product = await stripe.products.create({
      name: p.name,
      description: p.description,
      metadata: p.metadata,
    });

    for (const pr of p.prices) {
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: pr.unitAmount,
        currency: "brl",
        recurring: { interval: pr.interval },
        lookup_key: pr.lookupKey,
        transfer_lookup_key: true,
      });
      console.log(`  ✓ Price (${pr.interval}): ${price.id} | Lookup: ${pr.lookupKey}`);
    }
  }
  console.log("\nSetup complete!");
}

main().catch(console.error);
