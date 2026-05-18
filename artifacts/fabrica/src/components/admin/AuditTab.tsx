import { useState, useEffect, useCallback } from "react";
import { api, type AuditLogEntry } from "./shared";

const EVENT_LABELS: Record<string, { label: string; color: string }> = {
  "admin.user.plan_changed":        { label: "Plano alterado",        color: "text-blue-500" },
  "admin.user.admin_toggled":       { label: "Admin toggled",          color: "text-purple-500" },
  "admin.user.superuser_toggled":   { label: "Superuser toggled",      color: "text-purple-700" },
  "admin.coupon.created":           { label: "Cupom criado",           color: "text-green-500" },
  "admin.coupon.updated":           { label: "Cupom atualizado",       color: "text-yellow-500" },
  "admin.coupon.deleted":           { label: "Cupom desativado",       color: "text-orange-500" },
  "admin.deliverable.toggled":      { label: "Entregável toggled",     color: "text-blue-400" },
  "admin.settings.updated":         { label: "Settings atualizados",   color: "text-blue-400" },
  "admin.plans.updated":            { label: "Planos atualizados",     color: "text-blue-500" },
  "user.login":                     { label: "Login",                  color: "text-muted-foreground" },
  "user.project.created":           { label: "Projeto criado",         color: "text-green-500" },
  "user.project.deleted":           { label: "Projeto na lixeira",     color: "text-orange-500" },
  "user.project.restored":          { label: "Projeto restaurado",     color: "text-green-400" },
  "user.project.permanent_deleted": { label: "Projeto apagado",        color: "text-red-500" },
  "user.ai.used":                   { label: "IA executada",           color: "text-primary" },
  "user.payment.subscribed":        { label: "Assinatura ativa",       color: "text-green-500" },
  "user.payment.canceled":          { label: "Assinatura cancelada",   color: "text-red-500" },
  "user.coupon.redeemed":           { label: "Cupom usado",            color: "text-yellow-500" },
  "security.unauthorized":          { label: "Acesso não autorizado",  color: "text-red-600" },
  "security.rate_limited":          { label: "Rate limit atingido",    color: "text-orange-600" },
  "security.plan_limit_reached":    { label: "Limite do plano",        color: "text-orange-500" },
};

const EVENT_CATEGORIES = [
  { value: "", label: "Todos os eventos" },
  { value: "admin.", label: "Ações admin" },
  { value: "user.", label: "Eventos de usuário" },
  { value: "security.", label: "Segurança" },
];

export function AuditTab() {
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
      <div className="flex flex-wrap gap-3 items-center">
        <select value={category} onChange={e => setCategory(e.target.value)} className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground">
          {EVENT_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={days} onChange={e => setDays(Number(e.target.value))} className="text-sm border border-border rounded-lg px-3 py-2 bg-background text-foreground">
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
        <button onClick={load} className="text-xs font-mono text-primary hover:underline">Atualizar</button>
        <span className="ml-auto text-xs text-muted-foreground font-mono">{total} eventos</span>
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3,4,5].map(i => <div key={i} className="h-12 bg-muted rounded-xl animate-pulse" />)}</div>
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
                    <tr key={log.id} className="bg-card hover:bg-muted/20 transition-colors cursor-pointer" onClick={() => setExpandedId(isExpanded ? null : log.id)}>
                      <td className="px-4 py-3">
                        <span className={`font-medium text-xs ${ev?.color ?? "text-foreground"}`}>{ev?.label ?? log.eventType}</span>
                        <div className="text-[10px] font-mono text-muted-foreground/60">{log.eventType}</div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs font-medium text-foreground">{log.actorName ?? "—"}</div>
                        {log.actorClerkId && <div className="text-[10px] font-mono text-muted-foreground/60">{log.actorClerkId.slice(0, 14)}…</div>}
                      </td>
                      <td className="px-4 py-3"><div className="text-xs text-muted-foreground">{log.targetName ?? "—"}</div></td>
                      <td className="px-4 py-3"><div className="text-xs font-mono text-muted-foreground">{fmt(log.createdAt)}</div></td>
                      <td className="px-4 py-3"><div className="text-[10px] font-mono text-muted-foreground/60">{log.ip ?? "—"}</div></td>
                    </tr>
                    {isExpanded && metaObj && (
                      <tr key={`${log.id}-meta`} className="bg-muted/30">
                        <td colSpan={5} className="px-4 py-3">
                          <pre className="text-[11px] font-mono text-foreground/80 whitespace-pre-wrap break-all">{JSON.stringify(metaObj, null, 2)}</pre>
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

      {pages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="text-xs font-mono text-primary disabled:opacity-40 hover:underline">← Anterior</button>
          <span className="text-xs text-muted-foreground font-mono">Página {page} de {pages}</span>
          <button onClick={() => setPage(p => Math.min(pages, p + 1))} disabled={page === pages} className="text-xs font-mono text-primary disabled:opacity-40 hover:underline">Próxima →</button>
        </div>
      )}
    </div>
  );
}
