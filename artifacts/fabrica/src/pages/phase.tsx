import { useState } from "react";
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
import { usePlan } from "@/hooks/usePlan";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const LEAN_CANVAS_BLOCKS = [
  { key: "problema", label: "Problema", hint: "Top 3 problemas" },
  { key: "segmentos_clientes", label: "Segmentos de Clientes", hint: "Clientes-alvo" },
  { key: "proposta_valor_unica", label: "Proposta de Valor Única", hint: "Mensagem clara e convincente" },
  { key: "solucao", label: "Solução", hint: "Top 3 soluções" },
  { key: "canais", label: "Canais", hint: "Caminho para os clientes" },
  { key: "fluxo_receita", label: "Fluxo de Receita", hint: "Modelo de receita, LTV, receita bruta" },
  { key: "estrutura_custos", label: "Estrutura de Custos", hint: "Custos fixos e variáveis" },
  { key: "metricas_chave", label: "Métricas-Chave", hint: "Atividades-chave a medir" },
  { key: "vantagem_injusta", label: "Vantagem Injusta", hint: "Difícil de copiar ou comprar" },
];

function LeanCanvas({ content }: { content: string }) {
  let data: Record<string, string> = {};
  try {
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) data = JSON.parse(jsonMatch[1]);
    else { const t = content.trim(); if (t.startsWith("{")) data = JSON.parse(t); }
  } catch { /* fallback */ }

  if (Object.keys(data).length === 0) {
    return <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{content}</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-2 mt-2">
      {LEAN_CANVAS_BLOCKS.map((block) => (
        <div key={block.key} className={`border rounded-lg p-3 ${block.key === "proposta_valor_unica" ? "border-primary/40 bg-primary/5 row-span-2" : "border-border bg-background"}`}>
          <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-0.5">{block.label}</div>
          <div className="text-[10px] text-muted-foreground mb-1.5">{block.hint}</div>
          <div className="text-xs text-foreground leading-snug">{data[block.key] ?? <span className="text-muted-foreground italic">—</span>}</div>
        </div>
      ))}
    </div>
  );
}

