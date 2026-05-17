import { useState, useEffect, useCallback } from "react";
import { Link, useLocation } from "wouter";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

type Tab = "overview" | "users" | "coupons" | "plans" | "deliverables" | "theme" | "settings" | "audit";

interface Stats {
  users: number;
  projects: number;
  trashedProjects: number;
  admins: number;
  superusers: number;
  activeCoupons: number;
  paidUsers: number;
  newUsers30d: number;
  inactiveUsers30d: number;
  inactiveUsers14d: number;
  planBreakdown: Array<{ plan: string; count: number }>;
  signupsPerDay: Array<{ day: string; count: number }>;
  aiPerDay: Array<{ day: string; count: number }>;
}

interface AuditLogEntry {
  id: number;
  eventType: string;
  actorClerkId: string | null;
  actorName: string | null;
  targetClerkId: string | null;
  targetName: string | null;
  meta: string | null;
  ip: string | null;
  createdAt: string;
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
  { phase: 3, phaseName: "SEGURANÇA & LGPD", key: "DATA_MAP", label: "Data Map + RAT" },
  { phase: 3, phaseName: "SEGURANÇA & LGPD", key: "CLASSIFICACAO_DADOS", label: "Classificação de Dados" },
  { phase: 3, phaseName: "SEGURANÇA & LGPD", key: "PRIVACY_BY_DESIGN", label: "Privacy by Design" },
  { phase: 3, phaseName: "SEGURANÇA & LGPD", key: "POLITICA_PRIVACIDADE", label: "Política de Privacidade" },
  { phase: 3, phaseName: "SEGURANÇA & LGPD", key: "THREAT_MODEL", label: "Threat Model (STRIDE)" },
  { phase: 3, phaseName: "SEGURANÇA & LGPD", key: "MATRIZ_RBAC", label: "Matriz RBAC" },
  { phase: 3, phaseName: "SEGURANÇA & LGPD", key: "OWASP_CHECKLIST", label: "Checklist OWASP Top 10" },
  { phase: 3, phaseName: "SEGURANÇA & LGPD", key: "PLANO_INCIDENTES", label: "Plano de Resposta a Incidentes" },
  { phase: 4, phaseName: "SPEC", key: "ARQUITETURA", label: "Arquitetura do Sistema" },
  { phase: 4, phaseName: "SPEC", key: "MODELO_DADOS", label: "Modelo de Dados" },
  { phase: 4, phaseName: "SPEC", key: "CONTRATOS_API", label: "Contratos de API" },
  { phase: 4, phaseName: "SPEC", key: "SEGURANCA", label: "Plano de Segurança" },
  { phase: 4, phaseName: "SPEC", key: "FLUXOS_UI", label: "Fluxos de UX" },
  { phase: 4, phaseName: "SPEC", key: "ESCALABILIDADE", label: "Plano de Escalabilidade" },
  { phase: 4, phaseName: "SPEC", key: "ADR", label: "Architecture Decision Records" },
  { phase: 4, phaseName: "SPEC", key: "SETUP_DEVOPS", label: "DevOps & Infra" },
  { phase: 5, phaseName: "IMPLEMENTAÇÃO", key: "MILESTONES", label: "Plano de Milestones" },
  { phase: 5, phaseName: "IMPLEMENTAÇÃO", key: "SPRINT_1", label: "Sprint 1 Detalhado" },
  { phase: 5, phaseName: "IMPLEMENTAÇÃO", key: "ESTRUTURA_PASTAS", label: "Estrutura do Projeto" },
  { phase: 5, phaseName: "IMPLEMENTAÇÃO", key: "README", label: "README Completo" },
  { phase: 5, phaseName: "IMPLEMENTAÇÃO", key: "GUIA_CONTRIBUICAO", label: "CONTRIBUTING.md" },
  { phase: 5, phaseName: "IMPLEMENTAÇÃO", key: "TECH_DEBT_LOG", label: "Log de Débito Técnico" },
  { phase: 5, phaseName: "IMPLEMENTAÇÃO", key: "DEFINITION_OF_DONE", label: "Definition of Done" },
  { phase: 6, phaseName: "TESTE", key: "PLANO_TESTES", label: "Plano de Testes" },
  { phase: 6, phaseName: "TESTE", key: "CASOS_TESTE_CRITICOS", label: "20 Casos de Teste Críticos" },
  { phase: 6, phaseName: "TESTE", key: "CHECKLIST_QA", label: "Checklist de QA" },
  { phase: 6, phaseName: "TESTE", key: "SCRIPT_USER_TEST", label: "Script de Teste com Usuários" },
  { phase: 6, phaseName: "TESTE", key: "RELATORIO_PERFORMANCE", label: "Benchmarks de Performance" },
  { phase: 6, phaseName: "TESTE", key: "BUGS_PREVENCAO", label: "Top 10 Bugs a Prevenir" },
  { phase: 6, phaseName: "TESTE", key: "OBSERVABILIDADE", label: "Plano de Observabilidade" },
  { phase: 7, phaseName: "DEPLOY", key: "RUNBOOK_DEPLOY", label: "Runbook de Deploy" },
  { phase: 7, phaseName: "DEPLOY", key: "GTM", label: "Plano Go-to-Market" },
  { phase: 7, phaseName: "DEPLOY", key: "LAUNCH_CHECKLIST", label: "Launch Checklist" },
  { phase: 7, phaseName: "DEPLOY", key: "METRICAS_POS_LAUNCH", label: "Dashboard Pós-Lançamento" },
  { phase: 7, phaseName: "DEPLOY", key: "PLANO_CRESCIMENTO_90_DIAS", label: "Plano de Crescimento 90 Dias" },
  { phase: 7, phaseName: "DEPLOY", key: "PITCH_INVESTIDORES", label: "Narrativa para Investidores" },
  { phase: 7, phaseName: "DEPLOY", key: "SLA_SUPORTE", label: "SLA & Plano de Suporte" },
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

// ─── Mini Sparkline Chart ──────────────────────────────────────────────────────
function Sparkline({ data, color = "var(--color-primary)" }: { data: Array<{ day: string; count: number }>; color?: string }) {
  if (!data || data.length === 0) return <div className="text-xs text-muted-foreground">Sem dados</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  const w = 280; const h = 48; const pts = data.length;
  const points = data.map((d, i) => {
    const x = (i / (pts - 1)) * w;
    const y = h - (d.count / max) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: 48 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
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

  const freeUsers = stats.users - stats.paidUsers;
  const conversionRate = stats.users > 0 ? ((stats.paidUsers / stats.users) * 100).toFixed(1) : "0.0";

  return (
    <div className="space-y-6">
      {/* Primary metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Usuários totais" value={stats.users} sub={`+${stats.newUsers30d} últimos 30d`} />
        <StatCard label="Projetos ativos" value={stats.projects} sub={`${stats.trashedProjects} na lixeira`} />
        <StatCard label="Usuários pagos" value={stats.paidUsers} sub={`${conversionRate}% conversão`} />
        <StatCard label="Cupons ativos" value={stats.activeCoupons} />
      </div>

      {/* Health metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Inativos 14d" value={stats.inactiveUsers14d} sub="sem atividade" />
        <StatCard label="Inativos 30d" value={stats.inactiveUsers30d} sub="risco de churn" />
        <StatCard label="Usuários grátis" value={freeUsers} sub="free tier" />
        <StatCard label="Superusers" value={stats.superusers} sub="acesso total" />
      </div>

      {/* Sparklines */}
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

      {/* Plan distribution */}
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

// ─── Audit Log Tab ─────────────────────────────────────────────────────────────
const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  "admin.user.plan_changed":       { label: "Plano alterado",        color: "text-blue-500" },
  "admin.user.admin_toggled":      { label: "Admin toggled",          color: "text-purple-500" },
  "admin.user.superuser_toggled":  { label: "Superuser toggled",      color: "text-purple-700" },
  "admin.coupon.created":          { label: "Cupom criado",           color: "text-green-500" },
  "admin.coupon.updated":          { label: "Cupom atualizado",       color: "text-yellow-500" },
  "admin.coupon.deleted":          { label: "Cupom desativado",       color: "text-orange-500" },
  "admin.deliverable.toggled":     { label: "Entregável toggled",     color: "text-blue-400" },
  "admin.settings.updated":        { label: "Settings atualizados",   color: "text-blue-400" },
  "admin.plans.updated":           { label: "Planos atualizados",     color: "text-blue-500" },
  "user.login":                    { label: "Login",                  color: "text-muted-foreground" },
  "user.project.created":          { label: "Projeto criado",         color: "text-green-500" },
  "user.project.deleted":          { label: "Projeto na lixeira",     color: "text-orange-500" },
  "user.project.restored":         { label: "Projeto restaurado",     color: "text-green-400" },
  "user.project.permanent_deleted":{ label: "Projeto apagado",        color: "text-red-500" },
  "user.ai.used":                  { label: "IA executada",           color: "text-primary" },
  "user.payment.subscribed":       { label: "Assinatura ativa",       color: "text-green-500" },
  "user.payment.canceled":         { label: "Assinatura cancelada",   color: "text-red-500" },
  "user.coupon.redeemed":          { label: "Cupom usado",            color: "text-yellow-500" },
  "security.unauthorized":         { label: "Acesso não autorizado",  color: "text-red-600" },
  "security.rate_limited":         { label: "Rate limit atingido",    color: "text-orange-600" },
  "security.plan_limit_reached":   { label: "Limite do plano",        color: "text-orange-500" },
};

const EVENT_CATEGORIES = [
  { value: "", label: "Todos os eventos" },
  { value: "admin.", label: "Ações admin" },
  { value: "user.", label: "Eventos de usuário" },
  { value: "security.", label: "Segurança" },
];

function AuditTab() {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [category, setCategory] = useState("");
  const [days, setDays] = useState(30);
  const [actorFilter, setActorFilter] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const load = useCallback(() => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), days: String(days) });
    if (category) params.set("eventType", category);
    if (actorFilter) params.set("actor", actorFilter);
    api(`/admin/audit?${params}`)
      .then(r => r.json())
      .then(d => { setLogs(d.logs ?? []); setTotal(d.total ?? 0); setPages(d.pages ?? 1); })
      .finally(() => setLoading(false));
  }, [page, days, category, actorFilter]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [category, days, actorFilter]);

