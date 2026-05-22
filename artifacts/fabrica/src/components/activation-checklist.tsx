import { useState } from "react";
import { Link } from "wouter";

const DISMISSED_KEY = "fabrica_activation_dismissed";

interface ActivationChecklistProps {
  hasProjects: boolean;
  hasAiUsage: boolean;
  hasTemplates: boolean;
  hasSharedProject: boolean;
  phase1Completed: boolean;
  phase3Completed: boolean;
  allPhasesCompleted: boolean;
  onNewProject: () => void;
}

export function ActivationChecklist({
  hasProjects,
  hasAiUsage,
  hasTemplates,
  hasSharedProject,
  phase1Completed,
  phase3Completed,
  allPhasesCompleted,
  onNewProject,
}: ActivationChecklistProps) {
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem(DISMISSED_KEY) === "1";
    } catch {
      return false;
    }
  });

  function dismiss() {
    try {
      localStorage.setItem(DISMISSED_KEY, "1");
    } catch {
      return;
    }
    setDismissed(true);
  }

  if (dismissed) return null;

  const steps = [
    { id: "account", label: "Criar sua conta", description: "Você já está aqui.", done: true },
    { id: "project", label: "Criar o primeiro projeto", description: "Descreva seu projeto e deixe a IA trabalhar.", done: hasProjects, cta: "Criar projeto" },
    { id: "ai", label: "Gerar artefatos com IA", description: "Clique em Gerar com IA na Fase 1 do seu projeto.", done: hasAiUsage },
    { id: "templates", label: "Usar um template", description: "Comece a partir de um modelo de produto.", done: hasTemplates },
    { id: "share", label: "Compartilhar um projeto", description: "Convide alguém e gere contexto compartilhável.", done: hasSharedProject },
    { id: "phase1", label: "Concluir a Fase 1 — Diagnóstico", description: "Audite sua ideia com Lean Canvas, JTBD e Score de Potencial.", done: phase1Completed, href: hasProjects ? "/dashboard" : undefined },
    { id: "phase3", label: "Chegar na metade — Fase 3", description: "Segurança, LGPD e privacidade mapeados antes da arquitetura.", done: phase3Completed },
    { id: "complete", label: "Concluir as 7 fases", description: "Do diagnóstico ao lançamento — produto pronto.", done: allPhasesCompleted },
  ];

  const doneCount = steps.filter((step) => step.done).length;
  const pct = Math.round((doneCount / steps.length) * 100);
  const nextStep = steps.find((step) => !step.done);
  const allDone = doneCount === steps.length;

  if (allDone) {
    return (
      <div className="glass-card rounded-2xl p-5 mb-8 flex items-center gap-4">
        <div className="text-3xl flex-shrink-0">🏆</div>
        <div className="flex-1">
          <h3 className="font-serif text-lg text-foreground mb-0.5">Ativação completa!</h3>
          <p className="text-sm text-muted-foreground">Você passou por todas as etapas. Seu produto está pronto para o mercado.</p>
        </div>
        <button onClick={dismiss} className="text-xs text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
          Fechar
        </button>
      </div>
    );
  }

  return (
    <div className="glass-card rounded-2xl p-5 mb-8">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="font-serif text-base text-foreground">Primeiros passos</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{doneCount} de {steps.length} etapas concluídas</p>
        </div>
        <button
          onClick={dismiss}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Fechar checklist de ativação"
        >
          Ocultar
        </button>
      </div>

      <div className="w-full bg-muted rounded-full h-1.5 mb-5" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${pct}% das etapas concluídas`}>
        <div className="bg-primary h-1.5 rounded-full transition-all duration-700" style={{ width: `${pct}%` }} />
      </div>

      <div className="space-y-2">
        {steps.map((step, i) => {
          const isNext = step.id === nextStep?.id;
          return (
            <div
              key={step.id}
              className={`flex items-start gap-3 p-3 rounded-xl border transition-all ${step.done ? "bg-secondary/40 border-border/70 opacity-60" : isNext ? "bg-primary/5 border-primary/20" : "bg-background border-border/70 opacity-80"}`}
            >
              <div className={`w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center border mt-0.5 ${step.done ? "bg-primary border-primary" : isNext ? "border-primary/50 bg-background" : "border-muted-foreground/30 bg-background"}`} aria-hidden="true">
                {step.done ? (
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                    <path d="M2 5l2 2 4-4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                ) : (
                  <span className="text-[9px] font-bold text-muted-foreground">{i + 1}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium leading-snug ${step.done ? "line-through text-muted-foreground" : isNext ? "text-foreground" : "text-muted-foreground"}`}>
                  {step.label}
                </div>
                {!step.done && <div className="text-xs text-muted-foreground mt-0.5 leading-snug">{step.description}</div>}
              </div>
              {isNext && step.cta && (
                <button onClick={onNewProject} className="text-xs text-white bg-primary hover:bg-primary/90 px-3 py-1 rounded-lg flex-shrink-0 font-medium transition-colors">
                  {step.cta}
                </button>
              )}
              {isNext && step.href && (
                <Link href={step.href}>
                  <span className="text-xs text-primary hover:underline flex-shrink-0 font-medium">Ir →</span>
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
