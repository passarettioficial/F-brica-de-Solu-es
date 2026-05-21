import { db, settingsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";
import { logger } from "./logger";

type Usage = { prompt_tokens?: number; completion_tokens?: number } | null | undefined;

const MODEL_PRICES_USD_PER_1M: Record<string, { input: number; output: number }> = {
  "gpt-4.1": { input: 2.0, output: 8.0 },
  "gpt-4.1-mini": { input: 0.4, output: 1.6 },
  "gpt-4.1-nano": { input: 0.1, output: 0.4 },
  "gpt-4o": { input: 2.5, output: 10.0 },
  "gpt-4o-mini": { input: 0.15, output: 0.6 },
};

const DEFAULT_USD_BRL = 5.5;
const DEFAULT_BUDGET_BRL = 1000;

const KEY_MONTH = "openai_current_month_key";
const KEY_SPEND_USD = "openai_current_month_spend_usd";
const KEY_BUDGET_BRL = "openai_monthly_budget_brl";
const KEY_USD_BRL = "openai_usd_brl_rate";

function monthKey(d: Date = new Date()): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
}

function computeCostUsd(model: string, usage: Usage): number {
  if (!usage) return 0;
  const price = MODEL_PRICES_USD_PER_1M[model] ?? MODEL_PRICES_USD_PER_1M["gpt-4.1"];
  const inTok = usage.prompt_tokens ?? 0;
  const outTok = usage.completion_tokens ?? 0;
  return (inTok * price.input + outTok * price.output) / 1_000_000;
}

async function readSetting(key: string): Promise<string | null> {
  const [row] = await db.select().from(settingsTable).where(eq(settingsTable.key, key)).limit(1);
  return row?.value ?? null;
}

async function upsertSetting(key: string, value: string, category = "openai", label?: string): Promise<void> {
  await db
    .insert(settingsTable)
    .values({ key, value, category, label })
    .onConflictDoUpdate({ target: settingsTable.key, set: { value, updatedAt: new Date() } });
}

export async function recordOpenAiCost(model: string, usage: Usage): Promise<void> {
  try {
    const costUsd = computeCostUsd(model, usage);
    if (costUsd <= 0) return;

    const now = monthKey();
    const delta = costUsd.toFixed(6);

    // Atomic, transactional read-modify-write with row-level lock to avoid lost updates
    // under concurrent AI calls.
    await db.transaction(async (tx) => {
      // Ensure month key row exists and lock it.
      await tx
        .insert(settingsTable)
        .values({ key: KEY_MONTH, value: now, category: "openai", label: "Mês corrente OpenAI (YYYY-MM)" })
        .onConflictDoNothing({ target: settingsTable.key });

      const [monthRow] = await tx.execute<{ value: string }>(
        sql`SELECT value FROM ${settingsTable} WHERE key = ${KEY_MONTH} FOR UPDATE`,
      ).then((r) => (Array.isArray(r) ? r : r.rows) as Array<{ value: string }>);

      const storedMonth = monthRow?.value ?? now;
      const monthRolled = storedMonth !== now;

      if (monthRolled) {
        await tx
          .update(settingsTable)
          .set({ value: now, updatedAt: new Date() })
          .where(eq(settingsTable.key, KEY_MONTH));
        // Reset spend to current delta
        await tx
          .insert(settingsTable)
          .values({ key: KEY_SPEND_USD, value: delta, category: "openai", label: "Gasto OpenAI mês corrente (USD)" })
          .onConflictDoUpdate({ target: settingsTable.key, set: { value: delta, updatedAt: new Date() } });
      } else {
        // Atomic increment via SQL — no read-modify-write race
        await tx
          .insert(settingsTable)
          .values({ key: KEY_SPEND_USD, value: delta, category: "openai", label: "Gasto OpenAI mês corrente (USD)" })
          .onConflictDoUpdate({
            target: settingsTable.key,
            set: {
              value: sql`((${settingsTable.value})::numeric + ${delta}::numeric)::text`,
              updatedAt: new Date(),
            },
          });
      }
    });
  } catch (err) {
    logger.error({ err, model }, "Failed to record OpenAI cost");
  }
}

export type BudgetStatus = {
  monthKey: string;
  budgetBrl: number;
  spentUsd: number;
  spentBrl: number;
  usdBrlRate: number;
  percentage: number;
  alertLevel: "ok" | "warning" | "critical" | "exceeded";
  recommendation: string;
};

function recommendationFor(level: BudgetStatus["alertLevel"], pct: number): string {
  if (level === "exceeded") {
    return "Orçamento ultrapassado. Ações imediatas: (1) aumente o teto mensal no admin se receita justifica; (2) migre fases não-críticas para gpt-4.1-mini (90% mais barato); (3) reduza temporariamente o limite diário de IA dos planos free/founder até nivelar.";
  }
  if (level === "critical") {
    return `Você está em ${pct.toFixed(0)}% do orçamento. Ações: (1) avalie migrar pelo menos 2 fases para gpt-4.1-mini; (2) ative cache de respostas para briefings recorrentes; (3) reveja o limite diário do plano free (hoje 3/dia).`;
  }
  if (level === "warning") {
    return `Você está em ${pct.toFixed(0)}% do orçamento — atenção. Ações: (1) acompanhe diariamente; (2) identifique o plano que mais consome IA na aba Usuários; (3) considere preparar a migração de fases menos críticas para gpt-4.1-mini antes de bater 75%.`;
  }
  return "Consumo dentro do esperado. Nenhuma ação necessária.";
}

export async function getBudgetStatus(): Promise<BudgetStatus> {
  const now = monthKey();
  const storedMonth = await readSetting(KEY_MONTH);
  const spentUsd = storedMonth === now ? parseFloat((await readSetting(KEY_SPEND_USD)) ?? "0") || 0 : 0;
  const budgetBrl = parseFloat((await readSetting(KEY_BUDGET_BRL)) ?? "") || DEFAULT_BUDGET_BRL;
  const usdBrlRate = parseFloat((await readSetting(KEY_USD_BRL)) ?? "") || DEFAULT_USD_BRL;
  const spentBrl = spentUsd * usdBrlRate;
  const percentage = budgetBrl > 0 ? (spentBrl / budgetBrl) * 100 : 0;

  let alertLevel: BudgetStatus["alertLevel"] = "ok";
  if (percentage >= 100) alertLevel = "exceeded";
  else if (percentage >= 75) alertLevel = "critical";
  else if (percentage >= 50) alertLevel = "warning";

  return {
    monthKey: now,
    budgetBrl,
    spentUsd,
    spentBrl,
    usdBrlRate,
    percentage,
    alertLevel,
    recommendation: recommendationFor(alertLevel, percentage),
  };
}

export async function setBudget(budgetBrl: number, usdBrlRate?: number): Promise<void> {
  await upsertSetting(KEY_BUDGET_BRL, String(budgetBrl), "openai", "Orçamento mensal OpenAI (R$)");
  if (typeof usdBrlRate === "number" && usdBrlRate > 0) {
    await upsertSetting(KEY_USD_BRL, String(usdBrlRate), "openai", "Câmbio USD→BRL usado nos cálculos");
  }
}
