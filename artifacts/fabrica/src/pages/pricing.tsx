import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearch, useLocation } from "wouter";
import { useAuth } from "@clerk/react";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";
import { ThemeToggle } from "@/components/theme-toggle";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type BillingCycle = "monthly" | "yearly";
type UpgradeReason = "ai" | "projects" | "seats";

type AppliedCoupon = {
  code: string;
  discountType: string;
  discountValue: number;
  description: string | null;
  appliesTo: string | null;
};

function formatBRL(value: number): string {
  return `R$${value.toLocaleString("pt-BR", {
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}

function applyDiscount(value: number, coupon: AppliedCoupon): number {
  const discounted = coupon.discountType === "percent"
    ? value * (1 - coupon.discountValue / 100)
    : value - coupon.discountValue;
  return Math.max(0, Math.round(discounted * 100) / 100);
}

const UPGRADE_COPY: Record<UpgradeReason, { eyebrow: string; title: string; description: string; recommended: "founder" | "studio" }> = {
  ai: {
    eyebrow: "Limite de IA atingido",
    title: "Libere mais execuções de IA por dia",
    description: "Você esgotou o limite diário do plano Explorar (3 IAs/dia). Founder libera 30/dia — suficiente para fechar fases inteiras sem esperar.",
    recommended: "founder",
  },
  projects: {
    eyebrow: "Limite de projetos atingido",
    title: "Toque mais de um produto ao mesmo tempo",
    description: "Explorar mantém 1 projeto ativo. Founder libera até 5 e o Studio é ilimitado — ideal para serial founders e consultores.",
    recommended: "founder",
  },
  seats: {
    eyebrow: "Convide seu time",
    title: "Compartilhe a construção com o time",
    description: "Assentos múltiplos só no Studio: até 3 pessoas colaborando no mesmo projeto, com permissões e visibilidade.",
    recommended: "studio",
  },
};

const PLANS = [
  {
    id: "free",
    name: "Explorar",
    priceMonthly: "R$0",
    priceYearly: "R$0",
    monthlyValue: 0,
    yearlyValue: 0,
    period: "",
    description: "Teste o produto sem cartão de crédito.",
    highlight: false,
    badge: null,
    features: [
      "3 execuções de IA por dia",
      "1 projeto ativo",
      "Visualização dos artefatos na plataforma",
      "Acesso ao fluxo das 7 fases",
    ],
    limitations: [
      "Sem cópia de conteúdo",
      "Sem download de artefatos",
      "Sem AI Advisor",
    ],
    cta: "Começar grátis",
  },
  {
    id: "founder",
    name: "Founder",
    priceMonthly: "R$197",
    priceYearly: "R$1.970",
    monthlyValue: 197,
    yearlyValue: 1970,
    yearlyMonthlyEquivalent: "R$164",
    period: "/mês",
    periodYearly: "/ano",
    description: "Plano completo para founders sérios validando ou lançando um MVP.",
    highlight: true,
    badge: "Mais escolhido",
    features: [
      "30 execuções de IA por dia",
      "Até 5 projetos ativos",
      "Todos os artefatos das 7 fases",
      "Cópia, download e impressão",
      "🤖 AI Advisor — consultor de IA sobre seu produto",
      "Análise estratégica, técnica e de go-to-market",
      "Modelo GPT-4.1 prioritário",
      "Suporte por e-mail",
    ],
    limitations: [],
    cta: "Assinar Founder",
  },
  {
    id: "studio",
    name: "Studio",
    priceMonthly: "R$697",
    priceYearly: "R$6.970",
    monthlyValue: 697,
    yearlyValue: 6970,
    yearlyMonthlyEquivalent: "R$581",
    period: "/mês",
    periodYearly: "/ano",
    description: "Para serial founders, consultores e pequenas equipes de produto.",
    highlight: false,
    badge: "Premium",
    features: [
      "IA praticamente ilimitada (999/dia)",
      "Projetos ilimitados",
      "Até 3 seats incluídos",
      "Tudo do Founder + exportação white-label",
      "🤖 AI Advisor com prioridade",
      "Suporte prioritário com SLA",
      "Onboarding 1:1 com nosso time",
      "Acesso antecipado a novidades",
    ],
    limitations: [],
    cta: "Assinar Studio",
  },
];

const FAQ = [
  {
    q: "Posso começar no grátis e evoluir depois?",
    a: "Sim. O plano Explorar te deixa sentir o produto antes da conversão, sem cartão de crédito.",
  },
  {
    q: "O que diferencia o Founder do Studio?",
    a: "Founder é otimizado para solo founders validando um MVP. Studio é para serial founders, consultores e equipes — inclui projetos e seats múltiplos, IA praticamente ilimitada e onboarding 1:1.",
  },
  {
    q: "Vale a pena pagar anual?",
    a: "Sim. O plano anual sai por 10 meses (≈17% off) e inclui garantia de 14 dias.",
  },
  {
    q: "Posso cancelar quando quiser?",
    a: "Sim. Cancelamento e troca de plano são imediatos pelo portal seguro do Stripe.",
  },
  {
    q: "Os artefatos são meus?",
    a: "Sim. Tudo que a IA gera com base nos seus dados é seu — cópia, download e impressão estão habilitados nos planos pagos.",
  },
];

export function PricingPage() {
  const { permissions } = usePlan();
  const { isSignedIn, isLoaded } = useAuth();
  const [, setLocation] = useLocation();
  const [loading, setLoading] = useState<string | null>(null);
  const [cycle, setCycle] = useState<BillingCycle>("monthly");

  const [couponInput, setCouponInput] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(null);

  const search = useSearch();
  const { upgradeReason, requestedPlan } = useMemo(() => {
    const params = new URLSearchParams(search);
    const raw = params.get("upgrade");
    const reason: UpgradeReason | null = raw === "ai" || raw === "projects" || raw === "seats" ? raw : null;
    const planParam = params.get("plan");
    const plan = planParam === "founder" || planParam === "studio" ? planParam : null;
    return { upgradeReason: reason, requestedPlan: plan };
  }, [search]);

  const recommendedPlanId = upgradeReason
    ? (requestedPlan ?? UPGRADE_COPY[upgradeReason].recommended)
    : null;

  const recommendedCardRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (!recommendedPlanId) return;
    const t = setTimeout(() => {
      recommendedCardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 250);
    return () => clearTimeout(t);
  }, [recommendedPlanId]);

  async function handleSubscribe(planId: string) {
    if (!isLoaded) return;
    if (!isSignedIn) {
      const dest = `${basePath}/pricing?plan=${planId}`;
      setLocation(`/sign-in?redirect_url=${encodeURIComponent(dest)}`);
      return;
    }
    setLoading(planId);
    try {
      const res = await fetch(`${basePath}/api/billing/checkout`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          planId,
          billingCycle: cycle,
          ...(appliedCoupon && couponAppliesToPlan(planId) ? { couponCode: appliedCoupon.code } : {}),
        }),
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

  async function handleApplyCoupon() {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    if (!isLoaded) return;
    if (!isSignedIn) {
      const dest = `${basePath}/pricing`;
      setLocation(`/sign-in?redirect_url=${encodeURIComponent(dest)}`);
      return;
    }
    setCouponLoading(true);
    setCouponError(null);
    try {
      const res = await fetch(`${basePath}/api/billing/validate-coupon`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ code }),
      });
      const data = await res.json() as AppliedCoupon & { valid?: boolean; error?: string };
      if (res.ok && data.valid) {
        setAppliedCoupon({
          code: data.code,
          discountType: data.discountType,
          discountValue: data.discountValue,
          description: data.description ?? null,
          appliesTo: data.appliesTo ?? null,
        });
        setCouponInput("");
      } else {
        setCouponError(data.error ?? "Cupom inválido");
      }
    } catch {
      setCouponError("Erro de conexão");
    } finally {
      setCouponLoading(false);
    }
  }

  function removeCoupon() {
    setAppliedCoupon(null);
    setCouponError(null);
  }

  function couponAppliesToPlan(planId: string): boolean {
    if (!appliedCoupon) return false;
    if (planId === "free") return false;
    if (!appliedCoupon.appliesTo) return true;
    return appliedCoupon.appliesTo.split(",").map((p) => p.trim()).includes(planId);
  }

  const isCurrentPlan = (planId: string) => permissions.plan === planId;

  return (
    <>
    <Helmet>
      <title>Planos e Preços — FoundersFlow</title>
      <meta name="description" content="Explorar (grátis), Founder (R$197/mês) e Studio (R$697/mês). Escolha o plano ideal para validar e lançar seu produto com IA em 7 fases estruturadas. Plano anual com 17% de desconto." />
      <link rel="canonical" href="https://www.foundersflow.com.br/pricing" />
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        "mainEntity": FAQ.map(item => ({
          "@type": "Question",
          "name": item.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": item.a,
          },
        })),
      })}</script>
    </Helmet>
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/60 bg-background/85 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar ao painel
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle size={16} />
            {permissions.plan !== "free" && (
              <Link href="/billing" className="text-sm text-primary hover:underline">
                Gerenciar assinatura
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-16">
        {upgradeReason && (
          <div
            role="status"
            aria-live="polite"
            className="mb-8 rounded-2xl border border-accent/30 bg-accent/[0.05] p-5 flex items-start gap-4"
            data-testid={`upgrade-banner-${upgradeReason}`}
          >
            <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/15 flex items-center justify-center text-accent font-mono font-bold text-sm">
              ↑
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-mono uppercase tracking-wider text-accent mb-1">
                {UPGRADE_COPY[upgradeReason].eyebrow}
              </div>
              <div className="font-serif text-lg text-foreground leading-snug mb-1">
                {UPGRADE_COPY[upgradeReason].title}
              </div>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {UPGRADE_COPY[upgradeReason].description}
              </p>
            </div>
          </div>
        )}

        <div className="text-center mb-10">
          <p className="text-xs font-mono font-semibold text-primary uppercase tracking-[0.22em] mb-3">Planos</p>
          <h1 className="font-serif text-4xl text-foreground mb-4">
            Escolha o plano certo para você
          </h1>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Da ideia ao produto validado — com IA, em 7 fases.
          </p>
        </div>

        {/* Billing cycle toggle */}
        <div className="flex justify-center mb-10">
          <div className="inline-flex items-center gap-1 p-1 rounded-full border border-card-border bg-card">
            <button
              type="button"
              onClick={() => setCycle("monthly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors ${
                cycle === "monthly"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Mensal
            </button>
            <button
              type="button"
              onClick={() => setCycle("yearly")}
              className={`px-5 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
                cycle === "yearly"
                  ? "bg-primary text-white"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Anual
              <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                cycle === "yearly" ? "bg-white/20 text-white" : "bg-accent/15 text-accent"
              }`}>
                2 meses grátis
              </span>
            </button>
          </div>
        </div>

        {/* Coupon area */}
        <div className="max-w-md mx-auto mb-10">
          {appliedCoupon ? (
            <div
              className="rounded-xl border border-primary/30 bg-primary/[0.05] p-4 flex items-start gap-3"
              data-testid="coupon-applied"
            >
              <span className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/15 text-primary flex items-center justify-center text-sm font-bold">✓</span>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-foreground">
                  Cupom <span className="font-mono uppercase">{appliedCoupon.code}</span> aplicado
                </div>
                <div className="text-xs text-muted-foreground">
                  {appliedCoupon.discountType === "percent"
                    ? `${appliedCoupon.discountValue}% de desconto`
                    : `${formatBRL(appliedCoupon.discountValue)} de desconto`}
                  {appliedCoupon.description ? ` · ${appliedCoupon.description}` : ""}
                </div>
              </div>
              <button
                type="button"
                onClick={removeCoupon}
                className="flex-shrink-0 text-xs text-muted-foreground hover:text-foreground underline"
                data-testid="coupon-remove"
              >
                Remover
              </button>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={couponInput}
                  onChange={(e) => { setCouponInput(e.target.value); setCouponError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); void handleApplyCoupon(); } }}
                  placeholder="Tem um cupom? Insira o código"
                  className="flex-1 h-10 px-3 rounded-lg border border-card-border bg-card text-sm text-foreground placeholder:text-muted-foreground uppercase focus:outline-none focus:ring-2 focus:ring-primary/30"
                  data-testid="coupon-input"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void handleApplyCoupon()}
                  disabled={couponLoading || !couponInput.trim()}
                  data-testid="coupon-apply"
                >
                  {couponLoading ? "Validando..." : "Aplicar"}
                </Button>
              </div>
              {couponError && (
                <p className="mt-2 text-xs text-destructive" data-testid="coupon-error">{couponError}</p>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const isYearly = cycle === "yearly" && plan.id !== "free";
            const basePrice = isYearly ? plan.priceYearly : plan.priceMonthly;
            const baseValue = isYearly ? plan.yearlyValue : plan.monthlyValue;
            const hasDiscount = couponAppliesToPlan(plan.id);
            const displayPrice = hasDiscount && appliedCoupon
              ? formatBRL(applyDiscount(baseValue, appliedCoupon))
              : basePrice;
            const displayPeriod = isYearly ? plan.periodYearly : plan.period;
            const isRecommended = recommendedPlanId === plan.id;
            return (
            <div
              key={plan.id}
              ref={isRecommended ? recommendedCardRef : undefined}
              className={`relative rounded-2xl border p-7 flex flex-col transition-all ${
                isRecommended
                  ? "border-accent shadow-xl bg-card ring-2 ring-accent/30 ring-offset-2 ring-offset-background"
                  : plan.highlight
                  ? "border-primary/30 shadow-lg bg-card"
                  : "border-card-border bg-card"
              }`}
              data-testid={`pricing-plan-${plan.id}${isRecommended ? "-recommended" : ""}`}
            >
              {isRecommended ? (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold bg-accent text-accent-foreground whitespace-nowrap">
                  Recomendado para você
                </div>
              ) : plan.badge && (
                <div className={`absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full text-xs font-semibold ${
                  plan.highlight ? "bg-primary text-white" : "bg-foreground text-background"
                }`}>
                  {plan.badge}
                </div>
              )}

              <div className="mb-6">
                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{plan.name}</div>
                <div className="flex items-baseline gap-2 mb-1">
                  {hasDiscount && (
                    <span className="font-serif text-2xl text-muted-foreground line-through">{basePrice}</span>
                  )}
                  <span className={`font-serif text-4xl ${hasDiscount ? "text-primary" : "text-foreground"}`}>{displayPrice}</span>
                  <span className="text-muted-foreground text-sm">{displayPeriod}</span>
                </div>
                {hasDiscount && appliedCoupon && (
                  <div className="text-xs font-medium text-primary mb-2">
                    Cupom {appliedCoupon.code} aplicado
                  </div>
                )}
                {isYearly && plan.yearlyMonthlyEquivalent && (
                  <div className="text-xs text-accent font-medium mb-2">
                    ≈ {plan.yearlyMonthlyEquivalent}/mês · economize 17%
                  </div>
                )}
                {!isYearly && plan.id !== "free" && (
                  <div className="text-xs text-muted-foreground mb-2">
                    ou pague anual e economize 17%
                  </div>
                )}
                <p className="text-sm text-muted-foreground leading-snug">{plan.description}</p>
              </div>

              <div className="flex-1 space-y-4 mb-8">
                <ul className="space-y-2">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                      <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
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
              ) : plan.id === "free" ? (
                <Link href="/sign-up">
                  <Button className="w-full" variant="outline">{plan.cta}</Button>
                </Link>
              ) : (
                <Button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={!isLoaded || loading === plan.id}
                  className={`w-full ${plan.highlight ? "bg-primary hover:bg-primary/90 text-white" : ""}`}
                  variant={plan.highlight ? "default" : "outline"}
                >
                  {loading === plan.id ? "Redirecionando..." : plan.cta}
                </Button>
              )}
            </div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs text-muted-foreground">
            Garantia incondicional de 14 dias · Pagamentos processados pela Stripe · Cancele a qualquer momento
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

        {/* AI Advisor differentiator callout */}
        <div className="mt-16">
          <div className="mb-4">
            <h2 className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground">Diferencial dos planos pagos</h2>
          </div>
          <div className="glass-card rounded-2xl p-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-xl flex-shrink-0">🤖</div>
              <div>
                <h3 className="font-serif text-xl mb-2">O que é o AI Advisor?</h3>
                <p className="text-muted-foreground text-sm leading-relaxed mb-4">
                  O AI Advisor é um consultor de IA incluído nos planos Founder e Studio. Diferente da geração de artefatos, ele lê todos os seus artefatos já gerados — seu Lean Canvas, PRD, arquitetura, personas — e responde perguntas específicas sobre o <em>seu</em> produto.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { q: "\"Qual é o maior risco do meu modelo de pricing?\"", icon: "💰" },
                    { q: "\"Quais hipóteses do meu PRD têm maior risco de falhar?\"", icon: "📋" },
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
    </>
  );
}
