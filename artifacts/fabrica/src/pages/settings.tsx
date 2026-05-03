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
import { usePlan } from "@/hooks/usePlan";

export function SettingsPage() {
  const { user: clerkUser } = useUser();
  const { permissions } = usePlan();
  const queryClient = useQueryClient();
  const { data: userProfile, isLoading } = useGetCurrentUser();
  const updateSettings = useUpdateUserSettings();

  const [displayName, setDisplayName] = useState("");

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
        },
      }
    );
  }

  const aiUsagePercent = userProfile
    ? Math.round((userProfile.dailyAiUsage / userProfile.dailyAiLimit) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-muted-foreground hover:text-foreground text-sm transition-colors">
              Painel
            </Link>
            <span className="text-muted-foreground text-sm">/</span>
            <span className="text-foreground text-sm font-medium">Configurações</span>
          </div>
          {permissions.isAdmin && (
            <Link href="/admin" className="text-xs font-medium text-muted-foreground hover:text-foreground transition-colors">
              Admin
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-3xl font-serif text-foreground mb-8">Configurações da conta</h1>

        <div className="space-y-6">
          {/* Profile */}
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="font-serif text-lg mb-4">Perfil</h2>
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
              {updateSettings.isSuccess && (
                <p className="text-sm text-primary" data-testid="text-settings-saved">Salvo com sucesso.</p>
              )}
            </div>
          </div>

          {/* AI Usage */}
          <div className="bg-card border border-card-border rounded-xl p-6">
            <h2 className="font-serif text-lg mb-4">Uso de IA hoje</h2>
            {isLoading ? (
              <div className="animate-pulse h-8 bg-muted rounded" />
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Execuções utilizadas</span>
                  <span className="font-medium text-foreground" data-testid="text-ai-usage">
                    {userProfile?.dailyAiUsage ?? 0} / {userProfile?.dailyAiLimit ?? 50}
                  </span>
                </div>
                <Progress value={aiUsagePercent} className="h-2" />
                <p className="text-xs text-muted-foreground">
                  O limite é reiniciado diariamente. Cada execução de fase consome 1 crédito.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
