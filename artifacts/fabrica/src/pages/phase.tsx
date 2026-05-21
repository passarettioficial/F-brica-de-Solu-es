import { useState, memo, useEffect, useRef } from "react";
import confetti from "canvas-confetti";
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
import { ArtifactBody } from "@/components/artifact-body";
import {
  SeletorNichoCanvas,
  MatrizCompetitivaCanvas,
  CartaoPersonaCanvas,
  MapaDecisaoCompraCanvas,
  ValorQuantificadoCanvas,
  LtvCacCanvas,
  MatrizRbacCanvas,
  ModeloDadosCanvas,
  MilestonesCanvas,
  CasosTesteCanvas,
  MetricasPosLaunchCanvas,
} from "@/components/canvases";
import { deriveGate } from "@/lib/gate-derivations";

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

function parseJsonBlock<T = Record<string, unknown>>(content: string): T | null {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]) as T;
    const t = content.trim();
    if (t.startsWith("{")) return JSON.parse(t) as T;
  } catch { /* fallback to raw */ }
  return null;
}

function ProtectWrap({ protect, children }: { protect: boolean; children: React.ReactNode }) {
  if (!protect) return <>{children}</>;
  return (
    <div
      style={{ userSelect: "none", WebkitUserSelect: "none", pointerEvents: "none" }}
      onCopy={(e) => e.preventDefault()}
      onCut={(e) => e.preventDefault()}
      onContextMenu={(e) => e.preventDefault()}
    >
      {children}
    </div>
  );
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
  SELETOR_NICHO_INICIAL: { label: "Seletor de Nicho Inicial", description: "Ranqueamento dos segmentos candidatos" },
  LEAN_CANVAS: { label: "Lean Canvas", description: "9 blocos do modelo de negócio" },
  JTBD: { label: "Tarefa do Cliente (JTBD)", description: "O que o cliente realmente quer realizar" },
  ANALISE_COMPETITIVA: { label: "Análise Competitiva", description: "5 concorrentes com tabela comparativa" },
  MATRIZ_COMPETITIVA: { label: "Matriz Competitiva 2×2", description: "Posicionamento visual em 2 eixos das prioridades do cliente" },
  PADROES_MORTALIDADE: { label: "Padrões de Mortalidade", description: "Casos comparáveis e sinais de risco por segmento" },
  SWOT: { label: "Análise SWOT", description: "(legado) Forças, fraquezas, oportunidades e ameaças" },
  DIMENSIONAMENTO_MERCADO: { label: "TAM / SAM / SOM", description: "Tamanho real do mercado bottom-up" },
  VALIDACAO_RAPIDA: { label: "Script de Validação", description: "10 perguntas de entrevista para validar a hipótese" },
  HIPOTESE_CENTRAL: { label: "Hipótese Central", description: "Aposta principal em 1 frase testável" },
  SCORE_POTENCIAL: { label: "Score de Potencial", description: "Avaliação 1-5 em 5 dimensões com recomendação" },
  PRD: { label: "Product Requirements Document", description: "Escopo, núcleo do produto e critérios de sucesso" },
  PERSONAS: { label: "Personas", description: "(legado) 3 personas detalhadas" },
  CARTAO_PERSONA: { label: "Cartão de Persona", description: "Persona estruturada: bio, dia típico, gatilhos, watering holes" },
  MAPA_DECISAO_COMPRA: { label: "Mapa de Decisão de Compra", description: "Quem usa, quem aprova, quem paga, quem veta" },
  VALOR_QUANTIFICADO: { label: "Valor Quantificado", description: "Situação atual → possível → ganho em $ ou horas" },
  USER_STORIES: { label: "User Stories", description: "15 user stories com critérios de aceitação" },
  METRICAS_SUCESSO: { label: "Framework de Métricas", description: "North Star, inputs, guardrails e AARRR" },
  HIPOTESE_PRICING: { label: "Modelo de Precificação", description: "3 tiers com 3 perguntas-chave de pricing" },
  LTV_CAC: { label: "Calculadora LTV ÷ CAC", description: "Unit economics com veredito de viabilidade" },
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
  PLANO_CRESCIMENTO_90_DIAS: { label: "Plano de Crescimento 90 Dias", description: "Metas, canais, experimentos e gatilhos de pivô" },
  PITCH_INVESTIDORES: { label: "Narrativa para Investidores", description: "8 slides — problema, solução, mercado e pedido" },
  SLA_SUPORTE: { label: "SLA & Plano de Suporte", description: "Canais, SLA, playbooks e FAQ inicial" },
};

