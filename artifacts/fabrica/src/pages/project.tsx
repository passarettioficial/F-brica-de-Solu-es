import { useMemo, useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetProject,
  useUpdateProject,
  getGetProjectQueryKey,
  getGetDashboardQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { PHASES } from "@/lib/constants";
import { usePlan } from "@/hooks/usePlan";
import { AppSidebar } from "@/components/app-sidebar";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const ENCOURAGEMENT: Record<number, string> = {
  0: "Tudo comeca aqui. Vamos validar sua ideia.",
  1: "Excelente! Ideia validada. Hora de definir o produto.",
  2: "Incrivel! Produto definido. Vamos especificar tecnicamente.",
  3: "Otimo progresso! Especificacao pronta. Hora de implementar.",
  4: "Quase la! Implementacao concluida. Vamos testar.",
  5: "Produto pronto e testado. Hora do grande lancamento!",
};

function PhasePipeline({ phases, currentPhase, projectId }: {
  phases: Array<{ phaseNumber: number; status: string }>;
  currentPhase: number;
  projectId: number;
}) {
  const [, setLocation] = useLocation();
  const sorted = [...phases].sort((a, b) => a.phaseNumber - b.phaseNumber);

  return (
    <div className="flex items-center gap-0 w-full overflow-x-auto pb-2" role="list" aria-label="Pipeline de fases">
      {sorted.map((phase, i) => {
        const phaseDef = PHASES[phase.phaseNumber - 1];
        const isClickable = phase.status !== "locked";
        const isActive = phase.status === "active";
        const isCompleted = phase.status === "completed";
        const isLocked = phase.status === "locked";

        return (
          <div key={phase.phaseNumber} className="flex items-center" role="listitem">
            {i > 0 && (
              <div className={`h-0.5 w-8 md:w-14 flex-shrink-0 transition-colors duration-300 ${isCompleted || isActive ? "bg-primary" : "bg-muted"}`} />
            )}
            <button
              onClick={() => isClickable && setLocation(`/projects/${projectId}/phases/${phase.phaseNumber}`)}
              disabled={!isClickable}
              aria-label={`Fase ${phase.phaseNumber} — ${phaseDef?.name ?? ""} (${phase.status === "completed" ? "concluida" : phase.status === "active" ? "em andamento" : "bloqueada"})`}
              className={`flex flex-col items-center group transition-all ${isClickable ? "cursor-pointer" : "cursor-not-allowed"}`}
              data-testid={`phase-circle-${phase.phaseNumber}`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold border-2 transition-all
                  ${isCompleted ? "bg-primary border-primary text-white" : ""}
                  ${isActive ? "bg-primary/15 border-primary text-primary shadow-sm shadow-primary/20" : ""}
                  ${isLocked ? "bg-muted border-muted-foreground/20 text-muted-foreground" : ""}
                  ${isClickable ? "group-hover:scale-110" : ""}
                `}
              >
                {isCompleted ? (
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                ) : phase.phaseNumber}
              </div>
              <span className={`text-xs mt-1.5 font-medium whitespace-nowrap ${isActive ? "text-primary" : isCompleted ? "text-foreground" : "text-muted-foreground"}`}>
                {phaseDef?.name}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── CoherenceCard ──────────────────────────────────────────────────────────

function CoherenceCard({ project, projectId, onRefresh }: { project: any; projectId: number; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const score = project.coherenceScore as number | null | undefined;
  const data = (project.coherenceData ?? null) as any;
  const updatedAt = project.coherenceUpdatedAt ? new Date(project.coherenceUpdatedAt) : null;
  const phases: any[] = project.phases ?? [];
  const hasEnoughArtifacts = phases.some((p: any) => p.status === "completed" || p.status === "active");

  const scoreColor = score == null ? "text-muted-foreground" : score >= 75 ? "text-emerald-600 dark:text-emerald-400" : score >= 50 ? "text-amber-600 dark:text-amber-400" : "text-destructive";
  const ringColor = score == null ? "#e5e7eb" : score >= 75 ? "#10b981" : score >= 50 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 20;
  const strokeDash = score != null ? (score / 100) * circumference : 0;

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${basePath}/api/projects/${projectId}/coherence/analyze`, { method: "POST" });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || "Erro ao analisar"); }
      onRefresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-card border border-card-border rounded-xl p-5 mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0 w-14 h-14">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="20" fill="none" stroke="var(--muted)" strokeWidth="4" />
              {score != null && (
                <circle cx="28" cy="28" r="20" fill="none" stroke={ringColor} strokeWidth="4"
                  strokeLinecap="round" strokeDasharray={`${strokeDash} ${circumference}`}
                  transform="rotate(-90 28 28)" style={{ transition: "stroke-dasharray 0.5s ease" }} />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold ${scoreColor}`}>{score != null ? score : "—"}</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-base font-medium">
                {score == null ? "Score de Coerência"
                  : score >= 75 ? "Produto coeso — artefatos alinhados"
                  : score >= 50 ? "Divergências detectadas — revise antes de avançar"
                  : "Produto incoerente — risco real de falha"}
              </h3>
              {score != null && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  score >= 75 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" :
                  score >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                  "bg-destructive/10 text-destructive"
                }`}>
                  {score >= 75 ? "Coeso" : score >= 50 ? "Conflitos" : "Incoerente"}
                </span>
              )}
            </div>
            {score != null && !data?.resumo && (
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md">
                {score >= 75
                  ? "Sua ideia, estratégia e arquitetura falam a mesma língua. Isso é raro — é seu diferencial competitivo."
                  : score >= 50
                  ? "Há pontos de atrito entre as fases. Corrija agora, antes de construir em cima de bases instáveis."
                  : "As partes do seu produto contradizem umas às outras. Sem resolver isso, o time vai construir a coisa errada."}
              </p>
            )}
            {data?.resumo && (
              <p className="text-xs text-muted-foreground mt-0.5 max-w-md">{data.resumo}</p>
            )}
            {score == null && (
              <p className="text-xs text-muted-foreground mt-0.5">Analise a consistência entre todos os artefatos do projeto.</p>
            )}
            {updatedAt && (
              <p className="text-xs text-muted-foreground mt-0.5 opacity-60">
                Última análise: {updatedAt.toLocaleDateString("pt-BR")}
              </p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          {error && <span className="text-xs text-destructive max-w-[200px] text-right">{error}</span>}
          <Button size="sm" variant="outline" onClick={analyze} disabled={loading || !hasEnoughArtifacts}>
            {loading ? (
              <span className="flex items-center gap-1.5">
                <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Analisando…
              </span>
            ) : score != null ? "Reanalisar" : "Analisar coerência"}
          </Button>
        </div>
      </div>

      {data?.conflitos?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border space-y-2.5">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            {data.conflitos.length} {data.conflitos.length === 1 ? "conflito detectado" : "conflitos detectados"}
          </p>
          {(data.conflitos as any[]).slice(0, 3).map((c: any, i: number) => (
            <div key={i} className="flex items-start gap-2.5">
              <span className={`mt-1.5 flex-shrink-0 w-2 h-2 rounded-full ${
                c.severidade === "alta" ? "bg-destructive" : c.severidade === "media" ? "bg-amber-500" : "bg-muted-foreground"
              }`} />
              <div className="min-w-0">
                <p className="text-xs text-foreground leading-relaxed">{c.descricao}</p>
                {c.artefatos_envolvidos?.length > 0 && (
                  <p className="text-xs text-muted-foreground mt-0.5">{(c.artefatos_envolvidos as string[]).join(" · ")}</p>
                )}
              </div>
            </div>
          ))}
          {data.conflitos.length > 3 && (
            <p className="text-xs text-muted-foreground pl-4.5">+{data.conflitos.length - 3} conflito(s) adicionais</p>
          )}
        </div>
      )}

      {data && data?.conflitos?.length === 0 && data?.alinhamentos?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="text-xs text-emerald-600 dark:text-emerald-400">✓ Todos os artefatos estão alinhados entre si.</p>
        </div>
      )}
    </div>
  );
}

// ─── MarketPotentialCard ──────────────────────────────────────────────────────

function MarketPotentialCard({ project, projectId, onRefresh }: { project: any; projectId: number; onRefresh: () => void }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const score = project.marketPotentialScore as number | null | undefined;
  const data = (project.marketPotentialData ?? null) as any;
  const updatedAt = project.marketPotentialUpdatedAt ? new Date(project.marketPotentialUpdatedAt) : null;
  const phases: any[] = project.phases ?? [];
  const hasEnoughArtifacts = phases.some((p: any) => p.status === "completed" || p.status === "active");

  const scoreColor = score == null ? "text-muted-foreground" : score >= 75 ? "text-blue-600 dark:text-blue-400" : score >= 50 ? "text-amber-600 dark:text-amber-400" : "text-destructive";
  const ringColor = score == null ? "#e5e7eb" : score >= 75 ? "#2563eb" : score >= 50 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 20;
  const strokeDash = score != null ? (score / 100) * circumference : 0;

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${basePath}/api/projects/${projectId}/potential/analyze`, { method: "POST" });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.error || "Erro ao analisar"); }
      onRefresh();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const DIMENSION_LABELS: Record<string, string> = {
    tamanho_mercado: "Mercado",
    urgencia_problema: "Urgência",
    modelo_receita: "Receita",
    diferencial_competitivo: "Diferencial",
    viabilidade_execucao: "Execução",
  };

  return (
    <div className="bg-card border border-card-border rounded-xl p-5 mb-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-4">
          <div className="relative flex-shrink-0 w-14 h-14">
            <svg width="56" height="56" viewBox="0 0 56 56">
              <circle cx="28" cy="28" r="20" fill="none" stroke="var(--muted)" strokeWidth="4" />
              {score != null && (
                <circle cx="28" cy="28" r="20" fill="none" stroke={ringColor} strokeWidth="4"
                  strokeLinecap="round" strokeDasharray={`${strokeDash} ${circumference}`}
                  transform="rotate(-90 28 28)" style={{ transition: "stroke-dasharray 0.5s ease" }} />
              )}
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={`text-sm font-bold ${scoreColor}`}>{score != null ? score : "—"}</span>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-serif text-base font-medium">Potencial de Mercado</h3>
              {score != null && (
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  score >= 75 ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" :
                  score >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                  "bg-destructive/10 text-destructive"
                }`}>
                  {score >= 75 ? "Alto potencial" : score >= 50 ? "Potencial moderado" : "Potencial baixo"}
                </span>
              )}
            </div>
            {score == null ? (
              <p className="text-xs text-muted-foreground mt-1 max-w-[260px]">Avalie o potencial de mercado — TAM, urgência, modelo de receita e vantagem competitiva.</p>
            ) : (
              <p className="text-xs text-muted-foreground mt-1">
                {updatedAt ? `Analisado em ${updatedAt.toLocaleDateString("pt-BR")}` : "Analisado"}
                {data?.nivel_inovacao && <span className="ml-2 text-primary">· {data.nivel_inovacao.split(" — ")[0]}</span>}
              </p>
            )}
          </div>
        </div>
        <button
          onClick={analyze}
          disabled={loading || !hasEnoughArtifacts}
          className="text-xs text-primary hover:text-primary/80 transition-colors font-medium disabled:opacity-40 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {loading ? "Analisando..." : score != null ? "Reanalisar" : "Analisar Potencial"}
        </button>
      </div>

      {error && <p className="text-xs text-destructive mt-3">{error}</p>}
      {!hasEnoughArtifacts && score == null && (
        <p className="text-xs text-muted-foreground/70 mt-3 italic">Execute a IA em pelo menos uma fase para habilitar esta análise.</p>
      )}

      {data?.dimensoes && (
        <div className="mt-4 space-y-2">
          {Object.entries(data.dimensoes as Record<string, number>).map(([key, val]) => (
            <div key={key} className="flex items-center gap-3">
              <span className="text-xs text-muted-foreground w-24 shrink-0">{DIMENSION_LABELS[key] ?? key}</span>
              <div className="flex-1 bg-muted rounded-full h-1.5">
                <div
                  className={`h-1.5 rounded-full transition-all duration-700 ${val >= 75 ? "bg-blue-500" : val >= 50 ? "bg-amber-500" : "bg-destructive"}`}
                  style={{ width: `${val}%` }}
                />
              </div>
              <span className="text-xs font-medium text-foreground w-7 text-right">{val}</span>
            </div>
          ))}
        </div>
      )}

      {data?.resumo && (
        <p className="text-xs text-muted-foreground mt-4 leading-relaxed border-t border-border pt-3">{data.resumo}</p>
      )}

      {data?.alertas && data.alertas.length > 0 && (
        <div className="mt-3 space-y-1.5">
          {data.alertas.map((alert: string, i: number) => (
            <div key={i} className="flex items-start gap-2">
              <span className="flex-shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-amber-500" />
              <p className="text-xs text-muted-foreground">{alert}</p>
            </div>
          ))}
        </div>
      )}

      {data?.acelerador && (
        <p className="text-xs text-primary mt-3 font-medium">→ {data.acelerador}</p>
      )}
    </div>
  );
}

