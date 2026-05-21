import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api, PLAN_LABELS, DEFAULT_PLAN_PRICES } from "./shared";

export function PlansTab() {
  const [planConfig, setPlanConfig] = useState<typeof DEFAULT_PLAN_PRICES>(DEFAULT_PLAN_PRICES);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    api("/admin/settings").then(r => r.json()).then(d => {
      const s: Array<{ key: string; value: string }> = d.settings ?? [];
      const cfg = { ...DEFAULT_PLAN_PRICES };
      for (const plan of ["founder", "studio"] as const) {
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
        {(["founder", "studio"] as const).map(plan => (
          <div key={plan} className="bg-card border border-card-border rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <h3 className="font-medium capitalize">{PLAN_LABELS[plan]}</h3>
              {plan === "founder" && <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full">Mais escolhido</span>}
              {plan === "studio" && <span className="text-xs px-2 py-0.5 bg-foreground/10 text-foreground rounded-full">Premium</span>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-xs">Preço exibido</Label>
                <Input value={planConfig[plan]?.price ?? ""} onChange={e => update(plan, "price", e.target.value)} placeholder="R$197" className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Limite de IA por dia</Label>
                <Input type="number" value={planConfig[plan]?.aiLimit ?? ""} onChange={e => update(plan, "aiLimit", parseInt(e.target.value))} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Máximo de projetos</Label>
                <Input type="number" value={planConfig[plan]?.maxProjects ?? ""} onChange={e => update(plan, "maxProjects", parseInt(e.target.value))} className="mt-1" />
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
                    checked={planConfig[plan]?.[f.key as keyof typeof planConfig.founder] as boolean ?? false}
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
