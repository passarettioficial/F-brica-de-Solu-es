import { useMemo } from "react";
import { useLocation } from "wouter";
import { PHASES } from "@/lib/constants";

type ProjectSummary = {
  projectId: number;
  name: string;
  currentPhase: number;
  completedPhases: number;
  phaseStatuses?: string[];
};

type Props = { projects: ProjectSummary[] };

const PHASE_SHORT = ["IDEIA", "PRD", "LGPD", "SPEC", "BUILD", "QA", "DEPLOY"];

export function JourneyWidget({ projects }: Props) {
  const [, setLocation] = useLocation();

  const stats = useMemo(() => {
    const total = projects.length * 7;
    const completed = projects.reduce((s, p) => s + p.completedPhases, 0);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;

    // Distribution: how many projects currently sit at each phase (currentPhase as proxy)
    const distribution = Array.from({ length: 7 }, () => 0);
    for (const p of projects) {
      const isComplete = p.completedPhases === 7;
      if (isComplete) continue;
      const idx = Math.max(0, Math.min(6, p.currentPhase - 1));
      distribution[idx] += 1;
    }
    const frontierIdx = distribution.indexOf(Math.max(...distribution));
    const frontierCount = distribution[frontierIdx];
    const frontierLabel = PHASES[frontierIdx]?.name ?? `Fase ${frontierIdx + 1}`;

    const fullyDone = projects.filter((p) => p.completedPhases === 7).length;
    const phasesRemaining = total - completed;

    return { total, completed, pct, frontierLabel, frontierCount, fullyDone, phasesRemaining };
  }, [projects]);

  if (projects.length === 0) return null;

  const maxRows = 6;
  const displayProjects = projects.slice(0, maxRows);
  const overflow = projects.length - displayProjects.length;

  function cellStyle(status: string | undefined, isCurrent: boolean): string {
    if (status === "completed") return "bg-primary border-primary";
    if (status === "active" || isCurrent) return "bg-primary/25 border-primary/50";
    return "bg-muted/40 border-border";
  }

  return (
    <div className="glass-card rounded-2xl p-5 relative overflow-hidden">
      <div className="flex items-start justify-between mb-4">
        <div>
          <p className="text-[11px] font-mono uppercase tracking-[0.18em] text-muted-foreground mb-0.5">SUA JORNADA</p>
          <h3 className="font-serif text-lg text-foreground">Progresso cross-projeto</h3>
        </div>
        <div className="text-right">
          <div className="font-serif text-2xl text-primary leading-none stat-shimmer">{stats.pct}%</div>
          <div className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-1">
            {stats.completed} de {stats.total} fases
          </div>
        </div>
      </div>

      {/* Aggregate progress bar */}
      <div className="mb-4">
        <div className="h-1.5 bg-muted/50 rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-700"
            style={{ width: `${stats.pct}%` }}
            data-testid="journey-progress-fill"
          />
        </div>
      </div>

      {/* Phase column headers */}
      <div className="grid grid-cols-[minmax(0,1fr)_repeat(7,minmax(0,1.4rem))_minmax(0,2.5rem)] gap-1.5 items-center mb-1.5">
        <div />
        {PHASE_SHORT.map((label, i) => (
          <div key={i} className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider text-center" title={PHASES[i]?.name}>
            {label.slice(0, 4)}
          </div>
        ))}
        <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-wider text-right">%</div>
      </div>

      {/* Heatmap rows */}
      <div className="space-y-1">
        {displayProjects.map((p) => {
          const pct = Math.round((p.completedPhases / 7) * 100);
          const statuses = p.phaseStatuses ?? Array.from({ length: 7 }, (_, i) => (i < p.completedPhases ? "completed" : i === p.currentPhase - 1 ? "active" : "locked"));
          return (
            <button
              key={p.projectId}
              type="button"
              onClick={() => setLocation(`/projects/${p.projectId}/phases/${p.currentPhase}`)}
              className="w-full grid grid-cols-[minmax(0,1fr)_repeat(7,minmax(0,1.4rem))_minmax(0,2.5rem)] gap-1.5 items-center group hover:bg-primary/[0.03] rounded-md px-1 -mx-1 py-0.5 transition-colors text-left"
              data-testid={`journey-row-${p.projectId}`}
            >
              <span className="text-xs text-foreground truncate group-hover:text-primary transition-colors" title={p.name}>
                {p.name}
              </span>
              {Array.from({ length: 7 }, (_, i) => {
                const status = statuses[i];
                const isCurrent = i === p.currentPhase - 1 && status !== "completed";
                return (
                  <div
                    key={i}
                    className={`h-3.5 rounded-sm border transition-colors ${cellStyle(status, isCurrent)}`}
                    title={`${PHASES[i]?.name}: ${status === "completed" ? "concluída" : status === "active" || isCurrent ? "em andamento" : "bloqueada"}`}
                  />
                );
              })}
              <span className="text-[10px] font-mono text-muted-foreground text-right tabular-nums">{pct}%</span>
            </button>
          );
        })}
      </div>

      {overflow > 0 && (
        <p className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider mt-2 text-center">
          + {overflow} {overflow === 1 ? "projeto a mais" : "projetos a mais"}
        </p>
      )}

      {/* Footer insights */}
      <div className="mt-4 pt-3 border-t border-card-border flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {stats.frontierCount > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary/60" />
            <span className="text-[11px] text-muted-foreground">
              Próxima fronteira: <span className="font-semibold text-foreground">{stats.frontierLabel}</span>
              <span className="ml-1 text-muted-foreground/80">({stats.frontierCount} {stats.frontierCount === 1 ? "projeto" : "projetos"})</span>
            </span>
          </div>
        )}
        {stats.fullyDone > 0 && (
          <div className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary" />
            <span className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">{stats.fullyDone}</span> {stats.fullyDone === 1 ? "completo" : "completos"}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 ml-auto">
          <span className="text-[11px] text-muted-foreground">
            <span className="font-semibold text-foreground">{stats.phasesRemaining}</span> fase{stats.phasesRemaining !== 1 ? "s" : ""} restante{stats.phasesRemaining !== 1 ? "s" : ""}
          </span>
        </div>
      </div>
    </div>
  );
}
