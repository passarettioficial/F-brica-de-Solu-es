import { useState, useEffect } from "react";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";
import { AppSidebar } from "@/components/app-sidebar";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const PLAN_DETAILS: Record<string, { price: string; description: string }> = {
  founder: { price: "R$197/mês", description: "Plano completo para founders sérios" },
  studio: { price: "R$697/mês", description: "Para serial founders, consultores e equipes" },
  free: { price: "Grátis", description: "3 execuções de IA por dia, 1 projeto" },
  // legacy fallbacks
  basic: { price: "R$49/mês", description: "Plano legado — migre para Founder" },
  pro: { price: "R$149/mês", description: "Plano legado — migre para Founder" },
  advanced: { price: "R$349/mês", description: "Plano legado — migre para Studio" },
};

const BILLING_BENEFITS = [
  "Upgrade imediato para liberar mais capacidade",
  "Portal seguro para trocar ou cancelar quando quiser",
  "Plano avançado com AI Advisor e consultas estratégicas",
];

export function BillingPage() {
  const { permissions, loading } = usePlan();
  const [portalLoading, setPortalLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const search = useSearch();

  useEffect(() => {
    const params = new URLSearchParams(search);
    if (params.get("success") === "1") {
      const plan = params.get("plan");
      setSuccessMessage(`Assinatura do plano ${plan ?? ""} ativada com sucesso!`);
    }
  }, [search]);

  async function openPortal() {
    setPortalLoading(true);
    try {
      const res = await fetch(`${basePath}/api/billing/portal`, {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json() as { url?: string; error?: string };
      if (data.url) window.location.href = data.url;
      else alert(data.error ?? "Erro ao abrir portal");
    } catch {
      alert("Erro de conexão");
    } finally {
      setPortalLoading(false);
    }
  }

  const planDetail = PLAN_DETAILS[permissions.plan] ?? PLAN_DETAILS.free;
  const hasPaidPlan = permissions.plan !== "free";

  return (
    <div className="app-shell">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="topbar">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
            <Link href="/dashboard" className="hover:text-white transition-colors">Painel</Link>
            <span>/</span>
            <span style={{ color: "var(--text-primary)" }}>Assinatura</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-8 py-8 max-w-2xl w-full mx-auto space-y-6">
        <div>
          <h1 className="font-serif text-2xl mb-1">Sua assinatura</h1>
          <p className="text-sm text-muted-foreground">Gerencie seu plano e método de pagamento.</p>
        </div>

        {successMessage && (
          <div className="bg-primary/10 border border-primary/20 rounded-xl px-5 py-4 text-sm text-primary font-medium">
            {successMessage}
          </div>
        )}

        {loading ? (
          <div className="bg-card border border-card-border rounded-2xl p-6 animate-pulse h-40" />
        ) : (
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <div className="flex items-start justify-between mb-5">
              <div>
                <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">Plano atual</div>
                <div className="font-serif text-2xl text-foreground">{permissions.planName}</div>
                <div className="text-sm text-muted-foreground mt-0.5">{planDetail.price} — {planDetail.description}</div>
              </div>
              {hasPaidPlan && (
                <span className="text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">Ativo</span>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
              {[
                { label: "IA por dia", value: permissions.aiDailyLimit >= 999 ? "Ilimitada" : `${permissions.aiDailyLimit}x` },
                { label: "Cópia", value: permissions.canCopy ? "✓" : "✕" },
                { label: "Download", value: permissions.canDownload ? "✓" : "✕" },
                { label: "AI Advisor", value: permissions.hasAiAdvisor ? "✓" : "✕" },
              ].map((item) => (
                <div key={item.label} className="bg-muted/30 rounded-lg p-3 text-center">
                  <div className={`text-lg font-semibold ${item.value === "✕" ? "text-muted-foreground" : "text-foreground"}`}>
                    {item.value}
                  </div>
                  <div className="text-xs text-muted-foreground mt-0.5">{item.label}</div>
                </div>
              ))}
            </div>

            <div className="flex gap-3 flex-wrap">
              {hasPaidPlan ? (
                <Button
                  onClick={openPortal}
                  disabled={portalLoading}
                  variant="outline"
                >
                  {portalLoading ? "Redirecionando..." : "Gerenciar / Cancelar"}
                </Button>
              ) : null}
              <Link href="/pricing">
                <Button className="bg-primary hover:bg-primary/90 text-white">
                  {hasPaidPlan ? "Mudar de plano" : "Ver planos"}
                </Button>
              </Link>
            </div>
          </div>
        )}

        <div className="bg-card border border-card-border rounded-2xl p-6">
          <h2 className="font-serif text-lg mb-4">Por que fazer upgrade?</h2>
          <ul className="space-y-2">
            {BILLING_BENEFITS.map((item) => (
              <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                <span className="text-primary mt-0.5">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </div>

        {!permissions.hasAiAdvisor && !loading && (
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <div className="flex items-start gap-3">
              <div className="text-2xl">🤖</div>
              <div>
                <h3 className="font-medium mb-1">AI Advisor disponível a partir do plano Founder</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Um consultor de IA que lê todos os seus artefatos e responde perguntas específicas sobre o seu produto.
                </p>
                <Link href="/pricing">
                  <Button size="sm" variant="outline">Ver os planos</Button>
                </Link>
              </div>
            </div>
          </div>
        )}
        </main>
      </div>
    </div>
  );
}
