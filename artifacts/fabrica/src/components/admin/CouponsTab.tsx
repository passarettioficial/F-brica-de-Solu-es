import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api, type Coupon } from "./shared";

export function CouponsTab() {
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
      <div className="bg-card border border-card-border rounded-xl p-6">
        <h3 className="font-medium mb-4">Criar novo cupom</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label className="text-xs">Código *</Label>
            <Input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="PROMO20" className="mt-1 font-mono" />
          </div>
          <div>
            <Label className="text-xs">Tipo de desconto *</Label>
            <select className="mt-1 w-full border border-border rounded-md px-3 py-2 text-sm bg-background" value={form.discountType} onChange={e => setForm(f => ({ ...f, discountType: e.target.value as "percent" | "fixed" }))}>
              <option value="percent">Percentual (%)</option>
              <option value="fixed">Valor fixo (R$)</option>
            </select>
          </div>
          <div>
            <Label className="text-xs">Valor *</Label>
            <Input type="number" value={form.discountValue} onChange={e => setForm(f => ({ ...f, discountValue: e.target.value }))} placeholder={form.discountType === "percent" ? "20" : "49"} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Máximo de usos (em branco = ilimitado)</Label>
            <Input type="number" value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))} placeholder="100" className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Expira em</Label>
            <Input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))} className="mt-1" />
          </div>
          <div>
            <Label className="text-xs">Aplicável a planos (básico,pro,advanced ou em branco = todos)</Label>
            <Input value={form.appliesTo} onChange={e => setForm(f => ({ ...f, appliesTo: e.target.value }))} placeholder="pro,advanced" className="mt-1" />
          </div>
          <div className="md:col-span-3">
            <Label className="text-xs">Descrição</Label>
            <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Cupom de lançamento — 20% de desconto" className="mt-1" />
          </div>
        </div>
        <Button onClick={create} disabled={creating || !form.code || !form.discountValue} className="mt-4 bg-primary hover:bg-primary/90 text-white">
          {creating ? "Criando..." : "Criar cupom"}
        </Button>
      </div>

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
                <td className="px-4 py-3">{c.usesCount}{c.maxUses !== null ? ` / ${c.maxUses}` : " / ∞"}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("pt-BR") : "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${c.active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
                    {c.active ? "Ativo" : "Inativo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex gap-1 justify-end">
                    <Button size="sm" variant="outline" onClick={() => toggle(c)} className="text-xs h-7">{c.active ? "Desativar" : "Ativar"}</Button>
                    <Button size="sm" variant="outline" onClick={() => del(c.id)} className="text-xs h-7 text-destructive hover:text-destructive">✕</Button>
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
