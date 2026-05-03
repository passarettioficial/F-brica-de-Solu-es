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

const EXAMPLE_TEMPLATES = [
  { id: "saas", label: "SaaS B2B", icon: "💼", name: "Plataforma de gestão para PMEs", briefing: "Quero criar uma plataforma SaaS para pequenas e médias empresas gerenciarem projetos, clientes e receitas. Problema: PMEs perdem contratos por falta de acompanhamento. Público-alvo: donos de empresas de 5-50 funcionários. Diferencial: simplicidade e preço acessível (R$99/mês). Modelo: freemium com limite de projetos." },
  { id: "app", label: "App de Consumo", icon: "📱", name: "App de saúde e hábitos", briefing: "Quero criar um app mobile para ajudar pessoas a criarem hábitos saudáveis de forma gamificada. Problema: as pessoas desistem das metas em menos de 30 dias. Público-alvo: adultos 25-40 anos que querem ser mais produtivos. Diferencial: social accountability — você só avança se um amigo confirmar. Modelo: assinatura anual R$199." },
  { id: "marketplace", label: "Marketplace", icon: "🛒", name: "Marketplace de serviços criativos", briefing: "Quero criar um marketplace conectando freelancers criativos (designers, redatores, video-makers) a empresas que precisam de conteúdo sob demanda. Problema: empresas perdem semanas buscando fornecedores confiáveis. Público-alvo: startups e agências de marketing. Diferencial: garantia de entrega em 48h. Modelo: comissão de 15% por transação." },
];

function PhaseBadge({ status, phaseNumber }: { status: string; phaseNumber: number }) {
  const phaseName = PHASES[phaseNumber - 1]?.name ?? "";
  const colors: Record<string, string> = {
    completed: "bg-primary/10 text-primary border border-primary/20",
    active: "bg-secondary/70 text-primary border border-primary/15 dark:bg-primary/15 dark:text-primary dark:border-primary/25",
    locked: "bg-muted text-muted-foreground border border-border",
  };
  return <span className={`inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full ${colors[status] ?? colors.locked}`}>Fase {phaseNumber} — {phaseName}</span>;
}

function ProgressBar({ completed, total = 6 }: { completed: number; total?: number }) {
  const pct = Math.round((completed / total) * 100);
  return <div className="w-full bg-muted rounded-full h-1 mt-3" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}><div className="bg-primary h-1 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} /></div>;
}

function ResumeCard({ project }: { project: { projectId: number; name: string; currentPhase: number; completedPhases: number } }) {
  const phaseName = PHASES[project.currentPhase - 1]?.name ?? `Fase ${project.currentPhase}`;
  const pct = Math.round((project.completedPhases / 6) * 100);
  const motivations = ["Continue de onde parou — seu produto esta ganhando forma.", "Cada artefato concluido e um produto mais solido.", "Quase la! Falta pouco para concluir esta fase.", "Nao pare agora — voce esta no caminho certo."];
  const motivation = motivations[project.completedPhases % motivations.length];
  return (
    <Link href={`/projects/${project.projectId}/phases/${project.currentPhase}`}>
      <div className="glass-card rounded-2xl p-6 cursor-pointer group mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none"><div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-primary/20" /></div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2"><span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse flex-shrink-0" /><span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">Continuar de onde parou</span></div>
            <h3 className="font-serif text-xl text-foreground group-hover:text-primary transition-colors truncate mb-1">{project.name}</h3>
            <p className="text-xs text-muted-foreground">{motivation}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-3xl font-bold font-serif text-primary">{pct}%</div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">concluido</div>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider"><span>Fase {project.currentPhase} — {phaseName}</span><span>{project.completedPhases}/6</span></div>
          <ProgressBar completed={project.completedPhases} />
        </div>
        <div className="mt-5"><Button size="sm" className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-all group-hover:-translate-y-0.5 duration-200">Entrar na Fase {project.currentPhase} →</Button></div>
      </div>
    </Link>
  );
}

