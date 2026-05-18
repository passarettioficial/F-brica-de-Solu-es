import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { api } from "./shared";

export function ThemeTab() {
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
  const { toast } = useToast();

  useEffect(() => {
    api("/admin/settings").then(r => r.json()).then(d => {
      const s: Array<{ key: string; value: string }> = d.settings ?? [];
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
        type="range" min={min} max={max} value={parseInt(theme[key] as string)}
        onChange={e => setTheme(t => ({ ...t, [key]: e.target.value }))}
        className="w-full accent-primary"
      />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="rounded-xl overflow-hidden border border-card-border">
        <div className="p-6" style={{ backgroundColor: bgColor, fontFamily: `${theme.fontSans}, sans-serif` }}>
          <div style={{ color: primaryColor, fontSize: "11px", fontWeight: 600, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "8px" }}>PRÉVIA</div>
          <h1 style={{ fontFamily: `${theme.fontSerif}, serif`, fontSize: "28px", color: "#1a1a1a", marginBottom: "6px" }}>{theme.appName}</h1>
          <p style={{ color: "#737373", fontSize: "14px", marginBottom: "12px" }}>{theme.appTagline}</p>
          <button style={{ backgroundColor: primaryColor, color: "white", padding: "8px 20px", borderRadius: `${theme.borderRadius}rem`, fontSize: "14px", fontWeight: 500, border: "none", cursor: "pointer" }}>
            Começar agora
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
