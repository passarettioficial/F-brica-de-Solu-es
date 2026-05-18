import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { api, ALL_DELIVERABLES } from "./shared";

export function DeliverablesTab() {
  const [deliverables, setDeliverables] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setLoading(true);
    api("/admin/deliverables").then(r => r.json()).then(d => {
      const map: Record<string, boolean> = {};
      for (const item of ALL_DELIVERABLES) {
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

  if (loading) return <div className="text-muted-foreground text-sm py-8">Carregando...</div>;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Ative ou desative entregáveis por fase. Entregáveis desativados não são gerados pela IA.
      </p>

      {[1, 2, 3, 4, 5, 6, 7].map(phase => {
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
                  <input type="checkbox" checked={deliverables[item.key] !== false} onChange={() => toggle(item.key)} className="accent-primary" />
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
