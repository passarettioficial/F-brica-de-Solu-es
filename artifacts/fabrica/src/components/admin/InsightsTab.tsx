import { useEffect, useState } from "react";
import { api } from "./shared";
import { StatCard } from "./ui";

interface PhaseRow { phase: number; name: string; count?: number; pct?: number; completed?: number; rate?: number; activeCount?: number; avgDaysStuck?: number; maxDaysStuck?: number }

interface Insights {
  totalProjects: number;
  funnelByPhase: Array<PhaseRow>;
  completionByPhase: Array<PhaseRow>;
  stuckByPhase: Array<PhaseRow>;
  topDeliverables: Array<{ key: string; count: number }>;
  activeUsers: { dau: number; wau: number; mau: number };
  conversionFunnel: Array<{ step: string; count: number; pct: number }>;
  bottleneck: { phase: number; name: string; activeCount: number; avgDaysStuck: number; impact: number } | null;
}

function PhaseBar({ pct, color, label }: { pct: number; color: string; label?: string }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
        <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color }} />
      </div>
      {label && <span className="text-xs font-mono text-muted-foreground tabular-nums w-14 text-right">{label}</span>}
    </div>
  );
}

export function InsightsTab() {
  const [data, setData] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    api("/admin/insights")
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((d: Insights) => setData(d))
      .catch((e) => setErr(e instanceof Error ? e.message : "Erro"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted-foreground text-sm py-8">Carregando insights...</div>;
  if (err || !data) return <div className="text-destructive text-sm py-8">Erro ao carregar insights ({err})</div>;

  return (
    <div className="space-y-6">
      {/* Bottleneck callout */}
      {data.bottleneck && (
        <div className="bg-accent/5 border border-accent/30 rounded-xl p-5 flex items-start gap-4">
          <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent font-mono font-bold text-sm">
            !
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-mono uppercase tracking-wider text-accent mb-1">Gargalo principal</div>
            <div className="font-serif text-lg text-foreground leading-snug">
              Fase {data.bottleneck.phase} — {data.bottleneck.name}
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              <span className="font-semibold text-foreground">{data.bottleneck.activeCount}</span> usuários parados há em média{" "}
              <span className="font-semibold text-foreground">{data.bottleneck.avgDaysStuck} dias</span>. Considere reforçar o onboarding ou simplificar essa etapa.
            </div>
          </div>
        </div>
      )}

      {/* Active users */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="DAU" value={data.activeUsers.dau} sub="ativos hoje" />
        <StatCard label="WAU" value={data.activeUsers.wau} sub="últimos 7 dias" />
        <StatCard label="MAU" value={data.activeUsers.mau} sub="últimos 30 dias" />
        <StatCard
          label="Stickiness"
          value={data.activeUsers.mau > 0 ? `${((data.activeUsers.dau / data.activeUsers.mau) * 100).toFixed(0)}%` : "—"}
          sub="DAU / MAU"
        />
      </div>

      {/* Funnel: where users are now */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <div className="flex items-baseline justify-between mb-1">
          <h3 className="font-medium text-sm text-foreground">Onde os projetos estão agora</h3>
          <span className="text-xs font-mono text-muted-foreground">{data.totalProjects} projetos ativos</span>
        </div>
        <p className="text-xs text-muted-foreground mb-4">Distribuição pela fase atual</p>
        <div className="space-y-2.5">
          {data.funnelByPhase.map((p) => (
            <div key={p.phase} className="grid grid-cols-[1fr_2fr_auto] gap-3 items-center">
              <div className="text-xs">
                <span className="font-mono font-bold text-primary mr-1.5">F{p.phase}</span>
                <span className="text-foreground">{p.name}</span>
              </div>
              <PhaseBar pct={p.pct ?? 0} color="hsl(var(--primary))" label={`${(p.pct ?? 0).toFixed(0)}%`} />
              <span className="text-sm font-mono tabular-nums text-foreground w-10 text-right">{p.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Completion rate per phase */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <h3 className="font-medium text-sm text-foreground mb-1">Taxa de conclusão por fase</h3>
        <p className="text-xs text-muted-foreground mb-4">% de projetos ativos que concluíram cada fase</p>
        <div className="space-y-2.5">
          {data.completionByPhase.map((p) => (
            <div key={p.phase} className="grid grid-cols-[1fr_2fr_auto] gap-3 items-center">
              <div className="text-xs">
                <span className="font-mono font-bold text-primary mr-1.5">F{p.phase}</span>
                <span className="text-foreground">{p.name}</span>
              </div>
              <PhaseBar pct={p.rate ?? 0} color="hsl(var(--primary))" label={`${(p.rate ?? 0).toFixed(0)}%`} />
              <span className="text-sm font-mono tabular-nums text-foreground w-10 text-right">{p.completed}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Stuck */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <h3 className="font-medium text-sm text-foreground mb-1">Tempo parado em fase ativa</h3>
        <p className="text-xs text-muted-foreground mb-4">Média de dias desde a última atividade · projetos com fase ativa</p>
        <div className="space-y-2.5">
          {(() => {
            const maxAvg = Math.max(...data.stuckByPhase.map((p) => p.avgDaysStuck ?? 0), 1);
            return data.stuckByPhase.map((p) => {
              const v = p.avgDaysStuck ?? 0;
              const pct = (v / maxAvg) * 100;
              const isHot = v >= 7;
              return (
                <div key={p.phase} className="grid grid-cols-[1fr_2fr_auto_auto] gap-3 items-center">
                  <div className="text-xs">
                    <span className="font-mono font-bold text-primary mr-1.5">F{p.phase}</span>
                    <span className="text-foreground">{p.name}</span>
                  </div>
                  <PhaseBar pct={pct} color={isHot ? "#FF8C42" : "hsl(var(--primary))"} />
                  <span className={`text-sm font-mono tabular-nums w-14 text-right ${isHot ? "text-accent font-semibold" : "text-foreground"}`}>
                    {v}d
                  </span>
                  <span className="text-xs font-mono text-muted-foreground w-10 text-right">{p.activeCount} ⌁</span>
                </div>
              );
            });
          })()}
        </div>
        <div className="mt-3 pt-3 border-t border-card-border text-[11px] text-muted-foreground flex items-center gap-3">
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-primary" /> normal</span>
          <span className="inline-flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-accent" /> ≥ 7 dias parado (atenção)</span>
        </div>
      </div>

      {/* Conversion funnel */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <h3 className="font-medium text-sm text-foreground mb-1">Funil de conversão</h3>
        <p className="text-xs text-muted-foreground mb-4">Do cadastro ao deploy validado</p>
        <div className="space-y-3">
          {data.conversionFunnel.map((s, i) => {
            const prev = i > 0 ? data.conversionFunnel[i - 1] : null;
            const dropoff = prev && prev.count > 0 ? ((prev.count - s.count) / prev.count) * 100 : 0;
            return (
              <div key={s.step}>
                <div className="flex items-baseline justify-between mb-1.5">
                  <div className="text-xs">
                    <span className="font-mono text-muted-foreground mr-2">{String(i + 1).padStart(2, "0")}</span>
                    <span className="text-foreground">{s.step}</span>
                  </div>
                  <div className="text-xs font-mono tabular-nums">
                    <span className="font-semibold text-foreground">{s.count}</span>
                    <span className="text-muted-foreground"> · {s.pct.toFixed(1)}%</span>
                    {prev && dropoff > 0 && (
                      <span className="text-accent ml-2">−{dropoff.toFixed(0)}%</span>
                    )}
                  </div>
                </div>
                <PhaseBar pct={s.pct} color="hsl(var(--primary))" />
              </div>
            );
          })}
        </div>
      </div>

      {/* Top deliverables */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <h3 className="font-medium text-sm text-foreground mb-1">Entregáveis mais gerados</h3>
        <p className="text-xs text-muted-foreground mb-4">Top 12 artefatos por volume</p>
        <div className="space-y-2">
          {data.topDeliverables.length === 0 ? (
            <div className="text-xs text-muted-foreground">Nenhum dado ainda</div>
          ) : (() => {
            const maxC = Math.max(...data.topDeliverables.map((d) => d.count), 1);
            return data.topDeliverables.map((d) => (
              <div key={d.key} className="grid grid-cols-[1fr_2fr_auto] gap-3 items-center">
                <span className="text-xs font-mono text-foreground truncate" title={d.key}>{d.key}</span>
                <PhaseBar pct={(d.count / maxC) * 100} color="hsl(var(--primary))" />
                <span className="text-sm font-mono tabular-nums text-foreground w-10 text-right">{d.count}</span>
              </div>
            ));
          })()}
        </div>
      </div>
    </div>
  );
}