// ─── ValidationTab ───────────────────────────────────────────────────────────

function ValidationTab({ projectId, phases }: { projectId: number; phases: any[] }) {
  const phasesWithArtifacts = phases.filter((p: any) => p.status !== "locked");
  const defaultPhase = phasesWithArtifacts.find((p: any) => p.status === "active") ?? phasesWithArtifacts[0];

  const [selectedPhaseNumber, setSelectedPhaseNumber] = useState<number>(defaultPhase?.phaseNumber ?? 1);
  const [validations, setValidations] = useState<any[]>([]);
  const [currentValidation, setCurrentValidation] = useState<any | null>(null);
  const [_loading, setLoading] = useState(false);

  const [scriptContent, setScriptContent] = useState("");
  const [scriptGenerating, setScriptGenerating] = useState(false);

  const [notesText, setNotesText] = useState("");
  const [notesSaving, setNotesSaving] = useState(false);
  const [notesSaved, setNotesSaved] = useState(false);

  const [analysisContent, setAnalysisContent] = useState("");
  const [analysisGenerating, setAnalysisGenerating] = useState(false);

  const [scriptError, setScriptError] = useState<string | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);

  useEffect(() => { loadValidations(); }, [projectId]);

  useEffect(() => {
    const v = validations.find((v: any) => v.phaseNumber === selectedPhaseNumber);
    if (v) {
      setCurrentValidation(v);
      setScriptContent(v.interviewScript ?? "");
      setNotesText(v.interviewNotes ?? "");
      setAnalysisContent(v.aiAnalysis ?? "");
    } else {
      setCurrentValidation(null);
      setScriptContent("");
      setNotesText("");
      setAnalysisContent("");
    }
  }, [selectedPhaseNumber, validations]);

  async function loadValidations() {
    setLoading(true);
    try {
      const res = await fetch(`${basePath}/api/projects/${projectId}/validations`);
      if (res.ok) setValidations(await res.json());
    } finally { setLoading(false); }
  }

  async function getOrCreateValidation(): Promise<any | null> {
    if (currentValidation) return currentValidation;
    const res = await fetch(`${basePath}/api/projects/${projectId}/validations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phaseNumber: selectedPhaseNumber }),
    });
    if (!res.ok) return null;
    const v = await res.json();
    setValidations(prev => [...prev.filter((x: any) => x.phaseNumber !== selectedPhaseNumber), v]);
    setCurrentValidation(v);
    return v;
  }

  async function generateScript() {
    const validation = await getOrCreateValidation();
    if (!validation) return;
    setScriptGenerating(true);
    setScriptContent("");
    setScriptError(null);
    const res = await fetch(`${basePath}/api/projects/${projectId}/validations/${validation.id}/generate-script`, { method: "POST" });
    if (!res.ok || !res.body) {
      const body = await res.json().catch(() => ({}));
      setScriptError(body.error || "Erro ao gerar roteiro. Tente novamente.");
      setScriptGenerating(false);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulated = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.type === "token") { accumulated += parsed.content; setScriptContent(accumulated); }
          else if (parsed.type === "done") { setScriptGenerating(false); await loadValidations(); }
          else if (parsed.type === "error") { setScriptError(parsed.message || "Erro na geração."); setScriptGenerating(false); }
        } catch { /* ignore */ }
      }
    }
    setScriptGenerating(false);
  }

  async function saveNotes() {
    const validation = await getOrCreateValidation();
    if (!validation) return;
    setNotesSaving(true);
    try {
      await fetch(`${basePath}/api/projects/${projectId}/validations/${validation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interviewNotes: notesText }),
      });
      setNotesSaved(true);
      setTimeout(() => setNotesSaved(false), 2500);
      await loadValidations();
    } finally { setNotesSaving(false); }
  }

  async function analyzeNotes() {
    const validation = currentValidation;
    if (!validation) return;
    setAnalysisGenerating(true);
    setAnalysisContent("");
    setAnalysisError(null);
    const res = await fetch(`${basePath}/api/projects/${projectId}/validations/${validation.id}/analyze`, { method: "POST" });
    if (!res.ok || !res.body) {
      const body = await res.json().catch(() => ({}));
      setAnalysisError(body.error || "Erro ao analisar notas. Tente novamente.");
      setAnalysisGenerating(false);
      return;
    }
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    let accumulated = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.type === "token") { accumulated += parsed.content; setAnalysisContent(accumulated); }
          else if (parsed.type === "done") { setAnalysisGenerating(false); await loadValidations(); }
          else if (parsed.type === "error") { setAnalysisError(parsed.message || "Erro na análise."); setAnalysisGenerating(false); }
        } catch { /* ignore */ }
      }
    }
    setAnalysisGenerating(false);
  }

  if (phasesWithArtifacts.length === 0) {
    return (
      <div className="bg-card border border-card-border rounded-xl p-10 text-center">
        <p className="text-3xl mb-3">🔍</p>
        <p className="font-medium text-foreground mb-1">Nenhuma fase acessível ainda</p>
        <p className="text-sm text-muted-foreground">Complete ao menos uma fase para gerar roteiros de validação com o mercado.</p>
      </div>
    );
  }

  const Spinner = () => (
    <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );

  return (
    <div className="space-y-5" role="tabpanel">
      {/* Phase selector */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h3 className="font-serif text-base font-medium">Fase para validar</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Gere um roteiro de entrevistas baseado nos artefatos da fase selecionada.</p>
          </div>
          <select
            value={selectedPhaseNumber}
            onChange={(e) => setSelectedPhaseNumber(Number(e.target.value))}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm"
          >
            {phasesWithArtifacts.map((p: any) => {
              const v = validations.find((vx: any) => vx.phaseNumber === p.phaseNumber);
              const hasScript = !!v?.interviewScript;
              const hasAnalysis = !!v?.aiAnalysis;
              const badge = hasAnalysis ? " ✓ análise" : hasScript ? " ✓ roteiro" : "";
              return (
                <option key={p.phaseNumber} value={p.phaseNumber}>
                  Fase {p.phaseNumber} — {PHASES[p.phaseNumber - 1]?.name ?? `Fase ${p.phaseNumber}`}{badge}
                </option>
              );
            })}
          </select>
        </div>
      </div>

      {/* Script generation */}
      <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-serif text-base font-medium">Roteiro de Entrevistas</h3>
            <p className="text-xs text-muted-foreground mt-0.5">A IA gera perguntas e critérios de validação baseados nos artefatos da fase.</p>
          </div>
          <div className="flex items-center gap-2">
            {scriptContent && !scriptGenerating && (
              <Button size="sm" variant="outline" onClick={() => navigator.clipboard.writeText(scriptContent)}>
                Copiar
              </Button>
            )}
            <Button size="sm" className="bg-primary hover:bg-primary/90 text-white" onClick={generateScript} disabled={scriptGenerating}>
              {scriptGenerating ? <span className="flex items-center gap-1.5"><Spinner />Gerando…</span> : scriptContent ? "Regenerar" : "Gerar roteiro"}
            </Button>
          </div>
        </div>
        {scriptError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-2.5 text-sm text-destructive flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5">⚠</span>
            <span>{scriptError}</span>
          </div>
        )}
        {scriptContent ? (
          <div className="bg-muted/40 rounded-lg p-4 max-h-[480px] overflow-y-auto">
            <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
              {scriptContent}
              {scriptGenerating && <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 rounded-sm align-middle" />}
            </pre>
          </div>
        ) : scriptGenerating ? (
          <div className="bg-muted/40 rounded-lg p-4 min-h-[80px] flex items-center gap-3">
            <svg className="animate-spin w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-muted-foreground">Gerando roteiro personalizado…</span>
          </div>
        ) : null}
      </div>

      {/* Notes */}
      <div className="bg-card border border-card-border rounded-xl p-5 space-y-3">
        <div>
          <h3 className="font-serif text-base font-medium">Notas das Entrevistas</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Cole aqui os resumos ou transcrições das entrevistas realizadas.</p>
        </div>
        <Textarea
          value={notesText}
          onChange={(e) => setNotesText(e.target.value)}
          placeholder="Ex: Entrevistei 5 founders de SaaS B2B. 4 de 5 confirmaram que o problema é prioritário. 3 usam planilhas hoje. 1 mencionou dor com integrações bancárias — não citada nos artefatos…"
          className="min-h-[180px] text-sm"
        />
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{notesText.length} caracteres</span>
          <div className="flex items-center gap-2">
            {notesSaved && <span className="text-xs text-emerald-600 dark:text-emerald-400">Salvo ✓</span>}
            <Button size="sm" variant="outline" onClick={saveNotes} disabled={notesSaving || !notesText.trim()}>
              {notesSaving ? <span className="flex items-center gap-1.5"><Spinner />Salvando…</span> : "Salvar notas"}
            </Button>
          </div>
        </div>
      </div>

      {/* Analysis */}
      <div className="bg-card border border-card-border rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="font-serif text-base font-medium">Análise com IA</h3>
            <p className="text-xs text-muted-foreground mt-0.5">A IA compara suas notas com as hipóteses dos artefatos e emite um veredicto.</p>
          </div>
          <Button
            size="sm"
            className="bg-primary hover:bg-primary/90 text-white"
            onClick={analyzeNotes}
            disabled={analysisGenerating || !notesText.trim()}
          >
            {analysisGenerating ? <span className="flex items-center gap-1.5"><Spinner />Analisando…</span> : analysisContent ? "Reanalisar" : "Analisar com IA"}
          </Button>
        </div>
        {analysisError && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/8 px-4 py-2.5 text-sm text-destructive flex items-start gap-2">
            <span className="flex-shrink-0 mt-0.5">⚠</span>
            <span>{analysisError}</span>
          </div>
        )}
        {analysisContent ? (
          <div className="bg-muted/40 rounded-lg p-4 max-h-[560px] overflow-y-auto">
            <pre className="text-sm text-foreground whitespace-pre-wrap font-sans leading-relaxed">
              {analysisContent}
              {analysisGenerating && <span className="inline-block w-1.5 h-4 bg-primary animate-pulse ml-0.5 rounded-sm align-middle" />}
            </pre>
          </div>
        ) : analysisGenerating ? (
          <div className="bg-muted/40 rounded-lg p-4 min-h-[80px] flex items-center gap-3">
            <svg className="animate-spin w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            <span className="text-sm text-muted-foreground">Analisando notas e comparando com hipóteses…</span>
          </div>
        ) : (
          <div className="bg-muted/20 rounded-lg p-6 text-center">
            <p className="text-sm text-muted-foreground">Adicione as notas das entrevistas e clique em "Analisar com IA" para obter um veredicto detalhado.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── ProjectPage ─────────────────────────────────────────────────────────────

export function ProjectPage() {
  const params = useParams<{ id: string }>();
  const projectId = parseInt(params.id ?? "0", 10);
  const queryClient = useQueryClient();
  const { permissions } = usePlan();
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const { data: project, isLoading } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) },
  });

  const updateProject = useUpdateProject();
  const [editingBriefing, setEditingBriefing] = useState(false);
  const [briefingDraft, setBriefingDraft] = useState("");
  const [briefingAutoSaved, setBriefingAutoSaved] = useState(false);
  const [collaboratorEmail, setCollaboratorEmail] = useState("");
  const [activeTab, setActiveTab] = useState<"briefing" | "artifacts" | "validacao" | "collaboration">("briefing");

  // Auto-save briefing after 2s of inactivity
  useEffect(() => {
    if (!editingBriefing || !briefingDraft || !project || briefingDraft === project.briefing) return;
    const timer = setTimeout(() => {
      updateProject.mutate(
        { id: projectId, data: { briefing: briefingDraft } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
            setBriefingAutoSaved(true);
            setTimeout(() => setBriefingAutoSaved(false), 2000);
          },
        },
      );
    }, 2000);
    return () => clearTimeout(timer);
  }, [briefingDraft, editingBriefing]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b bg-card/50 sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-6 py-4">
            <div className="h-4 bg-muted rounded w-48 animate-pulse" />
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-10 space-y-6">
          <div className="h-10 bg-muted rounded w-64 animate-pulse mb-2" />
          <div className="h-4 bg-muted rounded w-40 animate-pulse" />
          <div className="bg-card border border-card-border rounded-2xl p-6 animate-pulse h-40" />
        </main>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-foreground font-medium mb-1">Projeto nao encontrado</p>
          <p className="text-muted-foreground text-sm mb-4">O projeto pode ter sido excluido ou voce nao tem acesso.</p>
          <Link href="/dashboard">
            <Button variant="outline">Voltar ao painel</Button>
          </Link>
        </div>
      </div>
    );
  }

  const phases = (project as any).phases ?? [];
  const activePhase = phases.find((p: any) => p.status === "active");
  const completedPhases = phases.filter((p: any) => p.status === "completed").length;
  const progressPct = Math.round((completedPhases / 7) * 100);
  const encouragement = ENCOURAGEMENT[completedPhases] ?? "";
  const nextPhase = useMemo(() => phases.find((p: any) => p.status !== "completed"), [phases]);
  const recentArtifacts = useMemo(() => {
    return phases.flatMap((phase: any) => (phase.artifacts ?? []).map((artifact: any) => ({
      phaseNumber: phase.phaseNumber,
      key: artifact.artifactKey,
      hasContent: !!artifact.content?.trim(),
    }))).filter((artifact: any) => artifact.hasContent).slice(-6).reverse();
  }, [phases]);

  function saveBriefing() {
    updateProject.mutate(
      { id: projectId, data: { briefing: briefingDraft } },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
          setEditingBriefing(false);
          toast({ title: "Briefing atualizado com sucesso!" });
        },
        onError: () => {
          toast({ title: "Erro ao salvar briefing", variant: "destructive" });
        },
      }
    );
  }

  function shareProject() {
    const shareUrl = `${window.location.origin}${basePath}/projects/${projectId}`;
    navigator.clipboard.writeText(shareUrl).then(() => {
      toast({ title: "Link copiado", description: "Compartilhe esse projeto com sua equipe." });
    }).catch(() => {
      toast({ title: "Nao foi possivel copiar", variant: "destructive" });
    });
  }

  function addCollaborator() {
    if (!collaboratorEmail.trim()) return;
    toast({
      title: "Convite preparado",
      description: `${collaboratorEmail} sera adicionado assim que a camada de colaboracao estiver ativa.`,
    });
    setCollaboratorEmail("");
  }

  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  async function deleteProject() {
    setDeleting(true);
    try {
      const res = await fetch(`${basePath}/api/projects/${projectId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (res.ok || res.status === 204) {
        queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        navigate("/dashboard");
        toast({ title: "Projeto movido para a lixeira.", description: "Você tem 30 dias para restaurá-lo." });
      } else {
        toast({ title: "Erro ao mover para a lixeira.", variant: "destructive" });
      }
    } catch {
      toast({ title: "Erro de conexão.", variant: "destructive" });
    } finally {
      setDeleting(false);
      setConfirmDelete(false);
    }
  }

  return (
    <div className="app-shell">
      <AppSidebar
        projectId={projectId}
        projectName={project.name}
        phaseStatuses={(project as any).phases?.map((p: { status: string }) => ({ status: p.status })) ?? []}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="topbar">
          <div className="flex items-center gap-2 text-sm" style={{ color: "var(--text-tertiary)" }}>
            <Link href="/dashboard" className="hover:text-white transition-colors">Painel</Link>
            <span>/</span>
            <span className="truncate max-w-[200px]" style={{ color: "var(--text-primary)" }}>{project.name}</span>
          </div>
        </div>

        <main className="flex-1 overflow-y-auto px-8 py-8 max-w-5xl w-full mx-auto">
        {/* Project title + progress */}
        <div className="mb-8">
          <h1 className="text-3xl font-serif text-foreground mb-1">{project.name}</h1>
          <div className="flex items-center flex-wrap gap-3 mb-4">
            <p className="text-sm text-muted-foreground">
              Fase atual: {PHASES[project.currentPhase - 1]?.name ?? `Fase ${project.currentPhase}`}
            </p>
            {(project as any).coherenceScore != null && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                (project as any).coherenceScore >= 75 ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300" :
                (project as any).coherenceScore >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                "bg-destructive/10 text-destructive"
              }`}>
                Coerência {(project as any).coherenceScore}/100
              </span>
            )}
            {(project as any).marketPotentialScore != null && (
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                (project as any).marketPotentialScore >= 75 ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300" :
                (project as any).marketPotentialScore >= 50 ? "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300" :
                "bg-destructive/10 text-destructive"
              }`}>
                Potencial {(project as any).marketPotentialScore}/100
              </span>
            )}
          </div>
          {encouragement && (
            <div className="inline-flex items-center gap-2 bg-primary/5 border border-primary/15 rounded-full px-3 py-1.5 text-xs text-primary font-medium">
              ✨ {encouragement}
            </div>
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
            <span>{completedPhases} de 7 fases concluidas</span>
            <span className="font-semibold text-foreground">{progressPct}%</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2" role="progressbar" aria-valuenow={progressPct} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="bg-primary h-2 rounded-full transition-all duration-700"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </div>

        {/* Pipeline */}
        <div className="bg-card border border-card-border rounded-2xl p-6 mb-8">
          <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-5">Pipeline de construcao</h2>
          {phases.length > 0 && (
            <PhasePipeline phases={phases} currentPhase={project.currentPhase} projectId={projectId} />
          )}
          {activePhase && (
            <div className="mt-6 pt-5 border-t border-border flex items-center gap-3 flex-wrap">
              <Link href={`/projects/${projectId}/phases/${activePhase.phaseNumber}`}>
                <Button className="bg-primary hover:bg-primary/90 text-white" data-testid="button-go-active-phase">
                  Entrar na Fase {activePhase.phaseNumber} — {PHASES[activePhase.phaseNumber - 1]?.name}
                </Button>
              </Link>
              {permissions.hasAiAdvisor && (
                <Link href={`/projects/${projectId}/advisor`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <span>🤖</span> AI Advisor
                  </Button>
                </Link>
              )}
              {!permissions.hasAiAdvisor && permissions.plan !== "advanced" && (
                <Link href="/pricing">
                  <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    🤖 AI Advisor — disponivel no plano Avancado →
                  </span>
                </Link>
              )}
            </div>
          )}

          {completedPhases === 7 && (
            <div className="mt-6 pt-5 border-t border-border">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
                    <path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">Projeto concluido com sucesso!</p>
                  <p className="text-xs text-muted-foreground">Todas as 7 fases foram concluidas. Seu produto esta pronto para o mercado.</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Score cards — always visible above tabs */}
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 mb-0">
          <div>
            <CoherenceCard
              project={project}
              projectId={projectId}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) })}
            />
          </div>
          <div>
            <MarketPotentialCard
              project={project}
              projectId={projectId}
              onRefresh={() => queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) })}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-6 overflow-x-auto" role="tablist">
          {(["briefing", "artifacts", "validacao", "collaboration"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              role="tab"
              aria-selected={activeTab === tab}
              className={`px-4 py-2.5 text-sm font-medium transition-colors border-b-2 -mb-px whitespace-nowrap ${
                activeTab === tab
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
              data-testid={`tab-${tab}`}
            >
              {tab === "briefing" ? "Briefing" : tab === "artifacts" ? "Artefatos" : tab === "validacao" ? "Validação" : "Colaboração"}
            </button>
          ))}
        </div>

        {activeTab === "briefing" && (
          <div className="bg-card border border-card-border rounded-xl p-6" role="tabpanel">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-serif text-lg">Briefing do projeto</h3>
                <p className="text-xs text-muted-foreground mt-0.5">Este e o contexto base usado pela IA em todas as fases.</p>
              </div>
              {!editingBriefing && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setEditingBriefing(true); setBriefingDraft(project.briefing); }}
                  data-testid="button-edit-briefing"
                >
                  Editar
                </Button>
              )}
              {editingBriefing && briefingAutoSaved && (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6l2.5 2.5L10 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                  Salvo automaticamente
                </span>
              )}
            </div>
            {editingBriefing ? (
              <div className="space-y-3">
                <Textarea
                  value={briefingDraft}
                  onChange={(e) => setBriefingDraft(e.target.value)}
                  className="min-h-[200px] text-sm"
                  data-testid="textarea-briefing"
                  aria-label="Briefing do projeto"
                />
                <p className="text-xs text-muted-foreground">Dica: briefings mais detalhados produzem artefatos significativamente melhores.</p>
                <div className="flex gap-2 justify-end">
                  <Button variant="outline" size="sm" onClick={() => setEditingBriefing(false)}>Cancelar</Button>
                  <Button size="sm" onClick={saveBriefing} disabled={updateProject.isPending} className="bg-primary hover:bg-primary/90 text-white" data-testid="button-save-briefing">
                    {updateProject.isPending ? "Salvando..." : "Salvar"}
                  </Button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">{project.briefing || "Nenhum briefing adicionado ainda."}</p>
            )}
          </div>
        )}

        {activeTab === "artifacts" && (
          <div className="space-y-4" role="tabpanel">
            {phases.map((phase: any) => {
              const phaseDef = PHASES[phase.phaseNumber - 1];
              const isAccessible = phase.status !== "locked";
              const isPhaseComplete = phase.status === "completed";
              return (
                <div key={phase.phaseNumber} className={`bg-card border rounded-xl p-5 transition-all ${
                  isAccessible ? "border-card-border hover:border-primary/20" : "border-muted opacity-60"
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 ${
                        isPhaseComplete ? "bg-primary text-white" :
                        phase.status === "active" ? "bg-primary/10 text-primary border border-primary/30" :
                        "bg-muted text-muted-foreground"
                      }`} aria-hidden="true">
                        {isPhaseComplete ? (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l2.5 2.5L10 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : phase.phaseNumber}
                      </div>
                      <div>
                        <span className="text-sm font-medium">{phaseDef?.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {isPhaseComplete ? "• Concluida" : phase.status === "active" ? "• Em andamento" : "• Bloqueada"}
                        </span>
                        {phaseDef?.tagline && (
                          <span className="text-xs text-muted-foreground ml-2">· {phaseDef.tagline}</span>
                        )}
                      </div>
                    </div>
                    {isAccessible && (
                      <Link href={`/projects/${projectId}/phases/${phase.phaseNumber}`}>
                        <Button variant="outline" size="sm" className="text-xs" data-testid={`button-go-phase-${phase.phaseNumber}`}>
                          {phase.status === "active" ? "Continuar fase →" : "Ver artefatos"}
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {activeTab === "validacao" && (
          <ValidationTab projectId={projectId} phases={phases} />
        )}

        {activeTab === "collaboration" && (
          <div className="space-y-4" role="tabpanel">
            <div className="bg-card border border-card-border rounded-xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-serif text-lg">Compartilhar projeto</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">Copie um link para revisao e contexto compartilhado.</p>
                </div>
                <Button variant="outline" size="sm" onClick={shareProject}>Copiar link</Button>
              </div>
              <div className="flex gap-2">
                <input
                  value={collaboratorEmail}
                  onChange={(e) => setCollaboratorEmail(e.target.value)}
                  placeholder="email@empresa.com"
                  className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
                <Button onClick={addCollaborator} className="bg-primary hover:bg-primary/90 text-white">Convidar</Button>
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-xl p-6">
              <h3 className="font-serif text-lg mb-4">Ultimas entregas</h3>
              <div className="space-y-3">
                {recentArtifacts.length > 0 ? recentArtifacts.map((item: any, index: number) => (
                  <div key={`${item.phaseNumber}-${item.key}-${index}`} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                    <div>
                      <div className="text-sm font-medium text-foreground">{item.key}</div>
                      <div className="text-xs text-muted-foreground">Fase {item.phaseNumber}</div>
                    </div>
                    <span className="text-xs text-primary">pronto</span>
                  </div>
                )) : (
                  <p className="text-sm text-muted-foreground">Nenhum artefato gerado ainda.</p>
                )}
              </div>
            </div>

            <div className="bg-card border border-card-border rounded-xl p-6">
              <h3 className="font-serif text-lg mb-4">Próximos passos</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Fase atual</span>
                  <span className="font-medium text-foreground">{PHASES[project.currentPhase - 1]?.name ?? `Fase ${project.currentPhase}`}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Próxima fase</span>
                  <span className="font-medium text-foreground">{nextPhase ? PHASES[nextPhase.phaseNumber - 1]?.name : "Projeto concluído"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progresso</span>
                  <span className="font-medium text-foreground">{progressPct}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
          {/* Danger zone */}
          <div className="mt-10 border border-destructive/20 rounded-2xl p-6">
            <h3 className="text-sm font-semibold text-destructive mb-1">Zona de risco</h3>
            <p className="text-xs text-muted-foreground mb-4">O projeto será movido para a lixeira. Você tem 30 dias para restaurá-lo antes da exclusão permanente.</p>
            <Button
              variant="outline"
              className="border-destructive/40 text-destructive hover:bg-destructive/10 hover:border-destructive"
              onClick={() => setConfirmDelete(true)}
            >
              Mover para lixeira
            </Button>
          </div>
        </main>
      </div>

      {/* Confirm delete modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
          <div className="w-full max-w-sm rounded-2xl p-6" style={{ background: "var(--bg-surface)", border: "1px solid var(--border-default)" }}>
            <div className="w-10 h-10 rounded-full flex items-center justify-center mb-4" style={{ background: "var(--color-error-bg)" }}>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--color-error)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h14M8 6V4h4v2M19 6l-1 12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2L3 6" />
              </svg>
            </div>
            <h2 className="font-serif text-lg mb-1" style={{ color: "var(--text-primary)" }}>Mover para a lixeira?</h2>
            <p className="text-sm mb-2" style={{ color: "var(--text-secondary)" }}>
              O projeto <strong style={{ color: "var(--text-primary)" }}>{project.name}</strong> será movido para a lixeira.
            </p>
            <p className="text-xs mb-6 px-3 py-2 rounded-lg" style={{ background: "var(--color-error-bg)", color: "var(--color-error)" }}>
              Você tem <strong>30 dias</strong> para restaurá-lo. Após esse prazo, o projeto e todos os seus artefatos serão excluídos permanentemente.
            </p>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmDelete(false)} disabled={deleting}>
                Cancelar
              </Button>
              <Button
                className="flex-1 bg-destructive hover:bg-destructive/90 text-white"
                onClick={deleteProject}
                disabled={deleting}
              >
                {deleting ? "Movendo…" : "Mover para lixeira"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