function AiLimitBanner({ used, limit }: { used: number; limit: number }) {
  const pct = Math.round((used / limit) * 100);
  if (pct < 70) return null;
  const isExhausted = used >= limit;
  return (
    <div className={`border rounded-2xl p-4 mb-6 flex items-start gap-3 ${isExhausted ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-900" : "bg-secondary/70 border-primary/15 dark:bg-primary/10 dark:border-primary/20"}`} role="alert">
      <span className="text-base flex-shrink-0">{isExhausted ? "⚠️" : "⚡"}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isExhausted ? "text-red-800 dark:text-red-300" : "text-primary"}`}>{isExhausted ? `Limite de IA atingido — ${used}/${limit} geracoes usadas hoje` : `${pct}% das suas geracoes de IA usadas hoje (${used}/${limit})`}</p>
        <p className={`text-xs mt-0.5 ${isExhausted ? "text-red-600 dark:text-red-400" : "text-primary/70"}`}>{isExhausted ? "Creditos renovam a meia-noite. Faca upgrade para nao parar." : "Faca upgrade para mais geracoes e manter o ritmo."}</p>
      </div>
      <Link href="/pricing"><Button size="sm" variant="outline" className={`text-xs flex-shrink-0 ${isExhausted ? "border-red-300 text-red-700 hover:bg-red-50" : "border-primary/20 text-primary hover:bg-primary/5"}`}>Ver planos</Button></Link>
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
          <svg width="36" height="36" viewBox="0 0 36 36" fill="none" className="text-primary"><rect x="6" y="4" width="24" height="28" rx="2" stroke="currentColor" strokeWidth="1.5"/><path d="M11 12h14M11 17h14M11 22h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/><path d="M27 27l3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t border-r border-primary/30" />
        <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b border-l border-primary/20" />
      </div>
      <h2 className="text-2xl font-serif text-foreground mb-3">Sua linha de montagem aguarda</h2>
      <p className="text-muted-foreground max-w-md mb-10 text-sm leading-relaxed">Cada grande produto comeca com uma ideia e um processo rigoroso. Crie seu primeiro projeto e deixe a IA guiar voce pelas 6 fases — da ideia ao lancamento.</p>
      <div className="grid grid-cols-3 gap-4 mb-10 max-w-lg w-full">
        {[{ step: "01", label: "Descreva sua ideia", desc: "Leva menos de 2 minutos" }, { step: "02", label: "IA gera os artefatos", desc: "PRD, personas, arquitetura..." }, { step: "03", label: "Avance fase a fase", desc: "Ate o lancamento" }].map((item, i) => <div key={i} className="glass-card rounded-xl p-4 text-left"><div className="text-xs font-mono text-primary/60 mb-2">{item.step}</div><div className="text-sm font-semibold text-foreground mb-0.5 leading-snug">{item.label}</div><div className="text-xs text-muted-foreground">{item.desc}</div></div>)}
      </div>
      <Button onClick={onNew} className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5 text-sm font-semibold" data-testid="button-new-project-empty">Criar meu primeiro projeto →</Button>
      <p className="text-xs font-mono text-muted-foreground/60 mt-4 uppercase tracking-wider">Sem cartao de credito</p>
    </div>
  );
}

type MetricVariant = "default" | "accent" | "dim" | "link" | "danger";

const METRIC_VALUE_COLOR: Record<MetricVariant, string> = {
  default: "text-primary",
  accent:  "text-accent",
  dim:     "text-primary",
  link:    "text-primary",
  danger:  "text-destructive",
};

const METRIC_SUB_COLOR: Record<MetricVariant, string> = {
  default: "text-muted-foreground",
  accent:  "text-muted-foreground",
  dim:     "text-muted-foreground",
  link:    "text-primary hover:text-primary/80 transition-colors",
  danger:  "text-destructive/70",
};

function MetricCard({ label, value, sub, variant = "default" }: { label: string; value: string | number; sub?: string; variant?: MetricVariant }) {
  return (
    <div className="surface-panel rounded-2xl p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm hover:border-primary/20">
      <div className={`text-2xl font-bold font-serif mb-0.5 ${METRIC_VALUE_COLOR[variant]}`}>{value}</div>
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      {sub && <div className={`text-xs mt-0.5 font-mono ${METRIC_SUB_COLOR[variant]}`}>{sub}</div>}
    </div>
  );
}

const SHORTCUTS = [
  { label: "Assinatura", href: "/billing", icon: "💳", desc: "Planos e faturamento" },
  { label: "Brandbook", href: "/brandbook", icon: "🎨", desc: "Guia visual da marca" },
  { label: "AI Advisor", href: null, icon: "🤖", desc: "Consultor de produto", planRequired: true },
  { label: "Atendimento", href: "/atendimento", icon: "💬", desc: "Suporte e WhatsApp" },
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

  const handleTourComplete = useCallback(() => { setTimeout(() => setShowNew(true), 400); }, []);
  function applyTemplate(template: typeof EXAMPLE_TEMPLATES[0]) { setName(template.name); setBriefing(template.briefing); setSelectedTemplate(template.id); }
  function handleCreate() {
    if (!name.trim() || !briefing.trim()) return;
    createProject.mutate({ data: { name: name.trim(), briefing: briefing.trim() } }, {
      onSuccess: (project) => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        setShowNew(false); setName(""); setBriefing(""); setSelectedTemplate(null);
        toast({ title: "Projeto criado!", description: `"${project.name}" esta pronto. Comecemos a Fase 1.` });
        setLocation(`/projects/${project.id}`);
      },
      onError: () => { toast({ title: "Erro ao criar projeto", description: "Tente novamente em alguns instantes.", variant: "destructive" }); },
    });
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
      <header className="border-b border-border/60 bg-background/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <img src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo.svg`} alt="Logo" className="w-7 h-7 rounded-xl bg-card ring-1 ring-border/60" />
            <span className="font-serif text-base font-semibold text-foreground tracking-tight">Fabrica</span>
          </Link>
          <nav className="flex items-center gap-1">
            <ThemeToggle />
            <Link href="/pricing" className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full hover:bg-muted/60 transition-all">{permissions.planName}</Link>
            <Link href="/billing" className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full hover:bg-muted/60 transition-all">Assinatura</Link>
            {permissions.isAdmin && <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full hover:bg-muted/60 transition-all font-medium" data-testid="link-admin">Admin</Link>}
            <NotificationBell />
            <Link href="/settings" className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-full hover:bg-muted/60 transition-all" data-testid="link-settings">{user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "Conta"}</Link>
          </nav>
        </div>
      </header>
      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="flex items-start justify-between mb-8">
          <div>
            <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mb-1.5">PAINEL DE CONTROLE</p>
            <h1 className="text-3xl font-serif text-foreground">{user?.firstName ? `Ola, ${user.firstName}.` : "Bem-vindo."}</h1>
            <p className="text-muted-foreground text-sm mt-1">{projects.length === 0 ? "Nenhum projeto ainda — comece criando o seu." : `${activeProjects} projeto${activeProjects !== 1 ? "s" : ""} em andamento · ${completedProjects !== 1 ? completedProjects + " concluídos" : "1 concluído"}`}</p>
          </div>
          <Button onClick={() => setShowNew(true)} className="bg-primary hover:bg-primary/90 text-white font-semibold rounded-full" data-testid="button-new-project">+ Nova construção</Button>
        </div>
        <div className="grid lg:grid-cols-[1fr_320px] gap-6">
          <section className="space-y-6">
            <div className="surface-panel rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h2 className="font-serif text-lg text-foreground">Primeiros passos</h2>
                  <p className="text-sm text-muted-foreground">{Math.min(6, Math.max(1, projects.length || 1))} de 6 etapas concluídas</p>
                </div>
                <span className="text-xs text-muted-foreground">Ocultar</span>
              </div>
              <div className="w-full bg-muted rounded-full h-1.5 mb-5">
                <div className="bg-primary h-1.5 rounded-full" style={{ width: `${Math.max(8, Math.min(100, (projects.length ? (projects.reduce((s, p) => s + p.completedPhases, 0) / 6) * 100 : 16)))}%` }} />
              </div>
              <div className="space-y-2">
                {[
                  { n: 1, title: "Criar sua conta", desc: "Voce ja está aqui.", done: true },
                  { n: 2, title: "Criar o primeiro projeto", desc: "Descreva sua ideia e deixe a IA trabalhar.", done: projects.length > 0, cta: "Criar projeto" },
                  { n: 3, title: "Usar um template", desc: "Comece por um modelo mais forte e mais rápido.", done: selectedTemplate !== null },
                  { n: 4, title: "Gerar artefatos com IA", desc: "Clique em Gerar com IA na Fase 1 do seu projeto.", done: (dashboard?.dailyAiUsage ?? 0) > 0 },
                  { n: 5, title: "Concluir a Fase 1 — Ideação", desc: "Valide sua ideia com Lean Canvas, SWOT e Score de Potencial.", done: phase1Completed },
                  { n: 6, title: "Chegar na metade — Fase 3", desc: "Produto definido com PRD, personas e roadmap.", done: phase3Completed },
                  { n: 7, title: "Concluir as 6 fases", desc: "Da ideia ao lançamento — produto pronto.", done: allPhasesCompleted },
                ].map((step) => (
                  <div key={step.n} className={`flex items-center gap-3 p-3 rounded-xl border ${step.done ? "bg-secondary/35 border-border/70" : "bg-background border-border/70"}`}>
                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold border ${step.done ? "bg-primary border-primary text-white" : "border-border text-muted-foreground"}`}>{step.done ? "✓" : step.n}</div>
                    <div className="flex-1 min-w-0">
                      <div className={`text-sm font-medium ${step.done ? "text-muted-foreground line-through" : "text-foreground"}`}>{step.title}</div>
                      {!step.done && <div className="text-xs text-muted-foreground">{step.desc}</div>}
                    </div>
                    {!step.done && step.cta && <Button size="sm" className="rounded-full bg-primary text-white">Criar projeto</Button>}
                  </div>
                ))}
              </div>
            </div>
            {!isLoading && dashboard && <AiLimitBanner used={dashboard.dailyAiUsage} limit={dashboard.dailyAiLimit} />}
            {showChecklist && <ActivationChecklist hasProjects={projects.length > 0} hasAiUsage={(dashboard?.dailyAiUsage ?? 0) > 0} hasTemplates={selectedTemplate !== null} hasSharedProject={projects.length > 0} phase1Completed={phase1Completed} phase3Completed={phase3Completed} allPhasesCompleted={allPhasesCompleted} onNewProject={() => setShowNew(true)} />}
            {!isLoading && mostRecentActive && projects.length > 0 && <ResumeCard project={mostRecentActive} />}
            <div className="flex items-start justify-between mb-8">
              <div />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              <MetricCard label="Projetos ativos" value={activeProjects} variant="default" />
              <MetricCard label="Fases concluídas" value={projects.reduce((s, p) => s + p.completedPhases, 0)} variant="accent" />
              <MetricCard label="IA hoje" value={`${dashboard?.dailyAiUsage ?? 0}/${dashboard?.dailyAiLimit ?? 2}`} sub={`${aiUsagePct}% usado`} variant="dim" />
              <MetricCard label="Plano" value={permissions.planName} sub="ver planos →" variant="link" />
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-10">
              {SHORTCUTS.map((s) => {
                const locked = s.planRequired && !permissions.hasAiAdvisor;
                const href = locked ? "/pricing" : (s.href ?? "/pricing");
                return <Link key={s.label} href={href}><div className="glass-card rounded-2xl p-4 cursor-pointer group h-full" role="button" aria-label={s.label}><div className="text-xl mb-2.5">{s.icon}</div><div className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">{s.label}</div><div className="text-xs text-muted-foreground mt-0.5">{locked ? "Plano Avancado" : s.desc}</div></div></Link>;
              })}
            </div>
            <div className="flex items-center justify-between mb-5"><div><p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.18em] mb-0.5">PROJETOS</p><h2 className="font-serif text-xl text-foreground">Suas construções</h2></div>{projects.length > 0 && <button onClick={() => setShowNew(true)} className="text-xs font-mono text-primary hover:text-primary/80 transition-colors uppercase tracking-wider">+ Novo</button>}</div>
            {isLoading ? <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{[1, 2, 3].map((i) => <div key={i} className="glass-card rounded-2xl p-5 animate-pulse h-44" />)}</div> : projects.length === 0 ? <EmptyState onNew={() => setShowNew(true)} /> : <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">{projects.map((project) => { const currentPhaseStatus = project.phaseStatuses?.[project.currentPhase - 1] ?? "active"; return <Link key={project.projectId} href={`/projects/${project.projectId}`} data-testid={`card-project-${project.projectId}`}><div className="glass-card rounded-2xl p-5 cursor-pointer group h-full relative overflow-hidden"><div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-primary/15 group-hover:border-primary/30 transition-colors" /><div className="flex items-start justify-between mb-3"><h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-snug pr-4">{project.name}</h3></div><div className="mb-4"><PhaseBadge status={currentPhaseStatus} phaseNumber={project.currentPhase} /></div><div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-1 uppercase tracking-wider"><span>{project.completedPhases}/6 fases</span><span>{Math.round((project.completedPhases / 6) * 100)}%</span></div><ProgressBar completed={project.completedPhases} /></div></Link>; })}</div>}
          </section>
          <aside className="space-y-4 lg:pt-[72px]">
            <div className="surface-panel rounded-[1.75rem] p-5">
              <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mb-2">Atalho visual</p>
              <h3 className="font-serif text-2xl text-foreground">Interface mais limpa</h3>
              <p className="text-sm text-muted-foreground mt-2 leading-relaxed">Blocos altos, bordas suaves e leitura mais direta para parecer um produto SaaS moderno.</p>
            </div>
            <div className="surface-panel rounded-[1.75rem] p-5">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-3">Status</p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Projetos</span><span className="font-medium text-foreground">{projects.length}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">Fases concluidas</span><span className="font-medium text-foreground">{projects.reduce((s, p) => s + p.completedPhases, 0)}</span></div>
                <div className="flex items-center justify-between"><span className="text-muted-foreground">IA hoje</span><span className="font-medium text-foreground">{dashboard?.dailyAiUsage ?? 0}/{dashboard?.dailyAiLimit ?? 2}</span></div>
              </div>
            </div>
          </aside>
        </div>
      </main>
      <Dialog open={showNew} onOpenChange={(open) => { setShowNew(open); if (!open) setSelectedTemplate(null); }}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader><DialogTitle className="font-serif text-xl">Nova construcao</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div><Label className="text-xs font-mono text-muted-foreground mb-2 block uppercase tracking-wider">Template (opcional)</Label><div className="grid grid-cols-3 gap-2">{EXAMPLE_TEMPLATES.map((t) => <button key={t.id} onClick={() => applyTemplate(t)} className={`flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all ${selectedTemplate === t.id ? "border-primary bg-primary/5 text-primary" : "border-border bg-card hover:border-primary/30 text-foreground"}`}><span className="text-xl">{t.icon}</span><span className="text-xs font-medium leading-tight">{t.label}</span></button>)}</div></div>
            <div><Label htmlFor="proj-name" className="text-sm font-medium">Nome do projeto</Label><Input id="proj-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: App de delivery para pets" className="mt-1.5" data-testid="input-project-name" /></div>
            <div><Label htmlFor="proj-briefing" className="text-sm font-medium">Briefing inicial <span className="text-xs font-normal text-muted-foreground ml-2">— Mais detalhe = melhores artefatos</span></Label><Textarea id="proj-briefing" value={briefing} onChange={e => setBriefing(e.target.value)} placeholder="Descreva sua ideia, o problema que resolve, o publico-alvo e diferenciais..." className="mt-1.5 min-h-[140px]" data-testid="textarea-project-briefing" />{briefing.length > 0 && <p className="text-xs text-muted-foreground mt-1 font-mono">{briefing.length} chars — {briefing.length < 200 ? "adicione mais contexto" : "otimo nivel de detalhe"}</p>}</div>
            <div className="flex justify-end gap-2 pt-1"><Button variant="outline" onClick={() => { setShowNew(false); setSelectedTemplate(null); }}>Cancelar</Button><Button onClick={handleCreate} disabled={!name.trim() || !briefing.trim() || createProject.isPending} className="bg-primary hover:bg-primary/90 text-white font-semibold" data-testid="button-create-project">{createProject.isPending ? "Criando..." : "Criar projeto →"}</Button></div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
