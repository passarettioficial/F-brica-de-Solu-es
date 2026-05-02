import { useState } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProject,
  useUpdateProject,
  getGetProjectQueryKey,
  getGetDashboardQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PHASES } from "@/lib/constants";
import { usePlan } from "@/hooks/usePlan";

function PhasePipeline({ phases, currentPhase, projectId }: {
  phases: Array<{ phaseNumber: number; status: string }>;
  currentPhase: number;
  projectId: number;
}) {
  const [, setLocation] = useLocation();
  const sorted = [...phases].sort((a, b) => a.phaseNumber - b.phaseNumber);

  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto pb-2">
      {sorted.map((phase, i) => {
        const phaseDef = PHASES[phase.phaseNumber - 1];
        const isClickable = phase.status !== "locked";
        const isActive = phase.status === "active";
        const isCompleted = phase.status === "completed";
        const isLocked = phase.status === "locked";

        return (
          <div key={phase.phaseNumber} className="flex items-center">
            {i > 0 && (
              <div className={`h-0.5 w-8 md:w-14 flex-shrink-0 ${isCompleted || isActive ? "bg-primary" : "bg-muted"}`} />
            )}
            <button
              onClick={() => isClickable && setLocation(`/projects/${projectId}/phases/${phase.phaseNumber}`)}
              disabled={!isClickable}
              className={`flex flex-col items-center group transition-all ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}`}
              data-testid={`phase-circle-${phase.phaseNumber}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all
                  ${isCompleted ? "bg-primary border-primary text-white" : ""}
                  ${isActive ? "bg-white border-primary text-primary shadow-sm shadow-primary/20" : ""}
                  ${isLocked ? "bg-muted border-muted-foreground/20 text-muted-foreground" : ""}
                  ${isClickable ? "group-hover:scale-110" : ""}
                `}
              >
                {isCompleted ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : phase.phaseNumber}
              </div>
              <span className={`text-xs mt-1.5 font-medium whitespace-nowrap ${isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                {phaseDef?.name}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

export function ProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id ?? "0", 10);
  const queryClient = useQueryClient();
  const { permissions } = usePlan();

  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) },
  });

  const updateProject = useUpdateProject();
  const [editingBriefing, setEditingBriefing] = useState(false);
  const [briefingDraft, setBriefingDraft] = useState("");
  const [activeTab, setActiveTab] = useState<"briefing" | "artifacts">("briefing");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando projeto...</div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground">Projeto não encontrado.</p>
          <Link href="/dashboard" className="text-primary text-sm mt-2 inline-block">Voltar ao painel</Link>
        </div>
      </div>
    );
  }

  const phases = (project as any).phases ?? [];
  const activePhase = phases.find((p: any) => p.status === "active");

  function saveBriefing() {
    updateProject.mutate(
      { id: projectId, data: { briefing: briefingDraft } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          setEditingBriefing(false);
        },
      }
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center gap-3">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
            Painel
          </Link>
          <span className="text-muted-foreground text-sm">/</span>
          <span className="text-foreground text-sm font-medium truncate">{project.name}</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10">
        {/* Project title */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-foreground mb-1">{project.name}</h1>
          <p className="text-sm text-muted-foreground">
            Fase atual: {PHASES[project.currentPhase - 1]?.name ?? `Fase ${project.currentPhase}`}
          </p>
        </div>

        {/* Pipeline */}
        <div className="bg-card border border-card-border rounded-2xl p-6 mb-8">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">Pipeline de construção</h2>
          {phases.length > 0 && (
            <PhasePipeline phases={phases} currentPhase={project.currentPhase} projectId={projectId} />
          )}
          {activePhase && (
            <div className="mt-6 pt-5 border-t border-border flex items-center gap-3 flex-wrap">
              <Link href={`/projects/${projectId}/phases/${activePhase.phaseNumber}`}>
                <Button className="bg-primary hover:bg-primary/90 text-white" data-testid="button-go-active-phase">
                  Entrar na Fase {activePhase.phaseNumber} — {PHASES[activePhase.phaseNumber - 1]?.name}
                </Button>
              </Link>
              {permissions.hasAiAdvisor && (
                <Link href={`/projects/${projectId}/advisor`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <span>🤖</span> AI Advisor
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6">
          {(["briefing", "artifacts"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-sm font-medium capitalize transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${tab}`}
            >
              {tab === "briefing" ? "Briefing" : "Artefatos"}
            </button>
          ))}
        </div>

        {activeTab === "briefing" && (
          <div className="bg-card border border-card-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-serif text-lg">Briefing do projeto</h3>
              {!editingBriefing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditingBriefing(true); setBriefingDraft(project.briefing); }}
                  data-testid="button-edit-briefing"
                >
                  Editar
                </Button>
              )}
            </div>
            {editingBriefing ? (
              <div className="space-y-3">
                <Textarea
                  value={briefingDraft}
                  onChange={(e) => setBriefingDraft(e.target.value)}
                  className="min-h-[200px] text-sm"
                  data-testid="textarea-briefing"
                />
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setEditingBriefing(false)}>Cancelar</Button>
                  <Button size="sm" onClick={saveBriefing} disabled={updateProject.isPending} className="bg-primary hover:bg-primary/90 text-white" data-testid="button-save-briefing">
                    {updateProject.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{project.briefing || "Nenhum briefing adicionado ainda."}</p>
            )}
          </div>
        )}

        {activeTab === "artifacts" && (
          <div className="space-y-4">
            {phases.map((phase: any) => {
              const phaseDef = PHASES[phase.phaseNumber - 1];
              const isAccessible = phase.status !== "locked";
              return (
                <div key={phase.phaseNumber} className={`bg-card border rounded-xl p-5 ${isAccessible ? "border-card-border" : "border-muted opacity-60"}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold ${
                        phase.status === "completed" ? "bg-primary text-white" :
                        phase.status === "active" ? "bg-primary/10 text-primary border border-primary/30" :
                        "bg-muted text-muted-foreground"
                      }`}>
                        {phase.phaseNumber}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{phaseDef?.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {phase.status === "completed" ? "• Concluída" : phase.status === "active" ? "• Em andamento" : "• Bloqueada"}
                        </span>
                      </div>
                    </div>
                    {isAccessible && (
                      <Link href={`/projects/${projectId}/phases/${phase.phaseNumber}`}>
                        <Button variant="outline" size="sm" className="text-xs" data-testid={`button-go-phase-${phase.phaseNumber}`}>
                          Ver fase
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
