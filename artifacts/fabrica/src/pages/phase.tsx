import { useState, useRef, useCallback } from "react";
import { Link, useParams } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetPhase,
  useGetProject,
  useUpdatePhaseGates,
  useCompletePhase,
  useUpdateArtifact,
  getGetPhaseQueryKey,
  getGetProjectQueryKey,
  getGetDashboardQueryKey,
} from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { PHASES } from "@/lib/constants";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

// Lean Canvas grid layout: 9 blocks in a specific 3x3 arrangement
const LEAN_CANVAS_BLOCKS = [
  { key: "problema", label: "Problema", hint: "Top 3 problemas" },
  { key: "solucao", label: "Solução", hint: "Top 3 soluções" },
  { key: "proposta_valor_unica", label: "Proposta de Valor Única", hint: "Mensagem clara e convincente" },
  { key: "vantagem_injusta", label: "Vantagem Injusta", hint: "Difícil de copiar ou comprar" },
  { key: "segmentos_clientes", label: "Segmentos de Clientes", hint: "Clientes-alvo" },
  { key: "metricas_chave", label: "Métricas-Chave", hint: "Atividades-chave a medir" },
  { key: "canais", label: "Canais", hint: "Caminho para os clientes" },
  { key: "estrutura_custos", label: "Estrutura de Custos", hint: "Custos fixos e variáveis" },
  { key: "fluxo_receita", label: "Fluxo de Receita", hint: "Modelo de receita, LTV, receita bruta" },
];

