import { useState, useEffect } from "react";
import { api, PLAN_LABELS, type Stats } from "./shared";
import { StatCard, Sparkline } from "./ui";
import { OpenAiBudgetCard } from "./OpenAiBudgetCard";

export function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/admin/stats").then(r => r.json()).then(d => setStats(d)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted-foreground text-sm py-8">Carregando...</div>;
  if (!stats) return <div className="text-destructive text-sm py-8">Erro ao carregar estatísticas</div>;

  const freeUsers = stats.users - stats.paidUsers;
  const conversionRate = stats.users > 0 ? ((stats.paidUsers / stats.users) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      <OpenAiBudgetCard />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Usuários totais" value={stats.users} sub={`+${stats.newUsers30d} últimos 30d`} />
        <StatCard label="Projetos ativos" value={stats.projects} sub={`${stats.trashedProjects} na lixeira`} />
        <StatCard label="Usuários pagos" value={stats.paidUsers} sub={`${conversionRate}% conversão`} />
        <StatCard label="Cupons ativos" value={stats.activeCoupons} />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Inativos 14d" value={stats.inactiveUsers14d} sub="sem atividade" />
        <StatCard label="Inativos 30d" value={stats.inactiveUsers30d} sub="risco de churn" />
        <StatCard label="Usuários grátis" value={freeUsers} sub="free tier" />
        <StatCard label="Superusers" value={stats.superusers} sub="acesso total" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-foreground">Novos usuários (30d)</h3>
            <span className="text-xs font-mono text-primary">+{stats.newUsers30d}</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Cadastros por dia</p>
          <Sparkline data={stats.signupsPerDay} />
        </div>
        <div className="bg-card border border-card-border rounded-xl p-5">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-sm font-medium text-foreground">Uso de IA (30d)</h3>
            <span className="text-xs font-mono text-accent">execuções</span>
          </div>
          <p className="text-xs text-muted-foreground mb-3">Artefatos gerados por dia</p>
          <Sparkline data={stats.aiPerDay} color="var(--color-accent, #FF8C42)" />
        </div>
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5">
        <h3 className="font-medium mb-4 text-sm">Distribuição por plano</h3>
        <div className="space-y-3">
          {stats.planBreakdown.map(p => (
            <div key={p.plan} className="flex items-center gap-3">
              <div className="w-28 text-sm text-muted-foreground">{PLAN_LABELS[p.plan] ?? p.plan}</div>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-500"
                  style={{ width: `${Math.min(100, stats.users > 0 ? (p.count / stats.users) * 100 : 0)}%` }}
                />
              </div>
              <div className="text-sm font-medium w-8 text-right text-foreground">{p.count}</div>
              <div className="text-xs text-muted-foreground w-12 text-right font-mono">
                {stats.users > 0 ? ((p.count / stats.users) * 100).toFixed(0) : 0}%
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
