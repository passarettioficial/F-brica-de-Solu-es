import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { subscribePaywall, type PaywallReason } from "@/lib/paywall";
import { Button } from "@/components/ui/button";

const FOCUSABLE = 'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

const PLAN_LABELS: Record<string, string> = {
  free: "Explorar",
  founder: "Founder",
  studio: "Studio",
};

const UPGRADE_OPTIONS = [
  {
    id: "founder",
    name: "Founder",
    monthly: "R$197",
    period: "/mês",
    aiPerDay: 30,
    highlight: "Recomendado",
    perks: ["30 IAs por dia", "Até 5 projetos", "AI Advisor incluído", "Suporte prioritário"],
    accent: true,
  },
  {
    id: "studio",
    name: "Studio",
    monthly: "R$697",
    period: "/mês",
    aiPerDay: 999,
    highlight: "Sem limites",
    perks: ["IA ilimitada", "Projetos ilimitados", "3 assentos de time", "Tudo do Founder"],
    accent: false,
  },
];

export function PaywallModal() {
  const [, setLocation] = useLocation();
  const [reason, setReason] = useState<PaywallReason | null>(null);
  const dialogRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    return subscribePaywall((r) => setReason(r));
  }, []);

  // Focus management + Escape close + focus trap
  useEffect(() => {
    if (!reason) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;

    const dialog = dialogRef.current;
    // Initial focus: first focusable element inside dialog
    const first = dialog?.querySelector<HTMLElement>(FOCUSABLE);
    first?.focus();

    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        e.preventDefault();
        setReason(null);
        return;
      }
      if (e.key !== "Tab" || !dialog) return;
      const focusables = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE))
        .filter((el) => !el.hasAttribute("disabled"));
      if (focusables.length === 0) return;
      const firstEl = focusables[0]!;
      const lastEl = focusables[focusables.length - 1]!;
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey && active === firstEl) {
        e.preventDefault();
        lastEl.focus();
      } else if (!e.shiftKey && active === lastEl) {
        e.preventDefault();
        firstEl.focus();
      }
    }
    document.addEventListener("keydown", onKey);

    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      previouslyFocusedRef.current?.focus?.();
    };
  }, [reason]);

  if (!reason) return null;

  const planLabel = PLAN_LABELS[reason.plan] ?? reason.plan;
  const isTrialExpired = reason.kind === "trial_expired";

  function close() {
    setReason(null);
  }

  function goToCheckout(planId: string) {
    close();
    setLocation(`/pricing?upgrade=ai&plan=${planId}`);
  }

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      aria-describedby="paywall-desc"
      ref={dialogRef}
    >
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm animate-in fade-in" onClick={close} />

      <div className="relative bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-2xl p-8 animate-in fade-in slide-in-from-bottom-4 duration-300 max-h-[92vh] overflow-y-auto">
        <button
          onClick={close}
          aria-label="Fechar"
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" strokeLinecap="round" />
          </svg>
        </button>

        {/* Header */}
        <div className="text-center mb-6">
          <span className="inline-block text-[11px] font-mono font-semibold text-accent bg-accent/10 px-2.5 py-1 rounded-full uppercase tracking-wider mb-3">
            {isTrialExpired ? "Período gratuito encerrado" : "Limite atingido"}
          </span>
          <h2 id="paywall-title" className="font-serif text-2xl text-foreground mb-2 leading-snug">
            {isTrialExpired
              ? "Seu período gratuito de 7 dias terminou"
              : `Você usou suas ${reason.limit} execuções de IA hoje`}
          </h2>
          <p id="paywall-desc" className="text-sm text-muted-foreground leading-relaxed max-w-md mx-auto">
            {isTrialExpired ? (
              <>
                {reason.context
                  ? <>A próxima ação (<span className="font-medium text-foreground">{reason.context}</span>) precisa de IA. </>
                  : "Novas execuções precisam de IA. "}
                O plano <span className="font-semibold text-foreground">{planLabel}</span> é gratuito por 7 dias. Faça upgrade para continuar executando — seu conteúdo segue disponível para visualização.
              </>
            ) : (
              <>
                {reason.context
                  ? <>A próxima ação (<span className="font-medium text-foreground">{reason.context}</span>) precisa de IA. </>
                  : "Sua próxima geração precisa de IA. "}
                Plano <span className="font-semibold text-foreground">{planLabel}</span> permite {reason.limit}/dia. Aumente agora ou volte amanhã.
              </>
            )}
          </p>
        </div>

        {/* Usage bar (apenas no limite diário) */}
        {!isTrialExpired && (
          <div className="mb-6 bg-muted/40 border border-card-border rounded-xl p-4">
            <div className="flex items-baseline justify-between mb-2">
              <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">Uso hoje</span>
              <span className="text-sm font-mono tabular-nums text-foreground">
                <span className="text-accent font-semibold">{reason.used}</span>
                <span className="text-muted-foreground"> / {reason.limit}</span>
              </span>
            </div>
            <div className="h-2 bg-background rounded-full overflow-hidden">
              <div className="h-full bg-accent" style={{ width: "100%" }} />
            </div>
          </div>
        )}

        {/* Upgrade options side-by-side */}
        <div className="grid sm:grid-cols-2 gap-3 mb-5">
          {UPGRADE_OPTIONS.map((opt) => {
            const isCurrent = opt.id === reason.plan;
            return (
              <div
                key={opt.id}
                className={`relative rounded-xl p-5 border transition-all ${
                  opt.accent
                    ? "border-primary/40 bg-primary/[0.03]"
                    : "border-card-border bg-background"
                }`}
              >
                {opt.highlight && (
                  <span className={`absolute -top-2.5 left-4 text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                    opt.accent ? "bg-primary text-white" : "bg-foreground text-background"
                  }`}>
                    {opt.highlight}
                  </span>
                )}
                <div className="mb-3">
                  <div className="font-serif text-lg text-foreground">{opt.name}</div>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-semibold text-foreground">{opt.monthly}</span>
                    <span className="text-xs text-muted-foreground">{opt.period}</span>
                  </div>
                </div>
                <div className="mb-3 pb-3 border-b border-card-border">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-1">IA por dia</div>
                  <div className="font-serif text-xl text-primary">
                    {opt.aiPerDay >= 999 ? "Ilimitado" : `${opt.aiPerDay}×`}
                    {!isTrialExpired && (
                      <span className="text-xs text-muted-foreground font-sans ml-1.5">
                        vs {reason.limit} atual
                      </span>
                    )}
                  </div>
                </div>
                <ul className="space-y-1.5 mb-4">
                  {opt.perks.map((perk) => (
                    <li key={perk} className="text-xs text-muted-foreground flex items-start gap-1.5">
                      <span className="text-primary mt-0.5">✓</span>
                      <span>{perk}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  onClick={() => goToCheckout(opt.id)}
                  disabled={isCurrent}
                  className={`w-full text-sm font-semibold ${
                    opt.accent
                      ? "bg-accent hover:bg-accent/90 text-accent-foreground"
                      : "bg-primary hover:bg-primary/90 text-white"
                  } disabled:opacity-40`}
                  data-testid={`paywall-upgrade-${opt.id}`}
                >
                  {isCurrent ? "Plano atual" : `Desbloquear por ${opt.monthly}`}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="flex items-center justify-between text-xs">
          <button
            onClick={close}
            className="text-muted-foreground hover:text-foreground transition-colors"
            data-testid="paywall-dismiss"
          >
            {isTrialExpired ? "Continuar só lendo" : "Voltar amanhã"}
          </button>
          <span className="text-muted-foreground">
            Cancele quando quiser · Sem fidelidade
          </span>
        </div>
      </div>
    </div>
  );
}
