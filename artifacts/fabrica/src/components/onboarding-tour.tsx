import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "fabrica_onboarding_done";

const STEPS = [
  {
    title: "Bem-vindo à Fábrica de Soluções! 🏭",
    description:
      "Esta plataforma transforma sua ideia em um produto validado com o apoio da IA. Em apenas 6 fases estruturadas, você vai da concepção ao lançamento.",
    icon: "🏭",
  },
  {
    title: "Crie seu primeiro projeto",
    description:
      "Clique em '+ Iniciar nova construção' e descreva sua ideia. Quanto mais detalhes você fornecer no briefing, melhores serão os artefatos gerados pela IA.",
    icon: "📋",
  },
  {
    title: "6 fases sequenciais",
    description:
      "Cada projeto passa por: Ideação → Definição → Especificação → Prototipação → Validação → Deploy. Você precisa concluir cada fase para avançar para a próxima.",
    icon: "🔄",
  },
  {
    title: "Artefatos gerados por IA",
    description:
      "Em cada fase, a IA gera documentos detalhados como PRD, personas, diagramas de arquitetura, planos de marketing e muito mais — tudo baseado no seu briefing.",
    icon: "🤖",
  },
  {
    title: "Créditos de IA diários",
    description:
      "Cada geração consome 1 crédito. Os créditos se renovam todo dia à meia-noite. Faça upgrade do seu plano para mais créditos e recursos avançados.",
    icon: "⚡",
  },
  {
    title: "Suporte sempre disponível",
    description:
      "Acesse nossa equipe pelo botão WhatsApp ou pela página de Atendimento. Também temos um AI Advisor no plano Avançado para consultas aprofundadas sobre o seu produto.",
    icon: "💬",
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  }

  function handleComplete() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
    onComplete?.();
  }

  function handleSkip() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const current = STEPS[step]!;
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-foreground/50 backdrop-blur-sm"
        onClick={handleSkip}
      />

      {/* Modal */}
      <div className="relative bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-md p-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
        {/* Progress bar */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-t-2xl overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Icon */}
        <div className="text-5xl text-center mb-5 mt-2">{current.icon}</div>

        {/* Step counter */}
        <div className="text-center mb-4">
          <span className="text-xs font-medium text-primary bg-primary/10 px-2.5 py-1 rounded-full">
            {step + 1} de {STEPS.length}
          </span>
        </div>

        <h2 className="font-serif text-2xl text-foreground text-center mb-3 leading-snug">
          {current.title}
        </h2>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-8">
          {current.description}
        </p>

        {/* Dots */}
        <div className="flex items-center justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              className={`rounded-full transition-all duration-200 ${
                i === step ? "w-5 h-2 bg-primary" : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between">
          <button
            onClick={handleSkip}
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            Pular tour
          </button>
          <Button
            onClick={handleNext}
            className="bg-primary hover:bg-primary/90 text-white px-6"
          >
            {step < STEPS.length - 1 ? "Próximo →" : "Começar agora!"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}