function downloadMarkdown(artifactKey: string, content: string, projectId: number, phaseNumber: number) {
  const blob = new Blob([content], { type: "text/markdown" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${artifactKey.toLowerCase()}.md`;
  a.click();
  URL.revokeObjectURL(url);
  // Mark as downloaded server-side (fire and forget)
  const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");
  fetch(`${basePath}/api/projects/${projectId}/phases/${phaseNumber}/artifacts/${artifactKey}/download`, {
    method: "PATCH",
    credentials: "include",
  }).catch(() => {/* silent — download already happened */});
}

const ArtifactCard = memo(function ArtifactCard({
  artifact,
  phaseNumber,
  projectId,
  canCopy,
  canDownload,
  onUpdate,
  expanded,
  onToggleExpanded,
}: {
  artifact: { id: number; artifactKey: string; content: string; contentJson: string | null; downloadedAt?: string | null };
  phaseNumber: number;
  projectId: number;
  canCopy: boolean;
  canDownload: boolean;
  onUpdate: () => void;
  expanded: boolean;
  onToggleExpanded: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(artifact.content);
  const [downloaded, setDownloaded] = useState(!!artifact.downloadedAt);
  const { toast } = useToast();
  const updateArtifact = useUpdateArtifact();

  const isLeanCanvas = phaseNumber === 1 && artifact.artifactKey === "LEAN_CANVAS";
  const isScorePotencial = phaseNumber === 1 && artifact.artifactKey === "SCORE_POTENCIAL";
  const isFailurePatterns = phaseNumber === 1 && artifact.artifactKey === "PADROES_MORTALIDADE";
  const isSeletorNicho = phaseNumber === 1 && artifact.artifactKey === "SELETOR_NICHO_INICIAL";
  const isMatrizComp = phaseNumber === 1 && artifact.artifactKey === "MATRIZ_COMPETITIVA";
  const isCartaoPersona = phaseNumber === 2 && artifact.artifactKey === "CARTAO_PERSONA";
  const isMapaDecisao = phaseNumber === 2 && artifact.artifactKey === "MAPA_DECISAO_COMPRA";
  const isValorQuant = phaseNumber === 2 && artifact.artifactKey === "VALOR_QUANTIFICADO";
  const isLtvCac = phaseNumber === 2 && artifact.artifactKey === "LTV_CAC";
  const isMatrizRbac = phaseNumber === 3 && artifact.artifactKey === "MATRIZ_RBAC";
  const isModeloDados = phaseNumber === 4 && artifact.artifactKey === "MODELO_DADOS";
  const isMilestones = phaseNumber === 5 && artifact.artifactKey === "MILESTONES";
  const isCasosTeste = phaseNumber === 6 && artifact.artifactKey === "CASOS_TESTE_CRITICOS";
  const isMetricasPos = phaseNumber === 7 && artifact.artifactKey === "METRICAS_POS_LAUNCH";
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
    <div id={`artifact-anchor-${artifact.id}`} className={`scroll-mt-24 bg-card border rounded-xl overflow-hidden transition-all ${expanded ? "border-primary/30 shadow-sm" : "border-card-border"}`}>
      <button
        onClick={onToggleExpanded}
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
          {isEmpty && <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full">Não gerado</span>}
          {downloaded && !isEmpty && (
            <span
              title="Artefato já baixado"
              className="flex items-center justify-center w-5 h-5 rounded-full bg-green-500/15 text-green-600 dark:text-green-400"
              aria-label="Artefato baixado"
            >
              <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            </span>
          )}
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
                <p className="text-sm text-muted-foreground italic">Este artefato não foi gerado ainda. Clique em "Gerar com IA" acima.</p>
              ) : isLeanCanvas ? (
                <ProtectWrap protect={!canCopy}><LeanCanvas content={artifact.content} /></ProtectWrap>
              ) : isScorePotencial ? (
                <ProtectWrap protect={!canCopy}><ScorePotencial content={artifact.content} /></ProtectWrap>
              ) : isSeletorNicho ? (
                <ProtectWrap protect={!canCopy}><SeletorNichoCanvas content={artifact.content} /></ProtectWrap>
              ) : isMatrizComp ? (
                <ProtectWrap protect={!canCopy}><MatrizCompetitivaCanvas content={artifact.content} /></ProtectWrap>
              ) : isCartaoPersona ? (
                <ProtectWrap protect={!canCopy}><CartaoPersonaCanvas content={artifact.content} /></ProtectWrap>
              ) : isMapaDecisao ? (
                <ProtectWrap protect={!canCopy}><MapaDecisaoCompraCanvas content={artifact.content} /></ProtectWrap>
              ) : isValorQuant ? (
                <ProtectWrap protect={!canCopy}><ValorQuantificadoCanvas content={artifact.content} /></ProtectWrap>
              ) : isLtvCac ? (
                <ProtectWrap protect={!canCopy}><LtvCacCanvas content={artifact.content} /></ProtectWrap>
              ) : isMatrizRbac ? (
                <ProtectWrap protect={!canCopy}><MatrizRbacCanvas content={artifact.content} /></ProtectWrap>
              ) : isModeloDados ? (
                <ProtectWrap protect={!canCopy}><ModeloDadosCanvas content={artifact.content} /></ProtectWrap>
              ) : isMilestones ? (
                <ProtectWrap protect={!canCopy}><MilestonesCanvas content={artifact.content} /></ProtectWrap>
              ) : isCasosTeste ? (
                <ProtectWrap protect={!canCopy}><CasosTesteCanvas content={artifact.content} /></ProtectWrap>
              ) : isMetricasPos ? (
                <ProtectWrap protect={!canCopy}><MetricasPosLaunchCanvas content={artifact.content} /></ProtectWrap>
              ) : isFailurePatterns ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-primary/15 bg-primary/5 p-4">
                    <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Camada opcional</p>
                    <p className="text-[15px] text-foreground leading-relaxed">
                      Padrões de falha, casos comparáveis e sinais de risco para ajudar na decisão sem inflar a análise principal.
                    </p>
                  </div>
                  <ArtifactBody content={artifact.content} protect={!canCopy} />
                </div>
              ) : (
                <ArtifactBody content={artifact.content} protect={!canCopy} />
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
                      className={`text-xs gap-1 ${downloaded ? "border-green-500/40 text-green-600 dark:text-green-400" : ""}`}
                      onClick={() => {
                        downloadMarkdown(artifact.artifactKey, artifact.content, projectId, phaseNumber);
                        setDownloaded(true);
                      }}
                      aria-label={`Baixar ${meta?.label ?? artifact.artifactKey} em Markdown`}
                    >
                      {downloaded ? (
                        <>
                          <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                          Baixado
                        </>
                      ) : "↓ .md"}
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

function GenerationLoadingState({ artifactCount, text, projectName }: { artifactCount: number; text: string; projectName?: string }) {
  const lines = text.split("\n").filter(Boolean);
  const lastLine = lines[lines.length - 1] ?? "";
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef(Date.now());

  useEffect(() => {
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current) / 1000)), 1000);
    return () => clearInterval(t);
  }, []);

  const estimateSec = Math.max(45, artifactCount * 6);
  const progress = Math.min(95, Math.round((elapsed / estimateSec) * 100));
  const remaining = Math.max(0, estimateSec - elapsed);
  const remainingLabel = remaining > 60 ? `~${Math.ceil(remaining / 60)} min` : `~${remaining}s`;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <span className="text-sm text-primary font-medium">
            Gerando {artifactCount} artefatos{projectName ? ` para ${projectName}` : ""} com IA…
          </span>
          <p className="text-xs text-muted-foreground mt-0.5">
            {elapsed < estimateSec ? `${remainingLabel} restantes` : "Finalizando…"} · Não feche esta página.
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div
          className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
          style={{ width: `${progress}%` }}
        />
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
        Fase {phaseNumber} concluída!
      </h3>
      <p className="text-sm text-muted-foreground mb-5">
        {phaseNumber < 7
          ? `Excelente trabalho! Agora você pode avançar para a Fase ${phaseNumber + 1} — ${nextPhase?.name}.`
          : "Incrível! Você concluiu todas as 7 fases. Seu produto está pronto para o mercado."}
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
  const [aiJustDone, setAiJustDone] = useState(false);
  const [aiWordCount, setAiWordCount] = useState(0);
  const [upgradeRequired, setUpgradeRequired] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const expandedInitRef = useRef(false);

  function toggleExpanded(id: number) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }

  function jumpToArtifact(id: number) {
    setExpandedIds((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
    requestAnimationFrame(() => {
      document.getElementById(`artifact-anchor-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  }

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

  // Initialize expand state once: open first 2 non-empty artifacts to give a "wow" view
  // without mounting all heavy markdown trees at once.
  useEffect(() => {
    if (expandedInitRef.current) return;
    const ready = artifacts.filter((a) => a.content?.trim());
    if (ready.length === 0) return;
    expandedInitRef.current = true;
    setExpandedIds(new Set(ready.slice(0, 2).map((a) => a.id)));
  }, [artifacts]);

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
          void confetti({ particleCount: phaseNumber === 7 ? 180 : 80, spread: 70, origin: { y: 0.6 }, colors: ["#1A3FAB", "#FF8C42", "#ffffff"] });
          toast({
            title: `Fase ${phaseNumber} concluída!`,
            description: phaseNumber < 7 ? `Avançando para Fase ${phaseNumber + 1} — ${PHASES[phaseNumber]?.name}` : "Todas as 7 fases concluídas. Produto pronto!",
          });
        },
        onError: () => {
          toast({ title: "Erro ao concluir fase", description: "Verifique se todos os critérios estão marcados.", variant: "destructive" });
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
        const err = await response.json().catch(() => ({ error: "Erro desconhecido" })) as { error?: string; code?: string; requiresUpgrade?: boolean };
        if (response.status === 402 || err.requiresUpgrade) {
          setUpgradeRequired(true);
          setGenerating(false);
          return;
        }
        const errorMsg = err.error ?? "Erro ao gerar artefatos";
        setGenerationError(errorMsg);
        setGenerating(false);
        toast({ title: "Erro na geração", description: errorMsg, variant: "destructive" });
        return;
      }
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      if (!reader) { setGenerationError("Streaming não suportado"); setGenerating(false); return; }
      let buffer = "";
      let accText = "";
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
              if (event.type === "progress") {
                const chunk = event.content ?? "";
                accText += chunk;
                setGeneratingText((prev) => prev + chunk);
              } else if (event.type === "done") {
                const words = accText.trim().split(/\s+/).filter(Boolean).length;
                setAiWordCount(words);
                setAiJustDone(true);
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

        {/* Método FoundersFlow — upgrade banner for legacy projects */}
        {(() => {
          if (!phaseDef?.artifacts?.length || !hasArtifacts || isLocked || generating) return null;
          const LEGACY_KEYS = ["SWOT", "PERSONAS"];
          const expectedKeys = new Set(phaseDef.artifacts.map((a) => a.key));
          const hasLegacy = artifacts.some((a) => LEGACY_KEYS.includes(a.artifactKey) && a.content?.trim());
          const missingNew = phaseDef.artifacts.some((a) => !artifacts.find((art) => art.artifactKey === a.key && art.content?.trim()));
          const hasUnknown = artifacts.some((a) => !expectedKeys.has(a.artifactKey) && !LEGACY_KEYS.includes(a.artifactKey) && a.content?.trim());
          if (!hasLegacy && !(missingNew && hasUnknown)) return null;
          return (
            <div className="rounded-2xl border-2 border-accent/40 bg-gradient-to-br from-accent/10 to-transparent p-5 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center text-xl">✨</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-accent font-bold">Método FoundersFlow · atualização disponível</span>
                  </div>
                  <h3 className="font-serif text-base text-foreground mb-1">Este projeto usa o método anterior</h3>
                  <p className="text-sm text-muted-foreground mb-3 leading-relaxed">
                    A Fase {phaseNumber} ganhou novos canvases visuais (
                    {phaseNumber === 1 ? "Seletor de Nicho, Matriz Competitiva 2×2" : "Cartão de Persona, Mapa de Decisão de Compra, Valor Quantificado, LTV ÷ CAC"}
                    ). Regenerar substitui os artefatos antigos pelo método atualizado — você pode baixar os atuais antes se quiser.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      onClick={handleExecuteAI}
                      className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold"
                    >
                      Atualizar para Método FoundersFlow
                    </Button>
                    <span className="text-[11px] text-muted-foreground self-center">consome 1 geração de IA</span>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

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
            <GenerationLoadingState artifactCount={phaseDef?.artifacts?.length ?? 0} text={generatingText} projectName={project?.name} />
          ) : (
          <div className="space-y-3">
              {upgradeRequired ? (
                <div className="flex items-start gap-3 bg-accent/10 border border-accent/30 rounded-xl p-4">
                  <span className="text-xl flex-shrink-0">🚀</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground">Fases 4 a 7 requerem upgrade</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Você concluiu as 3 fases gratuitas. Faça upgrade para desbloquear Spec, Implementação, Testes e Deploy.
                    </p>
                    <Link href="/pricing" className="inline-block mt-2">
                      <Button size="sm" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold text-xs">
                        Ver planos e fazer upgrade →
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
              <Button
                onClick={handleExecuteAI}
                className="bg-primary hover:bg-primary/90 text-white"
                data-testid="button-execute-ai"
              >
                {hasArtifacts ? "Regenerar todos os artefatos" : `Gerar artefatos da fase ${phaseDef?.name} com IA`}
              </Button>
              )}
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
              {!upgradeRequired && hasArtifacts && !generationError && (
                <p className="text-xs text-muted-foreground">Regenerar substituira todos os artefatos atuais.</p>
              )}
            </div>
          )}
        </div>

        {/* Wow moment banner after AI generation */}
        {aiJustDone && aiWordCount > 0 && (
          <div className="bg-primary/5 border border-primary/20 rounded-2xl px-6 py-4 flex items-center gap-4">
            <div className="text-2xl flex-shrink-0">✦</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {generatedCount} artefatos gerados — <span className="text-primary">{aiWordCount.toLocaleString("pt-BR")} palavras</span> de estratégia específica para o seu negócio
              </p>
              <p className="text-xs text-muted-foreground mt-0.5">Revise, edite e marque os critérios de saída para avançar para a próxima fase.</p>
            </div>
            <button onClick={() => setAiJustDone(false)} className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0" aria-label="Fechar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
        )}

        {/* Artifacts */}
        {artifacts.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg">Artefatos gerados</h2>
              <span className="text-xs text-muted-foreground">{generatedCount}/{totalCount} prontos</span>
            </div>

            {/* Sticky TOC — jumps to and expands target artifact */}
            {artifacts.filter(a => a.content?.trim()).length > 1 && (
              <nav
                aria-label="Índice de artefatos"
                className="sticky top-2 z-20 bg-card/95 backdrop-blur border border-card-border rounded-xl p-3 shadow-sm"
              >
                <div className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground mb-2">
                  Ir para
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {artifacts.map((a) => {
                    const isReady = !!a.content?.trim();
                    const meta = ARTIFACT_LABELS[a.artifactKey];
                    const label = meta?.label ?? a.artifactKey;
                    return (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => jumpToArtifact(a.id)}
                        className={`text-[12px] px-2.5 py-1 rounded-full border transition-colors ${
                          isReady
                            ? "border-primary/30 bg-primary/5 text-primary hover:bg-primary/10"
                            : "border-border bg-muted/40 text-muted-foreground hover:bg-muted"
                        }`}
                      >
                        {isReady ? "" : "○ "}{label}
                      </button>
                    );
                  })}
                </div>
              </nav>
            )}

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
            {(() => {
              const sections = (phaseDef as any)?.sections as { id: string; label: string; keys: string[] }[] | undefined;
              const renderCard = (artifact: any) => (
                <ArtifactCard
                  key={artifact.id}
                  artifact={artifact}
                  phaseNumber={phaseNumber}
                  projectId={projectId}
                  canCopy={permissions.canCopy}
                  canDownload={permissions.canDownload}
                  onUpdate={invalidatePhase}
                  expanded={expandedIds.has(artifact.id)}
                  onToggleExpanded={() => toggleExpanded(artifact.id)}
                />
              );
              if (!sections) return artifacts.map(renderCard);
              const grouped = sections.map((s) => ({
                ...s,
                items: artifacts.filter((a) => s.keys.includes(a.artifactKey)),
              }));
              const claimed = new Set(sections.flatMap((s) => s.keys));
              const orphans = artifacts.filter((a) => !claimed.has(a.artifactKey));
              return (
                <>
                  {grouped.map((g) => (
                    <div key={g.id} className="space-y-3">
                      <div className="flex items-center gap-3 pt-2">
                        <h3 className="font-serif text-base text-primary">{g.label}</h3>
                        <div className="flex-1 h-px bg-primary/20" />
                        <span className="text-[11px] font-mono uppercase tracking-wider text-muted-foreground">
                          {g.items.filter((a) => a.content?.trim()).length}/{g.items.length}
                        </span>
                      </div>
                      {g.items.map(renderCard)}
                    </div>
                  ))}
                  {orphans.length > 0 && (
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 pt-2">
                        <h3 className="font-serif text-sm text-muted-foreground">Outros entregáveis</h3>
                        <div className="flex-1 h-px bg-border" />
                      </div>
                      {orphans.map(renderCard)}
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        )}

        {/* Phase completion celebration */}
        {justCompleted && (
          <PhaseCompletionBanner phaseNumber={phaseNumber} projectId={projectId} />
        )}

        {/* Gate */}
        {!isLocked && !justCompleted && (
          <div className="glass-card rounded-2xl p-6">
            <h2 className="font-serif text-lg mb-1">Portão de saída</h2>
            <p className="text-xs text-muted-foreground mb-5">Marque os 3 critérios para avançar. Não avance até estar genuinamente satisfeito.</p>
            <div className="space-y-4" role="group" aria-label="Critérios de saída da fase">
              {phaseDef?.gates.map((gate, i) => {
                const gateNum = (i + 1) as 1 | 2 | 3;
                const checked = gateNum === 1 ? phase?.gate1Checked : gateNum === 2 ? phase?.gate2Checked : phase?.gate3Checked;
                const derived = deriveGate(phaseNumber, gateNum, artifacts);
                return (
                  <div key={i} data-testid={`gate-${gateNum}`}>
                    <label className="flex items-start gap-3 cursor-pointer group">
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
                    {derived.state !== "unknown" && (
                      <div className="mt-1.5 ml-7">
                        {derived.state === "pass" ? (
                          <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/30">
                            <svg viewBox="0 0 24 24" className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                            <span>Detectado nos artefatos · {derived.message}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/30">
                            <span>⚠ {derived.message}</span>
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {allGatesChecked && !isCompleted && (
              <div className="mt-6 pt-5 border-t border-border">
                <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4">
                  <p className="text-sm text-primary font-medium">Todos os critérios marcados — você está pronto para avançar!</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Esta ação é irreversível. Certifique-se de que os artefatos estão revisados.</p>
                </div>
                <Button
                  onClick={handleComplete}
                  disabled={completePhase.isPending}
                  className="bg-primary hover:bg-primary/90 text-white w-full sm:w-auto"
                  data-testid="button-complete-phase"
                >
                  {completePhase.isPending ? "Avançando..." : (phaseNumber < 7 ? `Concluir e avançar para Fase ${phaseNumber + 1} — ${PHASES[phaseNumber]?.name}` : "Concluir o projeto!")}
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
                  <p className="text-sm font-medium text-foreground">Fase {phaseNumber} concluída</p>
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
              <p className="text-sm text-muted-foreground mb-3">Faça upgrade para o plano Pro e tenha acesso completo a todos os artefatos gerados — inclui edição, cópia e download em Markdown.</p>
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
