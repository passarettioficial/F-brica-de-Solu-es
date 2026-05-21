import { useState, useEffect } from "react";
import { api } from "./shared";

type BudgetStatus = {
  monthKey: string;
  budgetBrl: number;
  spentUsd: number;
  spentBrl: number;
  usdBrlRate: number;
  percentage: number;
  alertLevel: "ok" | "warning" | "critical" | "exceeded";
  recommendation: string;
};

const ALERT_STYLES: Record<BudgetStatus["alertLevel"], { bg: string; border: string; text: string; bar: string; badge: string; label: string }> = {
  ok: {
    bg: "bg-card",
    border: "border-card-border",
    text: "text-foreground",
    bar: "bg-primary",
    badge: "bg-secondary text-secondary-foreground",
    label: "OK",
  },
  warning: {
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-300 dark:border-amber-800",
    text: "text-amber-900 dark:text-amber-200",
    bar: "bg-amber-500",
    badge: "bg-amber-500 text-white",
    label: "Atenção · 50%+",
  },
  critical: {
    bg: "bg-orange-50 dark:bg-orange-950/30",
    border: "border-orange-400 dark:border-orange-800",
    text: "text-orange-900 dark:text-orange-200",
    bar: "bg-orange-500",
    badge: "bg-orange-500 text-white",
    label: "Crítico · 75%+",
  },
  exceeded: {
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-400 dark:border-red-800",
    text: "text-red-900 dark:text-red-200",
    bar: "bg-red-600",
    badge: "bg-red-600 text-white",
    label: "Excedido · 100%+",
  },
};

function brl(v: number) {
  return v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 2 });
}

export function OpenAiBudgetCard() {
  const [status, setStatus] = useState<BudgetStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [budgetInput, setBudgetInput] = useState("");
  const [rateInput, setRateInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setError(null);
    api("/admin/openai-budget")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json() as Promise<BudgetStatus>;
      })
      .then((d) => {
        setStatus(d);
        setBudgetInput(String(d.budgetBrl));
        setRateInput(String(d.usdBrlRate));
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Erro ao carregar orçamento"))
      .finally(() => setLoading(false));
  }

  useEffect(() => { load(); }, []);

  async function save() {
    const budgetBrl = parseFloat(budgetInput);
    const usdBrlRate = parseFloat(rateInput);
    if (!Number.isFinite(budgetBrl) || budgetBrl < 0) {
      setError("Orçamento inválido");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const r = await api("/admin/openai-budget", {
        method: "PATCH",
        body: JSON.stringify({ budgetBrl, usdBrlRate: Number.isFinite(usdBrlRate) && usdBrlRate > 0 ? usdBrlRate : undefined }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body?.error ?? `HTTP ${r.status}`);
      }
      const d = (await r.json()) as BudgetStatus;
      setStatus(d);
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <div className="text-muted-foreground text-sm py-4">Carregando orçamento OpenAI...</div>;
  if (!status) {
    return (
      <div className="bg-red-50 dark:bg-red-950/30 border-2 border-red-400 dark:border-red-800 rounded-xl p-4 text-sm text-red-900 dark:text-red-200">
        Erro ao carregar orçamento OpenAI{error ? ` — ${error}` : ""}.{" "}
        <button onClick={() => { setLoading(true); load(); }} className="underline font-medium">Tentar novamente</button>
      </div>
    );
  }

  const s = ALERT_STYLES[status.alertLevel];
  const pctCapped = Math.min(100, status.percentage);

  return (
    <div className={`${s.bg} ${s.border} border-2 rounded-xl p-5`}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`text-sm font-semibold ${s.text}`}>Consumo OpenAI · {status.monthKey}</h3>
            <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded-full ${s.badge}`}>{s.label}</span>
          </div>
          <p className={`text-xs ${s.text} opacity-80`}>
            {brl(status.spentBrl)} de {brl(status.budgetBrl)} · {status.percentage.toFixed(1)}% · USD {status.spentUsd.toFixed(2)} (câmbio R$ {status.usdBrlRate.toFixed(2)})
          </p>
        </div>
        <button
          onClick={() => setEditing(v => !v)}
          className="text-xs font-medium px-3 py-1.5 rounded-md border border-card-border bg-card hover:bg-muted transition-colors text-foreground"
        >
          {editing ? "Cancelar" : "Editar"}
        </button>
      </div>

      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden mb-3">
        <div className={`${s.bar} h-2.5 rounded-full transition-all duration-500`} style={{ width: `${pctCapped}%` }} />
      </div>

      {status.alertLevel !== "ok" && (
        <div className={`text-xs ${s.text} leading-relaxed mb-3 p-3 rounded-md bg-background/60`}>
          <strong>Ação recomendada:</strong> {status.recommendation}
        </div>
      )}

      {error && (
        <div className="text-xs text-red-700 dark:text-red-300 mb-2">⚠ {error}</div>
      )}

      {editing && (
        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-card-border">
          <label className="text-xs text-foreground space-y-1">
            <span className="block font-medium">Orçamento mensal (R$)</span>
            <input
              type="number"
              min="0"
              step="50"
              value={budgetInput}
              onChange={e => setBudgetInput(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-card-border bg-background text-foreground text-sm"
            />
          </label>
          <label className="text-xs text-foreground space-y-1">
            <span className="block font-medium">Câmbio USD→BRL</span>
            <input
              type="number"
              min="0.1"
              step="0.1"
              value={rateInput}
              onChange={e => setRateInput(e.target.value)}
              className="w-full px-3 py-2 rounded-md border border-card-border bg-background text-foreground text-sm"
            />
          </label>
          <div className="col-span-2 flex justify-end">
            <button
              onClick={save}
              disabled={saving}
              className="text-xs font-medium px-4 py-2 rounded-md bg-primary text-white hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? "Salvando..." : "Salvar"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
