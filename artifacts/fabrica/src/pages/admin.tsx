import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { AppSidebar } from "@/components/app-sidebar";
import { TabButton } from "@/components/admin/ui";
import { api } from "@/components/admin/shared";
import { OverviewTab } from "@/components/admin/OverviewTab";
import { InsightsTab } from "@/components/admin/InsightsTab";
import { AuditTab } from "@/components/admin/AuditTab";
import { UsersTab } from "@/components/admin/UsersTab";
import { CouponsTab } from "@/components/admin/CouponsTab";
import { PlansTab } from "@/components/admin/PlansTab";
import { DeliverablesTab } from "@/components/admin/DeliverablesTab";
import { ThemeTab } from "@/components/admin/ThemeTab";
import { SettingsTab } from "@/components/admin/SettingsTab";

type Tab = "overview" | "insights" | "users" | "coupons" | "plans" | "deliverables" | "theme" | "settings" | "audit";

const TABS: Array<{ id: Tab; label: string }> = [
  { id: "overview", label: "Visão geral" },
  { id: "insights", label: "Insights" },
  { id: "users", label: "Usuários" },
  { id: "coupons", label: "Cupons" },
  { id: "plans", label: "Planos & Preços" },
  { id: "deliverables", label: "Entregáveis" },
  { id: "theme", label: "Tema" },
  { id: "settings", label: "Configurações" },
  { id: "audit", label: "Audit Log" },
];

export function AdminPage() {
  const [tab, setTab] = useState<Tab>("overview");
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const [checking, setChecking] = useState(true);
  const [, navigate] = useLocation();

  useEffect(() => {
    api("/admin/me")
      .then(r => {
        if (r.status === 403 || r.status === 401) { navigate("/dashboard"); return; }
        return r.json();
      })
      .then(d => { if (d) setIsAdmin(d.isAdmin || d.isSuperuser); })
      .finally(() => setChecking(false));
  }, [navigate]);

  if (checking || isAdmin === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Verificando permissões...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <div className="text-foreground font-medium">Acesso restrito</div>
          <div className="text-muted-foreground text-sm">Você não tem permissão para acessar a administração.</div>
          <Link href="/dashboard" className="inline-flex text-sm text-primary hover:underline">Voltar ao painel</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <AppSidebar />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="topbar">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
            <Link href="/dashboard" className="hover:text-white transition-colors">Painel</Link>
            <span>/</span>
            <span style={{ color: "var(--text-primary)" }}>Administração</span>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full font-mono font-medium border" style={{ background: "color-mix(in srgb, var(--brand-primary) 15%, transparent)", color: "var(--brand-primary)", borderColor: "color-mix(in srgb, var(--brand-primary) 30%, transparent)" }}>
            ADMIN
          </span>
        </div>

        <div className="border-b px-6 flex gap-1 overflow-x-auto" style={{ borderColor: "var(--border-subtle)", background: "var(--surface-1)" }}>
          {TABS.map(t => (
            <TabButton key={t.id} label={t.label} active={tab === t.id} onClick={() => setTab(t.id)} />
          ))}
        </div>

        <main className="flex-1 overflow-y-auto px-6 py-8 max-w-6xl w-full mx-auto">
          {tab === "overview" && <OverviewTab />}
          {tab === "insights" && <InsightsTab />}
          {tab === "users" && <UsersTab />}
          {tab === "coupons" && <CouponsTab />}
          {tab === "plans" && <PlansTab />}
          {tab === "deliverables" && <DeliverablesTab />}
          {tab === "theme" && <ThemeTab />}
          {tab === "settings" && <SettingsTab />}
          {tab === "audit" && <AuditTab />}
        </main>
      </div>
    </div>
  );
}
