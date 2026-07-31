import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useUpdateArtifact } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList, Cell,
} from "recharts";
import { parseJsonBlock, Fallback, replaceJsonBlock, clampNonNeg, fmtBRLmes, parseBrlFromStr } from "./shared";
import type { VqNumericData } from "./mercado";

// ───────────────────────── Cross-editor sync helpers ─────────────────────────
export type SiblingArtifact = { artifactKey: string; content: string };

function findSibling(siblings: SiblingArtifact[] | undefined, key: string): SiblingArtifact | undefined {
  return siblings?.find((s) => s.artifactKey === key && !!s.content?.trim());
}

function toPosNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function getArpuFromPricing(siblings?: SiblingArtifact[]): number | null {
  const sib = findSibling(siblings, "HIPOTESE_PRICING");
  if (!sib) return null;
  const d = parseJsonBlock<PricingData>(sib.content);
  if (!d?.tiers?.length) return null;
  const arpu = toPosNum(d.arpu_recomendado);
  if (arpu != null) return Math.round(arpu);
  const mid = toPosNum(d.tiers[1]?.preco_mensal);
  if (mid != null) return Math.round(mid);
  const prices = d.tiers.map((t) => toPosNum(t?.preco_mensal)).filter((n): n is number => n != null);
  if (!prices.length) return null;
  return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
}

export function getCeilingFromValor(siblings?: SiblingArtifact[]): number | null {
  const sib = findSibling(siblings, "VALOR_QUANTIFICADO");
  if (!sib) return null;
  const d = parseJsonBlock<VqNumericData>(sib.content);
  if (!d) return null;
  let economia = d.ganho_liquido?.dinheiro_economizado_mensal;
  if (typeof economia !== "number" || economia <= 0) {
    economia = parseBrlFromStr(d.ganho_liquido?.dinheiro_economizado) ?? undefined;
  }
  if (typeof economia !== "number" || economia <= 0) return null;
  return Math.max(1, Math.round(economia * 0.1));
}

function SyncChip({ label, onClick, testId }: { label: string; onClick: () => void; testId: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
      title="Puxar valor do artefato relacionado"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
      {label}
    </button>
  );
}

// ───────────────────────── 4c. HIPÓTESE PRICING (read + editor) ─────────────────────────
type PricingTier = { nome?: string; preco_mensal?: number; publico?: string; features?: string[] };
type PricingData = {
  modelo?: string;
  moeda?: string;
  tiers?: PricingTier[];
  perguntas_chave?: { valor_capturado?: string; alternativa_atual?: string; sensibilidade?: string };
  go_to_market?: string;
  comparacao_concorrentes?: string;
  arpu_recomendado?: number;
};