function ScorePotencial({ content }: { content: string }) {
  let data: Record<string, any> = {};
  try {
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) data = JSON.parse(jsonMatch[1]);
  } catch { /* fallback */ }

  if (!data.desejabilidade) return <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{content}</div>;

  const dims = ["desejabilidade", "viabilidade", "factibilidade", "escalabilidade", "timing"];
  const rec = data.recomendacao as string;
  const recColors: Record<string, string> = {
    "AVANÇAR": "bg-primary/10 text-primary border-primary/30",
    "PIVOTAR": "bg-yellow-50 text-yellow-700 border-yellow-200",
    "ABANDONAR": "bg-red-50 text-red-600 border-red-200",
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        {dims.map((dim) => (
          <div key={dim} className="text-center">
            <div className="text-2xl font-bold text-primary">{data[dim] ?? "—"}</div>
            <div className="text-[10px] text-muted-foreground capitalize mt-0.5">{dim}</div>
            {data.justificativas?.[dim] && <div className="text-[10px] text-foreground mt-1 leading-snug">{data.justificativas[dim]}</div>}
          </div>
        ))}
      </div>
      {rec && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${recColors[rec] ?? "bg-muted text-muted-foreground"}`}>
          Recomendação: {rec}
        </div>
      )}
      {data.proximos_passos?.length > 0 && (
        <div>
          <div className="text-xs font-medium mb-1">Próximos passos</div>
          <ul className="space-y-0.5">
            {data.proximos_passos.map((step: string, i: number) => (
              <li key={i} className="text-xs text-foreground flex gap-2">
                <span className="text-primary flex-shrink-0">{i + 1}.</span><span>{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

const ARTIFACT_LABELS: Record<string, { label: string; description: string }> = {
  LEAN_CANVAS: { label: "Lean Canvas", description: "9 blocos do modelo de negócio" },
  JTBD: { label: "Jobs to Be Done", description: "O que o cliente realmente quer realizar" },
  ANALISE_COMPETITIVA: { label: "Análise Competitiva", description: "5 concorrentes com tabela comparativa" },
  SWOT: { label: "Análise SWOT", description: "Forças, fraquezas, oportunidades e ameaças" },
  DIMENSIONAMENTO_MERCADO: { label: "TAM / SAM / SOM", description: "Tamanho real do mercado com metodologia" },
  VALIDACAO_RAPIDA: { label: "Script de Validação", description: "10 perguntas de entrevista para validar a hipótese" },
  HIPOTESE_CENTRAL: { label: "Hipótese Central", description: "Aposta principal em 1 frase testável" },
  SCORE_POTENCIAL: { label: "Score de Potencial", description: "Avaliação 1-5 em 5 dimensões com recomendação" },
  PRD: { label: "Product Requirements Document", description: "Escopo, funcionalidades e critérios de sucesso" },
  PERSONAS: { label: "Personas", description: "3 personas detalhadas incluindo persona negativa" },
  USER_STORIES: { label: "User Stories", description: "15 user stories com critérios de aceitação" },
  METRICAS_SUCESSO: { label: "Framework de Métricas", description: "North Star, inputs, guardrails e AARRR" },
  HIPOTESE_PRICING: { label: "Estratégia de Pricing", description: "3 tiers com unit economics e willingness to pay" },
  BENCHMARKING: { label: "Benchmarking", description: "3 referências globais com o que copiar e evitar" },
  ROADMAP_3_MESES: { label: "Roadmap 3 Meses", description: "Plano trimestral com objetivos e entregas-chave" },
  ARQUITETURA: { label: "Arquitetura do Sistema", description: "Stack, componentes, diagramas e trade-offs" },
  MODELO_DADOS: { label: "Modelo de Dados", description: "Entidades, campos, índices e relacionamentos" },
  CONTRATOS_API: { label: "Contratos de API", description: "8+ endpoints críticos documentados" },
  SEGURANCA: { label: "Plano de Segurança", description: "OWASP Top 10, LGPD, autenticação e auditoria" },
  FLUXOS_UI: { label: "Fluxos de UX", description: "5 fluxos críticos tela por tela com edge cases" },
  ESCALABILIDADE: { label: "Plano de Escalabilidade", description: "Estratégia para 1K, 10K e 100K usuários" },
  ADR: { label: "Architecture Decision Records", description: "5 ADRs com contexto, decisão e consequências" },
  SETUP_DEVOPS: { label: "DevOps & Infraestrutura", description: "CI/CD, ambientes, observabilidade e custo estimado" },
  MILESTONES: { label: "Plano de Milestones", description: "5+ milestones com features, critérios e demos" },
  SPRINT_1: { label: "Sprint 1 Detalhado", description: "Primeira semana hora a hora com bloqueadores" },
  ESTRUTURA_PASTAS: { label: "Estrutura do Projeto", description: "Árvore de arquivos comentada" },
  README: { label: "README Completo", description: "Setup em 5 comandos, .env.example e contribuição" },
  GUIA_CONTRIBUICAO: { label: "CONTRIBUTING.md", description: "Padrões, PR checklist e convenção de commits" },
  TECH_DEBT_LOG: { label: "Log de Débito Técnico", description: "8+ atalhos documentados com plano de resolução" },
  DEFINITION_OF_DONE: { label: "Definition of Done", description: "Critérios para código, testes e deploy" },
  PLANO_TESTES: { label: "Plano de Testes", description: "Estratégia, pirâmide, ferramentas e cobertura mínima" },
  CASOS_TESTE_CRITICOS: { label: "20 Casos de Teste Críticos", description: "P0/P1/P2 com steps e resultados esperados" },
  CHECKLIST_QA: { label: "Checklist de QA", description: "Funcionalidade, performance, segurança, acessibilidade" },
  SCRIPT_USER_TEST: { label: "Script de Teste com Usuários", description: "Roteiro para 5 testes reais com métricas" },
  RELATORIO_PERFORMANCE: { label: "Benchmarks de Performance", description: "Core Web Vitals, latência e carga suportada" },
  BUGS_PREVENCAO: { label: "Top 10 Bugs a Prevenir", description: "Causa raiz, impacto, prevenção e detecção" },
  OBSERVABILIDADE: { label: "Plano de Observabilidade", description: "Logs, métricas, alertas e dashboards" },
  RUNBOOK_DEPLOY: { label: "Runbook de Deploy", description: "Pré-deploy, deploy, smoke tests, rollback" },
  GTM: { label: "Plano Go-to-Market", description: "Canais, mensagem, 10 primeiros clientes e métricas" },
  LAUNCH_CHECKLIST: { label: "Launch Checklist", description: "Técnico, produto, marketing, legal e operacional" },
  METRICAS_POS_LAUNCH: { label: "Dashboard Pós-Lançamento", description: "Métricas semana a semana nas primeiras 4 semanas" },
  PLANO_CRESCIMENTO_90_DIAS: { label: "Plano de Crescimento 90 Dias", description: "Metas, canais, experimentos e triggers de pivô" },
  PITCH_INVESTIDORES: { label: "Narrativa para Investidores", description: "8 slides — problema, solução, mercado e pedido" },
  SLA_SUPORTE: { label: "SLA & Plano de Suporte", description: "Canais, SLA, playbooks e FAQ inicial" },
};

function downloadMarkdown(artifactKey: string, content: string) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${artifactKey.toLowerCase()}.md`;
  a.click();
  URL.revokeObjectURL(url);
}

function ArtifactCard({
  artifact,
  phaseNumber,
  projectId,
  canCopy,
  canDownload,
  onUpdate,
}: {
  artifact: { id: number; artifactKey: string; content: string; contentJson: string | null };
  phaseNumber: number;
  projectId: number;
  canCopy: boolean;
  canDownload: boolean;
  onUpdate: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(artifact.content);
  const updateArtifact = useUpdateArtifact();

  const isLeanCanvas = phaseNumber === 1 && artifact.artifactKey === "LEAN_CANVAS";
  const isScorePotencial = phaseNumber === 1 && artifact.artifactKey === "SCORE_POTENCIAL";
  const meta = ARTIFACT_LABELS[artifact.artifactKey];
  const isEmpty = !artifact.content?.trim();

  function save() {
    updateArtifact.mutate(
      { projectId, phaseNumber, artifactKey: artifact.artifactKey, data: { content: draft, contentJson: null } },
      { onSuccess: () => { setEditing(false); onUpdate(); } }
    );
  }

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all ${expanded ? "border-primary/30 shadow-sm" : "border-card-border"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors text-left"
      >
        <div className="flex items-start gap-3">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isEmpty ? "bg-muted-foreground/30" : "bg-primary"}`} />
          <div>
            <div className="text-sm font-medium text-foreground leading-snug">{meta?.label ?? artifact.artifactKey}</div>
            {meta?.description && <div className="text-xs text-muted-foreground mt-0.5">{meta.description}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {isEmpty && <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Não gerado</span>}
          <svg className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 border-t border-border/50 pt-4">
          {editing && canCopy ? (
            <div className="space-y-3">
              <Textarea value={draft} onChange={(e) => setDraft(e.target.value)} className="min-h-[240px] text-sm font-mono" />
              <div className="flex gap-2 justify-end">
                <Button variant="outline" size="sm" onClick={() => { setEditing(false); setDraft(artifact.content); }}>Cancelar</Button>
                <Button size="sm" onClick={save} disabled={updateArtifact.isPending} className="bg-primary hover:bg-primary/90 text-white">
                  {updateArtifact.isPending ? "Salvando..." : "Salvar"}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              {isEmpty ? (
                <p className="text-sm text-muted-foreground italic">Este artefato não foi gerado ainda.</p>
              ) : isLeanCanvas ? (
                <LeanCanvas content={artifact.content} />
              ) : isScorePotencial ? (
                <ScorePotencial content={artifact.content} />
              ) : (
                /* Plan gate: no copy/paste for basic */
                <div
                  className="text-sm text-foreground whitespace-pre-wrap leading-relaxed max-h-[500px] overflow-y-auto"
                  style={!canCopy ? {
                    userSelect: "none",
                    WebkitUserSelect: "none",
                    pointerEvents: "none",
                  } : {}}
                  onCopy={!canCopy ? (e) => e.preventDefault() : undefined}
                  onCut={!canCopy ? (e) => e.preventDefault() : undefined}
                  onContextMenu={!canCopy ? (e) => e.preventDefault() : undefined}
                >
                  {artifact.content}
                </div>
              )}

              {!isEmpty && (
                <div className="mt-3 flex items-center justify-between gap-2">
                  {!canCopy ? (
                    <Link href="/pricing">
                      <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                        🔒 Copiar e editar — plano Pro
                      </span>
                    </Link>
                  ) : (
                    <Button variant="outline" size="sm" className="text-xs" onClick={() => { setEditing(true); setDraft(artifact.content); }}>
                      Editar
                    </Button>
                  )}
                  {canDownload && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => downloadMarkdown(artifact.artifactKey, artifact.content)}
                    >
                      ↓ .md
                    </Button>
                  )}
                  {!canDownload && !isEmpty && (
                    <Link href="/pricing">
                      <span className="text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                        ↓ Download — plano Pro
                      </span>
                    </Link>
                  )}
                </div>
              )}
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
  const { permissions } = usePlan();

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
  const hasArtifacts = artifacts.some(a => a.content?.trim());

  // Print protection for basic plan
  const noPrint = !permissions.canPrint && permissions.plan !== "free";

  function handleGateChange(gateNum: 1 | 2 | 3, checked: boolean) {
    if (!phase) return;
    const update = {
      gate1Checked: gateNum === 1 ? checked : phase.gate1Checked,
      gate2Checked: gateNum === 2 ? checked : phase.gate2Checked,
      gate3Checked: gateNum === 3 ? checked : phase.gate3Checked,
    };
    updateGates.mutate(
      { projectId, phaseNumber, data: update },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPhaseQueryKey(projectId, phaseNumber) }) }
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
        const err = await response.json().catch(() => ({ error: "Erro desconhecido" })) as { error?: string };
        setGenerationError(err.error ?? "Erro ao gerar artefatos");
        setGenerating(false);
        return;
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) { setGenerationError("Streaming não suportado"); setGenerating(false); return; }
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
              const event = JSON.parse(line.slice(6)) as { type: string; content?: string };
              if (event.type === "progress") setGeneratingText((prev) => prev + (event.content ?? ""));
              else if (event.type === "done") {
                queryClient.invalidateQueries({ queryKey: getGetPhaseQueryKey(projectId, phaseNumber) });
                setGenerating(false);
              } else if (event.type === "error") {
                setGenerationError((event as any).message ?? "Erro");
                setGenerating(false);
              }
            } catch { /* ignore */ }
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
    <div className={`min-h-screen bg-background ${noPrint ? "no-print-content" : ""}`}>
      {/* CSS injection for print protection */}
      {noPrint && (
        <style>{`@media print { .no-print-content { display: none !important; } body::after { content: "Impressão disponível apenas no plano Avançado."; display: block; padding: 2rem; } }`}</style>
      )}

      <header className="border-b bg-card/50 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center gap-3 text-sm">
          <Link href="/dashboard" className="text-muted-foreground hover:text-foreground transition-colors">Painel</Link>
          <span className="text-muted-foreground">/</span>
          <Link href={`/projects/${projectId}`} className="text-muted-foreground hover:text-foreground transition-colors truncate max-w-[120px]">
            {project?.name ?? "Projeto"}
          </Link>
          <span className="text-muted-foreground">/</span>
          <span className="text-foreground font-medium">Fase {phaseNumber} — {phaseDef?.name}</span>
          {permissions.hasAiAdvisor && (
            <Link href={`/projects/${projectId}/advisor`} className="ml-auto text-xs text-primary hover:underline flex items-center gap-1">
              <span>🤖</span> AI Advisor
            </Link>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 space-y-6">
        {/* Phase header */}
        <div className="bg-card border border-card-border rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
              isCompleted ? "bg-primary text-white" : isLocked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary border border-primary/30"
            }`}>
              {phaseNumber}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Fase {phaseNumber}</span>
                {phaseDef?.tagline && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{phaseDef.tagline}</span>}
                {isCompleted && <span className="ml-auto text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">Concluída</span>}
                {isLocked && <span className="ml-auto text-xs font-medium px-2.5 py-1 bg-muted text-muted-foreground rounded-full">Bloqueada</span>}
              </div>
              <h1 className="text-xl font-serif text-foreground">{phaseDef?.name}</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed italic pl-14">"{phaseDef?.motivation}"</p>

          {phaseDef?.artifacts && (
            <div className="mt-5 pl-14">
              <div className="text-xs font-medium text-muted-foreground mb-2">O que você vai receber:</div>
              <div className="flex flex-wrap gap-1.5">
                {phaseDef.artifacts.map((art) => {
                  const generated = artifacts.find(a => a.artifactKey === art.key && a.content?.trim());
                  return (
                    <span key={art.key} className={`text-[11px] px-2 py-0.5 rounded-full border ${generated ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-muted"}`}>
                      {art.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Plan badge */}
          {permissions.plan !== "free" && (
            <div className="mt-4 pl-14 flex items-center gap-2">
              <span className="text-[10px] text-muted-foreground">Plano:</span>
              <span className="text-[10px] font-medium text-primary">{permissions.planName}</span>
              {!permissions.canCopy && (
                <Link href="/pricing">
                  <span className="text-[10px] text-muted-foreground hover:text-primary transition-colors ml-1">· Upgrade para copiar e baixar →</span>
                </Link>
              )}
            </div>
          )}
        </div>

        {/* AI Execution */}
        <div className="bg-card border border-card-border rounded-2xl p-6">
          <h2 className="font-serif text-lg mb-1">Gerar com IA</h2>
          <p className="text-xs text-muted-foreground mb-4">
            A IA vai analisar seu briefing e os artefatos das fases anteriores para gerar {phaseDef?.artifacts?.length ?? 0} entregáveis específicos para o seu produto.
          </p>

          {isLocked ? (
            <p className="text-sm text-muted-foreground">Esta fase está bloqueada. Conclua a fase anterior para desbloqueá-la.</p>
          ) : generating ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-primary font-medium">Gerando {phaseDef?.artifacts?.length} artefatos...</span>
              </div>
              {generatingText && (
                <div className="bg-muted/50 rounded-lg p-4 max-h-48 overflow-y-auto">
                  <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">{generatingText}</pre>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <Button onClick={handleExecuteAI} className="bg-primary hover:bg-primary/90 text-white" data-testid="button-execute-ai">
                Gerar artefatos da fase {phaseDef?.name} com IA
              </Button>
              {generationError && <p className="text-sm text-destructive">{generationError}</p>}
              {hasArtifacts && !generationError && (
                <p className="text-xs text-muted-foreground">Executar novamente substituirá todos os artefatos atuais.</p>
              )}
            </div>
          )}
        </div>

        {/* Artifacts */}
        {artifacts.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-serif text-lg">Artefatos gerados</h2>
              <span className="text-xs text-muted-foreground">
                {artifacts.filter(a => a.content?.trim()).length}/{artifacts.length} gerados
              </span>
            </div>
            {artifacts.map((artifact) => (
              <ArtifactCard
                key={artifact.id}
                artifact={artifact}
                phaseNumber={phaseNumber}
                projectId={projectId}
                canCopy={permissions.canCopy}
                canDownload={permissions.canDownload}
                onUpdate={invalidatePhase}
              />
            ))}
          </div>
        )}

        {/* Gate */}
        {!isLocked && (
          <div className="bg-card border border-card-border rounded-2xl p-6">
            <h2 className="font-serif text-lg mb-1">Portão de saída</h2>
            <p className="text-xs text-muted-foreground mb-5">Marque os 3 critérios para avançar. Não avance até estar genuinamente satisfeito.</p>
            <div className="space-y-4">
              {phaseDef?.gates.map((gate, i) => {
                const gateNum = (i + 1) as 1 | 2 | 3;
                const checked = gateNum === 1 ? phase?.gate1Checked : gateNum === 2 ? phase?.gate2Checked : phase?.gate3Checked;
                return (
                  <label key={i} className="flex items-start gap-3 cursor-pointer group" data-testid={`gate-${gateNum}`}>
                    <input
                      type="checkbox"
                      checked={!!checked}
                      onChange={(e) => handleGateChange(gateNum, e.target.checked)}
                      disabled={isCompleted}
                      className="mt-0.5 w-4 h-4 accent-[#b8461e] rounded flex-shrink-0"
                    />
                    <span className={`text-sm leading-snug ${checked ? "line-through text-muted-foreground" : "text-foreground"}`}>{gate}</span>
                  </label>
                );
              })}
            </div>

            {allGatesChecked && !isCompleted && (
              <div className="mt-6 pt-5 border-t border-border">
                <Button onClick={handleComplete} disabled={completePhase.isPending} className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto" data-testid="button-complete-phase">
                  {completePhase.isPending ? "Avançando..." : `Concluir fase e avançar para ${phaseNumber < 6 ? `Fase ${phaseNumber + 1} — ${PHASES[phaseNumber]?.name}` : "o lançamento"}`}
                </Button>
              </div>
            )}

            {isCompleted && (
              <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l2.5 2.5L10 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Fase concluída</p>
                  {phaseNumber < 6 && (
                    <Link href={`/projects/${projectId}/phases/${phaseNumber + 1}`} className="text-xs text-primary hover:underline">
                      Ir para Fase {phaseNumber + 1} — {PHASES[phaseNumber]?.name}
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {phaseNumber > 1 && (
          <div className="text-center pb-6">
            <Link href={`/projects/${projectId}/phases/${phaseNumber - 1}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              Voltar para a fase anterior
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}
