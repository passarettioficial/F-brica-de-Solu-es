import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useUpdateArtifact } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { parseJsonBlock, Fallback, Attribution, replaceJsonBlock } from "./shared";

// ───────────────────────── 5c. SCORE POTENCIAL EDITOR (interactive) ─────────────────────────
type ScorePotencialData = {
  desejabilidade?: number; viabilidade?: number; factibilidade?: number; escalabilidade?: number; timing?: number;
  media?: number; pontuacao_media?: number;
  justificativas?: Record<string, string>;
  recomendacao?: string;
  proximos_passos?: string[];
};

const SCORE_DIMS: Array<{ key: keyof ScorePotencialData & string; label: string; hint: string }> = [
  { key: "desejabilidade", label: "Desejabilidade", hint: "Cliente quer essa solução?" },
  { key: "viabilidade",    label: "Viabilidade",    hint: "Faz sentido econômico?" },
  { key: "factibilidade",  label: "Factibilidade",  hint: "Conseguimos construir?" },
  { key: "escalabilidade", label: "Escalabilidade", hint: "Cresce sem custo linear?" },
  { key: "timing",         label: "Timing",         hint: "Momento certo de mercado?" },
];

function clamp1to5(n: number): number {
  if (!isFinite(n)) return 1;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function recommendFromAvg(avg: number): "AVANCAR" | "PIVOTAR" | "ABANDONAR" {
  if (avg >= 4) return "AVANCAR";
  if (avg >= 3) return "PIVOTAR";
  return "ABANDONAR";
}

export function EditableScorePotencialCanvas({
  content, projectId, phaseNumber, artifactKey, canEdit, onUpdate,
}: {
  content: string;
  projectId: number;
  phaseNumber: number;
  artifactKey: string;
  canEdit: boolean;
  onUpdate?: () => void;
}) {
  const original = parseJsonBlock<ScorePotencialData>(content);
  const [editing, setEditing] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const d of SCORE_DIMS) {
      const raw = typeof original?.[d.key] === "number" ? (original[d.key] as number) : 3;
      init[d.key] = clamp1to5(raw);
    }
    return init;
  });
  const updateArtifact = useUpdateArtifact();
  const { toast } = useToast();

  const avg = useMemo(() => {
    const vals = SCORE_DIMS.map((d) => scores[d.key] ?? 0).filter((v) => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [scores]);
  const live = useMemo(() => ({ avg, recomendacao: recommendFromAvg(avg) }), [avg]);

  if (!editing) {
    return (
      <div className="space-y-3">
        <InlineScoreView content={content} />
        {canEdit && original?.desejabilidade != null && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} data-testid="button-edit-score-potencial">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mr-1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Editar scores
            </Button>
          </div>
        )}
      </div>
    );
  }

  const recColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
    AVANCAR:   { bg: "bg-green-50 dark:bg-green-950/20", border: "border-green-300 dark:border-green-900/50", text: "text-green-700 dark:text-green-400", label: "AVANÇAR ✓" },
    PIVOTAR:   { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-300 dark:border-amber-900/50", text: "text-amber-700 dark:text-amber-400", label: "PIVOTAR ⚠" },
    ABANDONAR: { bg: "bg-red-50 dark:bg-red-950/20",     border: "border-red-300 dark:border-red-900/50",     text: "text-red-700 dark:text-red-400",     label: "ABANDONAR ✕" },
  };
  const rec = recColors[live.recomendacao];

  function cancel() {
    const reset: Record<string, number> = {};
    for (const d of SCORE_DIMS) reset[d.key] = typeof original?.[d.key] === "number" ? original[d.key] as number : 3;
    setScores(reset);
    setEditing(false);
  }

  function save() {
    const clamped: Record<string, number> = {};
    for (const d of SCORE_DIMS) clamped[d.key] = clamp1to5(scores[d.key] ?? 3);
    const clampedVals = SCORE_DIMS.map((d) => clamped[d.key]);
    const clampedAvg = clampedVals.reduce((a, b) => a + b, 0) / clampedVals.length;
    const avgRounded = Math.round(clampedAvg * 10) / 10;
    const clampedRec = recommendFromAvg(clampedAvg);
    const next: ScorePotencialData = {
      ...original,
      ...clamped,
      media: avgRounded,
      pontuacao_media: avgRounded,
      recomendacao: clampedRec,
    };
    const newContent = replaceJsonBlock(content, next as object);
    updateArtifact.mutate(
      { projectId, phaseNumber, artifactKey, data: { content: newContent, contentJson: null } },
      {
        onSuccess: () => {
          toast({ title: "Scores atualizados", description: `Nova média: ${avgRounded.toFixed(1)}/5 → ${clampedRec}` });
          setEditing(false);
          onUpdate?.();
        },
        onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="space-y-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Editor de scores · média ao vivo</div>
        <div className="text-[10px] text-muted-foreground">Escala 1 (fraco) — 5 (excelente)</div>
      </div>
      <div className="space-y-3">
        {SCORE_DIMS.map((d) => {
          const val = scores[d.key] ?? 3;
          return (
            <div key={d.key} className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{d.label}</div>
                  <div className="text-[10px] text-muted-foreground">{d.hint}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScores((s) => ({ ...s, [d.key]: n }))}
                      data-testid={`button-score-${d.key}-${n}`}
                      className={`w-8 h-8 rounded-md border text-sm font-bold transition-colors ${
                        val === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                      }`}
                      aria-label={`${d.label} = ${n}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/40">
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Média ao vivo</div>
          <div className={`text-3xl font-bold ${rec.text}`}>{live.avg.toFixed(1)}<span className="text-base text-muted-foreground">/5</span></div>
        </div>
        <div className={`rounded-lg border-2 px-3 py-2 ${rec.bg} ${rec.border} flex flex-col justify-center`}>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Recomendação derivada</div>
          <div className={`text-sm font-bold ${rec.text}`}>{rec.label}</div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {live.avg >= 4 && "Score forte — momentum pra avançar pra Fase 2 com confiança."}
        {live.avg >= 3 && live.avg < 4 && "Score médio — vale revisitar a dimensão mais fraca antes de avançar."}
        {live.avg < 3 && live.avg > 0 && "Score baixo — considere pivotar a hipótese central antes de gastar mais tempo aqui."}
      </div>
      <div className="flex gap-2 justify-end pt-2 border-t border-border/40">
        <Button variant="outline" size="sm" onClick={cancel} disabled={updateArtifact.isPending}>Cancelar</Button>
        <Button size="sm" onClick={save} disabled={updateArtifact.isPending} data-testid="button-save-score-potencial">
          {updateArtifact.isPending ? "Salvando…" : "Salvar scores"}
        </Button>
      </div>
    </div>
  );
}

// Read-only view of Score Potencial (extracted from phase.tsx so the editor can compose it)
export function InlineScoreView({ content }: { content: string }) {
  const data = parseJsonBlock<ScorePotencialData & Record<string, unknown>>(content);
  if (!data?.desejabilidade) return <Fallback content={content} />;
  const rec = data.recomendacao;
  const recColors: Record<string, string> = {
    AVANCAR: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
    PIVOTAR: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    ABANDONAR: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        {SCORE_DIMS.map((d) => (
          <div key={d.key} className="text-center">
            <div className="text-2xl font-bold text-primary">{(data as any)[d.key] ?? "—"}</div>
            <div className="text-[10px] text-muted-foreground capitalize mt-0.5">{d.key}</div>
            {data.justificativas?.[d.key] && <div className="text-[10px] text-foreground mt-1 leading-snug">{data.justificativas[d.key]}</div>}
          </div>
        ))}
      </div>
      {rec && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${recColors[rec] ?? "bg-muted text-muted-foreground border-border"}`}>
          Recomendação: {rec}
        </div>
      )}
      {Array.isArray(data.proximos_passos) && data.proximos_passos.length > 0 && (
        <div>
          <div className="text-xs font-medium mb-1">Próximos passos</div>
          <ul className="space-y-0.5">
            {data.proximos_passos.map((step: string, i: number) => (
              <li key={i} className="text-xs text-foreground flex gap-2">
                <span className="text-primary flex-shrink-0">{i + 1}.</span><span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── 6. Matriz Competitiva 2×2 ─────────────────────────
type MatrizData = {
  eixo_x?: { label?: string; min_label?: string; max_label?: string };
  eixo_y?: { label?: string; min_label?: string; max_label?: string };
  concorrentes?: Array<{ nome: string; x: number; y: number; observacao?: string }>;
  nossa_posicao?: { x: number; y: number; justificativa?: string };
  quadrante_alvo?: string;
  vacuo_identificado?: string;
};

export function MatrizCompetitivaCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<MatrizData>(content);
  if (!data?.eixo_x || !data?.eixo_y || !data?.concorrentes?.length) return <Fallback content={content} />;
  const clamp = (n: number) => Math.max(0, Math.min(5, n));
  const pct = (n: number) => `${(clamp(n) / 5) * 100}%`;
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-[1fr_300px] gap-4 items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Eixo Y:</span>
            <span className="text-sm font-medium text-foreground">{data.eixo_y.label}</span>
          </div>
          <div className="relative w-full aspect-square max-w-md mx-auto border-2 border-border rounded-lg bg-gradient-to-tr from-muted/30 to-card">
            {/* Quadrant lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-border" />
            </div>
            {/* Axis labels */}
            <div className="absolute -bottom-6 left-0 text-[10px] font-mono uppercase text-muted-foreground">{data.eixo_x.min_label}</div>
            <div className="absolute -bottom-6 right-0 text-[10px] font-mono uppercase text-muted-foreground">{data.eixo_x.max_label}</div>
            <div className="absolute -left-2 -translate-x-full top-0 text-[10px] font-mono uppercase text-muted-foreground whitespace-nowrap">{data.eixo_y.max_label}</div>
            <div className="absolute -left-2 -translate-x-full bottom-0 text-[10px] font-mono uppercase text-muted-foreground whitespace-nowrap">{data.eixo_y.min_label}</div>
            {/* Competitors */}
            {data.concorrentes.map((c, i) => (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: pct(c.x), bottom: pct(c.y) }}
              >
                <div className="w-3 h-3 rounded-full bg-muted-foreground border-2 border-card shadow" />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[11px] text-foreground bg-card/90 backdrop-blur px-1.5 py-0.5 rounded border border-border whitespace-nowrap">
                  {c.nome}
                </div>
              </div>
            ))}
            {/* Our position */}
            {data.nossa_posicao && (
              <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pct(data.nossa_posicao.x), bottom: pct(data.nossa_posicao.y) }}>
                <div className="w-5 h-5 rounded-full bg-primary border-2 border-card shadow-lg animate-pulse" />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/40 whitespace-nowrap">
                  Nós
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-center mt-8 text-xs text-muted-foreground">
            <span className="font-medium">Eixo X: {data.eixo_x.label}</span>
          </div>
        </div>
        <div className="space-y-3">
          {!!data.concorrentes.length && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Concorrentes</div>
              <ul className="space-y-1.5">
                {data.concorrentes.map((c, i) => (
                  <li key={i} className="text-xs">
                    <div className="font-medium text-foreground">{c.nome}</div>
                    {c.observacao && <div className="text-muted-foreground">{c.observacao}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      {(data.nossa_posicao?.justificativa || data.quadrante_alvo || data.vacuo_identificado) && (
        <div className="grid md:grid-cols-2 gap-3">
          {data.nossa_posicao?.justificativa && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">Nossa posição</div>
              <p className="text-sm text-foreground">{data.nossa_posicao.justificativa}</p>
            </div>
          )}
          {data.vacuo_identificado && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Vácuo identificado</div>
              <p className="text-sm text-foreground">{data.vacuo_identificado}</p>
            </div>
          )}
        </div>
      )}
      <Attribution>Matriz de posicionamento competitivo — conceito clássico (Porter, anos 80). Escolha de eixos e estrutura próprias.</Attribution>
    </div>
  );
}
