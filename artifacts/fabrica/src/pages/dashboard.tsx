import { useState, useCallback, useEffect, useRef } from "react";
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
import { ProgressiveProfile } from "@/components/progressive-profile";
import { ActivationChecklist } from "@/components/activation-checklist";
import { AppSidebar } from "@/components/app-sidebar";

const EXAMPLE_TEMPLATES = [
  { id: "saas", label: "SaaS B2B", icon: "💼", tag: "Recorrente", name: "Plataforma de gestão para PMEs", briefing: "Quero criar uma plataforma SaaS para pequenas e médias empresas gerenciarem projetos, clientes e receitas. Problema: PMEs perdem contratos por falta de acompanhamento. Público-alvo: donos de empresas de 5-50 funcionários. Diferencial: simplicidade e preço acessível (R$99/mês). Modelo: freemium com limite de projetos." },
  { id: "app", label: "App de Consumo", icon: "📱", tag: "Mobile", name: "App de saúde e hábitos", briefing: "Quero criar um app mobile para ajudar pessoas a criarem hábitos saudáveis de forma gamificada. Problema: as pessoas desistem das metas em menos de 30 dias. Público-alvo: adultos 25-40 anos que querem ser mais produtivos. Diferencial: social accountability — você só avança se um amigo confirmar. Modelo: assinatura anual R$199." },
  { id: "marketplace", label: "Marketplace", icon: "🛒", tag: "Comissão", name: "Marketplace de serviços criativos", briefing: "Quero criar um marketplace conectando freelancers criativos (designers, redatores, video-makers) a empresas que precisam de conteúdo sob demanda. Problema: empresas perdem semanas buscando fornecedores confiáveis. Público-alvo: startups e agências de marketing. Diferencial: garantia de entrega em 48h. Modelo: comissão de 15% por transação." },
  { id: "fintech", label: "Fintech", icon: "🏦", tag: "Regulado", name: "Conta digital para autônomos", briefing: "Quero criar uma fintech focada em profissionais autônomos e MEIs no Brasil, com conta digital, emissão de notas fiscais e gestão de impostos. Problema: autônomos perdem dinheiro com bancos tradicionais e contadores caros. Público-alvo: freelancers, designers, devs, médicos autônomos faturando R$5k–50k/mês. Diferencial: cálculo automático de DAS, separação contas pessoa física/jurídica, integração com Pix. Modelo: R$29/mês + 1% sobre TPV. Compliance: BACEN, LGPD, lavagem de dinheiro." },
  { id: "edtech", label: "Edtech", icon: "🎓", tag: "Conteúdo", name: "Plataforma de cursos para profissionais", briefing: "Quero criar uma edtech B2B2C que oferece trilhas curtas (4-8h) para profissionais de tecnologia se especializarem em IA aplicada. Problema: cursos genéricos não preparam para uso real no trabalho. Público-alvo: devs, PMs, designers em empresas de tecnologia. Diferencial: projetos avaliados por IA + mentor sênior, certificado verificável on-chain. Modelo: B2B (empresas pagam R$199/colaborador/mês) e B2C (R$79/mês individual)." },
  { id: "healthtech", label: "Healthtech", icon: "🩺", tag: "Regulado", name: "Telemedicina para empresas", briefing: "Quero criar uma healthtech que oferece atendimento médico ilimitado por chat e vídeo como benefício corporativo. Problema: planos de saúde tradicionais são caros e subutilizados (média de 2-3 consultas/ano). Público-alvo: empresas de 20-500 funcionários que querem benefício de saúde mais acessível. Diferencial: triagem por IA antes da consulta, foco em saúde mental e clínica geral, integração com convênios. Modelo: R$39/colaborador/mês. Compliance: CFM, LGPD para dados sensíveis, ANS." },
  { id: "d2c", label: "D2C / E-commerce", icon: "🛍️", tag: "Produto", name: "Marca D2C de bem-estar", briefing: "Quero criar uma marca direct-to-consumer de suplementos naturais com assinatura recorrente. Problema: consumidor não sabe quais suplementos tomar e esquece de reabastecer. Público-alvo: mulheres 28-45 anos preocupadas com energia, sono e imunidade. Diferencial: quiz personalizado com nutricionista, frascos mensais entregues automaticamente, fórmulas brasileiras com ANVISA. Modelo: assinatura R$149/mês com cancelamento livre. Canais: Instagram, TikTok, influencers nano." },
  { id: "creator", label: "Creator / Infoproduto", icon: "🎙️", tag: "Comunidade", name: "Comunidade paga para criadores", briefing: "Quero criar uma plataforma onde criadores de conteúdo vendem acesso a comunidades pagas (estilo Patreon + Circle). Problema: criadores brasileiros perdem 30%+ em taxas internacionais e não têm Pix. Público-alvo: criadores 5k-200k seguidores que monetizam audiência. Diferencial: pagamento via Pix recorrente, app mobile próprio para a comunidade, ferramentas anti-pirataria. Modelo: 8% sobre receita do criador, sem mensalidade fixa." },
];

