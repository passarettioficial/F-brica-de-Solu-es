import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useUpdateArtifact } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LabelList } from "recharts";
import { parseJsonBlock, Fallback, Attribution, replaceJsonBlock } from "./shared";

// ───────────────────────── 9. Milestones (Fase 5) ─────────────────────────
type MilestonesData = {
  milestones?: {
    numero: number; nome: string; duracao?: string;
    features?: string[]; criterio_aceitacao?: string; demo?: string;
    risco?: "baixo" | "medio" | "alto"; dependencias?: (string | number)[];
  }[];
  duracao_total_estimada?: string;
  marco_mvp?: string | number;
};

const RISK_STYLE: Record<string, string> = {
  baixo: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  medio: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  alto: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

type Milestone = NonNullable<MilestonesData["milestones"]>[number];

function renumberMilestones(arr: Milestone[], oldMvp: string | number | undefined):
  { milestones: Milestone[]; marco_mvp: string | number | undefined } {
  const remap = new Map<number, number>();
  arr.forEach((m, i) => { remap.set(m.numero, i + 1); });
  const next = arr.map((m, i) => ({
    ...m,
    numero: i + 1,
    dependencias: m.dependencias?.map((d) => {
      if (typeof d === "number") return remap.get(d) ?? d;
      const asNum = Number(d);
      if (Number.isFinite(asNum) && remap.has(asNum)) return remap.get(asNum)!;
      return d;
    }),
  }));
  let nextMvp = oldMvp;
  if (oldMvp != null) {
    const asNum = Number(oldMvp);
    if (Number.isFinite(asNum) && remap.has(asNum)) nextMvp = remap.get(asNum);
  }
  return { milestones: next, marco_mvp: nextMvp };
}

export function MilestonesCanvas({
  content,
  canEdit = false,
  projectId,
  phaseNumber,
  artifactKey,
  onUpdate,
}: {
  content: string;
  canEdit?: boolean;
  projectId?: number;
  phaseNumber?: number;
  artifactKey?: string;
  onUpdate?: () => void;
}) {
  const parsed = parseJsonBlock<MilestonesData>(content);
  const initial = parsed?.milestones ?? [];
  const [items, setItems] = useState<Milestone[]>(initial);
  const [marcoMvp, setMarcoMvp] = useState<string | number | undefined>(parsed?.marco_mvp);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [overPos, setOverPos] = useState<"before" | "after">("before");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const updateArtifact = useUpdateArtifact();

  useEffect(() => {
    if (!dirty) {
      setItems(parsed?.milestones ?? []);
      setMarcoMvp(parsed?.marco_mvp);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (!parsed?.milestones?.length) return <Fallback content={content} />;

  const canDrag = canEdit && !!projectId && !!phaseNumber && !!artifactKey;
  const mvp = marcoMvp != null ? String(marcoMvp) : null;

  function onDragStart(e: React.DragEvent, idx: number) {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", String(idx)); } catch { /* noop */ }
  }
  function computePos(e: React.DragEvent): "before" | "after" {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return e.clientY - rect.top < rect.height / 2 ? "before" : "after";
  }
  function onDragOver(e: React.DragEvent, idx: number) {
    if (dragIdx === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const pos = computePos(e);
    if (overIdx !== idx) setOverIdx(idx);
    if (overPos !== pos) setOverPos(pos);
  }
  function onDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null) return;
    const pos = computePos(e);
    let target = pos === "before" ? idx : idx + 1;
    if (dragIdx < target) target -= 1; // account for removal shifting indices
    if (target === dragIdx) { setDragIdx(null); setOverIdx(null); return; }
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(target, 0, moved);
    const { milestones, marco_mvp } = renumberMilestones(next, marcoMvp);
    setItems(milestones);
    setMarcoMvp(marco_mvp);
    setDirty(true);
    setDragIdx(null);
    setOverIdx(null);
    setOverPos("before");
  }
  function onDragEnd() { setDragIdx(null); setOverIdx(null); setOverPos("before"); }

  // Alternativa acessível por teclado ao drag-and-drop (mesma reordenação do onDrop).
  function moveBy(idx: number, delta: number) {
    const target = idx + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    const { milestones, marco_mvp } = renumberMilestones(next, marcoMvp);
    setItems(milestones);
    setMarcoMvp(marco_mvp);
    setDirty(true);
  }
  function onHandleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === "ArrowUp") { e.preventDefault(); moveBy(idx, -1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); moveBy(idx, 1); }
  }

  function reset() {
    setItems(initial);
    setMarcoMvp(parsed?.marco_mvp);
    setDirty(false);
  }

  function save() {
    if (!canDrag || saving) return;
    setSaving(true);
    const nextData: MilestonesData = { ...parsed, milestones: items, marco_mvp: marcoMvp };
    const newContent = replaceJsonBlock(content, nextData as object);
    updateArtifact.mutate(
      { projectId: projectId!, phaseNumber: phaseNumber!, artifactKey: artifactKey!, data: { content: newContent, contentJson: null } },
      {
        onSuccess: () => {
          toast({ title: "Milestones reordenados", description: `${items.length} marcos atualizados.` });
          setDirty(false);
          setSaving(false);
          onUpdate?.();
        },
        onError: () => {
          toast({ title: "Erro ao salvar", description: "Tente novamente.", variant: "destructive" });
          setSaving(false);
        },
      }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h4 className="font-serif text-base">{items.length} milestones</h4>
        <div className="flex items-center gap-3">
          {parsed.duracao_total_estimada && <span className="text-xs text-muted-foreground">Duração total: <strong className="text-foreground">{parsed.duracao_total_estimada}</strong></span>}
          {canDrag && <span className="text-[10px] font-mono uppercase text-muted-foreground hidden md:inline">Arraste para reordenar</span>}
        </div>
      </div>
      <div className="overflow-x-auto -mx-1 pb-1">
        <div className="relative flex items-start gap-0 min-w-max px-1">
          {items.map((m, idx) => {
            const isMvp = mvp && String(m.numero) === mvp;
            const riskDot: Record<string, string> = {
              baixo: "border-green-500/60 bg-green-500/10",
              medio: "border-amber-500/60 bg-amber-500/10",
              alto: "border-red-500/60 bg-red-500/10",
            };
            return (
              <div key={`trail-${m.numero}-${idx}`} className="flex items-start">
                <div className="flex flex-col items-center w-28">
                  <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center text-xs font-bold ${riskDot[m.risco ?? "medio"] ?? riskDot.medio} ${isMvp ? "ring-2 ring-primary ring-offset-2 ring-offset-background" : ""}`}>
                    {m.numero}
                  </div>
                  <div className="text-[11px] font-medium text-foreground text-center mt-1.5 line-clamp-2 px-0.5">{m.nome}</div>
                  {m.duracao && <div className="text-[10px] text-muted-foreground mt-0.5">{m.duracao}</div>}
                  {isMvp && <div className="text-[9px] font-mono uppercase text-primary mt-0.5">MVP</div>}
                </div>
                {idx < items.length - 1 && <div className="h-0.5 w-6 bg-border mt-[18px] flex-shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>
      <div className="relative">
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />
        <div className="space-y-3">
          {items.map((m, idx) => {
            const isMvp = mvp && String(m.numero) === mvp;
            const isDragging = dragIdx === idx;
            const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
            return (
              <div
                key={`${m.numero}-${idx}`}
                className={`relative pl-12 transition-all ${isDragging ? "opacity-40" : ""} ${isOver ? "translate-y-0.5" : ""}`}
                draggable={canDrag}
                onDragStart={canDrag ? (e) => onDragStart(e, idx) : undefined}
                onDragOver={canDrag ? (e) => onDragOver(e, idx) : undefined}
                onDrop={canDrag ? (e) => onDrop(e, idx) : undefined}
                onDragEnd={canDrag ? onDragEnd : undefined}
                data-testid={`milestone-row-${idx}`}
              >
                {isOver && overPos === "before" && <div className="absolute left-12 right-0 -top-1.5 h-0.5 bg-accent rounded" aria-hidden="true" />}
                {isOver && overPos === "after" && <div className="absolute left-12 right-0 -bottom-1.5 h-0.5 bg-accent rounded" aria-hidden="true" />}
                <div className={`absolute left-1 top-2 w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold border-2 ${isMvp ? "bg-accent text-accent-foreground border-accent" : "bg-primary text-white border-primary"}`}>
                  {m.numero}
                </div>
                <div className={`rounded-xl border p-4 ${isMvp ? "border-accent/40 bg-accent/5" : "border-border bg-card"} ${canDrag ? "hover:border-primary/40" : ""}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <div className="flex-1 min-w-0 flex items-start gap-2">
                      {canDrag && (
                        <button
                          type="button"
                          className="cursor-grab active:cursor-grabbing text-muted-foreground mt-1 select-none rounded focus-visible:ring-2 focus-visible:ring-primary/50"
                          aria-label={`Mover milestone ${idx + 1} de ${items.length}. Use as setas para cima e para baixo para reordenar.`}
                          title="Arrastar ou usar as setas do teclado para reordenar"
                          onKeyDown={(e) => onHandleKeyDown(e, idx)}
                        >
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                        </button>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h5 className="font-serif text-base text-foreground">{m.nome}</h5>
                          {isMvp && <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-mono uppercase font-bold">MVP</span>}
                        </div>
                        {m.duracao && <div className="text-xs text-muted-foreground mt-0.5">{m.duracao}</div>}
                      </div>
                    </div>
                    {m.risco && (
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${RISK_STYLE[m.risco] ?? RISK_STYLE.medio}`}>
                        risco {m.risco}
                      </span>
                    )}
                  </div>
                  {!!m.features?.length && (
                    <ul className="text-sm space-y-0.5 mb-2">
                      {m.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-foreground"><span className="text-primary mt-0.5">▸</span><span>{f}</span></li>
                      ))}
                    </ul>
                  )}
                  {m.criterio_aceitacao && (
                    <div className="text-xs bg-secondary/40 rounded p-2 mt-2">
                      <span className="font-mono uppercase text-[10px] text-muted-foreground">Aceitação · </span>
                      <span className="text-foreground">{m.criterio_aceitacao}</span>
                    </div>
                  )}
                  {m.demo && <div className="text-[11px] text-muted-foreground mt-1.5">Demo: {m.demo}</div>}
                  {!!m.dependencias?.length && <div className="text-[11px] text-muted-foreground mt-1">Depende de: {m.dependencias.join(", ")}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {canDrag && dirty && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground mr-auto">Alterações não salvas</span>
          <Button variant="outline" size="sm" onClick={reset} disabled={saving} data-testid="button-milestones-reset">Desfazer</Button>
          <Button size="sm" onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90 text-white" data-testid="button-milestones-save">
            {saving ? "Salvando…" : "Salvar ordem"}
          </Button>
        </div>
      )}
      <Attribution>Milestone-based delivery (Brooks, 1995 · Cockburn, 2004). Cada marco deve ser um entregável demonstrável.</Attribution>
    </div>
  );
}

// ───────────────────────── 9b. User Stories (Fase 2) ─────────────────────────
type UserStoriesData = {
  stories?: {
    id: string;
    persona: string;
    acao: string;
    valor: string;
    epico?: string;
    esforco?: "P" | "M" | "G";
    prioridade?: number;
    aceitacao?: string[];
  }[];
};

const ESFORCO_STYLE: Record<string, string> = {
  P: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  M: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  G: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

const ESFORCO_CYCLE: Array<"P" | "M" | "G"> = ["P", "M", "G"];
function cycleEsforco(cur?: "P" | "M" | "G"): "P" | "M" | "G" {
  if (!cur) return "P";
  const i = ESFORCO_CYCLE.indexOf(cur);
  return ESFORCO_CYCLE[(i + 1) % ESFORCO_CYCLE.length];
}
function cyclePrioridade(cur?: number): number {
  if (!cur || cur < 1 || cur > 5) return 1;
  return cur === 5 ? 1 : cur + 1;
}

function prioStyle(p?: number): string {
  if (!p) return "bg-secondary text-muted-foreground border-border";
  if (p <= 2) return "bg-accent/15 text-accent-foreground dark:text-accent border-accent/40";
  if (p === 3) return "bg-primary/10 text-primary border-primary/30";
  return "bg-muted text-muted-foreground border-border";
}

type UserStory = NonNullable<UserStoriesData["stories"]>[number];

export function UserStoriesCanvas({
  content,
  canEdit = false,
  projectId,
  phaseNumber,
  artifactKey,
  onUpdate,
}: {
  content: string;
  canEdit?: boolean;
  projectId?: number;
  phaseNumber?: number;
  artifactKey?: string;
  onUpdate?: () => void;
}) {
  const parsed = parseJsonBlock<UserStoriesData>(content);
  const initial = parsed?.stories ?? [];
  const [items, setItems] = useState<UserStory[]>(initial);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [overPos, setOverPos] = useState<"before" | "after">("before");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filterEpico, setFilterEpico] = useState<string | "all">("all");
  const [filterPrio, setFilterPrio] = useState<number | "all">("all");
  const { toast } = useToast();
  const updateArtifact = useUpdateArtifact();

  useEffect(() => {
    if (!dirty) setItems(parsed?.stories ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (!parsed?.stories?.length) return <Fallback content={content} />;

  const canDrag = canEdit && !!projectId && !!phaseNumber && !!artifactKey;

  function computePos(e: React.DragEvent): "before" | "after" {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return e.clientY - rect.top < rect.height / 2 ? "before" : "after";
  }
  function onDragStart(e: React.DragEvent, idx: number) {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", String(idx)); } catch { /* noop */ }
  }
  function onDragOver(e: React.DragEvent, idx: number) {
    if (dragIdx === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const pos = computePos(e);
    if (overIdx !== idx) setOverIdx(idx);
    if (overPos !== pos) setOverPos(pos);
  }
  function onDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null) return;
    const pos = computePos(e);
    let target = pos === "before" ? idx : idx + 1;
    if (dragIdx < target) target -= 1;
    if (target === dragIdx) { setDragIdx(null); setOverIdx(null); setOverPos("before"); return; }
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(target, 0, moved);
    setItems(next);
    setDirty(true);
    setDragIdx(null);
    setOverIdx(null);
    setOverPos("before");
  }
  function onDragEnd() { setDragIdx(null); setOverIdx(null); setOverPos("before"); }

  // Alternativa acessível por teclado ao drag-and-drop (mesma reordenação do onDrop).
  function moveBy(idx: number, delta: number) {
    const target = idx + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    setItems(next);
    setDirty(true);
  }
  function onHandleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === "ArrowUp") { e.preventDefault(); moveBy(idx, -1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); moveBy(idx, 1); }
  }

  function reset() { setItems(initial); setDirty(false); }

  function save() {
    if (!canDrag || saving) return;
    setSaving(true);
    const nextData: UserStoriesData = { ...parsed, stories: items };
    const newContent = replaceJsonBlock(content, nextData as object);
    updateArtifact.mutate(
      { projectId: projectId!, phaseNumber: phaseNumber!, artifactKey: artifactKey!, data: { content: newContent, contentJson: null } },
      {
        onSuccess: () => {
          toast({ title: "Stories atualizadas", description: `${items.length} stories salvas.` });
          setDirty(false);
          setSaving(false);
          onUpdate?.();
        },
        onError: () => {
          toast({ title: "Erro ao salvar", description: "Tente novamente.", variant: "destructive" });
          setSaving(false);
        },
      }
    );
  }

  const epicos = Array.from(new Set(items.map((s) => s.epico).filter(Boolean))) as string[];
  const filterActive = filterEpico !== "all" || filterPrio !== "all";
  const dragEnabled = canDrag && !filterActive;
  const displayItems = items
    .map((s, idx) => ({ s, idx }))
    .filter(({ s }) => (filterEpico === "all" || s.epico === filterEpico) && (filterPrio === "all" || s.prioridade === filterPrio));

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <h4 className="font-serif text-base">
          {displayItems.length === items.length ? `${items.length} user stories` : `${displayItems.length} de ${items.length} stories`}
          {epicos.length > 0 && <span className="text-muted-foreground font-sans"> · {epicos.length} épicos</span>}
        </h4>
        {canDrag && (
          <span className="text-[10px] font-mono uppercase text-muted-foreground hidden md:inline">
            {dragEnabled ? "Arraste para repriorizar" : "Limpe filtros para reordenar"}
          </span>
        )}
      </div>
      {(epicos.length > 0 || items.some((s) => s.prioridade != null)) && (
        <div className="flex flex-wrap gap-1.5 items-center">
          {epicos.length > 0 && (
            <>
              <span className="text-[10px] font-mono uppercase text-muted-foreground mr-1">Épico:</span>
              <button
                type="button"
                onClick={() => setFilterEpico("all")}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${filterEpico === "all" ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}
                data-testid="filter-epico-all"
              >Todos</button>
              {Array.from(new Set([...epicos, ...(filterEpico !== "all" ? [filterEpico] : [])])).map((ep) => (
                <button
                  key={ep}
                  type="button"
                  onClick={() => setFilterEpico(ep)}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${filterEpico === ep ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}
                  data-testid={`filter-epico-${ep}`}
                >{ep}</button>
              ))}
            </>
          )}
          {items.some((s) => s.prioridade != null) && (
            <>
              <span className="text-[10px] font-mono uppercase text-muted-foreground ml-3 mr-1">Prioridade:</span>
              <button
                type="button"
                onClick={() => setFilterPrio("all")}
                className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${filterPrio === "all" ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}
                data-testid="filter-prio-all"
              >Todas</button>
              {[1, 2, 3, 4, 5].filter((p) => items.some((s) => s.prioridade === p) || filterPrio === p).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setFilterPrio(p)}
                  className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${filterPrio === p ? "bg-primary text-white border-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"}`}
                  data-testid={`filter-prio-${p}`}
                >P{p}</button>
              ))}
            </>
          )}
          {filterActive && (
            <button
              type="button"
              onClick={() => { setFilterEpico("all"); setFilterPrio("all"); }}
              className="text-[11px] px-2 py-0.5 rounded-full text-muted-foreground hover:text-foreground ml-2"
              data-testid="filter-clear"
            >Limpar</button>
          )}
        </div>
      )}
      {displayItems.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          Nenhuma story corresponde aos filtros.
        </div>
      ) : (
      <div className="space-y-2">
        {displayItems.map(({ s, idx }) => {
          const isDragging = dragIdx === idx;
          const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
          return (
            <div
              key={s.id || `story-${idx}`}
              className={`relative transition-all ${isDragging ? "opacity-40" : ""}`}
              draggable={dragEnabled}
              onDragStart={dragEnabled ? (e) => onDragStart(e, idx) : undefined}
              onDragOver={dragEnabled ? (e) => onDragOver(e, idx) : undefined}
              onDrop={dragEnabled ? (e) => onDrop(e, idx) : undefined}
              onDragEnd={dragEnabled ? onDragEnd : undefined}
              data-testid={`user-story-row-${idx}`}
            >
              {isOver && overPos === "before" && <div className="absolute left-0 right-0 -top-1 h-0.5 bg-accent rounded" aria-hidden="true" />}
              {isOver && overPos === "after" && <div className="absolute left-0 right-0 -bottom-1 h-0.5 bg-accent rounded" aria-hidden="true" />}
              <details className={`rounded-xl border bg-card group ${canDrag ? "border-border hover:border-primary/40" : "border-border"}`}>
                <summary className="cursor-pointer px-4 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors list-none">
                  {canDrag && (
                    <button
                      type="button"
                      disabled={!dragEnabled}
                      className={`select-none rounded focus-visible:ring-2 focus-visible:ring-primary/50 ${dragEnabled ? "cursor-grab active:cursor-grabbing text-muted-foreground" : "cursor-not-allowed text-muted-foreground/30"}`}
                      aria-label={dragEnabled ? `Mover story ${idx + 1} de ${items.length}. Use as setas para cima e para baixo para reordenar.` : "Limpe filtros para arrastar"}
                      title={dragEnabled ? "Arrastar ou usar as setas do teclado para reordenar" : "Limpe filtros para arrastar"}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onKeyDown={(e) => { if (dragEnabled) onHandleKeyDown(e, idx); }}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                    </button>
                  )}
                  {s.prioridade != null && (
                    canDrag ? (
                      <button
                        type="button"
                        className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all ${prioStyle(s.prioridade)}`}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); const next = [...items]; next[idx] = { ...s, prioridade: cyclePrioridade(s.prioridade) }; setItems(next); setDirty(true); }}
                        aria-label={`Prioridade ${s.prioridade}, clique para alterar`}
                        title="Clique para alterar prioridade (1-5)"
                        data-testid={`button-user-story-prio-${idx}`}
                      >P{s.prioridade}</button>
                    ) : (
                      <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${prioStyle(s.prioridade)}`}>P{s.prioridade}</span>
                    )
                  )}
                  <span className="font-mono text-[11px] text-muted-foreground">{s.id}</span>
                  <span className="flex-1 text-sm text-foreground truncate">
                    <span className="text-muted-foreground">Como </span><strong>{s.persona}</strong>
                    <span className="text-muted-foreground">, quero </span>{s.acao}
                  </span>
                  {s.epico && <span className="text-[10px] font-mono uppercase text-muted-foreground hidden md:inline">{s.epico}</span>}
                  {s.esforco && (
                    canDrag ? (
                      <button
                        type="button"
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all ${ESFORCO_STYLE[s.esforco] ?? ESFORCO_STYLE.M}`}
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); const next = [...items]; next[idx] = { ...s, esforco: cycleEsforco(s.esforco) }; setItems(next); setDirty(true); }}
                        aria-label={`Esforço ${s.esforco}, clique para alterar`}
                        title="Clique para alterar esforço (P/M/G)"
                        data-testid={`button-user-story-esforco-${idx}`}
                      >{s.esforco}</button>
                    ) : (
                      <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded border ${ESFORCO_STYLE[s.esforco] ?? ESFORCO_STYLE.M}`}>{s.esforco}</span>
                    )
                  )}
                  <svg className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 12 15 18 9" /></svg>
                </summary>
                <div className="px-4 pb-3 pt-2 border-t border-border space-y-2 text-sm">
                  <div className="text-foreground">
                    <span className="text-muted-foreground">Como </span><strong>{s.persona}</strong>
                    <span className="text-muted-foreground">, quero </span>{s.acao}
                    <span className="text-muted-foreground">, para </span>{s.valor}
                  </div>
                  {!!s.aceitacao?.length && (
                    <div className="rounded bg-secondary/40 p-2 mt-2">
                      <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Critérios de aceitação</div>
                      <ul className="space-y-1 text-foreground">
                        {s.aceitacao.map((a, i) => <li key={i} className="flex items-start gap-2"><span className="text-primary mt-0.5">▸</span><span>{a}</span></li>)}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            </div>
          );
        })}
      </div>
      )}
      {canDrag && dirty && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground mr-auto">Alterações não salvas</span>
          <Button variant="outline" size="sm" onClick={reset} disabled={saving} data-testid="button-user-stories-reset">Desfazer</Button>
          <Button size="sm" onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90 text-white" data-testid="button-user-stories-save">
            {saving ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      )}
      <Attribution>User stories como unidade de valor (Cohn, 2004 · Patton, 2014). Priorize por valor entregue, não por esforço.</Attribution>
    </div>
  );
}

// ───────────────────────── 10. Casos de Teste Críticos (Fase 6) ─────────────────────────
type CasosTesteData = {
  casos?: {
    id: string; titulo: string; prioridade: "P0" | "P1" | "P2";
    tipo?: string; preconds?: string; steps?: string[]; esperado?: string;
  }[];
  distribuicao_alvo?: string;
};

const PRIO_STYLE: Record<string, string> = {
  P0: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/40",
  P1: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40",
  P2: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
};

type CasoTeste = NonNullable<CasosTesteData["casos"]>[number];

export function CasosTesteCanvas({
  content,
  canEdit = false,
  projectId,
  phaseNumber,
  artifactKey,
  onUpdate,
}: {
  content: string;
  canEdit?: boolean;
  projectId?: number;
  phaseNumber?: number;
  artifactKey?: string;
  onUpdate?: () => void;
}) {
  const parsed = parseJsonBlock<CasosTesteData>(content);
  const initial = parsed?.casos ?? [];
  const [items, setItems] = useState<CasoTeste[]>(initial);
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const [overPos, setOverPos] = useState<"before" | "after">("before");
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();
  const updateArtifact = useUpdateArtifact();

  useEffect(() => {
    if (!dirty) setItems(parsed?.casos ?? []);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content]);

  if (!parsed?.casos?.length) return <Fallback content={content} />;

  const canDrag = canEdit && !!projectId && !!phaseNumber && !!artifactKey;
  const counts = items.reduce<Record<string, number>>((acc, c) => {
    acc[c.prioridade] = (acc[c.prioridade] ?? 0) + 1; return acc;
  }, {});

  function computePos(e: React.DragEvent): "before" | "after" {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    return e.clientY - rect.top < rect.height / 2 ? "before" : "after";
  }
  function onDragStart(e: React.DragEvent, idx: number) {
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = "move";
    try { e.dataTransfer.setData("text/plain", String(idx)); } catch { /* noop */ }
  }
  function onDragOver(e: React.DragEvent, idx: number) {
    if (dragIdx === null) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const pos = computePos(e);
    if (overIdx !== idx) setOverIdx(idx);
    if (overPos !== pos) setOverPos(pos);
  }
  function onDrop(e: React.DragEvent, idx: number) {
    e.preventDefault();
    if (dragIdx === null) return;
    const pos = computePos(e);
    let target = pos === "before" ? idx : idx + 1;
    if (dragIdx < target) target -= 1;
    if (target === dragIdx) { setDragIdx(null); setOverIdx(null); setOverPos("before"); return; }
    const next = [...items];
    const [moved] = next.splice(dragIdx, 1);
    next.splice(target, 0, moved);
    setItems(next);
    setDirty(true);
    setDragIdx(null);
    setOverIdx(null);
    setOverPos("before");
  }
  function onDragEnd() { setDragIdx(null); setOverIdx(null); setOverPos("before"); }

  // Alternativa acessível por teclado ao drag-and-drop (mesma reordenação do onDrop).
  function moveBy(idx: number, delta: number) {
    const target = idx + delta;
    if (target < 0 || target >= items.length) return;
    const next = [...items];
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    setItems(next);
    setDirty(true);
  }
  function onHandleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === "ArrowUp") { e.preventDefault(); moveBy(idx, -1); }
    else if (e.key === "ArrowDown") { e.preventDefault(); moveBy(idx, 1); }
  }

  function reset() { setItems(initial); setDirty(false); }

  function save() {
    if (!canDrag || saving) return;
    setSaving(true);
    const nextData: CasosTesteData = { ...parsed, casos: items };
    const newContent = replaceJsonBlock(content, nextData as object);
    updateArtifact.mutate(
      { projectId: projectId!, phaseNumber: phaseNumber!, artifactKey: artifactKey!, data: { content: newContent, contentJson: null } },
      {
        onSuccess: () => {
          toast({ title: "Casos atualizados", description: `${items.length} casos salvos.` });
          setDirty(false);
          setSaving(false);
          onUpdate?.();
        },
        onError: () => {
          toast({ title: "Erro ao salvar", description: "Tente novamente.", variant: "destructive" });
          setSaving(false);
        },
      }
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <h4 className="font-serif text-base">{items.length} casos de teste</h4>
        <div className="flex gap-2 items-center">
          {(["P0", "P1", "P2"] as const).map((p) => (
            <span key={p} className={`text-[11px] font-mono px-2 py-0.5 rounded border ${PRIO_STYLE[p]}`}>
              {p}: <strong>{counts[p] ?? 0}</strong>
            </span>
          ))}
          {canDrag && <span className="text-[10px] font-mono uppercase text-muted-foreground hidden md:inline">Arraste para reordenar</span>}
        </div>
      </div>
      <div className="space-y-2">
        {items.map((c, idx) => {
          const isDragging = dragIdx === idx;
          const isOver = overIdx === idx && dragIdx !== null && dragIdx !== idx;
          return (
            <div
              key={c.id || `caso-${idx}`}
              className={`relative transition-all ${isDragging ? "opacity-40" : ""}`}
              draggable={canDrag}
              onDragStart={canDrag ? (e) => onDragStart(e, idx) : undefined}
              onDragOver={canDrag ? (e) => onDragOver(e, idx) : undefined}
              onDrop={canDrag ? (e) => onDrop(e, idx) : undefined}
              onDragEnd={canDrag ? onDragEnd : undefined}
              data-testid={`caso-teste-row-${idx}`}
            >
              {isOver && overPos === "before" && <div className="absolute left-0 right-0 -top-1 h-0.5 bg-accent rounded" aria-hidden="true" />}
              {isOver && overPos === "after" && <div className="absolute left-0 right-0 -bottom-1 h-0.5 bg-accent rounded" aria-hidden="true" />}
              <details className={`rounded-xl border bg-card group ${canDrag ? "border-border hover:border-primary/40" : "border-border"}`}>
                <summary className="cursor-pointer px-4 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors list-none">
                  {canDrag && (
                    <button
                      type="button"
                      className="cursor-grab active:cursor-grabbing text-muted-foreground select-none rounded focus-visible:ring-2 focus-visible:ring-primary/50"
                      aria-label={`Mover caso de teste ${idx + 1} de ${items.length}. Use as setas para cima e para baixo para reordenar.`}
                      title="Arrastar ou usar as setas do teclado para reordenar"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
                      onKeyDown={(e) => onHandleKeyDown(e, idx)}
                    >
                      <svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><circle cx="9" cy="6" r="1.5"/><circle cx="9" cy="12" r="1.5"/><circle cx="9" cy="18" r="1.5"/><circle cx="15" cy="6" r="1.5"/><circle cx="15" cy="12" r="1.5"/><circle cx="15" cy="18" r="1.5"/></svg>
                    </button>
                  )}
                  {canDrag ? (
                    <button
                      type="button"
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border cursor-pointer hover:ring-2 hover:ring-primary/30 transition-all ${PRIO_STYLE[c.prioridade] ?? PRIO_STYLE.P2}`}
                      onClick={(e) => {
                        e.preventDefault(); e.stopPropagation();
                        const nextPrio = c.prioridade === "P0" ? "P1" : c.prioridade === "P1" ? "P2" : "P0";
                        const next = [...items]; next[idx] = { ...c, prioridade: nextPrio }; setItems(next); setDirty(true);
                      }}
                      aria-label={`Prioridade ${c.prioridade}, clique para alterar`}
                      title="Clique para alterar prioridade (P0/P1/P2)"
                      data-testid={`button-caso-teste-prio-${idx}`}
                    >{c.prioridade}</button>
                  ) : (
                    <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${PRIO_STYLE[c.prioridade] ?? PRIO_STYLE.P2}`}>{c.prioridade}</span>
                  )}
                  <span className="font-mono text-[11px] text-muted-foreground">{c.id}</span>
                  <span className="flex-1 text-sm text-foreground">{c.titulo}</span>
                  {c.tipo && <span className="text-[10px] font-mono uppercase text-muted-foreground">{c.tipo}</span>}
                  <svg className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 12 15 18 9" /></svg>
                </summary>
                <div className="px-4 pb-3 pt-1 border-t border-border space-y-2 text-sm">
                  {c.preconds && <div><span className="text-[10px] font-mono uppercase text-muted-foreground">Pré-condições · </span><span className="text-foreground">{c.preconds}</span></div>}
                  {!!c.steps?.length && (
                    <div>
                      <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Steps</div>
                      <ol className="list-decimal list-inside space-y-0.5 text-foreground">
                        {c.steps.map((s, i) => <li key={i}>{s}</li>)}
                      </ol>
                    </div>
                  )}
                  {c.esperado && (
                    <div className="rounded bg-green-500/5 border border-green-500/20 p-2">
                      <span className="text-[10px] font-mono uppercase text-green-700 dark:text-green-400">Esperado · </span>
                      <span className="text-foreground">{c.esperado}</span>
                    </div>
                  )}
                </div>
              </details>
            </div>
          );
        })}
      </div>
      {canDrag && dirty && (
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <span className="text-xs text-muted-foreground mr-auto">Alterações não salvas</span>
          <Button variant="outline" size="sm" onClick={reset} disabled={saving} data-testid="button-casos-teste-reset">Desfazer</Button>
          <Button size="sm" onClick={save} disabled={saving} className="bg-primary hover:bg-primary/90 text-white" data-testid="button-casos-teste-save">
            {saving ? "Salvando…" : "Salvar alterações"}
          </Button>
        </div>
      )}
      {parsed.distribuicao_alvo && <p className="text-[11px] text-muted-foreground italic">{parsed.distribuicao_alvo}</p>}
      <Attribution>Test prioritization (Kaner et al., 1999 · Crispin & Gregory, 2009). P0 bloqueia release.</Attribution>
    </div>
  );
}

