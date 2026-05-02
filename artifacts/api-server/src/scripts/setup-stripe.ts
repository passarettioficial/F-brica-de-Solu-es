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
    name: "Fábrica de Soluções — Básico",
    description: "Leia os artefatos gerados por IA na plataforma. Ideal para quem está explorando.",
    lookupKey: "basic_monthly",
    unitAmount: 4900, // R$49,00
    metadata: { plan: "basic" },
  },
  {
    name: "Fábrica de Soluções — Pro",
    description: "Copie e baixe todos os artefatos. O plano mais popular para founders ativos.",
    lookupKey: "pro_monthly",
    unitAmount: 14900, // R$149,00
    metadata: { plan: "pro" },
  },
  {
    name: "Fábrica de Soluções — Avançado",
    description: "Tudo do Pro + AI Advisor exclusivo que analisa todos os seus artefatos e responde perguntas estratégicas sobre seu produto.",
    lookupKey: "advanced_monthly",
    unitAmount: 34900, // R$349,00
    metadata: { plan: "advanced" },
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

    const price = await stripe.prices.create({
      product: product.id,
      unit_amount: p.unitAmount,
      currency: "brl",
      recurring: { interval: "month" },
      lookup_key: p.lookupKey,
      transfer_lookup_key: true,
    });

    console.log(`  ✓ Product: ${product.id} | Price: ${price.id} | Lookup: ${p.lookupKey}`);
  }
  console.log("\nSetup complete!");
}

main().catch(console.error);
