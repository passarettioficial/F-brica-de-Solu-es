import { useState } from "react";
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
import { PHASES } from "@/lib/constants";
import { usePlan } from "@/hooks/usePlan";
import { NotificationBell } from "@/components/notification-bell";
import { OnboardingTour } from "@/components/onboarding-tour";

const PHASE_STATUS_LABELS: Record<string, string> = {
  completed: "Concluída",
  active: "Em andamento",
  locked: "Bloqueada",
};

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
  return (
    <div className="w-full bg-muted rounded-full h-1.5 mt-3">
      <div
        className="bg-primary h-1.5 rounded-full transition-all duration-300"
        style={{ width: `${(completed / total) * 100}%` }}
      />
    </div>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-6">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
          <path d="M8 6h16M8 6v20M8 6l4-2 4 2 4-2 4 2v20M8 26h16M12 12h8M12 17h8M12 22h5" stroke="#b8461e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </div>
      <h2 className="text-2xl font-serif text-foreground mb-3">Sua linha de montagem aguarda</h2>
      <p className="text-muted-foreground max-w-md mb-8 text-sm leading-relaxed">
        Cada grande produto começa com uma ideia e um processo rigoroso. Crie seu primeiro projeto e deixe a IA guiar você pelas 6 fases de construção.
      </p>
      <div className="grid grid-cols-3 gap-4 mb-10 max-w-lg w-full text-left">
        {["Valide a ideia", "Defina e especifique", "Lance com impacto"].map((step, i) => (
          <div key={i} className="bg-card border border-card-border rounded-xl p-4">
            <div className="text-xs font-medium text-primary mb-1">Passo {i + 1}</div>
            <div className="text-sm font-medium text-foreground">{step}</div>
          </div>
        ))}
      </div>
      <Button onClick={onNew} className="bg-primary hover:bg-primary/90 text-white px-8 py-2.5" data-testid="button-new-project-empty">
        Iniciar nova construção
      </Button>
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
  { label: "Configurações", href: "/settings", icon: "⚙️", desc: "Conta e preferências" },
];

export function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useUser();
  const queryClient = useQueryClient();
  const [showNew, setShowNew] = useState(false);
  const [name, setName] = useState("");
  const [briefing, setBriefing] = useState("");
  const { permissions } = usePlan();

  const { data: dashboard, isLoading } = useGetDashboard();
  const createProject = useCreateProject();

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
          setLocation(`/projects/${project.id}`);
        },
      }
    );
  }

  const projects = dashboard?.projects ?? [];
  const completedProjects = projects.filter(p => p.completedPhases === 6).length;
  const activeProjects = projects.filter(p => p.completedPhases < 6).length;
  const aiUsagePct = dashboard ? Math.round((dashboard.dailyAiUsage / dashboard.dailyAiLimit) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <OnboardingTour />

      {/* Header */}
      <header className="border-b bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo.svg`}
              alt="Logo"
              className="w-7 h-7 rounded"
            />
            <span className="font-serif text-lg font-semibold text-foreground">Fábrica de Soluções</span>
          </Link>
          <nav className="flex items-center gap-3">
            <Link href="/pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              {permissions.planName}
            </Link>
            <Link href="/billing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Assinatura
            </Link>
            {permissions.isAdmin && (
              <Link href="/admin" className="text-xs text-muted-foreground hover:text-foreground transition-colors font-medium" data-testid="link-admin">
                Admin
              </Link>
            )}
            <NotificationBell />
            <Link href="/settings" className="text-sm text-muted-foreground hover:text-foreground transition-colors" data-testid="link-settings">
              {user?.firstName ?? user?.emailAddresses?.[0]?.emailAddress ?? "Conta"}
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10">
        {/* Title row */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-3xl font-serif text-foreground mb-1">
              Olá{user?.firstName ? `, ${user.firstName}` : ""}!
            </h1>
            <p className="text-muted-foreground text-sm">
              {projects.length === 0
                ? "Nenhum projeto ainda — comece criando o seu."
                : `${activeProjects} projeto${activeProjects !== 1 ? "s" : ""} em andamento · ${completedProjects} concluído${completedProjects !== 1 ? "s" : ""}`}
            </p>
          </div>
          <Button
            onClick={() => setShowNew(true)}
            className="bg-primary hover:bg-primary/90 text-white"
            data-testid="button-new-project"
          >
            + Iniciar nova construção
          </Button>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          <MetricCard label="Projetos ativos" value={activeProjects} color="default" />
          <MetricCard label="Fases concluídas" value={projects.reduce((s, p) => s + p.completedPhases, 0)} color="primary" />
          <MetricCard
            label="IA hoje"
            value={`${dashboard?.dailyAiUsage ?? 0}/${dashboard?.dailyAiLimit ?? 2}`}
            sub={`${aiUsagePct}% usado`}
            color={aiUsagePct >= 90 ? "primary" : "blue"}
          />
          <MetricCard label="Plano" value={permissions.planName} sub="Ver planos →" color="green" />
        </div>

        {/* Shortcuts */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {SHORTCUTS.map((s) => {
            const locked = s.planRequired && !permissions.hasAiAdvisor;
            const href = locked ? "/pricing" : (s.href ?? "/pricing");
            return (
              <Link key={s.label} href={href}>
                <div className="bg-card border border-card-border rounded-xl p-4 hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer group">
                  <div className="text-xl mb-2">{s.icon}</div>
                  <div className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">{s.label}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">
                    {locked ? "Plano Avançado" : s.desc}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Projects grid */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-xl text-foreground">Seus projetos</h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card border border-card-border rounded-xl p-5 animate-pulse h-40" />
            ))}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState onNew={() => setShowNew(true)} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {projects.map((project) => {
              const currentPhaseStatus = project.phaseStatuses?.[project.currentPhase - 1] ?? "active";
              return (
                <Link
                  key={project.projectId}
                  href={`/projects/${project.projectId}`}
                  data-testid={`card-project-${project.projectId}`}
                >
                  <div className="bg-card border border-card-border rounded-xl p-5 hover:border-primary/30 hover:shadow-md transition-all cursor-pointer group">
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-serif text-lg font-semibold text-foreground group-hover:text-primary transition-colors leading-snug">
                        {project.name}
                      </h3>
                    </div>
                    <div className="mb-4">
                      <PhaseBadge status={currentPhaseStatus} phaseNumber={project.currentPhase} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                      <span>{project.completedPhases} de 6 fases concluídas</span>
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

      {/* New project dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-xl">Nova construção</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <Label htmlFor="proj-name" className="text-sm font-medium">Nome do projeto</Label>
              <Input
                id="proj-name"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Ex: App de delivery para pets"
                className="mt-1.5"
                data-testid="input-project-name"
              />
            </div>
            <div>
              <Label htmlFor="proj-briefing" className="text-sm font-medium">Briefing inicial</Label>
              <Textarea
                id="proj-briefing"
                value={briefing}
                onChange={e => setBriefing(e.target.value)}
                placeholder="Descreva sua ideia, o problema que resolve, o público-alvo e diferenciais. Quanto mais detalhe, melhores os artefatos..."
                className="mt-1.5 min-h-[120px]"
                data-testid="textarea-project-briefing"
              />
            </div>
            <div className="flex justify-end gap-2 pt-1">
              <Button variant="outline" onClick={() => setShowNew(false)}>Cancelar</Button>
              <Button
                onClick={handleCreate}
                disabled={!name.trim() || !briefing.trim() || createProject.isPending}
                className="bg-primary hover:bg-primary/90 text-white"
                data-testid="button-create-project"
              >
                {createProject.isPending ? "Criando..." : "Criar projeto"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
