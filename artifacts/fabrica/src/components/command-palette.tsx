import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation } from "wouter";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const PHASE_NAMES = [
  "Ideia", "PRD", "Segurança & LGPD", "Spec", "Implementação", "Teste", "Deploy",
];

type Project = { id: number; name: string; currentPhase: number };

type Item = {
  id: string;
  label: string;
  hint?: string;
  group: string;
  href: string;
  keywords?: string;
};

const STATIC_ITEMS: Array<Item> = [
  { id: "go-dashboard", label: "Painel", hint: "Seus projetos", group: "Navegar", href: "/dashboard", keywords: "home inicio dashboard projetos" },
  { id: "go-pricing", label: "Planos & Preços", group: "Navegar", href: "/pricing", keywords: "upgrade assinatura plano billing" },
  { id: "go-billing", label: "Assinatura", group: "Navegar", href: "/billing", keywords: "billing stripe pagamento" },
  { id: "go-support", label: "Atendimento", group: "Navegar", href: "/atendimento", keywords: "suporte ajuda whatsapp ticket" },
  { id: "go-settings", label: "Configurações", group: "Navegar", href: "/settings", keywords: "ajustes preferencias lgpd" },
  { id: "go-privacy", label: "Política de Privacidade", group: "Navegar", href: "/privacidade", keywords: "lgpd privacy" },
  { id: "go-admin", label: "Administração", hint: "Apenas admins", group: "Navegar", href: "/admin", keywords: "admin insights cupons" },
  { id: "go-admin-insights", label: "Admin · Insights", hint: "Funil, gargalos, DAU/WAU", group: "Admin", href: "/admin", keywords: "metricas funil gargalo stuck dau wau" },
  { id: "upgrade-ai", label: "Aumentar limite de IA", group: "Ações", href: "/pricing?upgrade=ai", keywords: "ia gpt limite mais" },
  { id: "upgrade-projects", label: "Liberar mais projetos", group: "Ações", href: "/pricing?upgrade=projects", keywords: "projetos limite mais" },
];

function score(item: Item, q: string): number {
  if (!q) return 1;
  const hay = `${item.label} ${item.hint ?? ""} ${item.keywords ?? ""} ${item.group}`.toLowerCase();
  const needle = q.toLowerCase().trim();
  if (!needle) return 1;
  if (hay.includes(needle)) return 10;
  // subsequence match
  let i = 0;
  for (const c of hay) { if (c === needle[i]) i++; if (i === needle.length) return 5; }
  return 0;
}

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [, setLocation] = useLocation();
  const inputRef = useRef<HTMLInputElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  // Open shortcut: ⌘K / Ctrl+K
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const isMod = e.metaKey || e.ctrlKey;
      if (isMod && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((v) => !v);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Refetch projects on every open (cheap; handles sign-in/out transitions)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch(`${basePath}/api/projects`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => { if (!cancelled) setProjects(Array.isArray(data) ? data : []); })
      .catch(() => { if (!cancelled) setProjects([]); });
    return () => { cancelled = true; };
  }, [open]);

  // Focus + body scroll lock
  useEffect(() => {
    if (!open) return;
    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    setActive(0);
    setQ("");
    const t = setTimeout(() => inputRef.current?.focus(), 30);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      clearTimeout(t);
      document.body.style.overflow = prevOverflow;
      previouslyFocusedRef.current?.focus?.();
    };
  }, [open]);

  const items = useMemo<Array<Item>>(() => {
    const projectItems: Array<Item> = (projects ?? []).map((p) => ({
      id: `project-${p.id}`,
      label: p.name,
      hint: `Fase ${p.currentPhase} — ${PHASE_NAMES[p.currentPhase - 1] ?? ""}`,
      group: "Projetos",
      href: `/projects/${p.id}`,
      keywords: `projeto ${p.name}`,
    }));
    const phaseItems: Array<Item> = (projects ?? []).flatMap((p) =>
      PHASE_NAMES.map((name, i) => ({
        id: `phase-${p.id}-${i + 1}`,
        label: `${p.name} · Fase ${i + 1}`,
        hint: name,
        group: "Fases",
        href: `/projects/${p.id}/phases/${i + 1}`,
        keywords: `fase ${name} ${p.name}`,
      })),
    );
    return [...STATIC_ITEMS, ...projectItems, ...phaseItems];
  }, [projects]);

  const filtered = useMemo(() => {
    return items
      .map((it) => ({ it, s: score(it, q) }))
      .filter((x) => x.s > 0)
      .sort((a, b) => b.s - a.s)
      .slice(0, 40)
      .map((x) => x.it);
  }, [items, q]);

  // Keep active in bounds
  useEffect(() => { setActive(0); }, [q]);

  function run(it: Item) {
    setOpen(false);
    setTimeout(() => setLocation(it.href), 20);
  }

  function onInputKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Escape") { e.preventDefault(); setOpen(false); return; }
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(filtered.length - 1, i + 1)); return; }
    if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(0, i - 1)); return; }
    if (e.key === "Enter") {
      e.preventDefault();
      const it = filtered[active];
      if (it) run(it);
    }
  }

  if (!open) return null;

  // Group filtered by group
  const grouped = filtered.reduce<Record<string, Array<{ it: Item; flatIdx: number }>>>((acc, it, i) => {
    (acc[it.group] ??= []).push({ it, flatIdx: i });
    return acc;
  }, {});

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4"
      role="dialog"
      aria-modal="true"
      aria-label="Paleta de comandos"
    >
      <div className="absolute inset-0 bg-foreground/60 backdrop-blur-sm animate-in fade-in" onClick={() => setOpen(false)} />
      <div className="relative bg-card border border-card-border rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-200">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-card-border">
          <svg className="w-4 h-4 text-muted-foreground flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" strokeLinecap="round" />
          </svg>
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={onInputKey}
            placeholder="Busque projetos, fases, ações…"
            className="flex-1 bg-transparent outline-none text-sm text-foreground placeholder:text-muted-foreground"
            aria-label="Buscar"
            data-testid="command-palette-input"
          />
          <kbd className="text-[10px] font-mono text-muted-foreground border border-card-border rounded px-1.5 py-0.5">ESC</kbd>
        </div>
        <div className="max-h-[60vh] overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-muted-foreground">Nada encontrado para "{q}"</div>
          ) : (
            Object.entries(grouped).map(([group, rows]) => (
              <div key={group} className="mb-1">
                <div className="px-4 py-1 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{group}</div>
                {rows.map(({ it, flatIdx }) => {
                  const isActive = flatIdx === active;
                  return (
                    <button
                      key={it.id}
                      onClick={() => run(it)}
                      onMouseEnter={() => setActive(flatIdx)}
                      className={`w-full text-left px-4 py-2 flex items-center gap-3 ${isActive ? "bg-primary/10" : ""}`}
                      data-testid={`cmd-item-${it.id}`}
                    >
                      <span className={`flex-1 text-sm ${isActive ? "text-foreground font-medium" : "text-foreground"}`}>{it.label}</span>
                      {it.hint && <span className="text-xs text-muted-foreground">{it.hint}</span>}
                      {isActive && <span className="text-[10px] font-mono text-primary">↵</span>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>
        <div className="border-t border-card-border px-4 py-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span>
            <kbd className="font-mono border border-card-border rounded px-1">↑↓</kbd> navegar ·{" "}
            <kbd className="font-mono border border-card-border rounded px-1">↵</kbd> abrir
          </span>
          <span><kbd className="font-mono border border-card-border rounded px-1">⌘K</kbd> abrir</span>
        </div>
      </div>
    </div>
  );
}