const EMPTY_STATE_TEMPLATES = EXAMPLE_TEMPLATES.slice(0, 4);

function MiniPipeline({ completedPhases, currentPhase }: { completedPhases: number; currentPhase: number }) {
  return (
    <div className="flex items-center gap-1 mb-3">
      {Array.from({ length: 6 }, (_, i) => {
        const phaseNum = i + 1;
        const isDone = phaseNum <= completedPhases;
        const isCurrent = phaseNum === currentPhase && !isDone;
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1">
            <div
              className={`w-full h-1.5 rounded-full transition-all duration-500 ${
                isDone ? "bg-primary" : isCurrent ? "bg-primary/35" : "bg-muted"
              }`}
            />
          </div>
        );
      })}
    </div>
  );
}

function ProjectCard({ project, onContinue }: {
  project: { projectId: number; name: string; currentPhase: number; completedPhases: number; phaseStatuses?: string[] };
  onContinue?: () => void;
}) {
  const phaseName = PHASES[project.currentPhase - 1]?.name ?? `Fase ${project.currentPhase}`;
  const pct = Math.round((project.completedPhases / 7) * 100);
  const isComplete = project.completedPhases === 7;

  const nextActions: Record<number, string> = {
    1: "Gerar Lean Canvas e validar ideia",
    2: "Escrever PRD e definir personas",
    3: "Mapear dados pessoais e threat model",
    4: "Documentar arquitetura e API",
    5: "Criar milestones e sprint inicial",
    6: "Executar plano de testes QA",
    7: "Preparar runbook e go-to-market",
  };

  return (
    <Link href={`/projects/${project.projectId}`} data-testid={`card-project-${project.projectId}`}>
      <div className="glass-card rounded-2xl p-5 cursor-pointer group h-full relative overflow-hidden flex flex-col">
        <div className="absolute top-3 right-3 w-3 h-3 border-t border-r border-primary/15 group-hover:border-primary/35 transition-colors" />

        <div className="flex-1">
          <h3 className="font-serif text-base font-semibold text-foreground group-hover:text-primary transition-colors leading-snug pr-6 mb-3">
            {project.name}
          </h3>

          <MiniPipeline completedPhases={project.completedPhases} currentPhase={project.currentPhase} />

          <div className="flex items-center justify-between text-[11px] font-mono text-muted-foreground mb-3 uppercase tracking-wider">
            <span>{isComplete ? "Completo!" : `Fase ${project.currentPhase} — ${phaseName}`}</span>
            <span className={`font-semibold ${isComplete ? "text-primary" : ""}`}>{pct}%</span>
          </div>

          {!isComplete && (
            <p className="text-xs text-muted-foreground leading-snug mb-4">
              {nextActions[project.currentPhase] ?? "Continuar de onde parou"}
            </p>
          )}
        </div>

        {!isComplete && (
          <div className="pt-2 border-t border-border/60">
            <span className="text-xs font-semibold text-primary group-hover:underline underline-offset-2 transition-all">
              Continuar Fase {project.currentPhase} →
            </span>
          </div>
        )}
        {isComplete && (
          <div className="pt-2 border-t border-border/60">
            <span className="text-xs font-semibold text-primary">Produto completo ✓</span>
          </div>
        )}
      </div>
    </Link>
  );
}

