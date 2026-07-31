import { parseJsonBlock, Fallback, Attribution } from "./shared";

// ───────────────────────── 11. Métricas Pós-Lançamento (Fase 7) ─────────────────────────
type MetricasData = {
  north_star?: { nome: string; meta_semana_4?: string };
  semanas?: {
    semana: number; foco?: string;
    metricas?: Record<string, { meta?: string; como_medir?: string }>;
    acoes_se_abaixo?: string;
  }[];
  criterios_product_market_fit?: string[];
};

const AARRR_LABELS: Record<string, string> = {
  aquisicao: "Aquisição", ativacao: "Ativação", retencao: "Retenção", receita: "Receita", indicacao: "Indicação",
};

export function MetricasPosLaunchCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<MetricasData>(content);
  if (!data?.semanas?.length) return <Fallback content={content} />;
  return (
    <div className="space-y-4">
      {data.north_star && (
        <div className="rounded-xl border-2 border-accent/40 bg-gradient-to-br from-accent/10 to-transparent p-4">
          <div className="text-[10px] font-mono uppercase text-accent font-bold tracking-wider mb-1">⭐ North Star</div>
          <div className="font-serif text-lg text-foreground">{data.north_star.nome}</div>
          {data.north_star.meta_semana_4 && <div className="text-xs text-muted-foreground mt-0.5">Meta semana 4: <strong className="text-foreground">{data.north_star.meta_semana_4}</strong></div>}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wider">Semana</th>
              {Object.values(AARRR_LABELS).map((l) => (
                <th key={l} className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wider">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.semanas.map((s) => (
              <tr key={s.semana} className="border-t border-border align-top">
                <td className="px-3 py-2">
                  <div className="font-mono font-bold text-primary">S{s.semana}</div>
                  {s.foco && <div className="text-[11px] text-muted-foreground mt-0.5 max-w-[120px]">{s.foco}</div>}
                </td>
                {Object.keys(AARRR_LABELS).map((key) => {
                  const m = s.metricas?.[key];
                  const isEmpty = !m?.meta || m.meta === "—" || m.meta === "-";
                  return (
                    <td key={key} className="px-3 py-2">
                      {isEmpty ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        <div>
                          <div className="text-foreground text-xs font-medium">{m!.meta}</div>
                          {m!.como_medir && <div className="text-[10px] text-muted-foreground mt-0.5">{m!.como_medir}</div>}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.semanas.some((s) => s.acoes_se_abaixo) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.semanas.filter((s) => s.acoes_se_abaixo).map((s) => (
            <div key={s.semana} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
              <div className="font-mono text-[10px] uppercase text-amber-700 dark:text-amber-400">S{s.semana} · se abaixo</div>
              <div className="text-foreground mt-0.5">{s.acoes_se_abaixo}</div>
            </div>
          ))}
        </div>
      )}
      {!!data.criterios_product_market_fit?.length && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="text-[10px] font-mono uppercase text-primary font-bold tracking-wider mb-2">Critérios de Product-Market Fit</div>
          <ul className="space-y-1.5">
            {data.criterios_product_market_fit.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground"><span className="text-primary mt-0.5">✓</span><span>{c}</span></li>
            ))}
          </ul>
        </div>
      )}
      <Attribution>AARRR funnel (Dave McClure, 2007) + North Star Metric (Sean Ellis). Critério "muito decepcionado" (Ellis &amp; Brown, 2017).</Attribution>
    </div>
  );
}
