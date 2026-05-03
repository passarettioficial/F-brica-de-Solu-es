import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type Tab = "overview" | "users" | "coupons" | "plans" | "deliverables" | "theme" | "settings";

interface Stats {
  users: number;
  projects: number;
  admins: number;
  superusers: number;
  activeCoupons: number;
  planBreakdown: Array<{ plan: string; count: number }>;
}

interface User {
  id: number;
  clerkId: string;
  displayName: string | null;
  plan: string;
  isAdmin: boolean;
  isSuperuser: boolean;
  stripeSubscriptionStatus: string | null;
  createdAt: string;
}

interface Coupon {
  id: number;
  code: string;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  usesCount: number;
  expiresAt: string | null;
  active: boolean;
  appliesTo: string | null;
  description: string | null;
}

interface Setting {
  id: number;
  key: string;
  value: string;
  label: string | null;
  category: string;
}

const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  basic: "Básico",
  pro: "Pro",
  advanced: "Avançado",
};

const ALL_DELIVERABLES: Array<{ phase: number; phaseName: string; key: string; label: string }> = [
  { phase: 1, phaseName: "IDEIA", key: "LEAN_CANVAS", label: "Lean Canvas" },
  { phase: 1, phaseName: "IDEIA", key: "JTBD", label: "Jobs to Be Done" },
  { phase: 1, phaseName: "IDEIA", key: "ANALISE_COMPETITIVA", label: "Análise Competitiva" },
  { phase: 1, phaseName: "IDEIA", key: "SWOT", label: "Análise SWOT" },
  { phase: 1, phaseName: "IDEIA", key: "DIMENSIONAMENTO_MERCADO", label: "TAM / SAM / SOM" },
  { phase: 1, phaseName: "IDEIA", key: "VALIDACAO_RAPIDA", label: "Script de Validação" },
  { phase: 1, phaseName: "IDEIA", key: "HIPOTESE_CENTRAL", label: "Hipótese Central" },
  { phase: 1, phaseName: "IDEIA", key: "SCORE_POTENCIAL", label: "Score de Potencial" },
  { phase: 2, phaseName: "PRD", key: "PRD", label: "Product Requirements Document" },
  { phase: 2, phaseName: "PRD", key: "PERSONAS", label: "Personas" },
  { phase: 2, phaseName: "PRD", key: "USER_STORIES", label: "User Stories" },
  { phase: 2, phaseName: "PRD", key: "METRICAS_SUCESSO", label: "Framework de Métricas" },
  { phase: 2, phaseName: "PRD", key: "HIPOTESE_PRICING", label: "Estratégia de Pricing" },
  { phase: 2, phaseName: "PRD", key: "BENCHMARKING", label: "Benchmarking" },
  { phase: 2, phaseName: "PRD", key: "ROADMAP_3_MESES", label: "Roadmap 3 Meses" },
  { phase: 3, phaseName: "SPEC", key: "ARQUITETURA", label: "Arquitetura do Sistema" },
  { phase: 3, phaseName: "SPEC", key: "MODELO_DADOS", label: "Modelo de Dados" },
  { phase: 3, phaseName: "SPEC", key: "CONTRATOS_API", label: "Contratos de API" },
  { phase: 3, phaseName: "SPEC", key: "SEGURANCA", label: "Plano de Segurança" },
  { phase: 3, phaseName: "SPEC", key: "FLUXOS_UI", label: "Fluxos de UX" },
  { phase: 3, phaseName: "SPEC", key: "ESCALABILIDADE", label: "Plano de Escalabilidade" },
  { phase: 3, phaseName: "SPEC", key: "ADR", label: "Architecture Decision Records" },
  { phase: 3, phaseName: "SPEC", key: "SETUP_DEVOPS", label: "DevOps & Infra" },
  { phase: 4, phaseName: "IMPLEMENTAÇÃO", key: "MILESTONES", label: "Plano de Milestones" },
  { phase: 4, phaseName: "IMPLEMENTAÇÃO", key: "SPRINT_1", label: "Sprint 1 Detalhado" },
  { phase: 4, phaseName: "IMPLEMENTAÇÃO", key: "ESTRUTURA_PASTAS", label: "Estrutura do Projeto" },
  { phase: 4, phaseName: "IMPLEMENTAÇÃO", key: "README", label: "README Completo" },
  { phase: 4, phaseName: "IMPLEMENTAÇÃO", key: "GUIA_CONTRIBUICAO", label: "CONTRIBUTING.md" },
  { phase: 4, phaseName: "IMPLEMENTAÇÃO", key: "TECH_DEBT_LOG", label: "Log de Débito Técnico" },
  { phase: 4, phaseName: "IMPLEMENTAÇÃO", key: "DEFINITION_OF_DONE", label: "Definition of Done" },
  { phase: 5, phaseName: "TESTE", key: "PLANO_TESTES", label: "Plano de Testes" },
  { phase: 5, phaseName: "TESTE", key: "CASOS_TESTE_CRITICOS", label: "20 Casos de Teste Críticos" },
  { phase: 5, phaseName: "TESTE", key: "CHECKLIST_QA", label: "Checklist de QA" },
  { phase: 5, phaseName: "TESTE", key: "SCRIPT_USER_TEST", label: "Script de Teste com Usuários" },
  { phase: 5, phaseName: "TESTE", key: "RELATORIO_PERFORMANCE", label: "Benchmarks de Performance" },
  { phase: 5, phaseName: "TESTE", key: "BUGS_PREVENCAO", label: "Top 10 Bugs a Prevenir" },
  { phase: 5, phaseName: "TESTE", key: "OBSERVABILIDADE", label: "Plano de Observabilidade" },
  { phase: 6, phaseName: "DEPLOY", key: "RUNBOOK_DEPLOY", label: "Runbook de Deploy" },
  { phase: 6, phaseName: "DEPLOY", key: "GTM", label: "Plano Go-to-Market" },
  { phase: 6, phaseName: "DEPLOY", key: "LAUNCH_CHECKLIST", label: "Launch Checklist" },
  { phase: 6, phaseName: "DEPLOY", key: "METRICAS_POS_LAUNCH", label: "Dashboard Pós-Lançamento" },
  { phase: 6, phaseName: "DEPLOY", key: "PLANO_CRESCIMENTO_90_DIAS", label: "Plano de Crescimento 90 Dias" },
  { phase: 6, phaseName: "DEPLOY", key: "PITCH_INVESTIDORES", label: "Narrativa para Investidores" },
  { phase: 6, phaseName: "DEPLOY", key: "SLA_SUPORTE", label: "SLA & Plano de Suporte" },
];

