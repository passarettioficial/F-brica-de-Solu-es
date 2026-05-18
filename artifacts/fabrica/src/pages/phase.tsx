import { useState, memo } from "react";
import { Link, useParams, useLocation } from "wouter";
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
import { useToast } from "@/hooks/use-toast";
import { PHASES } from "@/lib/constants";
import { usePlan } from "@/hooks/usePlan";
import { AppSidebar } from "@/components/app-sidebar";

const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

const LEAN_CANVAS_BLOCKS = [
  { key: "problema", label: "Problema", hint: "Top 3 problemas" },
  { key: "segmentos_clientes", label: "Segmentos de Clientes", hint: "Clientes-alvo" },
  { key: "proposta_valor_unica", label: "Proposta de Valor Unica", hint: "Mensagem clara e convincente" },
  { key: "solucao", label: "Solucao", hint: "Top 3 solucoes" },
  { key: "canais", label: "Canais", hint: "Caminho para os clientes" },
  { key: "fluxo_receita", label: "Fluxo de Receita", hint: "Modelo de receita, LTV, receita bruta" },
  { key: "estrutura_custos", label: "Estrutura de Custos", hint: "Custos fixos e variaveis" },
  { key: "metricas_chave", label: "Metricas-Chave", hint: "Atividades-chave a medir" },
  { key: "vantagem_injusta", label: "Vantagem Injusta", hint: "Dificil de copiar ou comprar" },
];

function parseJsonBlock<T = Record<string, unknown>>(content: string): T | null {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]) as T;
    const t = content.trim();
    if (t.startsWith("{")) return JSON.parse(t) as T;
  } catch { /* fallback to raw */ }
  return null;
}

function LeanCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<Record<string, string>>(content) ?? {};

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
  const data = parseJsonBlock<Record<string, any>>(content) ?? {};

  if (!data.desejabilidade) return <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{content}</div>;

  const dims = ["desejabilidade", "viabilidade", "factibilidade", "escalabilidade", "timing"];
  const rec = data.recomendacao as string;
  const recColors: Record<string, string> = {
    "AVANCAR": "bg-primary/10 text-primary border-primary/30",
    "PIVOTAR": "bg-accent/10 text-accent-foreground border-accent/30",
    "ABANDONAR": "bg-red-950/20 text-red-400 border-red-800/50",
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
          Recomendacao: {rec}
        </div>
      )}
      {data.proximos_passos?.length > 0 && (
        <div>
          <div className="text-xs font-medium mb-1">Proximos passos</div>
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
  LEAN_CANVAS: { label: "Lean Canvas", description: "9 blocos do modelo de negocio" },
  JTBD: { label: "Jobs to Be Done", description: "O que o cliente realmente quer realizar" },
  ANALISE_COMPETITIVA: { label: "Analise Competitiva", description: "5 concorrentes com tabela comparativa" },
  PADROES_MORTALIDADE: { label: "Padroes de Mortalidade", description: "Casos comparáveis e sinais de risco por segmento" },
  SWOT: { label: "Analise SWOT", description: "Forcas, fraquezas, oportunidades e ameacas" },
  DIMENSIONAMENTO_MERCADO: { label: "TAM / SAM / SOM", description: "Tamanho real do mercado com metodologia" },
  VALIDACAO_RAPIDA: { label: "Script de Validacao", description: "10 perguntas de entrevista para validar a hipotese" },
  HIPOTESE_CENTRAL: { label: "Hipotese Central", description: "Aposta principal em 1 frase testavel" },
  SCORE_POTENCIAL: { label: "Score de Potencial", description: "Avaliacao 1-5 em 5 dimensoes com recomendacao" },
  PRD: { label: "Product Requirements Document", description: "Escopo, funcionalidades e criterios de sucesso" },
  PERSONAS: { label: "Personas", description: "3 personas detalhadas incluindo persona negativa" },
  USER_STORIES: { label: "User Stories", description: "15 user stories com criterios de aceitacao" },
  METRICAS_SUCESSO: { label: "Framework de Metricas", description: "North Star, inputs, guardrails e AARRR" },
  HIPOTESE_PRICING: { label: "Estrategia de Pricing", description: "3 tiers com unit economics e willingness to pay" },
  BENCHMARKING: { label: "Benchmarking", description: "3 referencias globais com o que copiar e evitar" },
  ROADMAP_3_MESES: { label: "Roadmap 3 Meses", description: "Plano trimestral com objetivos e entregas-chave" },
  ARQUITETURA: { label: "Arquitetura do Sistema", description: "Stack, componentes, diagramas e trade-offs" },
  MODELO_DADOS: { label: "Modelo de Dados", description: "Entidades, campos, indices e relacionamentos" },
  CONTRATOS_API: { label: "Contratos de API", description: "8+ endpoints criticos documentados" },
  SEGURANCA: { label: "Plano de Seguranca", description: "OWASP Top 10, LGPD, autenticacao e auditoria" },
  FLUXOS_UI: { label: "Fluxos de UX", description: "5 fluxos criticos tela por tela com edge cases" },
  ESCALABILIDADE: { label: "Plano de Escalabilidade", description: "Estrategia para 1K, 10K e 100K usuarios" },
  ADR: { label: "Architecture Decision Records", description: "5 ADRs com contexto, decisao e consequencias" },
  SETUP_DEVOPS: { label: "DevOps & Infraestrutura", description: "CI/CD, ambientes, observabilidade e custo estimado" },
  MILESTONES: { label: "Plano de Milestones", description: "5+ milestones com features, criterios e demos" },
  SPRINT_1: { label: "Sprint 1 Detalhado", description: "Primeira semana hora a hora com bloqueadores" },
  ESTRUTURA_PASTAS: { label: "Estrutura do Projeto", description: "Arvore de arquivos comentada" },
  README: { label: "README Completo", description: "Setup em 5 comandos, .env.example e contribuicao" },
  GUIA_CONTRIBUICAO: { label: "CONTRIBUTING.md", description: "Padroes, PR checklist e convencao de commits" },
  TECH_DEBT_LOG: { label: "Log de Debito Tecnico", description: "8+ atalhos documentados com plano de resolucao" },
  DEFINITION_OF_DONE: { label: "Definition of Done", description: "Criterios para codigo, testes e deploy" },
  PLANO_TESTES: { label: "Plano de Testes", description: "Estrategia, piramide, ferramentas e cobertura minima" },
  CASOS_TESTE_CRITICOS: { label: "20 Casos de Teste Criticos", description: "P0/P1/P2 com steps e resultados esperados" },
  CHECKLIST_QA: { label: "Checklist de QA", description: "Funcionalidade, performance, seguranca, acessibilidade" },
  SCRIPT_USER_TEST: { label: "Script de Teste com Usuarios", description: "Roteiro para 5 testes reais com metricas" },
  RELATORIO_PERFORMANCE: { label: "Benchmarks de Performance", description: "Core Web Vitals, latencia e carga suportada" },
  BUGS_PREVENCAO: { label: "Top 10 Bugs a Prevenir", description: "Causa raiz, impacto, prevencao e deteccao" },
  OBSERVABILIDADE: { label: "Plano de Observabilidade", description: "Logs, metricas, alertas e dashboards" },
  RUNBOOK_DEPLOY: { label: "Runbook de Deploy", description: "Pre-deploy, deploy, smoke tests, rollback" },
  GTM: { label: "Plano Go-to-Market", description: "Canais, mensagem, 10 primeiros clientes e metricas" },
  LAUNCH_CHECKLIST: { label: "Launch Checklist", description: "Tecnico, produto, marketing, legal e operacional" },
  METRICAS_POS_LAUNCH: { label: "Dashboard Pos-Lancamento", description: "Metricas semana a semana nas primeiras 4 semanas" },
  PLANO_CRESCIMENTO_90_DIAS: { label: "Plano de Crescimento 90 Dias", description: "Metas, canais, experimentos e triggers de pivo" },
  PITCH_INVESTIDORES: { label: "Narrativa para Investidores", description: "8 slides — problema, solucao, mercado e pedido" },
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

const ArtifactCard = memo(function ArtifactCard({
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
  const { toast } = useToast();
  const updateArtifact = useUpdateArtifact();

  const isLeanCanvas = phaseNumber === 1 && artifact.artifactKey === "LEAN_CANVAS";
  const isScorePotencial = phaseNumber === 1 && artifact.artifactKey === "SCORE_POTENCIAL";
  const isFailurePatterns = phaseNumber === 1 && artifact.artifactKey === "PADROES_MORTALIDADE";
  const meta = ARTIFACT_LABELS[artifact.artifactKey];
  const isEmpty = !artifact.content?.trim();

  function save() {
    updateArtifact.mutate(
      { projectId, phaseNumber, artifactKey: artifact.artifactKey, data: { content: draft, contentJson: null } },
      {
        onSuccess: () => {
          setEditing(false);
          onUpdate();
          toast({ title: "Artefato salvo com sucesso!" });
        },
        onError: () => {
          toast({ title: "Erro ao salvar artefato", description: "Tente novamente.", variant: "destructive" });
        },
      }
    );
  }

  return (
    <div className={`bg-card border rounded-xl overflow-hidden transition-all ${expanded ? "border-primary/30 shadow-sm" : "border-card-border"}`}>
      <button
        onClick={() => setExpanded(!expanded)}
        aria-expanded={expanded}
        aria-controls={`artifact-content-${artifact.id}`}
        className="w-full flex items-center justify-between p-4 hover:bg-muted/20 transition-colors text-left"
      >
        <div className="flex items-start gap-3">
          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${isEmpty ? "bg-muted-foreground/30" : "bg-primary"}`} aria-hidden="true" />
          <div>
            <div className="text-sm font-medium text-foreground leading-snug">{meta?.label ?? artifact.artifactKey}</div>
            {meta?.description && <div className="text-xs text-muted-foreground mt-0.5">{meta.description}</div>}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-3">
          {isEmpty && <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Nao gerado</span>}
          <svg className={`w-4 h-4 text-muted-foreground transition-transform ${expanded ? "rotate-180" : ""}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {expanded && (
        <div id={`artifact-content-${artifact.id}`} className="px-4 pb-4 border-t border-border/50 pt-4">
          {editing && canCopy ? (
            <div className="space-y-3">
              <Textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="min-h-[240px] text-sm font-mono"
                aria-label={`Editar ${meta?.label ?? artifact.artifactKey}`}
              />
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
                <p className="text-sm text-muted-foreground italic">Este artefato nao foi gerado ainda. Clique em "Gerar com IA" acima.</p>
              ) : isLeanCanvas ? (
                <LeanCanvas content={artifact.content} />
              ) : isScorePotencial ? (
                <ScorePotencial content={artifact.content} />
              ) : isFailurePatterns ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                    <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Camada opcional</p>
                    <p className="text-sm text-foreground leading-relaxed">
                      Padrões de falha, casos comparáveis e sinais de risco para ajudar na decisão sem inflar a análise principal.
                    </p>
                  </div>
                  <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed">{artifact.content}</div>
                </div>
              ) : (
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
                  {canDownload ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-xs"
                      onClick={() => downloadMarkdown(artifact.artifactKey, artifact.content)}
                      aria-label={`Baixar ${meta?.label ?? artifact.artifactKey} em Markdown`}
                    >
                      ↓ .md
                    </Button>
                  ) : (
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
});

function GenerationLoadingState({ artifactCount, text }: { artifactCount: number; text: string }) {
  const lines = text.split("\n").filter(Boolean);
  const lastLine = lines[lines.length - 1] ?? "";

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" aria-hidden="true" />
        <div>
          <span className="text-sm text-primary font-medium">Gerando {artifactCount} artefatos com IA...</span>
          <p className="text-xs text-muted-foreground mt-0.5">Isso pode levar de 30 a 90 segundos. Nao feche esta pagina.</p>
        </div>
      </div>

      <div className="bg-muted/30 rounded-xl border border-border p-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-2 h-2 bg-primary rounded-full animate-pulse" aria-hidden="true" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Progresso em tempo real</span>
        </div>
        <div className="max-h-40 overflow-y-auto space-y-1">
          {text ? (
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-mono leading-relaxed">{text}</pre>
          ) : (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-3 bg-muted rounded animate-pulse" style={{ width: `${60 + i * 15}%` }} />
              ))}
            </div>
          )}
        </div>
      </div>

      {lastLine && (
        <div className="flex items-center gap-2 text-xs text-primary">
          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
          <span className="truncate">{lastLine}</span>
        </div>
      )}
    </div>
  );
}

function PhaseCompletionBanner({ phaseNumber, projectId }: { phaseNumber: number; projectId: number }) {
  const nextPhase = PHASES[phaseNumber];
  const [, setLocation] = useLocation();

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 text-center animate-in fade-in slide-in-from-bottom-2 duration-300">
      <div className="text-4xl mb-3">🎉</div>
      <h3 className="font-serif text-xl text-foreground mb-2">
        Fase {phaseNumber} concluida!
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
        {phaseNumber < 7
          ? `Excelente trabalho! Agora voce pode avancar para a Fase ${phaseNumber + 1} — ${nextPhase?.name}.`
          : "Incrivel! Voce concluiu todas as 7 fases. Seu produto esta pronto para o mercado."}
      </p>
      {phaseNumber < 7 && nextPhase ? (
        <Button
          onClick={() => setLocation(`/projects/${projectId}/phases/${phaseNumber + 1}`)}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          Ir para Fase {phaseNumber + 1} — {nextPhase.name} →
        </Button>
      ) : (
        <Button
          onClick={() => setLocation(`/projects/${projectId}`)}
          className="bg-primary hover:bg-primary/90 text-white"
        >
          Ver projeto completo →
        </Button>
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
  const { toast } = useToast();

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
  const [justCompleted, setJustCompleted] = useState(false);

  const phaseDef = PHASES[phaseNumber - 1];
  const artifacts: any[] = (phase as any)?.artifacts ?? [];
  const artifactGroups = artifacts.reduce((acc: Record<string, any[]>, artifact: any) => {
    const key = artifact.content?.trim() ? "preenchidos" : "vazios";
    acc[key] ??= [];
    acc[key].push(artifact);
    return acc;
  }, {});
  const allGatesChecked = phase?.gate1Checked && phase?.gate2Checked && phase?.gate3Checked;
  const isLocked = phase?.status === "locked";
  const isCompleted = phase?.status === "completed";
  const hasArtifacts = artifacts.some(a => a.content?.trim());
  const generatedCount = artifacts.filter(a => a.content?.trim()).length;
  const totalCount = artifacts.length;

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
          setJustCompleted(true);
          toast({
            title: `Fase ${phaseNumber} concluida!`,
            description: phaseNumber < 7 ? `Avancando para Fase ${phaseNumber + 1} — ${PHASES[phaseNumber]?.name}` : "Todas as 7 fases concluidas. Produto pronto!",
          });
        },
        onError: () => {
          toast({ title: "Erro ao concluir fase", description: "Verifique se todos os criterios estao marcados.", variant: "destructive" });
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
        const errorMsg = err.error ?? "Erro ao gerar artefatos";
        setGenerationError(errorMsg);
        setGenerating(false);
        toast({ title: "Erro na geracao", description: errorMsg, variant: "destructive" });
        return;
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) { setGenerationError("Streaming nao suportado"); setGenerating(false); return; }
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
                toast({ title: "Artefatos gerados com sucesso!", description: `${phaseDef?.artifacts?.length ?? 0} artefatos prontos para revisao.` });
              } else if (event.type === "error") {
                const msg = (event as any).message ?? "Erro";
                setGenerationError(msg);
                setGenerating(false);
                toast({ title: "Erro na geracao", description: msg, variant: "destructive" });
              }
            } catch { /* ignore */ }
          }
        }
      }
      setGenerating(false);
    }).catch(() => {
      const msg = "Erro de conexao ao gerar artefatos. Verifique sua conexao e tente novamente.";
      setGenerationError(msg);
      setGenerating(false);
      toast({ title: "Erro de conexao", description: msg, variant: "destructive" });
    });
  }

  function invalidatePhase() {
    queryClient.invalidateQueries({ queryKey: getGetPhaseQueryKey(projectId, phaseNumber) });
  }

  if (isLoading) {
    return (
      <div className="app-shell">
        <div className="sidebar">
          <div className="px-4 py-5"><div className="skeleton h-7 w-24" /></div>
        </div>
        <div className="flex-1 flex flex-col">
          <div className="topbar"><div className="skeleton h-4 w-48" /></div>
          <div className="flex-1 px-8 py-8 space-y-4 max-w-3xl mx-auto w-full">
            <div className="surface-2 animate-pulse h-40 w-full" />
            <div className="surface-2 animate-pulse h-32 w-full" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`app-shell ${noPrint ? "no-print-content" : ""}`} data-phase={phaseNumber}>
      {noPrint && (
        <style>{`@media print { .no-print-content { display: none !important; } body::after { content: "Impressao disponivel apenas no plano Avancado."; display: block; padding: 2rem; } }`}</style>
      )}

      {/* Sidebar with phase context */}
      <AppSidebar
        currentPhase={phaseNumber}
        projectId={projectId}
        projectName={project?.name}
        phaseStatuses={(project as any)?.phases?.map((p: { status: string }) => ({ status: p.status })) ?? []}
      />

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Topbar */}
        <div className="topbar">
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--text-secondary)" }} aria-label="Navegacao">
            <Link href="/dashboard" className="hover:text-[var(--text-primary)] transition-colors">Painel</Link>
            <span>/</span>
            <Link href={`/projects/${projectId}`} className="hover:text-[var(--text-primary)] transition-colors truncate max-w-[100px]">
              {project?.name ?? "Projeto"}
            </Link>
            <span>/</span>
            <span style={{ color: "var(--phase-accent)", fontWeight: 500 }}>Fase {phaseNumber} — {phaseDef?.name}</span>
          </div>
          {permissions.hasAiAdvisor && (
            <Link href={`/projects/${projectId}/advisor`} className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80" style={{ color: "var(--phase-accent)" }}>
              <span>✦</span> AI Advisor
            </Link>
          )}
        </div>

      <main className="flex-1 overflow-y-auto px-8 py-8">
        <div className="max-w-3xl mx-auto space-y-8">
        {/* Phase header */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-start gap-4 mb-4">
            <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-sm font-bold ${
              isCompleted ? "bg-primary text-white" : isLocked ? "bg-muted text-muted-foreground" : "bg-primary/10 text-primary border border-primary/30"
            }`} aria-hidden="true">
              {isCompleted ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8l3.5 3.5L13 5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : phaseNumber}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                <span className="text-xs font-semibold text-primary uppercase tracking-wider">Fase {phaseNumber}</span>
                {phaseDef?.tagline && <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">{phaseDef.tagline}</span>}
                {isCompleted && <span className="ml-auto text-xs font-medium px-2.5 py-1 bg-primary/10 text-primary rounded-full border border-primary/20">Concluida ✓</span>}
                {isLocked && <span className="ml-auto text-xs font-medium px-2.5 py-1 bg-muted text-muted-foreground rounded-full">Bloqueada</span>}
              </div>
              <h1 className="text-xl font-serif text-foreground">{phaseDef?.name}</h1>
            </div>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed italic pl-14">"{phaseDef?.motivation}"</p>

          {phaseDef?.artifacts && (
            <div className="mt-5 pl-14">
              <div className="text-xs font-medium text-muted-foreground mb-2">
                O que voce vai receber ({generatedCount}/{totalCount} gerados):
              </div>
              <div className="flex flex-wrap gap-1.5">
                {phaseDef.artifacts.map((art) => {
                  const generated = artifacts.find(a => a.artifactKey === art.key && a.content?.trim());
                  return (
                    <span key={art.key} className={`text-[11px] px-2 py-0.5 rounded-full border transition-all ${generated ? "bg-primary/10 text-primary border-primary/20" : "bg-muted text-muted-foreground border-muted"}`}>
                      {generated ? "✓ " : ""}{art.label}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {permissions.plan !== "free" && !permissions.canCopy && (
            <div className="mt-4 pl-14">
              <Link href="/pricing">
                <span className="text-[11px] text-muted-foreground hover:text-primary transition-colors cursor-pointer bg-muted px-2 py-1 rounded-md">
                  🔒 Copiar, editar e baixar artefatos — upgrade para o plano Pro →
                </span>
              </Link>
            </div>
          )}
        </div>

        {/* Phase Preview — shown before first generation */}
        {!hasArtifacts && !isLocked && phaseDef?.artifacts && phaseDef.artifacts.length > 0 && (
          <div className="rounded-2xl border border-primary/20 bg-primary/5 p-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 bg-primary rounded-full animate-pulse" />
              <p className="text-xs font-mono font-semibold text-primary uppercase tracking-wider">O que você vai receber nesta fase</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {phaseDef.artifacts.slice(0, 6).map((art) => {
                const meta = ARTIFACT_LABELS[art.key];
                return (
                  <div key={art.key} className="flex items-start gap-2.5 bg-card/80 rounded-xl px-3 py-2.5 border border-border/60">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary/40 flex-shrink-0 mt-1.5" />
                    <div>
                      <p className="text-xs font-semibold text-foreground leading-snug">{meta?.label ?? art.key}</p>
                      {meta?.description && <p className="text-[11px] text-muted-foreground mt-0.5 leading-snug">{meta.description}</p>}
                    </div>
                  </div>
                );
              })}
              {phaseDef.artifacts.length > 6 && (
                <div className="flex items-center gap-2 px-3 py-2.5">
                  <p className="text-xs text-muted-foreground">+{phaseDef.artifacts.length - 6} entregáveis adicionais</p>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-4 leading-relaxed">
              Clique em <span className="font-semibold text-primary">Gerar com IA</span> abaixo para produzir todos estes artefatos personalizados para o seu produto.
            </p>
          </div>
        )}

        {/* AI Execution */}
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-start justify-between mb-1">
            <h2 className="font-serif text-lg">Gerar com IA</h2>
            {hasArtifacts && !generating && (
              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">
                {generatedCount}/{totalCount} gerados
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            A IA vai analisar seu briefing e os artefatos das fases anteriores para gerar {phaseDef?.artifacts?.length ?? 0} entregaveis especificos para o seu produto.
          </p>

          {isLocked ? (
            <div className="flex items-start gap-3 bg-muted/30 rounded-xl p-4">
              <span className="text-lg flex-shrink-0">🔒</span>
              <div>
                <p className="text-sm font-medium text-foreground">Esta fase esta bloqueada</p>
                <p className="text-xs text-muted-foreground mt-0.5">Conclua a fase anterior para desbloquea-la.</p>
                <Link href={`/projects/${projectId}/phases/${phaseNumber - 1}`} className="text-xs text-primary hover:underline mt-1 inline-block">
                  Ir para Fase {phaseNumber - 1} →
                </Link>
              </div>
            </div>
          ) : generating ? (
            <GenerationLoadingState artifactCount={phaseDef?.artifacts?.length ?? 0} text={generatingText} />
          ) : (
          <div className="space-y-3">
              <Button
                onClick={handleExecuteAI}
                className="bg-primary hover:bg-primary/90 text-white"
                data-testid="button-execute-ai"
              >
                {hasArtifacts ? "Regenerar todos os artefatos" : `Gerar artefatos da fase ${phaseDef?.name} com IA`}
              </Button>
              {generationError && (
                <div className="flex items-start gap-3 bg-destructive/10 border border-destructive/20 rounded-xl p-4" role="alert">
                  <span className="text-destructive flex-shrink-0">⚠️</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-destructive font-medium">Erro na geracao</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{generationError}</p>
                  </div>
                  <button
                    onClick={handleExecuteAI}
                    className="text-xs text-primary hover:text-primary/80 font-medium flex-shrink-0 underline"
                  >
                    Tentar novamente
                  </button>
                </div>
              )}
              {hasArtifacts && !generationError && (
                <p className="text-xs text-muted-foreground">Regenerar substituira todos os artefatos atuais.</p>
              )}
            </div>
          )}
        </div>

        {/* Artifacts */}
        {artifacts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg">Artefatos gerados</h2>
              <span className="text-xs text-muted-foreground">{generatedCount}/{totalCount} prontos</span>
            </div>
            {artifactGroups.preenchidos?.length > 0 && (
              <div className="bg-card border border-card-border rounded-xl p-4">
                <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Entregas concluídas</div>
                <div className="space-y-2">
                  {artifactGroups.preenchidos.map((artifact: any) => (
                    <div key={artifact.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2">
                      <span className="text-sm text-foreground">{artifact.artifactKey}</span>
                      <span className="text-xs text-primary">pronto</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
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

        {/* Phase completion celebration */}
        {justCompleted && (
          <PhaseCompletionBanner phaseNumber={phaseNumber} projectId={projectId} />
        )}

        {/* Gate */}
        {!isLocked && !justCompleted && (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-serif text-lg mb-1">Portao de saida</h2>
            <p className="text-xs text-muted-foreground mb-5">Marque os 3 criterios para avancar. Nao avance ate estar genuinamente satisfeito.</p>
            <div className="space-y-4" role="group" aria-label="Criterios de saida da fase">
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
                      aria-label={gate}
                      className="mt-0.5 w-4 h-4 accent-primary rounded flex-shrink-0"
                    />
                    <span className={`text-sm leading-snug transition-colors ${checked ? "line-through text-muted-foreground" : "text-foreground"}`}>{gate}</span>
                  </label>
                );
              })}
            </div>

            {allGatesChecked && !isCompleted && (
              <div className="mt-6 pt-5 border-t border-border">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                  <p className="text-sm text-primary font-medium">Todos os criterios marcados — voce esta pronto para avancar!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Esta acao e irreversivel. Certifique-se de que os artefatos estao revisados.</p>
                </div>
                <Button
                  onClick={handleComplete}
                  disabled={completePhase.isPending}
                  className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
                  data-testid="button-complete-phase"
                >
                  {completePhase.isPending ? "Avancando..." : (phaseNumber < 7 ? `Concluir e avancar para Fase ${phaseNumber + 1} — ${PHASES[phaseNumber]?.name}` : "Concluir o projeto!")}
                </Button>
              </div>
            )}

            {isCompleted && !justCompleted && (
              <div className="mt-5 pt-4 border-t border-border flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center flex-shrink-0" aria-hidden="true">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M2 6l2.5 2.5L10 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Fase {phaseNumber} concluida</p>
                  {phaseNumber < 7 && (
                    <Link href={`/projects/${projectId}/phases/${phaseNumber + 1}`} className="text-xs text-primary hover:underline">
                      Ir para Fase {phaseNumber + 1} — {PHASES[phaseNumber]?.name} →
                    </Link>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Upgrade prompt for free plan */}
        {permissions.plan === "free" && hasArtifacts && (
          <div className="glass-card rounded-2xl p-5 flex items-start gap-4">
            <div className="text-2xl flex-shrink-0">⬆️</div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground mb-1">Copie, edite e baixe seus artefatos</h3>
              <p className="text-sm text-muted-foreground mb-3">Faca upgrade para o plano Pro e tenha acesso completo a todos os artefatos gerados — inclui edicao, copia e download em Markdown.</p>
              <Link href="/pricing">
                <Button size="sm" className="bg-primary hover:bg-primary/90 text-white">Ver planos</Button>
              </Link>
            </div>
          </div>
        )}

        <div className="bg-card border border-card-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-serif text-lg">Colaboração do time</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Espaço para alinhar decisões e manter contexto.</p>
            </div>
            <Link href={`/projects/${projectId}`}>
              <Button variant="outline" size="sm">Ver projeto</Button>
            </Link>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Resumo da fase</div>
              <p className="text-sm text-foreground leading-relaxed">
                {phaseDef?.motivation}
              </p>
            </div>
            <div className="rounded-xl border border-border p-4">
              <div className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-2">Ação seguinte</div>
              <p className="text-sm text-foreground leading-relaxed">
                {allGatesChecked ? "Concluir a fase agora." : "Marcar os critérios de saída e revisar os artefatos."}
              </p>
            </div>
          </div>
        </div>

        {phaseNumber > 1 && (
          <div className="text-center pb-6">
            <Link href={`/projects/${projectId}/phases/${phaseNumber - 1}`} className="text-xs text-muted-foreground hover:text-foreground transition-colors">
              ← Voltar para a fase anterior
            </Link>
          </div>
        )}
        </div>
      </main>
      </div>
    </div>
  );
}
