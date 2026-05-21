import { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { api, PLAN_LABELS, type User } from "./shared";

export function UsersTab() {
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
      <Input placeholder="Buscar por nome ou Clerk ID..." value={search} onChange={e => setSearch(e.target.value)} className="max-w-sm" />

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
                    <select className="text-xs border border-border rounded px-2 py-1 bg-background" value={u.plan} onChange={e => updateUser(u.clerkId, { plan: e.target.value })} disabled={saving === u.clerkId}>
                      {["free", "founder", "studio", "basic", "pro", "advanced"].map(p => <option key={p} value={p}>{PLAN_LABELS[p]}</option>)}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={u.isAdmin} onChange={e => updateUser(u.clerkId, { isAdmin: e.target.checked })} disabled={saving === u.clerkId} className="accent-primary" />
                  </td>
                  <td className="px-4 py-3">
                    <input type="checkbox" checked={u.isSuperuser} onChange={e => updateUser(u.clerkId, { isSuperuser: e.target.checked })} disabled={saving === u.clerkId} className="accent-primary" />
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.stripeSubscriptionStatus === "active" ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                      {u.stripeSubscriptionStatus ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">{saving === u.clerkId && <span className="text-xs text-muted-foreground">Salvando...</span>}</td>
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