function LeanCanvas({ content }: { content: string }) {
  // Try to parse JSON from content
  let data: Record<string, string> = {};
  try {
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) {
      data = JSON.parse(jsonMatch[1]);
    } else {
      // Try direct JSON parse
      const trimmed = content.trim();
      if (trimmed.startsWith("{")) {
        data = JSON.parse(trimmed);
      }
    }
  } catch {
    // fallback: show raw content
  }

  if (Object.keys(data).length === 0) {
    return <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{content}</div>;
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-2">
      {LEAN_CANVAS_BLOCKS.map((block) => (
        <div
          key={block.key}
          className={`bg-background border border-border rounded-lg p-4 ${
            block.key === "proposta_valor_unica" ? "sm:row-span-2 border-primary/30 bg-primary/5" : ""
          }`}
        >
          <div className="text-xs font-semibold text-primary uppercase tracking-wider mb-1">{block.label}</div>
          <div className="text-xs text-muted-foreground mb-2">{block.hint}</div>
          <div className="text-sm text-foreground leading-relaxed">
            {data[block.key] ?? <span className="text-muted-foreground italic">Não gerado</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

function ArtifactCard({
  artifact,
  phaseNumber,
  projectId,
  onUpdate,
}: {
  artifact: { id: number; artifactKey: string; content: string; contentJson: string | null };
  phaseNumber: number;
  projectId: number;
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(artifact.content);
  const updateArtifact = useUpdateArtifact();

  const isLeanCanvas = phaseNumber === 1 && artifact.artifactKey === "LEAN_CANVAS";

  const ARTIFACT_LABELS: Record<string, string> = {
    LEAN_CANVAS: "Lean Canvas",
    JTBD: "Jobs to Be Done",
    DIMENSIONAMENTO_MERCADO: "Dimensionamento de Mercado (TAM/SAM/SOM)",
    HIPOTESE_CENTRAL: "Hipótese Central",
    SCORE_POTENCIAL: "Score de Potencial",
    PRD: "Product Requirements Document",
    PERSONAS: "Personas",
    METRICAS_SUCESSO: "Métricas de Sucesso",
    HIPOTESE_PRICING: "Hipótese de Pricing",
    ARQUITETURA: "Arquitetura do Sistema",
    MODELO_DADOS: "Modelo de Dados",
    CONTRATOS_API: "Contratos de API",
    FLUXOS_UI: "Fluxos de UI",
    MILESTONES: "Plano de Milestones",
    ESTRUTURA_PASTAS: "Estrutura de Pastas",
    README: "README",
    PLANO_TESTES: "Plano de Testes",
    CHECKLIST_QA: "Checklist de QA",
    BUGS_PREVENCAO: "Prevenção de Bugs",
    RUNBOOK_DEPLOY: "Runbook de Deploy",
    GTM: "Go-to-Market",
    LAUNCH_CHECKLIST: "Launch Checklist",
  };

  function save() {
    updateArtifact.mutate(
      { projectId, phaseNumber, artifactKey: artifact.artifactKey, data: { content: draft, contentJson: null } },
      { onSuccess: () => { setEditing(false); onUpdate(); } }
    );
  }

  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden" data-testid={`artifact-card-${artifact.artifactKey}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/30 transition-colors text-left"
        data-testid={`artifact-toggle-${artifact.artifactKey}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground">{ARTIFACT_LABELS[artifact.artifactKey] ?? artifact.artifactKey}</span>
        </div>
        <svg
          className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-4">
          {editing ? (
            <div className="space-y-3">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-[200px] text-sm font-mono"
                data-testid={`textarea-artifact-${artifact.artifactKey}`}
              />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setEditing(false); setDraft(artifact.content); }}>Cancelar</Button>
                <Button size="sm" onClick={save} disabled={updateArtifact.isPending} className="bg-primary hover:bg-primary/90 text-white" data-testid={`button-save-artifact-${artifact.artifactKey}`}>
                  {updateArtifact.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {isLeanCanvas ? (
                <LeanCanvas content={artifact.content} />
              ) : (
                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto">
                  {artifact.content || <span className="text-muted-foreground italic">Sem conteúdo</span>}
                </div>
              )}
              <div className="mt-3 flex justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  className="text-xs"
                  onClick={() => { setEditing(true); setDraft(artifact.content); }}
                  data-testid={`button-edit-artifact-${artifact.artifactKey}`}
                >
                  Editar
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function PhasePage() {
  const params = useParams<{ projectId: string; phaseNumber: string }>();
  const projectId = parseInt(params.projectId ?? "0", 10);
  const phaseNumber = parseInt(params.phaseNumber ?? "1", 10);
  const queryClient = useQueryClient();

  const { data: project } = useGetProject(projectId, {
    query: { enabled: !!projectId, queryKey: getGetProjectQueryKey(projectId) },
  });

  const { data: phase, isLoading } = useGetPhase(projectId, phaseNumber, {
    query: { enabled: !!projectId && !!phaseNumber, queryKey: getGetPhaseQueryKey(projectId, phaseNumber) },
  });

  const updateGates = useUpdatePhaseGates();
  const completePhase = useCompletePhase();

  const [generating, setGenerating] = useState(false);
  const [generatingText, setGeneratingText] = useState("");
  const [generationError, setGenerationError] = useState("");

  const phaseDef = PHASES[phaseNumber - 1];
  const artifacts: any[] = (phase as any)?.artifacts ?? [];
  const allGatesChecked = phase?.gate1Checked && phase?.gate2Checked && phase?.gate3Checked;
  const isLocked = phase?.status === "locked";
  const isCompleted = phase?.status === "completed";

  function handleGateChange(gateNum: 1 | 2 | 3, checked: boolean) {
    if (!phase) return;
    const update = {
      gate1Checked: gateNum === 1 ? checked : phase.gate1Checked,
      gate2Checked: gateNum === 2 ? checked : phase.gate2Checked,
      gate3Checked: gateNum === 3 ? checked : phase.gate3Checked,
    };
    updateGates.mutate(
      { projectId, phaseNumber, data: update },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPhaseQueryKey(projectId, phaseNumber) });
        },
      }
    );
  }

  function handleComplete() {
    completePhase.mutate(
      { projectId, phaseNumber },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPhaseQueryKey(projectId, phaseNumber) });
          queryClient.invalidateQueries({ queryKey: getGetProjectQueryKey(projectId) });
          queryClient.invalidateQueries({ queryKey: getGetDashboardQueryKey() });
        },
      }
    );
  }

  function handleExecuteAI() {
    setGenerating(true);
    setGeneratingText("");
    setGenerationError("");

    fetch(`${basePath}/api/projects/${projectId}/phases/${phaseNumber}/execute`, {
      method: "POST",
      credentials: "include",
    }).then(async (response) => {
      if (!response.ok) {
        const err = await response.json().catch(() => ({ error: "Erro desconhecido" }));
        setGenerationError(err.error ?? "Erro ao gerar artefatos");
        setGenerating(false);
        return;
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        setGenerationError("Streaming não suportado");
        setGenerating(false);
        return;
      }

      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (line.startsWith("data: ")) {
            try {
              const event = JSON.parse(line.slice(6));
              if (event.type === "progress") {
                setGeneratingText((prev) => prev + event.content);
              } else if (event.type === "done") {
                queryClient.invalidateQueries({ queryKey: getGetPhaseQueryKey(projectId, phaseNumber) });
                setGenerating(false);
              } else if (event.type === "error") {
                setGenerationError(event.message);
                setGenerating(false);
              }
            } catch {
              // ignore parse errors
            }
          }
        }
      }
      setGenerating(false);
    }).catch(() => {
      setGenerationError("Erro de conexão ao gerar artefatos");
      setGenerating(false);
    });
  }

  function invalidatePhase() {
    queryClient.invalidateQueries({ queryKey: getGetPhaseQueryKey(projectId, phaseNumber) });
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Carregando fase...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card/50 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Painel</Link>
          <span className="text-muted-foreground">/</span>
          <Link href={`/projects/${projectId}`} className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[120px]">
            {project?.name ?? "Projeto"}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-medium">Fase {phaseNumber} — {phaseDef?.name}</span>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-8">

        {/* Phase header */}
        <div className="bg-card border border-card-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-3">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
              isCompleted ? "bg-primary text-white" :
              isLocked ? "bg-muted text-muted-foreground" :
              "bg-primary/10 text-primary border border-primary/30"
            }`}>
              {phaseNumber}
            </div>
            <div>
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">Fase {phaseNumber}</span>
              <h1 className="text-xl font-serif text-foreground">{phaseDef?.name}</h1>
            </div>
            {isCompleted && (
              <span className="ml-auto text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">
                Concluída
              </span>
            )}
            {isLocked && (
              <span className="ml-auto text-xs font-medium px-2.5 py-1 bg-muted text-muted-foreground rounded-full">
                Bloqueada
              </span>
            )}
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed italic">
            "{phaseDef?.motivation}"
          </p>
        </div>

        {/* AI Execution */}
        <div className="bg-card border border-card-border rounded-2xl p-6">
          <h2 className="font-serif text-lg mb-4">Gerar artefatos com IA</h2>

          {isLocked ? (
            <p className="text-sm text-muted-foreground">Esta fase está bloqueada. Conclua a fase anterior para desbloqueá-la.</p>
          ) : generating ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-primary font-medium">Gerando artefatos...</span>
              </div>
              {generatingText && (
                <div className="bg-muted/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono">{generatingText}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Button
                onClick={handleExecuteAI}
                className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
                data-testid="button-execute-ai"
              >
                Gerar artefatos da fase {phaseDef?.name} com IA
              </Button>
              {generationError && (
                <p className="text-sm text-destructive" data-testid="text-generation-error">{generationError}</p>
              )}
              {artifacts.length > 0 && !generationError && (
                <p className="text-xs text-muted-foreground">Executar novamente substituirá os artefatos atuais.</p>
              )}
            </div>
          )}
        </div>

        {/* Artifacts */}
        {artifacts.length > 0 && (
          <div className="space-y-3">
            <h2 className="font-serif text-lg">Artefatos gerados</h2>
            {artifacts.map((artifact) => (
              <ArtifactCard
                key={artifact.id}
                artifact={artifact}
                phaseNumber={phaseNumber}
                projectId={projectId}
                onUpdate={invalidatePhase}
              />
            ))}
          </div>
        )}

        {/* Gate of exit */}
        {!isLocked && (
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <h2 className="font-serif text-lg mb-1">Portão de saída</h2>
            <p className="text-xs text-muted-foreground mb-5">Marque todos os critérios para avançar para a próxima fase.</p>
            <div className="space-y-3">
              {phaseDef?.gates.map((gate, i) => {
                const gateNum = (i + 1) as 1 | 2 | 3;
                const checked = gateNum === 1 ? phase?.gate1Checked : gateNum === 2 ? phase?.gate2Checked : phase?.gate3Checked;
                return (
                  <label
                    key={i}
                    className="flex items-start gap-3 cursor-pointer group"
                    data-testid={`gate-${gateNum}`}
                  >
                    <input
                      type="checkbox"
                      checked={!!checked}
                      onChange={(e) => handleGateChange(gateNum, e.target.checked)}
                      disabled={isCompleted}
                      className="mt-0.5 w-4 h-4 accent-[#b8461e] rounded"
                    />
                    <span className={`text-sm leading-snug ${checked ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {gate}
                    </span>
                  </label>
                );
              })}
            </div>

            {allGatesChecked && !isCompleted && (
              <div className="mt-6 pt-5 border-t border-border">
                <Button
                  onClick={handleComplete}
                  disabled={completePhase.isPending}
                  className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
                  data-testid="button-complete-phase"
                >
                  {completePhase.isPending ? "Avançando..." : `Concluir fase e avançar para ${phaseNumber < 6 ? `Fase ${phaseNumber + 1}` : "o Deploy"}`}
                </Button>
              </div>
            )}

            {isCompleted && (
              <div className="mt-5 pt-4 border-t border-border">
                <p className="text-sm text-primary font-medium">Esta fase foi concluída.</p>
                {phaseNumber < 6 && (
                  <Link href={`/projects/${projectId}/phases/${phaseNumber + 1}`}>
                    <Button variant="outline" size="sm" className="mt-2" data-testid="link-next-phase">
                      Ir para Fase {phaseNumber + 1} — {PHASES[phaseNumber]?.name}
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        )}

        {/* Back to previous phase */}
        {phaseNumber > 1 && (
          <div className="text-center pt-4">
            <Link href={`/projects/${projectId}/phases/${phaseNumber - 1}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Voltar para a fase anterior
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
