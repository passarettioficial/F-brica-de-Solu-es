import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useUser } from "@clerk/react";
import {
  useGetCurrentUser,
  useUpdateUserSettings,
  getGetCurrentUserQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { usePlan } from "@/hooks/usePlan";
import { resetOnboarding } from "@/components/onboarding-tour";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function SettingsPage() {
  const { user: clerkUser } = useUser();
  const { permissions } = usePlan();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { data: userProfile, isLoading } = useGetCurrentUser();
  const updateSettings = useUpdateUserSettings();

  const [displayName, setDisplayName] = useState("");
  const [lgpdRequested, setLgpdRequested] = useState(false);

  useEffect(() => {
    if (userProfile?.displayName) {
      setDisplayName(userProfile.displayName);
    } else if (clerkUser?.firstName) {
      setDisplayName(clerkUser.firstName);
    }
  }, [userProfile, clerkUser]);

  function handleSave() {
    updateSettings.mutate(
      { data: { displayName: displayName.trim() } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetCurrentUserQueryKey() });
          toast({ title: "Configuracoes salvas com sucesso!" });
        },
        onError: () => {
          toast({ title: "Erro ao salvar", description: "Tente novamente.", variant: "destructive" });
        },
      }
    );
  }

  async function handleDeleteRequest() {
    if (!confirm("Isso abrira um chamado de exclusao de dados conforme a LGPD. Continuar?")) return;
    try {
      await fetch(`${basePath}/api/support/tickets`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: "Solicitação de exclusão de dados (LGPD)",
          message: `Solicito a exclusão completa dos meus dados pessoais conforme o Art. 18 da LGPD. ID da conta: ${clerkUser?.id ?? "desconhecido"}.`,
          category: "lgpd",
        }),
      });
      setLgpdRequested(true);
    } catch {
      alert("Erro ao enviar solicitação. Tente pela página de Atendimento.");
    }
  }

  const aiUsagePercent = userProfile
    ? Math.round((userProfile.dailyAiUsage / userProfile.dailyAiLimit) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-background/90 sticky top-0 z-10 backdrop-blur-xl">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-muted-foreground hover:text-primary text-sm transition-colors">
              Painel
            </Link>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="text-foreground text-sm font-medium">Configurações</span>
          </div>
          <div className="flex items-center gap-3">
            {permissions.isAdmin && (
              <Link href="/admin" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
                Admin
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8 rounded-3xl border border-border bg-card p-6 shadow-sm">
          <p className="text-xs font-mono uppercase tracking-[0.18em] text-primary mb-2">PAINEL DE CONFIGURAÇÕES</p>
          <h1 className="text-3xl font-serif text-foreground">Configurações da conta</h1>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">Ajuste seu perfil, plano e preferências com a linguagem visual da marca: azul estrutural, laranja de ação e superfícies claras.</p>
        </div>

        <div className="space-y-6">
          {/* Profile */}
          <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg">Perfil</h2>
              <span className="text-xs font-mono uppercase tracking-wider text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">essencial</span>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="display-name" className="text-sm font-medium">Nome de exibição</Label>
                <Input
                  id="display-name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Seu nome"
                  className="mt-1.5"
                  data-testid="input-display-name"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">Email</Label>
                <div className="mt-1.5 text-sm text-muted-foreground">
                  {clerkUser?.emailAddresses?.[0]?.emailAddress ?? "—"}
                </div>
              </div>
              <Button
                onClick={handleSave}
                disabled={!displayName.trim() || updateSettings.isPending}
                className="bg-primary hover:bg-primary/90 text-white"
                data-testid="button-save-settings"
              >
                {updateSettings.isPending ? "Salvando..." : "Salvar alterações"}
              </Button>
            </div>
          </div>

          {/* AI Usage */}
          <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-serif text-lg mb-4">Uso de IA hoje</h2>
            {isLoading ? (
              <div className="animate-pulse h-8 bg-muted rounded" />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Execuções utilizadas</span>
                  <span className="font-medium text-foreground" data-testid="text-ai-usage">
                    {userProfile?.dailyAiUsage ?? 0} / {userProfile?.dailyAiLimit ?? 2}
                  </span>
                </div>
                <Progress value={aiUsagePercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  O limite é reiniciado diariamente. Cada execução de fase consome 1 crédito.
                </p>
              </div>
            )}
          </div>

          {/* Plan Management */}
          <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-serif text-lg">Plano atual</h2>
              <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-full border border-primary/20">
                {permissions.planName}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 mb-4 text-sm">
              {[
                { label: "IA por dia", value: permissions.aiDailyLimit >= 999 ? "Ilimitada" : `${permissions.aiDailyLimit}x` },
                { label: "Cópia de artefatos", value: permissions.canCopy ? "✓" : "✕" },
                { label: "Download de artefatos", value: permissions.canDownload ? "✓" : "✕" },
                { label: "AI Advisor", value: permissions.hasAiAdvisor ? "✓" : "✕" },
              ].map(item => (
                <div key={item.label} className="flex items-center justify-between bg-secondary/60 rounded-lg px-3 py-2 border border-border/60">
                  <span className="text-muted-foreground text-xs">{item.label}</span>
                  <span className={`text-xs font-medium ${item.value === "✕" ? "text-muted-foreground" : "text-foreground"}`}>{item.value}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link href="/billing">
                <Button variant="outline" size="sm">Gerenciar assinatura</Button>
              </Link>
              <Link href="/pricing">
                <Button size="sm" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                  {permissions.plan === "free" ? "Fazer upgrade" : "Mudar plano"}
                </Button>
              </Link>
            </div>
          </div>

          {/* Shortcuts */}
          <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-serif text-lg mb-4">Atalhos</h2>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/atendimento">
                <div className="flex items-center gap-2 bg-secondary/60 hover:bg-primary/10 rounded-lg px-3 py-2.5 cursor-pointer transition-colors border border-border/60">
                  <span>💬</span>
                  <span className="text-sm">Atendimento</span>
                </div>
              </Link>
              <Link href="/privacidade">
                <div className="flex items-center gap-2 bg-secondary/60 hover:bg-primary/10 rounded-lg px-3 py-2.5 cursor-pointer transition-colors border border-border/60">
                  <span>🔒</span>
                  <span className="text-sm">Privacidade</span>
                </div>
              </Link>
              <button
                onClick={() => { resetOnboarding(); window.location.href = `${basePath}/dashboard`; }}
                className="flex items-center gap-2 bg-secondary/60 hover:bg-primary/10 rounded-lg px-3 py-2.5 cursor-pointer transition-colors text-left border border-border/60"
              >
                <span>🎯</span>
                <span className="text-sm">Ver tour de boas-vindas</span>
              </button>
              <Link href="/billing">
                <div className="flex items-center gap-2 bg-secondary/60 hover:bg-primary/10 rounded-lg px-3 py-2.5 cursor-pointer transition-colors border border-border/60">
                  <span>💳</span>
                  <span className="text-sm">Faturamento</span>
                </div>
              </Link>
            </div>
          </div>

          {/* LGPD / Privacy */}
          <div className="bg-card border border-card-border rounded-2xl p-6 shadow-sm">
            <h2 className="font-serif text-lg mb-1">Privacidade e LGPD</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Seus dados são protegidos conforme a Lei 13.709/2018 (LGPD). Você pode exercer seus direitos a qualquer momento.
            </p>

            <div className="space-y-2 mb-4">
              <Link href="/privacidade">
                <div className="flex items-center justify-between bg-secondary/60 hover:bg-primary/10 rounded-lg px-3 py-2.5 cursor-pointer transition-colors border border-border/60">
                  <span className="text-sm">Ver política de privacidade completa</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </Link>
              <Link href="/atendimento">
                <div className="flex items-center justify-between bg-secondary/60 hover:bg-primary/10 rounded-lg px-3 py-2.5 cursor-pointer transition-colors border border-border/60">
                  <span className="text-sm">Solicitar portabilidade de dados</span>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
                </div>
              </Link>
            </div>

            {lgpdRequested ? (
              <p className="text-sm text-primary">Solicitação de exclusão enviada. Nossa equipe entrará em contato.</p>
            ) : (
              <button
                onClick={handleDeleteRequest}
                className="text-sm text-accent-foreground hover:text-primary underline transition-colors font-medium"
              >
                Solicitar exclusão de todos os meus dados
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
