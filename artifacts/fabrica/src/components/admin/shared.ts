const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

export function api(path: string, options?: RequestInit) {
  return fetch(`${basePath}/api${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
}

export const PLAN_LABELS: Record<string, string> = {
  free: "Gratuito",
  basic: "Básico",
  pro: "Pro",
  advanced: "Avançado",
};

export const DEFAULT_PLAN_PRICES: Record<string, { price: string; aiLimit: number; maxProjects: number; canCopy: boolean; canDownload: boolean; canPrint: boolean; hasAiAdvisor: boolean }> = {
  basic: { price: "R$49", aiLimit: 5, maxProjects: 3, canCopy: false, canDownload: false, canPrint: false, hasAiAdvisor: false },
  pro: { price: "R$149", aiLimit: 20, maxProjects: 10, canCopy: true, canDownload: true, canPrint: false, hasAiAdvisor: false },
  advanced: { price: "R$349", aiLimit: 999, maxProjects: 999, canCopy: true, canDownload: true, canPrint: true, hasAiAdvisor: true },
};

export const ALL_DELIVERABLES: Array<{ phase: number; phaseName: string; key: string; label: string }> = [
  { phase: 1, phaseName: "IDEIA", key: "LEAN_CANVAS", label: "Lean Canvas" },
  { phase: 1, phaseName: "IDEIA", key: "JTBD", label: "Jobs to Be Done" },
  { phase: 1, phaseName: "IDEIA", key: "ANALISE_COMPETITIVA", label: "Análise Competitiva" },
  { phase: 1, phaseName: "IDEIA", key: "SWOT", label: "Análise SWOT" },
  { phase: 1, phaseName: "IDEIA", key: "DIMENSIONAMENTO_MERCADO", label: "TAM / SAM / SOM" },
  { phase: 1, phaseName: "IDEIA", key: "VALIDACAO_RAPIDA", label: "Script de Validação" },
  { phase: 1, phaseName: "IDEIA", key: "HIPOTESE_CENTRAL", label: "Hipótese Central" },
  { phase: 1, phaseName: "IDEIA", key: "SCORE_POTENCIAL", label: "Score de Potencial" },
  { phase: 2, phaseName: "PRD", key: "PRD", label: "Product Requirements Document" },
  { phase: 2, phaseName: "PRD", key: "PERSONAS", label: "Personas" },
  { phase: 2, phaseName: "PRD", key: "USER_STORIES", label: "User Stories" },
  { phase: 2, phaseName: "PRD", key: "METRICAS_SUCESSO", label: "Framework de Métricas" },
  { phase: 2, phaseName: "PRD", key: "HIPOTESE_PRICING", label: "Estratégia de Pricing" },
  { phase: 2, phaseName: "PRD", key: "BENCHMARKING", label: "Benchmarking" },
  { phase: 2, phaseName: "PRD", key: "ROADMAP_3_MESES", label: "Roadmap 3 Meses" },
  { phase: 3, phaseName: "SEGURANÇA & LGPD", key: "DATA_MAP", label: "Data Map + RAT" },
  { phase: 3, phaseName: "SEGURANÇA & LGPD", key: "CLASSIFICACAO_DADOS", label: "Classificação de Dados" },
  { phase: 3, phaseName: "SEGURANÇA & LGPD", key: "PRIVACY_BY_DESIGN", label: "Privacy by Design" },
  { phase: 3, phaseName: "SEGURANÇA & LGPD", key: "POLITICA_PRIVACIDADE", label: "Política de Privacidade" },
  { phase: 3, phaseName: "SEGURANÇA & LGPD", key: "THREAT_MODEL", label: "Threat Model (STRIDE)" },
  { phase: 3, phaseName: "SEGURANÇA & LGPD", key: "MATRIZ_RBAC", label: "Matriz RBAC" },
  { phase: 3, phaseName: "SEGURANÇA & LGPD", key: "OWASP_CHECKLIST", label: "Checklist OWASP Top 10" },
  { phase: 3, phaseName: "SEGURANÇA & LGPD", key: "PLANO_INCIDENTES", label: "Plano de Resposta a Incidentes" },
  { phase: 4, phaseName: "SPEC", key: "ARQUITETURA", label: "Arquitetura do Sistema" },
  { phase: 4, phaseName: "SPEC", key: "MODELO_DADOS", label: "Modelo de Dados" },
  { phase: 4, phaseName: "SPEC", key: "CONTRATOS_API", label: "Contratos de API" },
  { phase: 4, phaseName: "SPEC", key: "SEGURANCA", label: "Plano de Segurança" },
  { phase: 4, phaseName: "SPEC", key: "FLUXOS_UI", label: "Fluxos de UX" },
  { phase: 4, phaseName: "SPEC", key: "ESCALABILIDADE", label: "Plano de Escalabilidade" },
  { phase: 4, phaseName: "SPEC", key: "ADR", label: "Architecture Decision Records" },
  { phase: 4, phaseName: "SPEC", key: "SETUP_DEVOPS", label: "DevOps & Infra" },
  { phase: 5, phaseName: "IMPLEMENTAÇÃO", key: "MILESTONES", label: "Plano de Milestones" },
  { phase: 5, phaseName: "IMPLEMENTAÇÃO", key: "SPRINT_1", label: "Sprint 1 Detalhado" },
  { phase: 5, phaseName: "IMPLEMENTAÇÃO", key: "ESTRUTURA_PASTAS", label: "Estrutura do Projeto" },
  { phase: 5, phaseName: "IMPLEMENTAÇÃO", key: "README", label: "README Completo" },
  { phase: 5, phaseName: "IMPLEMENTAÇÃO", key: "GUIA_CONTRIBUICAO", label: "CONTRIBUTING.md" },
  { phase: 5, phaseName: "IMPLEMENTAÇÃO", key: "TECH_DEBT_LOG", label: "Log de Débito Técnico" },
  { phase: 5, phaseName: "IMPLEMENTAÇÃO", key: "DEFINITION_OF_DONE", label: "Definition of Done" },
  { phase: 6, phaseName: "TESTE", key: "PLANO_TESTES", label: "Plano de Testes" },
  { phase: 6, phaseName: "TESTE", key: "CASOS_TESTE_CRITICOS", label: "20 Casos de Teste Críticos" },
  { phase: 6, phaseName: "TESTE", key: "CHECKLIST_QA", label: "Checklist de QA" },
  { phase: 6, phaseName: "TESTE", key: "SCRIPT_USER_TEST", label: "Script de Teste com Usuários" },
  { phase: 6, phaseName: "TESTE", key: "RELATORIO_PERFORMANCE", label: "Benchmarks de Performance" },
  { phase: 6, phaseName: "TESTE", key: "BUGS_PREVENCAO", label: "Top 10 Bugs a Prevenir" },
  { phase: 6, phaseName: "TESTE", key: "OBSERVABILIDADE", label: "Plano de Observabilidade" },
  { phase: 7, phaseName: "DEPLOY", key: "RUNBOOK_DEPLOY", label: "Runbook de Deploy" },
  { phase: 7, phaseName: "DEPLOY", key: "GTM", label: "Plano Go-to-Market" },
  { phase: 7, phaseName: "DEPLOY", key: "LAUNCH_CHECKLIST", label: "Launch Checklist" },
  { phase: 7, phaseName: "DEPLOY", key: "METRICAS_POS_LAUNCH", label: "Dashboard Pós-Lançamento" },
  { phase: 7, phaseName: "DEPLOY", key: "PLANO_CRESCIMENTO_90_DIAS", label: "Plano de Crescimento 90 Dias" },
  { phase: 7, phaseName: "DEPLOY", key: "PITCH_INVESTIDORES", label: "Narrativa para Investidores" },
  { phase: 7, phaseName: "DEPLOY", key: "SLA_SUPORTE", label: "SLA & Plano de Suporte" },
];

export interface Stats {
  users: number;
  projects: number;
  trashedProjects: number;
  admins: number;
  superusers: number;
  activeCoupons: number;
  paidUsers: number;
  newUsers30d: number;
  inactiveUsers30d: number;
  inactiveUsers14d: number;
  planBreakdown: Array<{ plan: string; count: number }>;
  signupsPerDay: Array<{ day: string; count: number }>;
  aiPerDay: Array<{ day: string; count: number }>;
}

export interface AuditLogEntry {
  id: number;
  eventType: string;
  actorClerkId: string | null;
  actorName: string | null;
  targetClerkId: string | null;
  targetName: string | null;
  meta: string | null;
  ip: string | null;
  createdAt: string;
}

export interface User {
  id: number;
  clerkId: string;
  displayName: string | null;
  plan: string;
  isAdmin: boolean;
  isSuperuser: boolean;
  stripeSubscriptionStatus: string | null;
  createdAt: string;
}

export interface Coupon {
  id: number;
  code: string;
  discountType: string;
  discountValue: number;
  maxUses: number | null;
  usesCount: number;
  expiresAt: string | null;
  active: boolean;
  appliesTo: string | null;
  description: string | null;
}

export interface Setting {
  id: number;
  key: string;
  value: string;
  label: string | null;
  category: string;
}