const DEFAULT_PLAN_PRICES: Record<string, { price: string; aiLimit: number; maxProjects: number; canCopy: boolean; canDownload: boolean; canPrint: boolean; hasAiAdvisor: boolean }> = {
  basic: { price: "R$49", aiLimit: 5, maxProjects: 3, canCopy: false, canDownload: false, canPrint: false, hasAiAdvisor: false },
  pro: { price: "R$149", aiLimit: 20, maxProjects: 10, canCopy: true, canDownload: true, canPrint: false, hasAiAdvisor: false },
  advanced: { price: "R$349", aiLimit: 999, maxProjects: 999, canCopy: true, canDownload: true, canPrint: true, hasAiAdvisor: true },
};

function api(path: string, options?: RequestInit) {
  return fetch(`${basePath}/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? "bg-primary text-white"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}

function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className="text-2xl font-serif font-normal text-foreground">{value}</div>
      <div className="text-sm font-medium text-foreground mt-1">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api("/admin/stats").then(r => r.json()).then(d => setStats(d)).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted-foreground text-sm py-8">Carregando...</div>;
  if (!stats) return <div className="text-destructive text-sm py-8">Erro ao carregar estatísticas</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Usuários" value={stats.users} />
        <StatCard label="Projetos" value={stats.projects} />
        <StatCard label="Cupons ativos" value={stats.activeCoupons} />
        <StatCard label="Superusers" value={stats.superusers} />
      </div>

      <div className="bg-card border border-card-border rounded-xl p-5">
        <h3 className="font-medium mb-3 text-sm">Distribuição por plano</h3>
        <div className="space-y-2">
          {stats.planBreakdown.map(p => (
            <div key={p.plan} className="flex items-center gap-3">
              <div className="w-24 text-sm text-muted-foreground">{PLAN_LABELS[p.plan] ?? p.plan}</div>
              <div className="flex-1 bg-muted rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{ width: `${Math.min(100, (p.count / stats.users) * 100)}%` }}
                />
              </div>
              <div className="text-sm font-medium w-8 text-right">{p.count}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Users Tab ─────────────────────────────────────────────────────────────────
function UsersTab() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState<string | null>(null);
  const { toast } = useToast();

  const load = useCallback(() => {
    setLoading(true);
    api("/admin/users").then(r => r.json()).then(d => setUsers(d.users ?? [])).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const updateUser = async (clerkId: string, patch: Partial<User>) => {
    setSaving(clerkId);
    try {
      const r = await api(`/admin/users/${encodeURIComponent(clerkId)}`, { method: "PATCH", body: JSON.stringify(patch) });
      if (!r.ok) throw new Error((await r.json()).error);
      const { user } = await r.json() as { user: User };
      setUsers(prev => prev.map(u => u.clerkId === clerkId ? { ...u, ...user } : u));
      toast({ title: "Usuário atualizado" });
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    } finally {
      setSaving(null);
    }
  };

  const filtered = users.filter(u =>
    !search ||
    (u.displayName ?? "").toLowerCase().includes(search.toLowerCase()) ||
    u.clerkId.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <Input
        placeholder="Buscar por nome ou Clerk ID..."
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="max-w-sm"
      />

      {loading ? (
        <div className="text-muted-foreground text-sm">Carregando...</div>
      ) : (
        <div className="rounded-xl border border-card-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usuário</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plano</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Admin</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Superuser</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(u => (
                <tr key={u.clerkId} className="bg-card hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3">
                    <div className="font-medium text-foreground">{u.displayName ?? "—"}</div>
                    <div className="text-xs text-muted-foreground font-mono">{u.clerkId.slice(0, 16)}...</div>
                  </td>
                  <td className="px-4 py-3">
                    <select
                      className="text-xs border border-border rounded px-2 py-1 bg-background"
                      value={u.plan}
                      onChange={e => updateUser(u.clerkId, { plan: e.target.value })}
                      disabled={saving === u.clerkId}
                    >
                      {["free", "basic", "pro", "advanced"].map(p => (
                        <option key={p} value={p}>{PLAN_LABELS[p]}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={u.isAdmin}
                      onChange={e => updateUser(u.clerkId, { isAdmin: e.target.checked })}
                      disabled={saving === u.clerkId}
                      className="accent-primary"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={u.isSuperuser}
                      onChange={e => updateUser(u.clerkId, { isSuperuser: e.target.checked })}
                      disabled={saving === u.clerkId}
                      className="accent-primary"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      u.stripeSubscriptionStatus === "active"
                        ? "bg-primary/10 text-primary"
                        : "bg-muted text-muted-foreground"
                    }`}>
                      {u.stripeSubscriptionStatus ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {saving === u.clerkId && (
                      <span className="text-xs text-muted-foreground">Salvando...</span>
                    )}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum usuário encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Coupons Tab ───────────────────────────────────────────────────────────────
function CouponsTab() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    code: "", discountType: "percent" as "percent" | "fixed", discountValue: "",
    maxUses: "", expiresAt: "", appliesTo: "", description: "",
  });
  const { toast } = useToast();

  const load = () => {
    setLoading(true);
    api("/admin/coupons").then(r => r.json()).then(d => setCoupons(d.coupons ?? [])).finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!form.code || !form.discountValue) return;
    setCreating(true);
    try {
      const r = await api("/admin/coupons", {
        method: "POST",
        body: JSON.stringify({
          code: form.code,
          discountType: form.discountType,
          discountValue: parseFloat(form.discountValue),
          maxUses: form.maxUses ? parseInt(form.maxUses) : undefined,
          expiresAt: form.expiresAt || undefined,
          appliesTo: form.appliesTo || undefined,
          description: form.description || undefined,
        }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Cupom criado" });
      setForm({ code: "", discountType: "percent", discountValue: "", maxUses: "", expiresAt: "", appliesTo: "", description: "" });
      load();
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    } finally {
      setCreating(false);
    }
  };

  const toggle = async (c: Coupon) => {
    const r = await api(`/admin/coupons/${c.id}`, { method: "PATCH", body: JSON.stringify({ active: !c.active }) });
    if (r.ok) { const { coupon } = await r.json() as { coupon: Coupon }; setCoupons(prev => prev.map(x => x.id === c.id ? coupon : x)); }
  };

  const del = async (id: number) => {
    if (!confirm("Desativar este cupom?")) return;
    await api(`/admin/coupons/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-6">
      {/* Create form */}
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h3 className="font-medium mb-4">Criar novo cupom</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Código *</Label>
            <Input
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              placeholder="PROMO20"
              className="mt-1 font-mono"
            />
          </div>
          <div>
            <Label className="text-xs">Tipo de desconto *</Label>
            <select
              className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background"
              value={form.discountType}
              onChange={e => setForm(f => ({ ...f, discountType: e.target.value as "percent" | "fixed" }))}
            >
              <option value="percent">Percentual (%)</option>
              <option value="fixed">Valor fixo (R$)</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Valor *</Label>
            <Input
              type="number"
              value={form.discountValue}
              onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))}
              placeholder={form.discountType === "percent" ? "20" : "49"}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Máximo de usos (em branco = ilimitado)</Label>
            <Input
              type="number"
              value={form.maxUses}
              onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
              placeholder="100"
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Expira em</Label>
            <Input
              type="date"
              value={form.expiresAt}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
              className="mt-1"
            />
          </div>
          <div>
            <Label className="text-xs">Aplicável a planos (básico,pro,advanced ou em branco = todos)</Label>
            <Input
              value={form.appliesTo}
              onChange={e => setForm(f => ({ ...f, appliesTo: e.target.value }))}
              placeholder="pro,advanced"
              className="mt-1"
            />
          </div>
          <div className="md:col-span-3">
            <Label className="text-xs">Descrição</Label>
            <Input
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              placeholder="Cupom de lançamento — 20% de desconto"
              className="mt-1"
            />
          </div>
        </div>
        <Button
          onClick={create}
          disabled={creating || !form.code || !form.discountValue}
          className="mt-4 bg-primary hover:bg-primary/90 text-white"
        >
          {creating ? "Criando..." : "Criar cupom"}
        </Button>
      </div>

      {/* List */}
      <div className="rounded-xl border border-card-border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Código</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Desconto</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Usos</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Expira</th>
              <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {coupons.map(c => (
              <tr key={c.id} className="bg-card hover:bg-muted/20">
                <td className="px-4 py-3">
                  <div className="font-mono font-medium">{c.code}</div>
                  <div className="text-xs text-muted-foreground">{c.description ?? "—"}</div>
                </td>
                <td className="px-4 py-3">
                  {c.discountType === "percent" ? `${c.discountValue}%` : `R$${c.discountValue}`}
                  {c.appliesTo && <div className="text-xs text-muted-foreground">{c.appliesTo}</div>}
                </td>
                <td className="px-4 py-3">
                  {c.usesCount}{c.maxUses !== null ? ` / ${c.maxUses}` : " / ∞"}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("pt-BR") : "—"}
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {c.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="outline" onClick={() => toggle(c)} className="text-xs h-7">
                      {c.active ? "Desativar" : "Ativar"}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => del(c.id)} className="text-xs h-7 text-destructive hover:text-destructive">
                      ✕
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {coupons.length === 0 && !loading && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Nenhum cupom criado ainda</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Plans Tab ─────────────────────────────────────────────────────────────────
function PlansTab() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [planConfig, setPlanConfig] = useState<typeof DEFAULT_PLAN_PRICES>(DEFAULT_PLAN_PRICES);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api("/admin/settings").then(r => r.json()).then(d => {
      const s: Setting[] = d.settings ?? [];
      setSettings(s);
      // Load plan settings
      const cfg = { ...DEFAULT_PLAN_PRICES };
      for (const plan of ["basic", "pro", "advanced"] as const) {
        const price = s.find(x => x.key === `plan_${plan}_price`)?.value;
        const aiLimit = s.find(x => x.key === `plan_${plan}_ai_limit`)?.value;
        const maxProj = s.find(x => x.key === `plan_${plan}_max_projects`)?.value;
        if (price) cfg[plan].price = price;
        if (aiLimit) cfg[plan].aiLimit = parseInt(aiLimit);
        if (maxProj) cfg[plan].maxProjects = parseInt(maxProj);
      }
      setPlanConfig(cfg);
    });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const updates: Array<{ key: string; value: string; label: string; category: string }> = [];
      for (const [plan, cfg] of Object.entries(planConfig)) {
        updates.push({ key: `plan_${plan}_price`, value: cfg.price, label: `${plan} price`, category: "plan" });
        updates.push({ key: `plan_${plan}_ai_limit`, value: String(cfg.aiLimit), label: `${plan} AI limit`, category: "plan" });
        updates.push({ key: `plan_${plan}_max_projects`, value: String(cfg.maxProjects), label: `${plan} max projects`, category: "plan" });
      }
      const r = await api("/admin/settings", { method: "PUT", body: JSON.stringify({ settings: updates }) });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Configurações de plano salvas" });
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const update = (plan: string, field: string, value: string | number | boolean) => {
    setPlanConfig(prev => ({ ...prev, [plan]: { ...prev[plan as keyof typeof prev], [field]: value } }));
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ajuste os valores exibidos nos planos. Para alterar preços efetivos no Stripe, use o dashboard da Stripe diretamente.
      </p>

      <div className="grid gap-4">
        {(["basic", "pro", "advanced"] as const).map(plan => (
          <div key={plan} className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-medium capitalize">{PLAN_LABELS[plan]}</h3>
              {plan === "pro" && <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">Mais popular</span>}
              {plan === "advanced" && <span className="text-xs px-2 py-0.5 bg-foreground/10 text-foreground rounded-full">Premium</span>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Preço exibido</Label>
                <Input
                  value={planConfig[plan]?.price ?? ""}
                  onChange={e => update(plan, "price", e.target.value)}
                  placeholder="R$49"
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Limite de IA por dia</Label>
                <Input
                  type="number"
                  value={planConfig[plan]?.aiLimit ?? ""}
                  onChange={e => update(plan, "aiLimit", parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs">Máximo de projetos</Label>
                <Input
                  type="number"
                  value={planConfig[plan]?.maxProjects ?? ""}
                  onChange={e => update(plan, "maxProjects", parseInt(e.target.value))}
                  className="mt-1"
                />
              </div>
            </div>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { key: "canCopy", label: "Copiar conteúdo" },
                { key: "canDownload", label: "Download Markdown" },
                { key: "canPrint", label: "Impressão" },
                { key: "hasAiAdvisor", label: "AI Advisor" },
              ].map(f => (
                <label key={f.key} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={planConfig[plan]?.[f.key as keyof typeof planConfig.basic] as boolean ?? false}
                    onChange={e => update(plan, f.key, e.target.checked)}
                    className="accent-primary"
                  />
                  <span className="text-muted-foreground">{f.label}</span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90 text-white">
        {saving ? "Salvando..." : "Salvar configurações"}
      </Button>
    </div>
  );
}

// ─── Deliverables Tab ──────────────────────────────────────────────────────────
function DeliverablesTab() {
  const [deliverables, setDeliverables] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    api("/admin/deliverables").then(r => r.json()).then(d => {
      const map: Record<string, boolean> = {};
      for (const item of ALL_DELIVERABLES) {
        // Default all enabled if not set
        map[item.key] = d.deliverables?.[item.key] !== false;
      }
      setDeliverables(map);
    }).finally(() => setLoading(false));
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await api("/admin/deliverables", { method: "PUT", body: JSON.stringify({ deliverables }) });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Entregáveis atualizados" });
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const toggle = (key: string) => setDeliverables(prev => ({ ...prev, [key]: !prev[key] }));
  const toggleAll = (phase: number, val: boolean) => {
    const keys = ALL_DELIVERABLES.filter(d => d.phase === phase).map(d => d.key);
    setDeliverables(prev => { const next = { ...prev }; for (const k of keys) next[k] = val; return next; });
  };

  const phases = [1, 2, 3, 4, 5, 6];

  if (loading) return <div className="text-muted-foreground text-sm py-8">Carregando...</div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ative ou desative entregáveis por fase. Entregáveis desativados não são gerados pela IA.
      </p>

      {phases.map(phase => {
        const items = ALL_DELIVERABLES.filter(d => d.phase === phase);
        const phaseEnabled = items.filter(d => deliverables[d.key] !== false).length;
        const phaseName = items[0]?.phaseName ?? "";
        return (
          <div key={phase} className="bg-card border border-card-border rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 bg-muted/30 border-b border-border">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">Fase {phase}</span>
                <span className="font-medium text-sm">{phaseName}</span>
                <span className="text-xs text-muted-foreground">({phaseEnabled}/{items.length} ativos)</span>
              </div>
              <div className="flex gap-2">
                <button onClick={() => toggleAll(phase, true)} className="text-xs text-primary hover:underline">Ativar todos</button>
                <span className="text-muted-foreground text-xs">·</span>
                <button onClick={() => toggleAll(phase, false)} className="text-xs text-muted-foreground hover:underline">Desativar todos</button>
              </div>
            </div>
            <div className="divide-y divide-border">
              {items.map(item => (
                <label key={item.key} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/10 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={deliverables[item.key] !== false}
                    onChange={() => toggle(item.key)}
                    className="accent-primary"
                  />
                  <div>
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className="text-xs font-mono text-muted-foreground">{item.key}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        );
      })}

      <Button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90 text-white">
        {saving ? "Salvando..." : "Salvar entregáveis"}
      </Button>
    </div>
  );
}

// ─── Theme Tab ─────────────────────────────────────────────────────────────────
function ThemeTab() {
  const [theme, setTheme] = useState({
    primaryH: "16", primaryS: "72", primaryL: "42",
    backgroundH: "40", backgroundS: "33", backgroundL: "98",
    fontSerif: "Space Grotesk",
    fontSans: "Inter",
    borderRadius: "0.5",
    appName: "Fábrica de Soluções",
    appTagline: "Transforme ideias em produtos com IA",
  });
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<Setting[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    api("/admin/settings").then(r => r.json()).then(d => {
      const s: Setting[] = d.settings ?? [];
      setSettings(s);
      const get = (key: string, def: string) => s.find(x => x.key === key)?.value ?? def;
      setTheme({
        primaryH: get("theme_primary_h", "16"),
        primaryS: get("theme_primary_s", "72"),
        primaryL: get("theme_primary_l", "42"),
        backgroundH: get("theme_background_h", "40"),
        backgroundS: get("theme_background_s", "33"),
        backgroundL: get("theme_background_l", "98"),
        fontSerif: get("theme_font_serif", "Space Grotesk"),
        fontSans: get("theme_font_sans", "Inter"),
        borderRadius: get("theme_border_radius", "0.5"),
        appName: get("app_name", "Fábrica de Soluções"),
        appTagline: get("app_tagline", "Transforme ideias em produtos com IA"),
      });
    });
  }, []);

  const primaryColor = `hsl(${theme.primaryH}, ${theme.primaryS}%, ${theme.primaryL}%)`;
  const bgColor = `hsl(${theme.backgroundH}, ${theme.backgroundS}%, ${theme.backgroundL}%)`;

  const save = async () => {
    setSaving(true);
    try {
      const updates = [
        { key: "theme_primary_h", value: theme.primaryH, label: "Primary color H", category: "theme" },
        { key: "theme_primary_s", value: theme.primaryS, label: "Primary color S", category: "theme" },
        { key: "theme_primary_l", value: theme.primaryL, label: "Primary color L", category: "theme" },
        { key: "theme_background_h", value: theme.backgroundH, label: "Background H", category: "theme" },
        { key: "theme_background_s", value: theme.backgroundS, label: "Background S", category: "theme" },
        { key: "theme_background_l", value: theme.backgroundL, label: "Background L", category: "theme" },
        { key: "theme_font_serif", value: theme.fontSerif, label: "Serif font", category: "theme" },
        { key: "theme_font_sans", value: theme.fontSans, label: "Sans font", category: "theme" },
        { key: "theme_border_radius", value: theme.borderRadius, label: "Border radius", category: "theme" },
        { key: "app_name", value: theme.appName, label: "App name", category: "branding" },
        { key: "app_tagline", value: theme.appTagline, label: "App tagline", category: "branding" },
      ];
      const r = await api("/admin/settings", { method: "PUT", body: JSON.stringify({ settings: updates }) });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Tema salvo", description: "Recarregue a página para ver o novo tema." });
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const sliderField = (label: string, key: keyof typeof theme, min: number, max: number, suffix: string) => (
    <div>
      <div className="flex justify-between mb-1">
        <Label className="text-xs">{label}</Label>
        <span className="text-xs text-muted-foreground">{theme[key]}{suffix}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={parseInt(theme[key] as string)}
        onChange={e => setTheme(t => ({ ...t, [key]: e.target.value }))}
        className="w-full accent-primary"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="rounded-xl overflow-hidden border border-card-border">
        <div
          className="p-6"
          style={{ backgroundColor: bgColor, fontFamily: `${theme.fontSans}, sans-serif` }}
        >
          <div style={{ color: primaryColor, fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>
            PRÉVIA
          </div>
          <h1 style={{ fontFamily: `${theme.fontSerif}, serif`, fontSize: "28px", color: "#1a1a1a", marginBottom: "6px" }}>
            {theme.appName}
          </h1>
          <p style={{ color: "#737373", fontSize: "14px", marginBottom: "12px" }}>{theme.appTagline}</p>
          <button
            style={{
              backgroundColor: primaryColor,
              color: "white",
              padding: "8px 20px",
              borderRadius: `${theme.borderRadius}rem`,
              fontSize: "14px",
              fontWeight: 500,
              border: "none",
              cursor: "pointer",
            }}
          >
            Começar agora
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Primary color */}
        <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: primaryColor }} />
            <h3 className="font-medium text-sm">Cor primária</h3>
            <span className="text-xs font-mono text-muted-foreground ml-auto">{primaryColor}</span>
          </div>
          {sliderField("Matiz (Hue)", "primaryH", 0, 360, "°")}
          {sliderField("Saturação", "primaryS", 0, 100, "%")}
          {sliderField("Luminosidade", "primaryL", 10, 90, "%")}
        </div>

        {/* Background color */}
        <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full border border-border" style={{ backgroundColor: bgColor }} />
            <h3 className="font-medium text-sm">Cor de fundo</h3>
            <span className="text-xs font-mono text-muted-foreground ml-auto">{bgColor}</span>
          </div>
          {sliderField("Matiz (Hue)", "backgroundH", 0, 360, "°")}
          {sliderField("Saturação", "backgroundS", 0, 100, "%")}
          {sliderField("Luminosidade", "backgroundL", 50, 100, "%")}
        </div>

        {/* Typography */}
        <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
          <h3 className="font-medium text-sm mb-2">Tipografia</h3>
          <div>
            <Label className="text-xs">Fonte serifada (títulos)</Label>
            <Input value={theme.fontSerif} onChange={e => setTheme(t => ({ ...t, fontSerif: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Fonte sem serifa (corpo)</Label>
            <Input value={theme.fontSans} onChange={e => setTheme(t => ({ ...t, fontSans: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Raio dos cantos (rem)</Label>
            <Input type="number" step="0.125" value={theme.borderRadius} onChange={e => setTheme(t => ({ ...t, borderRadius: e.target.value }))} className="mt-1" />
          </div>
        </div>

        {/* Branding */}
        <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
          <h3 className="font-medium text-sm mb-2">Branding</h3>
          <div>
            <Label className="text-xs">Nome do app</Label>
            <Input value={theme.appName} onChange={e => setTheme(t => ({ ...t, appName: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Tagline</Label>
            <Input value={theme.appTagline} onChange={e => setTheme(t => ({ ...t, appTagline: e.target.value }))} className="mt-1" />
          </div>
        </div>
      </div>

      <Button onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90 text-white">
        {saving ? "Salvando..." : "Salvar tema"}
      </Button>
    </div>
  );
}

// ─── Settings Tab ──────────────────────────────────────────────────────────────
function SettingsTab() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [newKey, setNewKey] = useState("");
  const [newValue, setNewValue] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState("general");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = () => {
    api("/admin/settings").then(r => r.json()).then(d => setSettings(d.settings ?? []));
  };

  useEffect(() => { load(); }, []);

  const save = async (updated: Setting[]) => {
    const r = await api("/admin/settings", {
      method: "PUT",
      body: JSON.stringify({ settings: updated.map(s => ({ key: s.key, value: s.value, label: s.label ?? s.key, category: s.category })) }),
    });
    if (r.ok) load();
  };

  const add = async () => {
    if (!newKey) return;
    setSaving(true);
    try {
      const r = await api("/admin/settings", {
        method: "PUT",
        body: JSON.stringify({ settings: [{ key: newKey, value: newValue, label: newLabel || newKey, category: newCategory }] }),
      });
      if (!r.ok) throw new Error((await r.json()).error);
      toast({ title: "Configuração salva" });
      setNewKey(""); setNewValue(""); setNewLabel(""); setNewCategory("general");
      load();
    } catch (e) {
      toast({ title: "Erro", description: String(e), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const categories = [...new Set(settings.map(s => s.category))].sort();

  return (
    <div className="space-y-6">
      {/* Add new setting */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <h3 className="font-medium mb-4 text-sm">Adicionar configuração</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label className="text-xs">Chave *</Label>
            <Input value={newKey} onChange={e => setNewKey(e.target.value)} placeholder="chave_exemplo" className="mt-1 font-mono" />
          </div>
          <div>
            <Label className="text-xs">Valor</Label>
            <Input value={newValue} onChange={e => setNewValue(e.target.value)} placeholder="valor" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Rótulo legível</Label>
            <Input value={newLabel} onChange={e => setNewLabel(e.target.value)} placeholder="Nome amigável" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Categoria</Label>
            <Input value={newCategory} onChange={e => setNewCategory(e.target.value)} placeholder="general" className="mt-1" />
          </div>
        </div>
        <Button onClick={add} disabled={saving || !newKey} className="mt-3 bg-primary hover:bg-primary/90 text-white" size="sm">
          {saving ? "Salvando..." : "Adicionar"}
        </Button>
      </div>

      {/* Group by category */}
      {categories.map(cat => (
        <div key={cat} className="bg-card border border-card-border rounded-xl overflow-hidden">
          <div className="px-5 py-3 bg-muted/30 border-b border-border">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{cat}</span>
          </div>
          <div className="divide-y divide-border">
            {settings.filter(s => s.category === cat).map(s => (
              <div key={s.id} className="flex items-center gap-4 px-5 py-3">
                <div className="w-40 flex-shrink-0">
                  <div className="text-xs font-mono font-medium">{s.key}</div>
                  <div className="text-xs text-muted-foreground">{s.label}</div>
                </div>
                <input
                  className="flex-1 text-sm border border-border rounded px-2 py-1 bg-background"
                  defaultValue={s.value}
                  onBlur={e => {
                    if (e.target.value !== s.value) {
                      save(settings.map(x => x.id === s.id ? { ...x, value: e.target.value } : x));
                    }
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {settings.length === 0 && (
        <div className="text-center text-muted-foreground text-sm py-8">Nenhuma configuração registrada</div>
      )}
    </div>
  );
}

// ─── Admin Page ────────────────────────────────────────────────────────────────
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

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Visão geral" },
    { id: "users", label: "Usuários" },
    { id: "coupons", label: "Cupons" },
    { id: "plans", label: "Planos & Preços" },
    { id: "deliverables", label: "Entregáveis" },
    { id: "theme", label: "Tema" },
    { id: "settings", label: "Configurações" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 sticky top-0 z-10 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              ← Painel
            </Link>
            <span className="text-muted-foreground">/</span>
            <span className="text-sm font-medium flex items-center gap-1.5">
              <span>⚙️</span> Administração
            </span>
          </div>
          <span className="text-xs px-2.5 py-1 bg-primary/10 text-primary rounded-full font-medium border border-primary/20">
            Admin
          </span>
        </div>
        <div className="max-w-6xl mx-auto px-6 pb-3 flex gap-1 overflow-x-auto">
          {tabs.map(t => (
            <TabButton key={t.id} label={t.label} active={tab === t.id} onClick={() => setTab(t.id)} />
          ))}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {tab === "overview" && <OverviewTab />}
        {tab === "users" && <UsersTab />}
        {tab === "coupons" && <CouponsTab />}
        {tab === "plans" && <PlansTab />}
        {tab === "deliverables" && <DeliverablesTab />}
        {tab === "theme" && <ThemeTab />}
        {tab === "settings" && <SettingsTab />}
      </main>
    </div>
  );
}
