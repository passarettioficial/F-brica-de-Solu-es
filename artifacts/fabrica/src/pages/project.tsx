import { useMemo, useState } from "react";
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
import { useToast } from "@/hooks/use-toast";
import { PHASES } from "@/lib/constants";
import { usePlan } from "@/hooks/usePlan";
import { AppSidebar } from "@/components/app-sidebar";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const ENCOURAGEMENT: Record<number, string> = {
  0: "Tudo comeca aqui. Vamos validar sua ideia.",
  1: "Excelente! Ideia validada. Hora de definir o produto.",
  2: "Incrivel! Produto definido. Vamos especificar tecnicamente.",
  3: "Otimo progresso! Especificacao pronta. Hora de implementar.",
  4: "Quase la! Implementacao concluida. Vamos testar.",
  5: "Produto pronto e testado. Hora do grande lancamento!",
};

function PhasePipeline({ phases, currentPhase, projectId }: {
  phases: Array<{ phaseNumber: number; status: string }>;
  currentPhase: number;
  projectId: number;
}) {
  const [, setLocation] = useLocation();
  const sorted = [...phases].sort((a, b) => a.phaseNumber - b.phaseNumber);

  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto pb-2" role="list" aria-label="Pipeline de fases">
      {sorted.map((phase, i) => {
        const phaseDef = PHASES[phase.phaseNumber - 1];
        const isClickable = phase.status !== "locked";
        const isActive = phase.status === "active";
        const isCompleted = phase.status === "completed";
        const isLocked = phase.status === "locked";

        return (
          <div key={phase.phaseNumber} className="flex items-center" role="listitem">
            {i > 0 && (
              <div className={`h-0.5 w-8 md:w-14 flex-shrink-0 transition-colors duration-300 ${isCompleted || isActive ? "bg-primary" : "bg-muted"}`} />
            )}
            <button
              onClick={() => isClickable && setLocation(`/projects/${projectId}/phases/${phase.phaseNumber}`)}
              disabled={!isClickable}
              aria-label={`Fase ${phase.phaseNumber} — ${phaseDef?.name ?? ""} (${phase.status === "completed" ? "concluida" : phase.status === "active" ? "em andamento" : "bloqueada"})`}
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
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
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
  const { toast } = useToast();

  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) },
  });

  const updateProject = useUpdateProject();
  const [editingBriefing, setEditingBriefing] = useState(false);
  const [briefingDraft, setBriefingDraft] = useState("");
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"briefing" | "artifacts">("briefing");

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/50 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="h-4 bg-muted rounded w-48 animate-pulse" />
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
          <div className="h-10 bg-muted rounded w-64 animate-pulse mb-2" />
          <div className="h-4 bg-muted rounded w-40 animate-pulse" />
          <div className="bg-card border border-card-border rounded-2xl p-6 animate-pulse h-40" />
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-foreground font-medium mb-1">Projeto nao encontrado</p>
          <p className="text-muted-foreground text-sm mb-4">O projeto pode ter sido excluido ou voce nao tem acesso.</p>
          <Link href="/dashboard">
            <Button variant="outline">Voltar ao painel</Button>
          </Link>
        </div>
      </div>
    );
  }

  const phases = (project as any).phases ?? [];
  const activePhase = phases.find((p: any) => p.status === "active");
  const completedPhases = phases.filter((p: any) => p.status === "completed").length;
  const progressPct = Math.round((completedPhases / 6) * 100);
  const encouragement = ENCOURAGEMENT[completedPhases] ?? "";
  const nextPhase = useMemo(() => phases.find((p: any) => p.status !== "completed"), [phases]);
  const recentArtifacts = useMemo(() => {
    return phases.flatMap((phase: any) => (phase.artifacts ?? []).map((artifact: any) => ({
      phaseNumber: phase.phaseNumber,
      key: artifact.artifactKey,
      hasContent: !!artifact.content?.trim(),
    }))).filter((artifact: any) => artifact.hasContent).slice(-6).reverse();
  }, [phases]);

  function saveBriefing() {
    updateProject.mutate(
      { id: projectId, data: { briefing: briefingDraft } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          setEditingBriefing(false);
          toast({ title: "Briefing atualizado com sucesso!" });
        },
        onError: () => {
          toast({ title: "Erro ao salvar briefing", variant: "destructive" });
        },
      }
    );
  }

  function shareProject() {
    const shareUrl = `${window.location.origin}${basePath}/projects/${projectId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({ title: "Link copiado", description: "Compartilhe esse projeto com sua equipe." });
    }).catch(() => {
      toast({ title: "Nao foi possivel copiar", variant: "destructive" });
    });
  }

  function addCollaborator() {
    if (!collaboratorEmail.trim()) return;
    toast({
      title: "Convite preparado",
      description: `${collaboratorEmail} sera adicionado assim que a camada de colaboracao estiver ativa.`,
    });
    setCollaboratorEmail("");
  }

  return (
    <div className="app-shell">
      <AppSidebar
        projectId={projectId}
        projectName={project.name}
        phaseStatuses={(project as any).phases?.map((p: { status: string }) => ({ status: p.status })) ?? []}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="topbar">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
            <Link href="/dashboard" className="hover:text-white transition-colors">Painel</Link>
            <span>/</span>
            <span className="truncate max-w-[200px]" style={{ color: "var(--text-primary)" }}>{project.name}</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-8 py-8 max-w-5xl w-full mx-auto">
        {/* Project title + progress */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-foreground mb-1">{project.name}</h1>
          <p className="text-sm text-muted-foreground mb-4">
            Fase atual: {PHASES[project.currentPhase - 1]?.name ?? `Fase ${project.currentPhase}`}
          </p>
          {encouragement && (
            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-full px-3 py-1.5 text-xs text-primary font-medium">
              ✨ {encouragement}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{completedPhases} de 6 fases concluidas</span>
            <span className="font-semibold text-foreground">{progressPct}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="bg-primary h-2 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Pipeline */}
        <div className="bg-card border border-card-border rounded-2xl p-6 mb-8">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">Pipeline de construcao</h2>
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
              {!permissions.hasAiAdvisor && permissions.plan !== "advanced" && (
                <Link href="/pricing">
                  <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    🤖 AI Advisor — disponivel no plano Avancado →
                  </span>
                </Link>
              )}
            </div>
          )}

          {completedPhases === 6 && (
            <div className="mt-6 pt-5 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Projeto concluido com sucesso!</p>
                  <p className="text-xs text-muted-foreground">Todas as 6 fases foram concluidas. Seu produto esta pronto para o mercado.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6" role="tablist">
          {(["briefing", "artifacts", "collaboration"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              role="tab"
              aria-selected={activeTab === tab}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${tab}`}
            >
              {tab === "briefing" ? "Briefing" : tab === "artifacts" ? "Artefatos" : "Colaboração"}
            </button>
          ))}
        </div>

        {activeTab === "briefing" && (
          <div className="bg-card border border-card-border rounded-xl p-6" role="tabpanel">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg">Briefing do projeto</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Este e o contexto base usado pela IA em todas as fases.</p>
              </div>
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
                  aria-label="Briefing do projeto"
                />
                <p className="text-xs text-muted-foreground">Dica: briefings mais detalhados produzem artefatos significativamente melhores.</p>
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
          <div className="space-y-4" role="tabpanel">
            {phases.map((phase: any) => {
              const phaseDef = PHASES[phase.phaseNumber - 1];
              const isAccessible = phase.status !== "locked";
              const isPhaseComplete = phase.status === "completed";
              return (
                <div key={phase.phaseNumber} className={`bg-card border rounded-xl p-5 transition-all ${
                  isAccessible ? "border-card-border hover:border-primary/20" : "border-muted opacity-60"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                        isPhaseComplete ? "bg-primary text-white" :
                        phase.status === "active" ? "bg-primary/10 text-primary border border-primary/30" :
                        "bg-muted text-muted-foreground"
                      }`} aria-hidden="true">
                        {isPhaseComplete ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l2.5 2.5L10 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : phase.phaseNumber}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{phaseDef?.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {isPhaseComplete ? "• Concluida" : phase.status === "active" ? "• Em andamento" : "• Bloqueada"}
                        </span>
                        {phaseDef?.tagline && (
                          <span className="text-xs text-muted-foreground ml-2">· {phaseDef.tagline}</span>
                        )}
                      </div>
                    </div>
                    {isAccessible && (
                      <Link href={`/projects/${projectId}/phases/${phase.phaseNumber}`}>
                        <Button variant="outline" size="sm" className="text-xs" data-testid={`button-go-phase-${phase.phaseNumber}`}>
                          {phase.status === "active" ? "Continuar fase →" : "Ver artefatos"}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "collaboration" && (
          <div className="space-y-4" role="tabpanel">
            <div className="bg-card border border-card-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-lg">Compartilhar projeto</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Copie um link para revisao e contexto compartilhado.</p>
                </div>
                <Button variant="outline" size="sm" onClick={shareProject}>Copiar link</Button>
              </div>
              <div className="flex gap-2">
                <input
                  value={collaboratorEmail}
                  onChange={(e) => setCollaboratorEmail(e.target.value)}
                  placeholder="email@empresa.com"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <Button onClick={addCollaborator} className="bg-primary hover:bg-primary/90 text-white">Convidar</Button>
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-xl p-6">
              <h3 className="font-serif text-lg mb-4">Ultimas entregas</h3>
              <div className="space-y-3">
                {recentArtifacts.length > 0 ? recentArtifacts.map((item: any, index: number) => (
                  <div key={`${item.phaseNumber}-${item.key}-${index}`} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.key}</div>
                      <div className="text-xs text-muted-foreground">Fase {item.phaseNumber}</div>
                    </div>
                    <span className="text-xs text-primary">pronto</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">Nenhum artefato gerado ainda.</p>
                )}
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-xl p-6">
              <h3 className="font-serif text-lg mb-4">Próximos passos</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fase atual</span>
                  <span className="font-medium text-foreground">{PHASES[project.currentPhase - 1]?.name ?? `Fase ${project.currentPhase}`}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Próxima fase</span>
                  <span className="font-medium text-foreground">{nextPhase ? PHASES[nextPhase.phaseNumber - 1]?.name : "Projeto concluído"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium text-foreground">{progressPct}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
