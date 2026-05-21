import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface FounderProfile {
  estagio?: string;
  setor?: string;
  equipe?: string;
  cargo?: string;
  modeloNegocio?: string;
  prazoLancamento?: string;
  faturamentoMensal?: string;
  orcamentoFerramentas?: string;
  principalDesafio?: string;
}

interface Question {
  field: keyof FounderProfile;
  label: string;
  type?: "select" | "text";
  placeholder?: string;
  options?: { value: string; emoji?: string; label: string }[];
}

interface Stage {
  num: 2 | 3;
  title: string;
  subtitle: string;
  why: string;
  questions: Question[];
}

const STAGES: Stage[] = [
  {
    num: 2,
    title: "Conta um pouco mais sobre você",
    subtitle: "3 perguntas rápidas — ajuda a IA a personalizar os artefatos.",
    why: "Com isso, recomendamos as fases certas e ajustamos linguagem ao seu contexto.",
    questions: [
      {
        field: "cargo",
        label: "Qual seu papel principal?",
        options: [
          { value: "ceo", emoji: "👔", label: "CEO / Fundador" },
          { value: "cto", emoji: "💻", label: "CTO / Tech" },
          { value: "solo_founder", emoji: "🧑", label: "Solo founder" },
          { value: "produto", emoji: "🎯", label: "Produto / Design" },
          { value: "outro", emoji: "⚡", label: "Outro" },
        ],
      },
      {
        field: "modeloNegocio",
        label: "Qual modelo de negócio?",
        options: [
          { value: "b2b", emoji: "🏢", label: "B2B" },
          { value: "b2c", emoji: "👥", label: "B2C" },
          { value: "b2b2c", emoji: "🔁", label: "B2B2C" },
          { value: "marketplace", emoji: "🛒", label: "Marketplace" },
          { value: "outro", emoji: "⚡", label: "Outro" },
        ],
      },
      {
        field: "prazoLancamento",
        label: "Quando pretende lançar?",
        options: [
          { value: "ja_lancado", emoji: "✅", label: "Já lançado" },
          { value: "ate_30d", emoji: "🔥", label: "30 dias" },
          { value: "30_90d", emoji: "📅", label: "30-90 dias" },
          { value: "90_180d", emoji: "🗓️", label: "3-6 meses" },
          { value: "mais_180d", emoji: "🌱", label: "6+ meses" },
          { value: "indefinido", emoji: "🤔", label: "Indefinido" },
        ],
      },
    ],
  },
  {
    num: 3,
    title: "Última rodada de perguntas",
    subtitle: "3 últimas — pra entendermos onde podemos ajudar mais.",
    why: "Usamos isso pra montar recomendações de planos, conteúdo e parcerias relevantes pra você.",
    questions: [
      {
        field: "faturamentoMensal",
        label: "Faturamento mensal atual?",
        options: [
          { value: "zero", emoji: "🌱", label: "Pré-receita" },
          { value: "ate_10k", emoji: "💵", label: "Até R$ 10k" },
          { value: "10k_50k", emoji: "💰", label: "R$ 10k-50k" },
          { value: "50k_200k", emoji: "📈", label: "R$ 50k-200k" },
          { value: "mais_200k", emoji: "🚀", label: "R$ 200k+" },
        ],
      },
      {
        field: "orcamentoFerramentas",
        label: "Orçamento mensal para ferramentas?",
        options: [
          { value: "ate_100", emoji: "🪙", label: "Até R$ 100" },
          { value: "100_500", emoji: "💵", label: "R$ 100-500" },
          { value: "500_2k", emoji: "💰", label: "R$ 500-2k" },
          { value: "mais_2k", emoji: "💎", label: "R$ 2k+" },
        ],
      },
      {
        field: "principalDesafio",
        label: "Qual é hoje seu maior desafio? (opcional)",
        type: "text",
        placeholder: "Ex: validar se o público pagaria pelo MVP...",
      },
    ],
  },
];

const SNOOZE_KEY = "fabrica_profile_snooze";
const SNOOZE_DAYS = 3;

interface ProgressiveProfileProps {
  profileStage: number;
  totalCompletedPhases: number;
  basePath: string;
  onSaved?: () => void;
}