function ProgressBar({ completed, total = 7 }: { completed: number; total?: number }) {
  const pct = Math.round((completed / total) * 100);
  return (
    <div className="w-full bg-muted rounded-full h-1 mt-3" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100}>
      <div className="bg-primary h-1 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
    </div>
  );
}

function ResumeCard({ project }: { project: { projectId: number; name: string; currentPhase: number; completedPhases: number } }) {
  const phaseName = PHASES[project.currentPhase - 1]?.name ?? `Fase ${project.currentPhase}`;
  const pct = Math.round((project.completedPhases / 7) * 100);
  const motivations = ["Continue de onde parou — seu produto está ganhando forma.", "Cada artefato concluído é um produto mais sólido.", "Quase lá! Falta pouco para concluir esta fase.", "Não pare agora — você está no caminho certo."];
  const motivation = motivations[project.completedPhases % motivations.length];
  return (
    <Link href={`/projects/${project.projectId}/phases/${project.currentPhase}`}>
      <div className="glass-card rounded-2xl p-6 cursor-pointer group mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 pointer-events-none"><div className="absolute top-3 right-3 w-4 h-4 border-t border-r border-primary/20" /></div>
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse flex-shrink-0" />
              <span className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">Continuar de onde parou</span>
            </div>
            <h3 className="font-serif text-xl text-foreground group-hover:text-primary transition-colors truncate mb-1">{project.name}</h3>
            <p className="text-xs text-muted-foreground">{motivation}</p>
          </div>
          <div className="flex-shrink-0 text-right">
            <div className="text-3xl font-bold font-serif text-primary">{pct}%</div>
            <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">concluído</div>
          </div>
        </div>
        <div className="mt-5">
          <div className="flex items-center justify-between text-xs font-mono text-muted-foreground mb-1.5 uppercase tracking-wider">
            <span>Fase {project.currentPhase} — {phaseName}</span>
            <span>{project.completedPhases}/7</span>
          </div>
          <ProgressBar completed={project.completedPhases} />
        </div>
        <div className="mt-5">
          <Button size="sm" className="bg-primary hover:bg-primary/90 text-white text-xs font-semibold transition-all group-hover:-translate-y-0.5 duration-200">
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
    <div className={`border rounded-2xl p-4 mb-6 flex items-start gap-3 ${isExhausted ? "bg-red-950/20 border-red-900/60" : "bg-primary/8 border-primary/20"}`} role="alert">
      <span className="text-base flex-shrink-0">{isExhausted ? "⚠️" : "⚡"}</span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-medium ${isExhausted ? "text-red-300" : "text-primary"}`}>
          {isExhausted ? `Limite de IA atingido — ${used}/${limit} gerações usadas hoje` : `${pct}% das suas gerações de IA usadas hoje (${used}/${limit})`}
        </p>
        <p className={`text-xs mt-0.5 ${isExhausted ? "text-red-400/80" : "text-primary/70"}`}>
          {isExhausted ? "Créditos renovam à meia-noite. Faça upgrade para não parar." : "Faça upgrade para mais gerações e manter o ritmo."}
        </p>
      </div>
      <Link href="/pricing">
        <Button size="sm" variant="outline" className={`text-xs flex-shrink-0 ${isExhausted ? "border-red-800/60 text-red-400 hover:bg-red-950/40" : "border-primary/20 text-primary hover:bg-primary/5"}`}>
          Ver planos
        </Button>
      </Link>
    </div>
  );
}

function EmptyState({ onNew, onTemplate }: { onNew: () => void; onTemplate: (t: typeof EXAMPLE_TEMPLATES[0]) => void }) {
  return (
    <div className="flex flex-col items-center py-16 text-center">
      <div className="relative mb-7">
        <div className="w-16 h-16 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
          <svg width="30" height="30" viewBox="0 0 36 36" fill="none" className="text-primary">
            <rect x="6" y="4" width="24" height="28" rx="2" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M11 12h14M11 17h14M11 22h9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
        <div className="absolute -top-1 -right-1 w-3 h-3 border-t border-r border-primary/30" />
      </div>

      <h2 className="text-2xl font-serif text-foreground mb-2">Sua linha de montagem aguarda</h2>
      <p className="text-muted-foreground max-w-sm mb-8 text-sm leading-relaxed">
        Da ideia ao lançamento em 7 fases — PRD, segurança, arquitetura, go-to-market e mais. Comece em 2 minutos.
      </p>

      <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.18em] mb-3">Comece por um template</p>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-7 max-w-xl w-full">
        {EMPTY_STATE_TEMPLATES.map((t) => (
          <button
            key={t.id}
            onClick={() => onTemplate(t)}
            className="glass-card rounded-xl p-3 text-center hover:border-primary/40 hover:shadow-md transition-all group"
          >
            <div className="text-2xl mb-1.5">{t.icon}</div>
            <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">{t.label}</div>
          </button>
        ))}
      </div>

      <Button onClick={onNew} className="bg-primary hover:bg-primary/90 text-white px-7 py-2.5 text-sm font-semibold" data-testid="button-new-project-empty">
        Criar do zero →
      </Button>
      <p className="text-xs font-mono text-muted-foreground/60 mt-3 uppercase tracking-wider">Sem cartão de crédito</p>
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
  { label: "Configurações", href: "/settings", icon: "⚙️", desc: "Conta e preferências" },
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
  const [searchQuery, setSearchQuery] = useState("");
  const { permissions } = usePlan();

  const [showTrash, setShowTrash] = useState(false);
  const [trash, setTrash] = useState<Array<{ id: number; name: string; deletedAt: string; daysRemaining: number }>>([]);
  const [trashLoading, setTrashLoading] = useState(false);
  const [trashActionId, setTrashActionId] = useState<number | null>(null);
  const [benchmarks, setBenchmarks] = useState<{
    platform: { totalProjects: number; avgCoherenceScore: number | null; avgMarketPotentialScore: number | null; avgCurrentPhase: number | null; completedProjects: number };
    user: { totalProjects: number; avgCoherenceScore: number | null };
  } | null>(null);
  const [profileStage, setProfileStage] = useState<number>(0);
  const benchmarksFetched = useRef(false);

  const { data: dashboard, isLoading } = useGetDashboard();
  const createProject = useCreateProject();

  const handleTourComplete = useCallback(() => { setTimeout(() => setShowNew(true), 400); }, []);

  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

  async function loadTrash() {
    setTrashLoading(true);
    try {
      const res = await fetch(`${basePath}/api/projects/trash`, { credentials: "include" });
      if (res.ok) setTrash(await res.json());
    } finally {
      setTrashLoading(false);
    }
  }

  useEffect(() => { loadTrash(); }, []);

  useEffect(() => {
    if (benchmarksFetched.current) return;
    benchmarksFetched.current = true;
    fetch(`${basePath}/api/benchmarks`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setBenchmarks(data); })
      .catch(() => undefined);
  }, [basePath]);

  useEffect(() => {
    fetch(`${basePath}/api/users/me`, { credentials: "include" })
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d && typeof d.profileStage === "number") setProfileStage(d.profileStage); })
      .catch(() => undefined);
  }, [basePath]);

  async function restoreProject(id: number) {
    setTrashActionId(id);
    try {
      const res = await fetch(`${basePath}/api/projects/${id}/restore`, { method: "POST", credentials: "include" });
      if (res.ok) {
        toast({ title: "Projeto restaurado!", description: "O projeto voltou para seus projetos ativos." });
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        await loadTrash();
      } else {
        const data = await res.json().catch(() => ({}));
        toast({ title: "Erro ao restaurar", description: data.error ?? "Tente novamente.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão.", variant: "destructive" });
    } finally {
      setTrashActionId(null);
    }
  }

  async function permanentDelete(id: number, projectName: string) {
    if (!window.confirm(`Apagar "${projectName}" permanentemente? Esta ação não pode ser desfeita.`)) return;
    setTrashActionId(id);
    try {
      const res = await fetch(`${basePath}/api/projects/${id}/permanent`, { method: "DELETE", credentials: "include" });
      if (res.ok || res.status === 204) {
        toast({ title: "Projeto excluído permanentemente." });
        await loadTrash();
      } else {
        toast({ title: "Erro ao excluir.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão.", variant: "destructive" });
    } finally {
      setTrashActionId(null);
    }
  }

  function applyTemplate(template: typeof EXAMPLE_TEMPLATES[0]) {
    setName(template.name);
    setBriefing(template.briefing);
    setSelectedTemplate(template.id);
    setShowNew(true);
  }

  function handleCreate() {
    if (!name.trim() || !briefing.trim()) return;
    createProject.mutate({ data: { name: name.trim(), briefing: briefing.trim() } }, {
      onSuccess: (project) => {
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        setShowNew(false); setName(""); setBriefing(""); setSelectedTemplate(null);
        toast({ title: "Projeto criado!", description: `"${project.name}" pronto. Abrindo Fase 1…` });
        setTimeout(() => setLocation(`/projects/${project.id}/phases/1`), 80);
      },
      onError: () => { toast({ title: "Erro ao criar projeto", description: "Tente novamente em alguns instantes.", variant: "destructive" }); },
    });
  }

  const projects = dashboard?.projects ?? [];
  const completedProjects = projects.filter(p => p.completedPhases === 7).length;
  const activeProjects = projects.filter(p => p.completedPhases < 7).length;
  const aiUsagePct = dashboard ? Math.round((dashboard.dailyAiUsage / dashboard.dailyAiLimit) * 100) : 0;
  const mostRecentActive = projects.filter(p => p.completedPhases < 7).sort((a, b) => (b.projectId ?? 0) - (a.projectId ?? 0))[0];
  const totalCompletedPhases = projects.reduce((s, p) => s + p.completedPhases, 0);
  const phase1Completed = totalCompletedPhases >= 1;
  const phase3Completed = totalCompletedPhases >= 3;
  const allPhasesCompleted = projects.some(p => p.completedPhases === 7);
  const showChecklist = !isLoading && totalCompletedPhases < 3;
  const hasSharedProject = projects.length > 0;

  const filteredProjects = searchQuery.trim()
    ? projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : projects;

  return (
    <div className="app-shell">
      <OnboardingTour onComplete={handleTourComplete} />
      <ProgressiveProfile
        profileStage={profileStage}
        totalCompletedPhases={totalCompletedPhases}
        basePath={basePath}
        onSaved={() => setProfileStage(s => Math.min(s + 1, 3))}
      />
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <div className="topbar">
          <div className="flex items-center gap-3">
            <p className="text-xs font-mono uppercase tracking-[0.18em]" style={{ color: "var(--text-tertiary)" }}>Painel</p>
            <span style={{ color: "var(--border-default)" }}>/</span>
            <span className="font-serif text-sm font-semibold" style={{ color: "var(--text-primary)" }}>
              {user?.firstName ? `Olá, ${user.firstName}.` : "Dashboard"}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <NotificationBell />
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:-translate-y-px"
              style={{ background: "var(--phase-accent)", boxShadow: "0 4px 16px var(--phase-glow)" }}
              data-testid="button-new-project"
            >
              + Nova construção
            </button>
          </div>
        </div>

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="mb-8">
          <p className="text-xs font-mono uppercase tracking-[0.18em] mb-1" style={{ color: "var(--text-tertiary)" }}>PAINEL DE CONTROLE</p>
          <h1 className="text-2xl font-serif mb-1" style={{ color: "var(--text-primary)" }}>
            {user?.firstName ? `Olá, ${user.firstName}.` : "Bem-vindo."}
          </h1>
          <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
            {projects.length === 0
              ? "Nenhum projeto ainda — comece criando o seu."
              : `${activeProjects} projeto${activeProjects !== 1 ? "s" : ""} em andamento · ${completedProjects !== 1 ? completedProjects + " concluídos" : "1 concluído"}`}
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <section className="space-y-6 min-w-0">
            {showChecklist && (
              <ActivationChecklist
                hasProjects={projects.length > 0}
                hasAiUsage={(dashboard?.dailyAiUsage ?? 0) > 0}
                hasTemplates={selectedTemplate !== null}
                hasSharedProject={hasSharedProject}
                phase1Completed={phase1Completed}
                phase3Completed={phase3Completed}
                allPhasesCompleted={allPhasesCompleted}
                onNewProject={() => setShowNew(true)}
              />
            )}

            {!isLoading && dashboard && <AiLimitBanner used={dashboard.dailyAiUsage} limit={dashboard.dailyAiLimit} />}
            {!isLoading && mostRecentActive && projects.length > 0 && <ResumeCard project={mostRecentActive} />}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <MetricCard label="Projetos ativos" value={activeProjects} variant="default" />
              <MetricCard label="Fases concluídas" value={totalCompletedPhases} variant="accent" />
              <MetricCard label="IA hoje" value={`${dashboard?.dailyAiUsage ?? 0}/${dashboard?.dailyAiLimit ?? 2}`} sub={`${aiUsagePct}% usado`} variant="dim" />
              <MetricCard label="Plano" value={permissions.planName} sub="ver planos →" variant="link" />
            </div>

            {benchmarks && benchmarks.platform.totalProjects > 1 && (
              <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 bg-card border border-card-border rounded-xl px-4 py-3">
                <span className="text-[11px] font-mono text-primary uppercase tracking-wider font-semibold">Média da plataforma</span>
                {benchmarks.platform.avgCoherenceScore != null && (
                  <span className="text-xs text-muted-foreground">
                    Coerência: <span className="font-medium text-foreground">{benchmarks.platform.avgCoherenceScore}/100</span>
                  </span>
                )}
                {benchmarks.platform.avgMarketPotentialScore != null && (
                  <span className="text-xs text-muted-foreground">
                    Potencial: <span className="font-medium text-foreground">{benchmarks.platform.avgMarketPotentialScore}/100</span>
                  </span>
                )}
                {benchmarks.platform.avgCurrentPhase != null && (
                  <span className="text-xs text-muted-foreground">
                    Fase média: <span className="font-medium text-foreground">{benchmarks.platform.avgCurrentPhase}/7</span>
                  </span>
                )}
                <span className="text-xs text-muted-foreground ml-auto">
                  {benchmarks.platform.totalProjects} projetos ativos
                </span>
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {SHORTCUTS.map((s) => {
                const locked = s.planRequired && !permissions.hasAiAdvisor;
                const href = locked ? "/pricing" : (s.href ?? "/pricing");
                return (
                  <Link key={s.label} href={href}>
                    <div className="glass-card rounded-2xl p-4 cursor-pointer group h-full" role="button" aria-label={s.label}>
                      <div className="text-xl mb-2">{s.icon}</div>
                      <div className="text-xs font-semibold text-foreground group-hover:text-primary transition-colors">{s.label}</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">{locked ? "Plano Avancado" : s.desc}</div>
                    </div>
                  </Link>
                );
              })}
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.18em] mb-0.5">PROJETOS</p>
                  <h2 className="font-serif text-xl text-foreground">Suas construções</h2>
                </div>
                {projects.length > 0 && (
                  <button onClick={() => setShowNew(true)} className="text-xs font-mono text-primary hover:text-primary/80 transition-colors uppercase tracking-wider">
                    + Novo
                  </button>
                )}
              </div>

              {projects.length > 2 && (
                <div className="relative mb-4">
                  <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                  </svg>
                  <input
                    type="text"
                    placeholder="Buscar projeto..."
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/30 focus:border-primary/40 transition-all"
                  />
                  {searchQuery && (
                    <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-sm">
                      ✕
                    </button>
                  )}
                </div>
              )}

              {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => <div key={i} className="glass-card rounded-2xl p-5 animate-pulse h-44" />)}
                </div>
              ) : projects.length === 0 ? (
                <EmptyState onNew={() => setShowNew(true)} onTemplate={applyTemplate} />
              ) : filteredProjects.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground text-sm">
                  Nenhum projeto encontrado para "{searchQuery}"
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredProjects.map((project) => (
                    <ProjectCard key={project.projectId} project={project} />
                  ))}
                </div>
              )}
            </div>

            {/* Trash section */}
            {(trash.length > 0 || trashLoading) && (
              <div>
                <button
                  onClick={() => setShowTrash(v => !v)}
                  className="flex items-center gap-2 text-xs font-mono text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider mb-3"
                >
                  <svg width="13" height="13" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 6h14M8 6V4h4v2M19 6l-1 12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2L3 6" />
                  </svg>
                  Lixeira ({trash.length})
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className={`transition-transform ${showTrash ? "rotate-180" : ""}`}>
                    <path d="M2 3.5l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>

                {showTrash && (
                  <div className="space-y-2">
                    {trashLoading ? (
                      <div className="h-10 bg-muted rounded-xl animate-pulse" />
                    ) : (
                      trash.map((item) => (
                        <div key={item.id} className="flex items-center justify-between rounded-xl border border-border bg-card/60 px-4 py-3 gap-3">
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-foreground truncate">{item.name}</p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {item.daysRemaining > 0
                                ? `Apagado em ${item.daysRemaining} dia${item.daysRemaining !== 1 ? "s" : ""}`
                                : "Apagado permanentemente em breve"}
                            </p>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={() => restoreProject(item.id)}
                              disabled={trashActionId === item.id}
                              className="text-xs font-semibold text-primary hover:text-primary/80 transition-colors disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-primary/8"
                            >
                              {trashActionId === item.id ? "…" : "Restaurar"}
                            </button>
                            <button
                              onClick={() => permanentDelete(item.id, item.name)}
                              disabled={trashActionId === item.id}
                              className="text-xs font-semibold text-destructive hover:text-destructive/80 transition-colors disabled:opacity-50 px-2 py-1 rounded-lg hover:bg-destructive/8"
                            >
                              Apagar
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    <p className="text-[10px] text-muted-foreground font-mono px-1">
                      Projetos na lixeira são apagados permanentemente após 30 dias.
                    </p>
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="space-y-4 lg:pt-0">
            <div className="surface-panel rounded-2xl p-5">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-3">Status de uso</p>
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Projetos</span>
                  <span className="font-semibold text-foreground">{projects.length}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Fases concluidas</span>
                  <span className="font-semibold text-foreground">{totalCompletedPhases}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">IA hoje</span>
                  <span className="font-semibold text-foreground">{dashboard?.dailyAiUsage ?? 0}/{dashboard?.dailyAiLimit ?? 2}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Plano</span>
                  <span className="font-semibold text-primary">{permissions.planName}</span>
                </div>
              </div>
              {aiUsagePct >= 50 && (
                <Link href="/pricing">
                  <div className="mt-4 pt-3 border-t border-border">
                    <div className="w-full bg-muted rounded-full h-1.5 mb-2">
                      <div
                        className={`h-1.5 rounded-full transition-all ${aiUsagePct >= 100 ? "bg-destructive" : aiUsagePct >= 80 ? "bg-accent" : "bg-primary"}`}
                        style={{ width: `${Math.min(100, aiUsagePct)}%` }}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">{aiUsagePct}% do limite de IA usado</p>
                  </div>
                </Link>
              )}
            </div>

            <div className="surface-panel rounded-2xl p-5">
              <p className="text-xs font-mono text-muted-foreground uppercase tracking-[0.2em] mb-3">Fases do processo</p>
              <div className="space-y-2">
                {PHASES.slice(0, 6).map((phase, i) => (
                  <div key={i} className="flex items-center gap-2.5">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border flex-shrink-0 ${
                      i < totalCompletedPhases ? "bg-primary border-primary text-white" : "border-border text-muted-foreground"
                    }`}>
                      {i < totalCompletedPhases ? "✓" : i + 1}
                    </div>
                    <span className={`text-xs ${i < totalCompletedPhases ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {phase.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Dialog open={showNew} onOpenChange={(open) => { setShowNew(open); if (!open) setSelectedTemplate(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-serif text-xl">Nova construção</DialogTitle></DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-xs font-mono text-muted-foreground block uppercase tracking-wider">Template por vertical (opcional)</Label>
                {selectedTemplate && (
                  <button
                    type="button"
                    onClick={() => { setName(""); setBriefing(""); setSelectedTemplate(null); }}
                    className="text-xs text-muted-foreground hover:text-foreground underline-offset-2 hover:underline"
                  >
                    Limpar template
                  </button>
                )}
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {EXAMPLE_TEMPLATES.map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => { setName(t.name); setBriefing(t.briefing); setSelectedTemplate(t.id); }}
                    className={`flex flex-col items-start gap-1 p-3 rounded-xl border text-left transition-all ${selectedTemplate === t.id ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border bg-card hover:border-primary/40 hover:bg-primary/[0.02]"}`}
                    data-testid={`template-${t.id}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-lg leading-none">{t.icon}</span>
                      <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{t.tag}</span>
                    </div>
                    <span className={`text-xs font-semibold leading-tight ${selectedTemplate === t.id ? "text-primary" : "text-foreground"}`}>{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="proj-name" className="text-sm font-medium">Nome do projeto</Label>
              <Input id="proj-name" value={name} onChange={e => setName(e.target.value)} placeholder="Ex: App de delivery para pets" className="mt-1.5" data-testid="input-project-name" />
            </div>
            <div>
              <Label htmlFor="proj-briefing" className="text-sm font-medium">
                Briefing inicial <span className="text-xs font-normal text-muted-foreground ml-2">— Mais detalhe = melhores artefatos</span>
              </Label>
              <Textarea id="proj-briefing" value={briefing} onChange={e => setBriefing(e.target.value)} placeholder={"Descreva: (1) qual problema resolve, (2) para quem, (3) como é diferente do que existe hoje.\n\nEx: App de delivery para pets em condominios. O morador pede racao e medicamentos sem sair de casa. Diferencial: parceria com petshops locais e entrega em 2h."} className="mt-1.5 min-h-[140px]" data-testid="textarea-project-briefing" />
              {briefing.trim().length > 0 && (() => {
                const wc = briefing.trim().split(/\s+/).filter(Boolean).length;
                const tier = wc >= 80 ? { label: "Excelente — artefatos altamente personalizados", color: "text-emerald-600 dark:text-emerald-400" }
                  : wc >= 40 ? { label: "Bom contexto — a IA tem informação suficiente", color: "text-amber-600 dark:text-amber-400" }
                  : { label: "Briefing curto — adicione problema, público e diferencial", color: "text-muted-foreground" };
                return <p className={`text-xs mt-1.5 font-mono ${tier.color}`}>{wc} palavras · {tier.label}</p>;
              })()}
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => { setShowNew(false); setSelectedTemplate(null); }}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={!name.trim() || !briefing.trim() || createProject.isPending} className="bg-primary hover:bg-primary/90 text-white font-semibold" data-testid="button-create-project">
                {createProject.isPending ? "Criando..." : "Criar projeto →"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}