// ───────────────────────── Sprint 1 Detalhado (Fase 5) ─────────────────────────
type Sprint1Data = {
  objetivos?: string[];
  tasks?: Array<{ titulo: string; estimativa_horas?: number; categoria?: string }>;
  setup_passos?: string[];
  definition_of_done?: string[];
  bloqueadores?: Array<{ risco: string; mitigacao?: string }>;
  checkpoint_fim_sprint?: string;
};

export function Sprint1Canvas({ content }: { content: string }) {
  const data = parseJsonBlock<Sprint1Data>(content);
  if (!data?.tasks?.length) return <Fallback content={content} />;
  const byCategory = new Map<string, NonNullable<Sprint1Data["tasks"]>>();
  for (const t of data.tasks) {
    const cat = t.categoria ?? "Outros";
    if (!byCategory.has(cat)) byCategory.set(cat, []);
    byCategory.get(cat)!.push(t);
  }
  const totalHoras = data.tasks.reduce((s, t) => s + (t.estimativa_horas ?? 0), 0);
  const chartData = [...byCategory.entries()].map(([categoria, tasks]) => ({
    categoria,
    horas: tasks.reduce((s, t) => s + (t.estimativa_horas ?? 0), 0),
  }));

  return (
    <div className="space-y-4">
      {!!data.objetivos?.length && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1.5">Objetivos da sprint</div>
          <ul className="space-y-1">
            {data.objetivos.map((o, i) => <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-primary mt-0.5">✓</span><span>{o}</span></li>)}
          </ul>
        </div>
      )}

      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h4 className="font-serif text-base">{data.tasks.length} tasks</h4>
        <span className="text-xs text-muted-foreground">Total: <strong className="text-foreground">{totalHoras}h</strong></span>
      </div>

      {byCategory.size > 1 && (
        <div className="rounded-xl border border-border bg-card/50 p-2">
          <ResponsiveContainer width="100%" height={Math.max(80, byCategory.size * 32)}>
            <BarChart data={chartData} layout="vertical" margin={{ top: 4, right: 32, left: 4, bottom: 4 }}>
              <CartesianGrid horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="categoria" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} width={80} />
              <Bar dataKey="horas" fill="hsl(var(--primary))" radius={[0, 6, 6, 0]} barSize={18}>
                <LabelList dataKey="horas" position="right" formatter={(v: number) => `${v}h`} style={{ fontSize: 11, fill: "hsl(var(--foreground))", fontWeight: 600 }} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="space-y-3">
        {[...byCategory.entries()].map(([cat, tasks]) => (
          <div key={cat} className="rounded-lg border border-border p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{cat}</div>
              <div className="text-xs text-muted-foreground">{tasks.reduce((s, t) => s + (t.estimativa_horas ?? 0), 0)}h</div>
            </div>
            <ul className="space-y-1.5">
              {tasks.map((t, i) => (
                <li key={i} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-foreground">{t.titulo}</span>
                  {t.estimativa_horas != null && <span className="text-xs font-mono text-muted-foreground flex-shrink-0">{t.estimativa_horas}h</span>}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {!!data.setup_passos?.length && (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Setup do ambiente</div>
          <ol className="space-y-1">
            {data.setup_passos.map((s, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-muted-foreground font-mono text-xs flex-shrink-0">{i + 1}.</span><span>{s}</span></li>
            ))}
          </ol>
        </div>
      )}

      {!!data.definition_of_done?.length && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Definition of Done</div>
          <ul className="space-y-1">
            {data.definition_of_done.map((d, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-green-600 dark:text-green-400 mt-0.5">✓</span><span>{d}</span></li>
            ))}
          </ul>
        </div>
      )}

      {!!data.bloqueadores?.length && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3">
          <div className="text-[10px] font-mono uppercase text-amber-700 dark:text-amber-400 mb-1.5">Bloqueadores potenciais</div>
          <ul className="space-y-2">
            {data.bloqueadores.map((b, i) => (
              <li key={i} className="text-sm">
                <span className="text-foreground font-medium">{b.risco}</span>
                {b.mitigacao && <span className="text-muted-foreground"> — {b.mitigacao}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {data.checkpoint_fim_sprint && (
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Checkpoint de fim de sprint</div>
          <p className="text-sm text-foreground">{data.checkpoint_fim_sprint}</p>
        </div>
      )}
    </div>
  );
}