export function HipotesePricingCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<PricingData>(content);
  if (!data?.tiers?.length) return <Fallback content={content} />;
  const prices = data.tiers.map((t) => t.preco_mensal ?? 0).filter((n) => n > 0);
  const arpu = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  return (
    <div className="space-y-4">
      {data.modelo && (
        <div className="text-xs text-muted-foreground">
          <span className="font-mono uppercase tracking-wider text-primary">Modelo:</span> {data.modelo}
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-3">
        {data.tiers.map((t, i) => (
          <div key={i} className={`rounded-xl border p-4 ${i === 1 ? "border-primary/40 bg-primary/5" : "border-border bg-background"}`}>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Tier {i + 1}</div>
            <div className="text-base font-semibold text-foreground mt-0.5">{t.nome ?? "—"}</div>
            <div className="text-2xl font-bold text-primary mt-1">{t.preco_mensal != null ? fmtBRLmes(t.preco_mensal) : "—"}</div>
            {t.publico && <div className="text-xs text-muted-foreground mt-2 italic">{t.publico}</div>}
            {!!t.features?.length && (
              <ul className="mt-3 space-y-1 text-xs text-foreground/80">
                {t.features.map((f, j) => <li key={j} className="flex gap-1.5"><span className="text-primary">✓</span><span>{f}</span></li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
      {arpu > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground">
          <span className="font-mono uppercase text-primary">ARPU médio:</span> <span className="font-semibold">{fmtBRLmes(arpu)}</span>
          <span className="text-muted-foreground"> · use como `ticket_medio_mensal` no LTV÷CAC</span>
        </div>
      )}
      {data.perguntas_chave && (
        <div className="space-y-1.5 text-xs">
          {data.perguntas_chave.valor_capturado && <div><span className="text-muted-foreground">Valor capturado: </span><span className="text-foreground">{data.perguntas_chave.valor_capturado}</span></div>}
          {data.perguntas_chave.alternativa_atual && <div><span className="text-muted-foreground">Alternativa atual: </span><span className="text-foreground">{data.perguntas_chave.alternativa_atual}</span></div>}
          {data.perguntas_chave.sensibilidade && <div><span className="text-muted-foreground">Sensibilidade: </span><span className="text-foreground">{data.perguntas_chave.sensibilidade}</span></div>}
        </div>
      )}
      {data.go_to_market && <div className="text-xs text-muted-foreground"><span className="font-mono uppercase text-primary">GTM:</span> {data.go_to_market}</div>}
    </div>
  );
}

const DEFAULT_TIERS: PricingTier[] = [
  { nome: "Starter", preco_mensal: 97, publico: "", features: [] },
  { nome: "Pro", preco_mensal: 297, publico: "", features: [] },
  { nome: "Business", preco_mensal: 697, publico: "", features: [] },
];

export function EditableHipotesePricingCanvas({
  content, projectId, phaseNumber, artifactKey, canEdit, onUpdate, siblings,
}: {
  content: string;
  projectId: number;
  phaseNumber: number;
  artifactKey: string;
  canEdit: boolean;
  onUpdate?: () => void;
  siblings?: SiblingArtifact[];
}) {
  const ceiling = getCeilingFromValor(siblings);
  const original = parseJsonBlock<PricingData>(content);
  const hasJson = !!original?.tiers?.length;
  const [editing, setEditing] = useState(false);

  const seedTiers = (): PricingTier[] => {
    if (hasJson) {
      const arr = (original!.tiers ?? []).slice(0, 3);
      while (arr.length < 3) arr.push({ ...DEFAULT_TIERS[arr.length] });
      return arr.map((t) => ({
        nome: t.nome ?? "",
        preco_mensal: clampNonNeg(t.preco_mensal ?? 0),
        publico: t.publico ?? "",
        features: Array.isArray(t.features) ? t.features.map((f) => (typeof f === "string" ? f.trim() : "")).filter(Boolean) : [],
      }));
    }
    return DEFAULT_TIERS.map((t) => ({ ...t }));
  };
  const [tiers, setTiers] = useState<PricingTier[]>(seedTiers);
  const updateArtifact = useUpdateArtifact();
  const { toast } = useToast();

  const live = useMemo(() => {
    const prices = tiers.map((t) => clampNonNeg(t.preco_mensal ?? 0)).filter((n) => n > 0);
    const arpu = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    const spreadX = min > 0 ? max / min : 0;
    return { arpu, min, max, spreadX, mid: tiers[1]?.preco_mensal ?? 0 };
  }, [tiers]);

  if (!editing) {
    return (
      <div className="space-y-3">
        {hasJson ? <HipotesePricingCanvas content={content} /> : <Fallback content={content} />}
        {canEdit && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} data-testid="button-edit-pricing">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mr-1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              {hasJson ? "Editar tiers" : "Estruturar pricing"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  function updateTier(i: number, patch: Partial<PricingTier>) {
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }
  function updateFeatures(i: number, text: string) {
    const features = text.split("\n").map((s) => s.trim()).filter(Boolean);
    updateTier(i, { features });
  }

  function cancel() {
    setTiers(seedTiers());
    setEditing(false);
  }

  function save() {
    const cleanTiers: PricingTier[] = tiers.map((t) => ({
      nome: (t.nome ?? "").trim() || "Tier",
      preco_mensal: clampNonNeg(t.preco_mensal ?? 0),
      publico: (t.publico ?? "").trim() || undefined,
      features: (t.features ?? []).map((f) => (typeof f === "string" ? f.trim() : "")).filter(Boolean),
    }));
    const prices = cleanTiers.map((t) => t.preco_mensal ?? 0).filter((n) => n > 0);
    const arpu = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const next: PricingData = {
      ...original,
      modelo: original?.modelo ?? "SaaS recorrente",
      moeda: original?.moeda ?? "BRL",
      tiers: cleanTiers,
      arpu_recomendado: arpu,
    };
    const newContent = replaceJsonBlock(content, next as object);
    updateArtifact.mutate(
      { projectId, phaseNumber, artifactKey, data: { content: newContent, contentJson: null } },
      {
        onSuccess: () => {
          toast({ title: "Pricing atualizado", description: `ARPU: ${fmtBRLmes(arpu)} · use no LTV÷CAC` });
          setEditing(false);
          onUpdate?.();
        },
        onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
      }
    );
  }

  const spreadHint = live.spreadX >= 5
    ? { text: `Spread ${live.spreadX.toFixed(1)}× — bom: cobre econômico até enterprise`, color: "text-green-700 dark:text-green-400" }
    : live.spreadX >= 2.5
    ? { text: `Spread ${live.spreadX.toFixed(1)}× — saudável`, color: "text-amber-700 dark:text-amber-400" }
    : live.spreadX > 0
    ? { text: `Spread ${live.spreadX.toFixed(1)}× — tiers muito próximos, perde segmentação`, color: "text-red-700 dark:text-red-400" }
    : { text: "Defina preços nos 3 tiers", color: "text-muted-foreground" };

  return (
    <div className="space-y-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Editor de pricing · ARPU ao vivo</div>
        <div className="text-[10px] text-muted-foreground">3 tiers · regra: Pro ~3× Starter, Business ~2× Pro</div>
      </div>

      {ceiling != null && ceiling > 0 && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-accent/40 bg-accent/5 px-3 py-2">
          <div className="text-[11px] text-foreground">
            <span className="font-mono uppercase text-accent-foreground">Teto sugerido pelo Valor Quantificado:</span>{" "}
            <span className="font-semibold">{fmtBRLmes(ceiling)}</span>{" "}
            <span className="text-muted-foreground">(10% do ganho mensal do cliente)</span>
          </div>
          <SyncChip
            label={`Aplicar no Tier 2 (${fmtBRLmes(ceiling)})`}
            onClick={() => updateTier(1, { preco_mensal: ceiling })}
            testId="chip-sync-ceiling-tier2"
          />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-3">
        {tiers.map((t, i) => (
          <div key={i} className={`rounded-lg border p-3 space-y-2 ${i === 1 ? "border-primary/40 bg-primary/5" : "border-border bg-background"}`}>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Tier {i + 1}{i === 1 && " · destaque"}</div>
            <input
              type="text"
              value={t.nome ?? ""}
              onChange={(e) => updateTier(i, { nome: e.target.value })}
              placeholder="Nome do tier"
              data-testid={`input-tier-${i}-nome`}
              className="w-full px-2 py-1 rounded-md border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">R$</span>
              <input
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={Number.isFinite(t.preco_mensal) ? t.preco_mensal : 0}
                onChange={(e) => updateTier(i, { preco_mensal: Number(e.target.value) })}
                data-testid={`input-tier-${i}-preco`}
                className="flex-1 px-2 py-1 rounded-md border border-border bg-background text-lg font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">/mês</span>
            </div>
            <input
              type="text"
              value={t.publico ?? ""}
              onChange={(e) => updateTier(i, { publico: e.target.value })}
              placeholder="Para quem é este tier"
              data-testid={`input-tier-${i}-publico`}
              className="w-full px-2 py-1 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <textarea
              value={(t.features ?? []).join("\n")}
              onChange={(e) => updateFeatures(i, e.target.value)}
              placeholder="Uma feature por linha"
              data-testid={`textarea-tier-${i}-features`}
              rows={4}
              className="w-full px-2 py-1 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-3 pt-3 border-t border-border/40">
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">ARPU médio</div>
          <div className="text-2xl font-bold text-primary">{fmtBRLmes(live.arpu)}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Faixa</div>
          <div className="text-sm font-semibold text-foreground">{fmtBRLmes(live.min)} → {fmtBRLmes(live.max)}</div>
          <div className={`text-[10px] mt-0.5 ${spreadHint.color}`}>{spreadHint.text}</div>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 flex flex-col justify-center">
          <div className="text-[10px] font-mono uppercase text-primary">→ usar no LTV÷CAC</div>
          <div className="text-sm font-semibold text-foreground">{fmtBRLmes(live.mid > 0 ? live.mid : live.arpu)}</div>
          <div className="text-[10px] text-muted-foreground">tier do meio (mais provável)</div>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-border/40">
        <Button variant="outline" size="sm" onClick={cancel} disabled={updateArtifact.isPending}>Cancelar</Button>
        <Button size="sm" onClick={save} disabled={updateArtifact.isPending} data-testid="button-save-pricing">
          {updateArtifact.isPending ? "Salvando…" : "Salvar pricing"}
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────── 5. LTV ÷ CAC ─────────────────────────
type LtvCacData = {
  premissas?: { ticket_medio_mensal?: number; margem_bruta_pct?: number; churn_mensal_pct?: number; tempo_vida_estimado_meses?: number };
  ltv?: { valor_calculado?: number; formula?: string; explicacao?: string };
  cac?: { valor_calculado?: number; canais?: Array<{ canal: string; custo_estimado_lead: number; taxa_conversao_pct: number; cac_canal: number }>; explicacao?: string };
  razao_ltv_cac?: number;
  payback_meses?: number;
  veredito?: "SAUDAVEL" | "AJUSTAR" | "INVIAVEL" | string;
  interpretacao?: string;
  acoes_recomendadas?: string[];
};

function formatBRL(n?: number) {
  const value = typeof n === "number" ? n : Number(n);
  if (n == null || !Number.isFinite(value)) return "—";
  return value.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

function formatRatio(n?: number) {
  const value = typeof n === "number" ? n : Number(n);
  if (n == null || !Number.isFinite(value)) return "—";
  return value.toFixed(1);
}

function LtvCacBarChart({ ltv, cac }: { ltv?: number; cac?: number }) {
  if (ltv == null && cac == null) return null;
  const data = [
    { nome: "LTV", valor: ltv ?? 0, fill: "hsl(var(--primary))" },
    { nome: "CAC", valor: cac ?? 0, fill: "#94a3b8" },
  ];
  return (
    <div className="rounded-xl border border-border bg-card/50 p-2">
      <ResponsiveContainer width="100%" height={140}>
        <BarChart data={data} layout="vertical" margin={{ top: 4, right: 32, left: 4, bottom: 4 }}>
          <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="nome" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} width={40} />
          <Bar dataKey="valor" radius={[0, 6, 6, 0]} barSize={28}>
            {data.map((d) => <Cell key={d.nome} fill={d.fill} />)}
            <LabelList dataKey="valor" position="right" formatter={(v: number) => formatBRL(v)} style={{ fontSize: 12, fill: "hsl(var(--foreground))", fontWeight: 600 }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function LtvCacCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<LtvCacData>(content);
  if (!data?.ltv && !data?.cac) return <Fallback content={content} />;
  const vMap = {
    SAUDAVEL: { bg: "bg-green-50 dark:bg-green-950/20", border: "border-green-300 dark:border-green-900/50", text: "text-green-700 dark:text-green-400", label: "SAUDÁVEL" },
    AJUSTAR: { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-300 dark:border-amber-900/50", text: "text-amber-700 dark:text-amber-400", label: "AJUSTAR" },
    INVIAVEL: { bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-300 dark:border-red-900/50", text: "text-red-700 dark:text-red-400", label: "INVIÁVEL" },
  } as const;
  const v = (data.veredito && vMap[data.veredito as keyof typeof vMap]) || vMap.AJUSTAR;
  return (
    <div className="space-y-4">
      {data.premissas && (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Premissas</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><div className="text-xs text-muted-foreground">Ticket/mês</div><div className="font-semibold text-foreground">{formatBRL(data.premissas.ticket_medio_mensal)}</div></div>
            <div><div className="text-xs text-muted-foreground">Margem bruta</div><div className="font-semibold text-foreground">{data.premissas.margem_bruta_pct ?? "—"}%</div></div>
            <div><div className="text-xs text-muted-foreground">Churn/mês</div><div className="font-semibold text-foreground">{data.premissas.churn_mensal_pct ?? "—"}%</div></div>
            <div><div className="text-xs text-muted-foreground">Vida estimada</div><div className="font-semibold text-foreground">{data.premissas.tempo_vida_estimado_meses ?? "—"} m</div></div>
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">LTV — Valor do cliente</div>
          <div className="text-3xl font-bold text-primary">{formatBRL(data.ltv?.valor_calculado)}</div>
          {data.ltv?.formula && <div className="text-xs text-muted-foreground mt-1 font-mono">{data.ltv.formula}</div>}
          {data.ltv?.explicacao && <p className="text-xs text-foreground/70 mt-2">{data.ltv.explicacao}</p>}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">CAC — Custo de aquisição</div>
          <div className="text-3xl font-bold text-foreground">{formatBRL(data.cac?.valor_calculado)}</div>
          {data.cac?.explicacao && <p className="text-xs text-foreground/70 mt-2">{data.cac.explicacao}</p>}
        </div>
      </div>
      <LtvCacBarChart ltv={data.ltv?.valor_calculado} cac={data.cac?.valor_calculado} />
      {!!data.cac?.canais?.length && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">CAC por canal</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-mono uppercase text-muted-foreground border-b border-border">
                  <th className="text-left px-2 py-1.5">Canal</th>
                  <th className="text-right px-2 py-1.5">Custo/lead</th>
                  <th className="text-right px-2 py-1.5">Conv.</th>
                  <th className="text-right px-2 py-1.5">CAC</th>
                </tr>
              </thead>
              <tbody>
                {data.cac.canais.map((c) => (
                  <tr key={c.canal} className="border-b border-border/40">
                    <td className="px-2 py-2 text-foreground">{c.canal}</td>
                    <td className="px-2 py-2 text-right text-foreground">{formatBRL(c.custo_estimado_lead)}</td>
                    <td className="px-2 py-2 text-right text-foreground">{c.taxa_conversao_pct}%</td>
                    <td className="px-2 py-2 text-right font-medium text-foreground">{formatBRL(c.cac_canal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className={`rounded-xl border-2 p-4 ${v.bg} ${v.border}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Razão LTV ÷ CAC</div>
            <div className={`text-4xl font-bold ${v.text}`}>{formatRatio(data.razao_ltv_cac)}×</div>
          </div>
          <div className="text-right">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border-2 ${v.border} ${v.text} ${v.bg}`}>{v.label}</div>
            {data.payback_meses != null && <div className="text-xs text-muted-foreground mt-2">Payback: <span className="font-medium text-foreground">{data.payback_meses} meses</span></div>}
          </div>
        </div>
        {data.interpretacao && <p className="text-sm text-foreground/80 mt-3 pt-3 border-t border-border/40">{data.interpretacao}</p>}
      </div>
      {!!data.acoes_recomendadas?.length && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1.5">Ações recomendadas</div>
          <ol className="space-y-1.5">
            {data.acoes_recomendadas.map((a, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-primary font-mono text-xs flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span>{a}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── 5b. LTV ÷ CAC EDITOR (interactive) ─────────────────────────
function computeLtvCac(ticket: number, margemPct: number, churnPct: number, cac: number) {
  const ticketSafe = isFinite(ticket) && ticket > 0 ? ticket : 0;
  const margemSafe = isFinite(margemPct) && margemPct > 0 ? margemPct / 100 : 0;
  const churnSafe = isFinite(churnPct) && churnPct > 0 ? churnPct / 100 : 0;
  const cacSafe = isFinite(cac) && cac > 0 ? cac : 0;
  const vidaMeses = churnSafe > 0 ? 1 / churnSafe : 0;
  const ltv = ticketSafe * margemSafe * vidaMeses;
  const margemMensal = ticketSafe * margemSafe;
  const payback = margemMensal > 0 && cacSafe > 0 ? cacSafe / margemMensal : 0;
  const razao = cacSafe > 0 ? ltv / cacSafe : 0;
  let veredito: "SAUDAVEL" | "AJUSTAR" | "INVIAVEL" = "AJUSTAR";
  if (razao >= 3) veredito = "SAUDAVEL";
  else if (razao < 1 && razao > 0) veredito = "INVIAVEL";
  return { ltv, payback, razao, veredito, vidaMeses };
}

export function EditableLtvCacCanvas({
  content, projectId, phaseNumber, artifactKey, canEdit, onUpdate, siblings,
}: {
  content: string;
  projectId: number;
  phaseNumber: number;
  artifactKey: string;
  canEdit: boolean;
  onUpdate?: () => void;
  siblings?: SiblingArtifact[];
}) {
  const original = parseJsonBlock<LtvCacData>(content);
  const arpuFromPricing = getArpuFromPricing(siblings);
  const [editing, setEditing] = useState(false);
  const [ticket, setTicket] = useState<number>(original?.premissas?.ticket_medio_mensal ?? 0);
  const [margem, setMargem] = useState<number>(original?.premissas?.margem_bruta_pct ?? 70);
  const [churn, setChurn] = useState<number>(original?.premissas?.churn_mensal_pct ?? 5);
  const [cac, setCac] = useState<number>(original?.cac?.valor_calculado ?? 0);
  const updateArtifact = useUpdateArtifact();
  const { toast } = useToast();

  const live = useMemo(() => computeLtvCac(ticket, margem, churn, cac), [ticket, margem, churn, cac]);

  if (!editing) {
    return (
      <div className="space-y-3">
        <LtvCacCanvas content={content} />
        {canEdit && original && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} data-testid="button-edit-ltv-cac">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mr-1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Editar premissas
            </Button>
          </div>
        )}
      </div>
    );
  }

  const vMap = {
    SAUDAVEL: { bg: "bg-green-50 dark:bg-green-950/20", border: "border-green-300 dark:border-green-900/50", text: "text-green-700 dark:text-green-400", label: "SAUDÁVEL ✓" },
    AJUSTAR: { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-300 dark:border-amber-900/50", text: "text-amber-700 dark:text-amber-400", label: "AJUSTAR ⚠" },
    INVIAVEL: { bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-300 dark:border-red-900/50", text: "text-red-700 dark:text-red-400", label: "INVIÁVEL ✕" },
  } as const;
  const v = vMap[live.veredito];

  function cancel() {
    setTicket(original?.premissas?.ticket_medio_mensal ?? 0);
    setMargem(original?.premissas?.margem_bruta_pct ?? 70);
    setChurn(original?.premissas?.churn_mensal_pct ?? 5);
    setCac(original?.cac?.valor_calculado ?? 0);
    setEditing(false);
  }

  function save() {
    const ticketC = clampNonNeg(ticket);
    const margemC = clampNonNeg(margem, 100);
    const churnC = clampNonNeg(churn, 100);
    const cacC = clampNonNeg(cac);
    const next: LtvCacData = {
      ...original,
      premissas: {
        ...original?.premissas,
        ticket_medio_mensal: ticketC,
        margem_bruta_pct: margemC,
        churn_mensal_pct: churnC,
        tempo_vida_estimado_meses: Math.round(live.vidaMeses * 10) / 10,
      },
      ltv: {
        ...original?.ltv,
        valor_calculado: Math.round(live.ltv),
        formula: `Ticket × Margem × (1 / Churn) = ${ticketC} × ${margemC}% × ${(live.vidaMeses).toFixed(1)}`,
      },
      cac: {
        ...original?.cac,
        valor_calculado: Math.round(cacC),
      },
      razao_ltv_cac: Math.round(live.razao * 10) / 10,
      payback_meses: Math.round(live.payback * 10) / 10,
      veredito: live.veredito,
    };
    const newContent = replaceJsonBlock(content, next as object);
    updateArtifact.mutate(
      { projectId, phaseNumber, artifactKey, data: { content: newContent, contentJson: null } },
      {
        onSuccess: () => {
          toast({ title: "Premissas atualizadas", description: `Nova razão LTV÷CAC: ${(Math.round(live.razao * 10) / 10).toFixed(1)}×` });
          setEditing(false);
          onUpdate?.();
        },
        onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
      }
    );
  }

  const inputCls = "w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Editor de premissas · cálculo ao vivo</div>
        <div className="text-[10px] text-muted-foreground">Não usa IA — pura matemática</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <label className="block">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="text-xs text-muted-foreground">Ticket médio/mês (R$)</div>
            {arpuFromPricing != null && arpuFromPricing > 0 && arpuFromPricing !== Math.round(ticket) && (
              <SyncChip
                label={`Pricing: ${fmtBRLmes(arpuFromPricing)}`}
                onClick={() => setTicket(arpuFromPricing)}
                testId="chip-sync-arpu-ticket"
              />
            )}
          </div>
          <input type="number" min={0} step="1" value={ticket || ""} onChange={(e) => setTicket(parseFloat(e.target.value) || 0)} className={inputCls} data-testid="input-ticket" />
        </label>
        <label className="block">
          <div className="text-xs text-muted-foreground mb-1">Margem bruta (%)</div>
          <input type="number" min={0} max={100} step="1" value={margem || ""} onChange={(e) => setMargem(parseFloat(e.target.value) || 0)} className={inputCls} data-testid="input-margem" />
        </label>
        <label className="block">
          <div className="text-xs text-muted-foreground mb-1">Churn mensal (%)</div>
          <input type="number" min={0} max={100} step="0.1" value={churn || ""} onChange={(e) => setChurn(parseFloat(e.target.value) || 0)} className={inputCls} data-testid="input-churn" />
        </label>
        <label className="block">
          <div className="text-xs text-muted-foreground mb-1">CAC (R$)</div>
          <input type="number" min={0} step="1" value={cac || ""} onChange={(e) => setCac(parseFloat(e.target.value) || 0)} className={inputCls} data-testid="input-cac" />
        </label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border/40">
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">LTV calculado</div>
          <div className="text-xl font-bold text-primary">{formatBRL(live.ltv)}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Vida média</div>
          <div className="text-xl font-bold text-foreground">{live.vidaMeses > 0 ? `${live.vidaMeses.toFixed(1)} m` : "—"}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Payback</div>
          <div className="text-xl font-bold text-foreground">{live.payback > 0 ? `${live.payback.toFixed(1)} m` : "—"}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Razão LTV÷CAC</div>
          <div className={`text-xl font-bold ${v.text}`}>{live.razao > 0 ? `${live.razao.toFixed(1)}×` : "—"}</div>
        </div>
      </div>
      <LtvCacBarChart ltv={live.ltv} cac={cac} />
      <div className={`rounded-lg border-2 px-3 py-2 ${v.bg} ${v.border} flex items-center justify-between flex-wrap gap-2`}>
        <div className={`text-sm font-bold ${v.text}`}>Veredito: {v.label}</div>
        <div className="text-xs text-muted-foreground">
          {live.razao >= 3 && "Unit economics saudáveis — pode escalar"}
          {live.razao >= 1 && live.razao < 3 && "Funciona mas margem apertada — otimizar CAC ou ticket"}
          {live.razao < 1 && live.razao > 0 && "Cada cliente gera prejuízo — não escalar antes de corrigir"}
          {live.razao === 0 && "Preencha CAC e premissas pra calcular"}
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2 border-t border-border/40">
        <Button variant="outline" size="sm" onClick={cancel} disabled={updateArtifact.isPending}>Cancelar</Button>
        <Button size="sm" onClick={save} disabled={updateArtifact.isPending || live.razao === 0} data-testid="button-save-ltv-cac">
          {updateArtifact.isPending ? "Salvando…" : "Salvar premissas"}
        </Button>
      </div>
    </div>
  );
}
