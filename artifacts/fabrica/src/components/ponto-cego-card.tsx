import { useCountUp } from "@/hooks/use-count-up";

export type PontoCegoData = {
  score: number;
  dimensoes: {
    tamanho_mercado: number;
    urgencia_problema: number;
    modelo_receita: number;
    diferencial_competitivo: number;
    viabilidade_execucao: number;
  };
  alertas: string[];
  acelerador: string;
};

const DIMENSION_LABELS: Record<string, string> = {
  tamanho_mercado: "Tamanho de mercado",
  urgencia_problema: "Urgência do problema",
  modelo_receita: "Modelo de receita",
  diferencial_competitivo: "Diferencial competitivo",
  viabilidade_execucao: "Viabilidade de execução",
};

function weakestDimension(dimensoes: PontoCegoData["dimensoes"] | undefined | null) {
  if (!dimensoes || typeof dimensoes !== "object") return null;
  const entries = (Object.entries(dimensoes) as Array<[keyof PontoCegoData["dimensoes"], number]>).filter(
    ([, value]) => typeof value === "number" && Number.isFinite(value),
  );
  if (!entries.length) return null;
  return entries.reduce((min, cur) => (cur[1] < min[1] ? cur : min), entries[0]);
}

export function PontoCegoCard({
  loading,
  data,
  onDismiss,
}: {
  loading: boolean;
  data: PontoCegoData | null;
  onDismiss?: () => void;
}) {
  const weakest = data ? weakestDimension(data.dimensoes) : null;
  const weakestValue = weakest?.[1] ?? 0;
  const animatedWeakest = useCountUp(weakest ? weakestValue : null);

  if (!loading && !data) return null;

  return (
    <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 mb-4" data-testid="ponto-cego-card">
      <div className="flex items-start justify-between gap-3">
        <div className="text-[10px] font-mono uppercase tracking-wider text-accent">Ponto cego da sua ideia</div>
        {onDismiss && (
          <button onClick={onDismiss} className="text-muted-foreground hover:text-foreground text-xs flex-shrink-0" aria-label="Fechar" data-testid="button-dismiss-ponto-cego">
            ✕
          </button>
        )}
      </div>

      {loading && !data && (
        <p className="text-xs text-muted-foreground mt-2">Analisando o maior risco do seu briefing…</p>
      )}

      {data && weakest && (
        <div className="mt-2 space-y-3">
          <div>
            <div className="flex items-baseline justify-between gap-2">
              <span className="text-sm font-medium text-foreground">{DIMENSION_LABELS[weakest[0]] ?? weakest[0]}</span>
              <span className="text-sm font-bold tabular-nums text-accent">{animatedWeakest ?? 0}/100</span>
            </div>
            <div className="h-1.5 mt-1.5 rounded-full bg-muted overflow-hidden">
              <div className="h-full bg-accent transition-all" style={{ width: `${animatedWeakest ?? 0}%` }} />
            </div>
          </div>

          {data.alertas?.[0] && (
            <p className="text-sm text-foreground/90 leading-relaxed">{data.alertas[0]}</p>
          )}

          {data.acelerador && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-0.5">Ação que mais destrava isso</div>
              <p className="text-sm text-foreground">{data.acelerador}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
