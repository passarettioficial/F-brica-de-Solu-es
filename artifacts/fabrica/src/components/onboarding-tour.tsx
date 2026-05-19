import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

const STORAGE_KEY = "fabrica_onboarding_done";
const PROFILE_KEY = "fabrica_founder_profile";

type ProfileField = "estagio" | "setor" | "equipe";
interface FounderProfile {
  estagio: string;
  setor: string;
  equipe: string;
}

const PROFILE_QUESTIONS: Array<{
  field: ProfileField;
  label: string;
  options: { value: string; emoji: string; label: string }[];
}> = [
  {
    field: "estagio",
    label: "Em que estágio está seu projeto?",
    options: [
      { value: "ideia", emoji: "💡", label: "Ideia" },
      { value: "prototipo", emoji: "🛠️", label: "Protótipo" },
      { value: "mvp", emoji: "🚀", label: "MVP" },
      { value: "tracao", emoji: "📈", label: "Tração" },
    ],
  },
  {
    field: "setor",
    label: "Qual é o setor do seu negócio?",
    options: [
      { value: "saas", emoji: "💻", label: "SaaS" },
      { value: "marketplace", emoji: "🛒", label: "Marketplace" },
      { value: "fintech", emoji: "💰", label: "Fintech" },
      { value: "healthtech", emoji: "🏥", label: "Healthtech" },
      { value: "edtech", emoji: "📚", label: "Edtech" },
      { value: "outro", emoji: "⚡", label: "Outro" },
    ],
  },
  {
    field: "equipe",
    label: "Como é sua equipe?",
    options: [
      { value: "solo", emoji: "🧑", label: "Solo" },
      { value: "cofundadores", emoji: "👥", label: "Co-fundadores" },
      { value: "time_pequeno", emoji: "👨‍👩‍👧", label: "Time pequeno" },
      { value: "time_grande", emoji: "🏢", label: "Time maior" },
    ],
  },
];

const STEPS = [
  {
    title: "Bem-vindo ao FoundersFlow!",
    description:
      "Transformamos sua ideia em produto validado em 7 fases estruturadas — da ideação ao lançamento, com IA guiando cada etapa.",
    icon: "🏭",
    tag: "Passo 1 de 4",
  },
  {
    title: "Conte um pouco sobre você",
    description: "Isso ajuda a IA a personalizar os artefatos e recomendações para o seu contexto específico.",
    icon: "👤",
    tag: "Passo 2 de 4",
    isProfile: true,
  },
  {
    title: "IA gera seus artefatos",
    description:
      "Descreva sua ideia no briefing e a IA gera PRD, personas, arquitetura, go-to-market e mais — cada fase com entregáveis prontos para usar.",
    icon: "🤖",
    tag: "Passo 3 de 4",
  },
  {
    title: "Pronto para começar?",
    description:
      "Crie seu primeiro projeto agora. Leva menos de 2 minutos e você já terá seus primeiros artefatos gerados pela IA.",
    icon: "🚀",
    tag: "Passo 4 de 4",
  },
];

interface OnboardingTourProps {
  onComplete?: () => void;
}

export function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(false);
  const [profile, setProfile] = useState<Partial<FounderProfile>>({});

  useEffect(() => {
    const done = localStorage.getItem(STORAGE_KEY);
    if (!done) {
      const timer = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, []);

  function handleSelect(field: ProfileField, value: string) {
    setProfile((prev) => ({ ...prev, [field]: value }));
  }

  function handleNext() {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      handleComplete();
    }
  }

  function handleComplete() {
    localStorage.setItem(STORAGE_KEY, "1");
    if (Object.keys(profile).length > 0) {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      // Non-blocking save to API
      const base = import.meta.env.BASE_URL.replace(/\/$/, "");
      fetch(`${base}/api/users/me/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ founderProfile: profile }),
      }).catch(() => undefined);
    }
    setVisible(false);
    onComplete?.();
  }

  function handleSkip() {
    localStorage.setItem(STORAGE_KEY, "1");
    setVisible(false);
  }

  if (!visible) return null;

  const current = STEPS[step]!;
  const isLastStep = step === STEPS.length - 1;
  const isProfileStep = (current as { isProfile?: boolean }).isProfile === true;
  const profileComplete = isProfileStep
    ? Object.keys(profile).length >= PROFILE_QUESTIONS.length
    : true;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={handleSkip} />

      <div className={`relative bg-card border border-card-border rounded-2xl shadow-2xl w-full ${isProfileStep ? "max-w-md" : "max-w-sm"} p-8 animate-in fade-in slide-in-from-bottom-4 duration-300`}>
        <div className="absolute top-0 left-0 right-0 h-1 bg-muted rounded-t-2xl overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-500"
            style={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {!isProfileStep && (
          <div className="text-4xl text-center mb-4 mt-1">{current.icon}</div>
        )}

        <div className="text-center mb-3">
          <span className="text-[11px] font-mono font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            {current.tag}
          </span>
        </div>

        <h2 className="font-serif text-xl text-foreground text-center mb-3 leading-snug">
          {current.title}
        </h2>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-5">
          {current.description}
        </p>

        {isProfileStep && (
          <div className="space-y-5 mb-5">
            {PROFILE_QUESTIONS.map((q) => (
              <div key={q.field}>
                <p className="text-xs font-medium text-muted-foreground mb-2">{q.label}</p>
                <div className="flex flex-wrap gap-2">
                  {q.options.map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => handleSelect(q.field, opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                        profile[q.field] === opt.value
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-background border-border text-foreground hover:border-primary/50"
                      }`}
                    >
                      <span>{opt.emoji}</span>
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-center gap-1.5 mb-6">
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              aria-label={`Ir para passo ${i + 1}`}
              className={`rounded-full transition-all duration-200 ${
                i === step ? "w-6 h-2 bg-primary" : "w-2 h-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
            />
          ))}
        </div>

        <div className="flex items-center justify-between">
          <button onClick={handleSkip} className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pular
          </button>
          <Button
            onClick={handleNext}
            disabled={isProfileStep && !profileComplete}
            className="bg-primary hover:bg-primary/90 text-white px-6 disabled:opacity-40"
          >
            {isLastStep ? "Criar meu projeto →" : "Próximo →"}
          </Button>
        </div>
      </div>
    </div>
  );
}

export function resetOnboarding() {
  localStorage.removeItem(STORAGE_KEY);
}
