import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const PLANS = [
  {
    id: "basic",
    name: "Básico",
    price: "R$49",
    period: "/mês",
    description: "Leia os artefatos gerados por IA diretamente na plataforma.",
    highlight: false,
    badge: null,
    features: [
      "5 execuções de IA por dia",
      "Até 3 projetos simultâneos",
      "Todos os 7–8 artefatos por fase",
      "Leitura na plataforma",
      "Portões de qualidade por fase",
    ],
    limitations: [
      "Sem cópia de conteúdo",
      "Sem download de artefatos",
      "Sem impressão",
      "Sem AI Advisor",
    ],
    cta: "Assinar Básico",
  },
  {
    id: "pro",
    name: "Pro",
    price: "R$149",
    period: "/mês",
    description: "O plano completo para founders construindo produtos sérios.",
    highlight: true,
    badge: "Mais popular",
    features: [
      "20 execuções de IA por dia",
      "Até 10 projetos simultâneos",
      "Todos os 7–8 artefatos por fase",
      "Cópia e edição de conteúdo",
      "Download de artefatos em Markdown",
      "Portões de qualidade por fase",
      "Acesso antecipado a novidades",
    ],
    limitations: [
      "Sem AI Advisor",
    ],
    cta: "Assinar Pro",
  },
  {
    id: "advanced",
    name: "Avançado",
    price: "R$349",
    period: "/mês",
    description: "Para founders que querem um consultor de IA exclusivo para seu produto.",
    highlight: false,
    badge: "Premium",
    features: [
      "IA ilimitada por dia",
      "Projetos ilimitados",
      "Todos os 7–8 artefatos por fase",
      "Cópia, edição e impressão",
      "Download de artefatos em Markdown",
      "🤖 AI Advisor — chat com IA sobre seu produto",
      "Respostas baseadas nos seus artefatos reais",
      "Análise estratégica, técnica e de go-to-market",
      "Modelo GPT-4.1 prioritário",
    ],
    limitations: [],
    cta: "Assinar Avançado",
  },
];

const FAQ = [
  {
    q: "Posso começar no grátis e evoluir depois?",
    a: "Sim. O fluxo foi desenhado para mostrar valor antes da conversão.",
  },
  {
    q: "O que diferencia o Pro do Avançado?",
    a: "Pro libera edição, cópia e download; Avançado adiciona AI Advisor e uso ilimitado.",
  },
  {
    q: "Os artefatos são reutilizáveis?",
    a: "Sim. Eles funcionam como base viva para briefing, decisão e colaboração do time.",
  },
];

export function PricingPage() {
  const { permissions } = usePlan();
  const [loading, setLoading] = useState<string | null>(null);
  const [, navigate] = useLocation();

  async function handleSubscribe(planId: string) {
    setLoading(planId);
    try {
      const res = await fetch(`${basePath}/api/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ planId }),
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert(data.error ?? "Erro ao iniciar checkout");
      }
    } catch {
      alert("Erro de conexão");
    } finally {
      setLoading(null);
    }
  }

  const isCurrentPlan = (planId: string) => permissions.plan === planId;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar ao painel
          </Link>
          {permissions.plan !== "free" && (
            <Link href="/billing" className="text-sm text-primary hover:underline">
              Gerenciar assinatura
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <p className="text-xs font-mono font-semibold text-primary uppercase tracking-[0.22em] mb-3">Planos</p>
          <h1 className="font-serif text-4xl text-foreground mb-4">
            Escolha o plano certo para você
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Transforme ideias em produtos com IA.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative rounded-2xl border p-7 flex flex-col ${
                plan.highlight
                  ? "border-primary/30 shadow-lg bg-card"
                  : "border-card-border bg-card"
              }`}
            >
              {plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold ${
                  plan.highlight ? "bg-primary text-white" : "bg-foreground text-background"
                }`}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{plan.name}</div>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="font-serif text-4xl text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground text-sm">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground leading-snug">{plan.description}</p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                <div>
                  <ul className="space-y-2">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                        <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                {plan.limitations.length > 0 && (
                  <div className="pt-2 border-t border-border">
                    <ul className="space-y-1.5">
                      {plan.limitations.map((l, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="mt-0.5 flex-shrink-0 opacity-40">✕</span>
                          <span>{l}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {isCurrentPlan(plan.id) ? (
                <div className="w-full py-2.5 text-center rounded-lg bg-muted text-muted-foreground text-sm font-medium">
                  Plano atual
                </div>
              ) : (
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={loading === plan.id}
                  className={`w-full ${plan.highlight ? "bg-primary hover:bg-primary/90 text-white" : ""}`}
                  variant={plan.highlight ? "default" : "outline"}
                >
                  {loading === plan.id ? "Redirecionando..." : plan.cta}
                </Button>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <p className="text-xs text-muted-foreground">
            Pagamentos processados com segurança pela Stripe. Cancele a qualquer momento.
          </p>
        </div>

        <section className="mt-16 bg-card border border-card-border rounded-2xl p-6">
          <h2 className="text-xl font-serif text-foreground mb-4">Perguntas frequentes</h2>
          <div className="grid gap-3">
            {FAQ.map((item) => (
              <div key={item.q} className="rounded-xl border border-border p-4">
                <div className="text-sm font-medium text-foreground mb-1">{item.q}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Advanced plan differentiator callout */}
        <div className="mt-16">
          <div className="mb-4">
            <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">Plano avançado</h2>
          </div>
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">🤖</div>
              <div>
                <h3 className="font-serif text-xl mb-2">O que é o AI Advisor?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  O AI Advisor é um consultor de IA exclusivo do plano Avançado. Diferente da geração de artefatos, ele lê todos os seus artefatos já gerados — seu Lean Canvas, PRD, arquitetura, personas — e responde perguntas específicas sobre o <em>seu</em> produto.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { q: "\"Qual é o maior risco do meu modelo de pricing?\"", icon: "💰" },
                    { q: "\"Como eu deveria priorizar o backlog dado meu SWOT?\"", icon: "📋" },
                    { q: "\"Quais são os gaps de segurança na minha arquitetura?\"", icon: "🔒" },
                  ].map((ex, i) => (
                    <div key={i} className="bg-muted/40 rounded-lg p-3">
                      <div className="text-xl mb-1">{ex.icon}</div>
                      <p className="text-xs text-foreground italic">{ex.q}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