  function fmt(iso: string) {
    const d = new Date(iso);
    return d.toLocaleDateString("pt-BR") + " " + d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <select
          value={category}
          onChange={e => setCategory(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground"
        >
          {EVENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>

        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground"
        >
          <option value={7}>Últimos 7 dias</option>
          <option value={30}>Últimos 30 dias</option>
          <option value={90}>Últimos 90 dias</option>
        </select>

        <input
          placeholder="Filtrar por ator..."
          value={actorFilter}
          onChange={e => setActorFilter(e.target.value)}
          className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground w-48"
        />

        <button onClick={load} className="text-xs font-mono text-primary hover:underline">
          Atualizar
        </button>

        <span className="ml-auto text-xs text-muted-foreground font-mono">{total} eventos</span>
      </div>

      {/* Table */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center text-muted-foreground text-sm py-12">Nenhum evento encontrado</div>
      ) : (
        <div className="rounded-xl border border-card-border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Evento</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Ator</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Alvo</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">Quando</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground text-xs uppercase tracking-wider">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map(log => {
                const ev = EVENT_LABELS[log.eventType];
                const isExpanded = expandedId === log.id;
                let metaObj: Record<string, unknown> | null = null;
                try { if (log.meta) metaObj = JSON.parse(log.meta); } catch {}
                return (
                  <>
                    <tr
                      key={log.id}
                      className="bg-card hover:bg-muted/20 transition-colors cursor-pointer"
                      onClick={() => setExpandedId(isExpanded ? null : log.id)}
                    >
                      <td className="px-4 py-3">
                        <span className={`font-medium text-xs ${ev?.color ?? "text-foreground"}`}>
                          {ev?.label ?? log.eventType}
                        </span>
                        <div className="text-[10px] font-mono text-muted-foreground/60">{log.eventType}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-foreground">{log.actorName ?? "—"}</div>
                        {log.actorClerkId && <div className="text-[10px] font-mono text-muted-foreground/60">{log.actorClerkId.slice(0, 14)}…</div>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs text-muted-foreground">{log.targetName ?? "—"}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-mono text-muted-foreground">{fmt(log.createdAt)}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[10px] font-mono text-muted-foreground/60">{log.ip ?? "—"}</div>
                      </td>
                    </tr>
                    {isExpanded && metaObj && (
                      <tr key={`${log.id}-meta`} className="bg-muted/30">
                        <td colSpan={5} className="px-4 py-3">
                          <pre className="text-[11px] font-mono text-foreground/80 whitespace-pre-wrap break-all">
                            {JSON.stringify(metaObj, null, 2)}
                          </pre>
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      {pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs font-mono text-primary disabled:opacity-40 hover:underline"
          >
            ← Anterior
          </button>
          <span className="text-xs text-muted-foreground font-mono">Página {page} de {pages}</span>
          <button
            onClick={() => setPage(p => Math.min(pages, p + 1))}
            disabled={page === pages}
            className="text-xs font-mono text-primary disabled:opacity-40 hover:underline"
          >
            Próxima →
          </button>
        </div>
      )}
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

  const phases = [1, 2, 3, 4, 5, 6, 7];

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
    appName: "FoundersFlow",
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
        appName: get("app_name", "FoundersFlow"),
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

  const tabs: Array<{ id: Tab; label: string }> = [
    { id: "overview", label: "Visão geral" },
    { id: "users", label: "Usuários" },
    { id: "coupons", label: "Cupons" },
    { id: "plans", label: "Planos & Preços" },
    { id: "deliverables", label: "Entregáveis" },
    { id: "theme", label: "Tema" },
    { id: "settings", label: "Configurações" },
    { id: "audit", label: "Audit Log" },
  ];

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
          {tabs.map(t => (
            <TabButton key={t.id} label={t.label} active={tab === t.id} onClick={() => setTab(t.id)} />
          ))}
        </div>

        <main className="flex-1 overflow-y-auto px-6 py-8 max-w-6xl w-full mx-auto">
          {tab === "overview" && <OverviewTab />}
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
