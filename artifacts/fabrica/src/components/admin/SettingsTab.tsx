import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api, type Setting } from "./shared";

export function SettingsTab() {
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
