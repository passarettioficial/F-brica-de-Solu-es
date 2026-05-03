import { useState, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import {
  useGetDashboard,
  useCreateProject,
  getGetDashboardQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { PHASES } from "@/lib/constants";
import { usePlan } from "@/hooks/usePlan";
import { NotificationBell } from "@/components/notification-bell";
import { OnboardingTour } from "@/components/onboarding-tour";
import { ActivationChecklist } from "@/components/activation-checklist";
import { ThemeToggle } from "@/components/theme-toggle";
import { UxStrategyCard } from "@/components/ux-strategy-card";

const PHASE_STATUS_LABELS: Record<string, string> = {
  completed: "Concluida",
  active: "Em andamento",
  locked: "Bloqueada",
};

const EXAMPLE_TEMPLATES = [
  {
    id: "saas",
    label: "SaaS B2B",
    icon: "💼",
    name: "Plataforma de gestao para PMEs",
    briefing:
      "Quero criar uma plataforma SaaS para pequenas e medias empresas gerenciarem seus projetos e clientes. O problema: PMEs perdem contratos por falta de acompanhamento. Publico-alvo: donos de empresas de 5-50 funcionarios. Diferencial: simplicidade e preco acessivel (R$99/mes). Modelo: freemium com limite de projetos.",
  },
  {
    id: "app",
    label: "App de Consumo",
    icon: "📱",
    name: "App de saude e habitos",
    briefing:
      "Quero criar um app mobile para ajudar pessoas a criarem habitos saudaveis de forma gamificada. O problema: as pessoas desistem das metas em menos de 30 dias. Publico-alvo: adultos 25-40 anos que querem ser mais produtivos. Diferencial: social accountability — voce so avanca se um amigo confirmar. Modelo: assinatura anual R$199.",
  },
  {
    id: "marketplace",
    label: "Marketplace",
    icon: "🛒",
    name: "Marketplace de servicos criativos",
    briefing:
      "Quero criar um marketplace conectando freelancers criativos (designers, redatores, video-makers) a empresas que precisam de contedo sob demanda. Problema: empresas perdem semanas buscando fornecedores confiaveis. Publico-alvo: startups e agencias de marketing. Diferencial: garantia de entrega em 48h. Modelo: comissao de 15% por transacao.",
  },
];

function PhaseBadge({ status, phaseNumber }: { status: string; phaseNumber: number }) {
  const phaseName = PHASES[phaseNumber - 1]?.name ?? "";
  const colors: Record<string, string> = {
    completed: "bg-[#b8461e]/10 text-[#b8461e] border border-[#b8461e]/20",
    active: "bg-blue-50 text-blue-700 border border-blue-200",
    locked: "bg-muted text-muted-foreground border border-border",
  };
  return (
    <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] ?? colors.locked}`}>
      Fase {phaseNumber} — {phaseName}
    </span>
  );
}

function ProgressBar({ completed, total = 6 }: { completed: number; total?: number }) {
  const pct = Math.round((completed / total) * 100);
  return (
    <div className="w-full bg-muted rounded-full h-1.5 mt-3" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% concluido`}>
      <div
        className="bg-primary h-1.5 rounded-full transition-all duration-500"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

function ResumeCard({ project }: { project: { projectId: number; name: string; currentPhase: number; completedPhases: number; phaseStatuses?: string[] } }) {
  const phaseName = PHASES[project.currentPhase - 1]?.name ?? `Fase ${project.currentPhase}`;
  const pct = Math.round((project.completedPhases / 6) * 100);
  const motivations = [
    "Voce esta indo muito bem — continue!",
    "Quase la! Falta pouco para concluir esta fase.",
    "Cada fase concluida e um produto mais solido.",
    "Sua ideia esta ganhando forma. Nao pare agora!",
  ];
  const motivation = motivations[project.completedPhases % motivations.length];

  return (
    <Link href={`/projects/${project.projectId}/phases/${project.currentPhase}`}>
      <div className="glass-card rounded-2xl p-5 hover:shadow-md transition-all cursor-pointer group mb-8">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Continuar de onde parou</span>
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
            </div>
            <h3 className="font-serif text-lg text-foreground group-hover:text-primary transition-colors truncate mb-0.5">{project.name}</h3>
            <p className="text-xs text-muted-foreground">{motivation}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-2xl font-bold font-serif text-primary">{pct}%</div>
            <div className="text-xs text-muted-foreground">concluido</div>
          </div>
        </div>
        <div className="mt-4">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Fase {project.currentPhase} — {phaseName}</span>
            <span>{project.completedPhases}/6 fases</span>
          </div>
          <ProgressBar completed={project.completedPhases} />
        </div>
        <div className="mt-4 flex items-center gap-2">
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white text-xs">
            Entrar na Fase {project.currentPhase} →
          </Button>
        </div>
      </div>
    </Link>
  );
}

function AiLimitBanner({ used, limit }: { used: number; limit: number }) {
  const pct = Math.round((used / limit) * 100);
  if (pct < 70) return null;
  const isExhausted = used >= limit;
  return (
    <div className={`border rounded-xl p-4 mb-6 flex items-start gap-3 ${isExhausted ? "bg-red-50 border-red-200" : "bg-amber-50 border-amber-200"}`} role="alert">
      <span className="text-lg flex-shrink-0">{isExhausted ? "⚠️" : "⚡"}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isExhausted ? "text-red-800" : "text-amber-800"}`}>
          {isExhausted ? `Limite de IA atingido — ${used}/${limit} geracoes usadas hoje` : `Voce usou ${pct}% das suas geracoes de IA hoje (${used}/${limit})`}
        </p>
        <p className={`text-xs mt-0.5 ${isExhausted ? "text-red-600" : "text-amber-600"}`}>
          {isExhausted ? "Os creditos se renovam a meia-noite. Faca upgrade para nao perder o ritmo." : "Faca upgrade para mais geracoes e nunca perder o ritmo."}
        </p>
      </div>
      <Link href="/pricing">
        <Button size="sm" variant="outline" className={`text-xs flex-shrink-0 ${isExhausted ? "border-red-300 text-red-700 hover:bg-red-100" : "border-amber-300 text-amber-700 hover:bg-amber-100"}`}>
          Ver planos
        </Button>
      </Link>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M8 6h16M8 6v20M8 6l4-2 4 2 4-2 4 2v20M8 26h16M12 12h8M12 17h8M12 22h5" stroke="#b8461e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 className="text-2xl font-serif text-foreground mb-3">Sua linha de montagem aguarda</h2>
      <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
        Cada grande produto comeca com uma ideia e um processo rigoroso. Crie seu primeiro projeto e deixe a IA guiar voce pelas 6 fases de construcao — da ideia ao lancamento.
      </p>
      <div className="grid grid-cols-3 gap-4 mb-8 max-w-lg w-full text-left">
        {[
          { step: "1", label: "Descreva sua ideia", desc: "Leva menos de 2 minutos" },
          { step: "2", label: "IA gera os artefatos", desc: "PRD, personas, arquitetura..." },
          { step: "3", label: "Valide e avance", desc: "Fase a fase ate o lancamento" },
        ].map((item, i) => (
          <div key={i} className="glass-card rounded-xl p-4">
            <div className="text-xs font-semibold text-primary mb-1">Passo {item.step}</div>
            <div className="text-sm font-medium text-foreground mb-0.5">{item.label}</div>
            <div className="text-xs text-muted-foreground">{item.desc}</div>
          </div>
        ))}
      </div>
      <Button onClick={onNew} className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 text-base" data-testid="button-new-project-empty">
        Criar meu primeiro projeto
      </Button>
      <p className="text-xs text-muted-foreground mt-3">Gratuito para comecar. Sem cartao de credito.</p>
    </div>
  );
}

function MetricCard({ label, value, sub, color = "default" }: { label: string; value: string | number; sub?: string; color?: "default" | "primary" | "blue" | "green" }) {
  const colors = {
    default: "bg-card border-card-border",
    primary: "bg-primary/5 border-primary/20",
    blue: "bg-blue-50 border-blue-100",
    green: "bg-green-50 border-green-100",
  };
  const textColors = {
    default: "text-foreground",
    primary: "text-primary",
    blue: "text-blue-700",
    green: "text-green-700",
  };
  return (
    <div className={`border rounded-xl p-4 ${colors[color]}`}>
      <div className={`text-2xl font-bold font-serif mb-0.5 ${textColors[color]}`}>{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {sub && <div className="text-xs text-muted-foreground/70 mt-0.5">{sub}</div>}
    </div>
  );
}

const SHORTCUTS = [
  { label: "Assinatura", href: "/billing", icon: "💳", desc: "Planos e faturamento" },
  { label: "AI Advisor", href: null, icon: "🤖", desc: "Consultor de IA", planRequired: "advanced" },
  { label: "Atendimento", href: "/atendimento", icon: "💬", desc: "WhatsApp e suporte" },
  { label: "Configuracoes", href: "/settings", icon: "⚙️", desc: "Conta e preferencias" },
];

export function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [briefing, setBriefing] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const { permissions } = usePlan();

  const { data: dashboard, isLoading } = useGetDashboard();
  const createProject = useCreateProject();

  const handleTourComplete = useCallback(() => {
    setTimeout(() => setShowNew(true), 400);
  }, []);

  function applyTemplate(template: typeof EXAMPLE_TEMPLATES[0]) {
    setName(template.name);
    setBriefing(template.briefing);
    setSelectedTemplate(template.id);
  }

  function handleCreate() {
    if (!name.trim() || !briefing.trim()) return;
    createProject.mutate(
      { data: { name: name.trim(), briefing: briefing.trim() } },
      {
        onSuccess: (project) => {
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          setShowNew(false);
          setName("");
          setBriefing("");
          setSelectedTemplate(null);
          toast({ title: "Projeto criado com sucesso!", description: `"${project.name}" esta pronto. Vamos comecar a Fase 1.` });
          setLocation(`/projects/${project.id}`);
        },
        onError: () => {
          toast({ title: "Erro ao criar projeto", description: "Tente novamente em alguns instantes.", variant: "destructive" });
        },
      }
    );
  }

  const projects = dashboard?.projects ?? [];
  const completedProjects = projects.filter(p => p.completedPhases === 6).length;
  const activeProjects = projects.filter(p => p.completedPhases < 6).length;
  const aiUsagePct = dashboard ? Math.round((dashboard.dailyAiUsage / dashboard.dailyAiLimit) * 100) : 0;
  const mostRecentActive = projects.filter(p => p.completedPhases < 6).sort((a, b) => (b.projectId ?? 0) - (a.projectId ?? 0))[0];
  const totalCompletedPhases = projects.reduce((s, p) => s + p.completedPhases, 0);
  const phase1Completed = totalCompletedPhases >= 1;
  const phase3Completed = totalCompletedPhases >= 3;
  const allPhasesCompleted = projects.some(p => p.completedPhases === 6);
  const showChecklist = !isLoading && totalCompletedPhases < 3;

  return (
    <div className="min-h-screen bg-background">
      <OnboardingTour onComplete={handleTourComplete} />
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo.svg`} alt="Logo" className="w-7 h-7 rounded" />
            <span className="font-serif text-lg font-semibold text-foreground">Fabrica de Solucoes</span>
          </Link>
          <nav className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">{permissions.planName}</Link>
            <Link href="/billing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Assinatura</Link>
            {permissions.isAdmin && (
              <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium" data-testid="link-admin">Admin</Link>
            )}
            <NotificationBell />
            <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-settings">
              {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "Conta"}
            </Link>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-serif text-foreground mb-1">{user?.firstName ? `Ola, ${user.firstName}!` : "Bem-vindo!"}</h1>
            <p className="text-muted-foreground text-sm">
              {projects.length === 0 ? "Nenhum projeto ainda — comece criando o seu." : `${activeProjects} projeto${activeProjects !== 1 ? "s" : ""} em andamento · ${completedProjects} concluido${completedProjects !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Button onClick={() => setShowNew(true)} className="bg-primary hover:bg-primary/90 text-white" data-testid="button-new-project">+ Iniciar nova construcao</Button>
        </div>
        {!isLoading && dashboard && <AiLimitBanner used={dashboard.dailyAiUsage} limit={dashboard.dailyAiLimit} />}
        {showChecklist && <ActivationChecklist hasProjects={projects.length > 0} hasAiUsage={(dashboard?.dailyAiUsage ?? 0) > 0} phase1Completed={phase1Completed} phase3Completed={phase3Completed} allPhasesCompleted={allPhasesCompleted} onNewProject={() => setShowNew(true)} />}
        <UxStrategyCard />
        {!isLoading && mostRecentActive && projects.length > 0 && <ResumeCard project={mostRecentActive} />}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <MetricCard label="Projetos ativos" value={activeProjects} color="default" />
          <MetricCard label="Fases concluidas" value={projects.reduce((s, p) => s + p.completedPhases, 0)} color="primary" />
          <MetricCard label="IA hoje" value={`${dashboard?.dailyAiUsage ?? 0}/${dashboard?.dailyAiLimit ?? 2}`} sub={`${aiUsagePct}% usado`} color={aiUsagePct >= 90 ? "primary" : "blue"} />
          <MetricCard label="Plano" value={permissions.planName} sub="Ver planos →" color="green" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {SHORTCUTS.map((s) => {
            const locked = s.planRequired && !permissions.hasAiAdvisor;
            const href = locked ? "/pricing" : (s.href ?? "/pricing");
            return (
              <Link key={s.label} href={href}>
                <div className="glass-card rounded-xl p-4 cursor-pointer group" role="button" aria-label={s.label}>
                  <div className="text-xl mb-2">{s.icon}</div>
                  <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{s.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{locked ? "Plano Avancado" : s.desc}</div>
                </div>
              </Link>
            );
          })}
        </div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-foreground">Seus projetos</h2>
          {projects.length > 0 && <button onClick={() => setShowNew(true)} className="text-xs text-primary hover:text-primary/80 transition-colors font-medium">+ Novo projeto</button>}
        </div>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => <div key={i} className="bg-card border border-card-border rounded-xl p-5 animate-pulse h-40" />)}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState onNew={() => setShowNew(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => {
              const currentPhaseStatus = project.phaseStatuses?.[project.currentPhase - 1] ?? "active";
              return (
                <Link key={project.projectId} href={`/projects/${project.projectId}`} data-testid={`card-project-${project.projectId}`}>
                  <div className="bg-card border border-card-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group h-full">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">{project.name}</h3>
                    </div>
                    <div className="mb-4"><PhaseBadge status={currentPhaseStatus} phaseNumber={project.currentPhase} /></div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{project.completedPhases} de 6 fases concluidas</span>
                      <span>{Math.round((project.completedPhases / 6) * 100)}%</span>
                    </div>
                    <ProgressBar completed={project.completedPhases} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>
      <Dialog open={showNew} onOpenChange={(open) => { setShowNew(open); if (!open) { setSelectedTemplate(null); } }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Nova construcao</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label className="text-xs font-medium text-muted-foreground mb-2 block">Comecar com um exemplo (opcional)</Label>
              <div className="grid grid-cols-3 gap-2">
                {EXAMPLE_TEMPLATES.map((t) => (
                  <button key={t.id} onClick={() => applyTemplate(t)} className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all text-sm ${selectedTemplate === t.id ? "border-primary bg-primary/5 text-primary" : "border-card-border bg-card hover:border-primary/30 text-foreground"}`}>
                    <span className="text-xl">{t.icon}</span>
                    <span className="text-xs font-medium leading-tight">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="proj-name" className="text-sm font-medium">Nome do projeto</Label>
              <Input id="proj-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: App de delivery para pets" className="mt-1.5" data-testid="input-project-name" aria-required="true" />
            </div>
            <div>
              <Label htmlFor="proj-briefing" className="text-sm font-medium">Briefing inicial <span className="text-xs font-normal text-muted-foreground ml-2">— Quanto mais detalhe, melhor a IA</span></Label>
              <Textarea id="proj-briefing" value={briefing} onChange={e => setBriefing(e.target.value)} placeholder="Descreva sua ideia, o problema que resolve, o publico-alvo e diferenciais. Quanto mais detalhe, melhores os artefatos..." className="mt-1.5 min-h-[140px]" data-testid="textarea-project-briefing" aria-required="true" />
              {briefing.length > 0 && <p className="text-xs text-muted-foreground mt-1">{briefing.length} caracteres — {briefing.length < 200 ? "adicione mais contexto para melhores resultados" : "otimo nivel de detalhe!"}</p>}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => { setShowNew(false); setSelectedTemplate(null); }}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!name.trim() || !briefing.trim() || createProject.isPending} className="bg-primary hover:bg-primary/90 text-white" data-testid="button-create-project">{createProject.isPending ? "Criando..." : "Criar projeto"}</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