export function ProgressiveProfile({ profileStage, totalCompletedPhases, basePath, onSaved }: ProgressiveProfileProps) {
  const [open, setOpen] = useState(false);
  const [stage, setStage] = useState<Stage | null>(null);
  const [answers, setAnswers] = useState<FounderProfile>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Snoozed?
    const snoozedAt = localStorage.getItem(SNOOZE_KEY);
    if (snoozedAt) {
      const elapsed = Date.now() - Number(snoozedAt);
      if (elapsed < SNOOZE_DAYS * 24 * 60 * 60 * 1000) return;
    }

    // Stage 2 trigger: profileStage=1 + at least 1 phase completed
    if (profileStage === 1 && totalCompletedPhases >= 1) {
      setStage(STAGES[0]!);
      setOpen(true);
      return;
    }
    // Stage 3 trigger: profileStage=2 + at least 3 phases completed
    if (profileStage === 2 && totalCompletedPhases >= 3) {
      setStage(STAGES[1]!);
      setOpen(true);
    }
  }, [profileStage, totalCompletedPhases]);

  function select(field: keyof FounderProfile, value: string) {
    setAnswers(prev => ({ ...prev, [field]: value }));
  }

  function snooze() {
    localStorage.setItem(SNOOZE_KEY, String(Date.now()));
    setOpen(false);
  }

  async function save() {
    if (!stage) return;
    setSaving(true);
    try {
      const res = await fetch(`${basePath}/api/users/me/profile`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ founderProfile: answers, profileStage: stage.num }),
      });
      if (!res.ok) throw new Error("save failed");
      localStorage.removeItem(SNOOZE_KEY);
      setOpen(false);
      onSaved?.();
    } catch {
      // Silent fail — user can try again later
      setOpen(false);
    } finally {
      setSaving(false);
    }
  }

  if (!open || !stage) return null;

  // Required questions = non-text. Text fields are optional.
  const requiredFields = stage.questions.filter(q => q.type !== "text").map(q => q.field);
  const complete = requiredFields.every(f => Boolean(answers[f]));

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-foreground/50 backdrop-blur-sm" onClick={snooze} />

      <div className="relative bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-md p-7 animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[90vh] overflow-y-auto">
        <div className="text-center mb-2">
          <span className="text-[11px] font-mono font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full uppercase tracking-wider">
            Etapa {stage.num} de 3
          </span>
        </div>

        <h2 className="font-serif text-xl text-foreground text-center mb-2 leading-snug">
          {stage.title}
        </h2>
        <p className="text-sm text-muted-foreground text-center leading-relaxed mb-1">
          {stage.subtitle}
        </p>
        <p className="text-xs text-muted-foreground/70 text-center leading-relaxed mb-5 italic">
          {stage.why}
        </p>

        <div className="space-y-5 mb-5">
          {stage.questions.map(q => (
            <div key={q.field}>
              <p className="text-xs font-medium text-foreground mb-2">{q.label}</p>
              {q.type === "text" ? (
                <textarea
                  value={(answers[q.field] as string | undefined) ?? ""}
                  onChange={e => select(q.field, e.target.value)}
                  placeholder={q.placeholder}
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 rounded-lg text-sm border border-border bg-background text-foreground placeholder:text-muted-foreground/60 focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30 resize-none"
                />
              ) : (
                <div className="flex flex-wrap gap-2">
                  {q.options!.map(opt => (
                    <button
                      key={opt.value}
                      onClick={() => select(q.field, opt.value)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-150 ${
                        answers[q.field] === opt.value
                          ? "bg-primary text-white border-primary shadow-sm"
                          : "bg-background border-border text-foreground hover:border-primary/50"
                      }`}
                    >
                      {opt.emoji && <span>{opt.emoji}</span>}
                      <span>{opt.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between gap-3">
          <button
            onClick={snooze}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Lembrar depois
          </button>
          <Button
            onClick={save}
            disabled={!complete || saving}
            className="bg-primary hover:bg-primary/90 text-white px-6 disabled:opacity-40"
          >
            {saving ? "Salvando..." : "Continuar →"}
          </Button>
        </div>

        <p className="text-[10px] text-muted-foreground/60 text-center mt-4 leading-relaxed">
          Você pode atualizar ou apagar seus dados a qualquer momento em Configurações.
        </p>
      </div>
    </div>
  );
}
