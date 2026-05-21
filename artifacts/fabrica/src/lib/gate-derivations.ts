type Artifact = { artifactKey: string; content: string };

export type GateDerivationResult =
  | { state: "pass"; message: string }
  | { state: "warn"; message: string }
  | { state: "unknown" };

function findContent(artifacts: Artifact[], key: string): string {
  return artifacts.find((a) => a.artifactKey === key)?.content?.trim() ?? "";
}

function parseJson<T = Record<string, unknown>>(content: string): T | null {
  if (!content) return null;
  try {
    const m = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (m) return JSON.parse(m[1]) as T;
    const t = content.trim();
    if (t.startsWith("{")) return JSON.parse(t) as T;
  } catch { /* ignore */ }
  return null;
}

type Derivation = (artifacts: Artifact[]) => GateDerivationResult;

const DERIVATIONS: Record<number, Record<number, Derivation>> = {
  // Phase 1
  1: {
    1: (arts) => {
      const sel = parseJson<{ recomendacao?: { segmento_escolhido?: string } }>(findContent(arts, "SELETOR_NICHO_INICIAL"));
      const tam = findContent(arts, "DIMENSIONAMENTO_MERCADO");
      if (sel?.recomendacao?.segmento_escolhido && tam.length > 100) {
        return { state: "pass", message: `Nicho "${sel.recomendacao.segmento_escolhido}" selecionado + TAM detalhado` };
      }
      return { state: "unknown" };
    },
    2: (arts) => {
      const h = findContent(arts, "HIPOTESE_CENTRAL");
      if (h.length > 20) return { state: "pass", message: "Hipótese central preenchida" };
      return { state: "unknown" };
    },
    3: (arts) => {
      const raw = findContent(arts, "SCORE_POTENCIAL");
      const data = parseJson<{
        media?: number; pontuacao_media?: number; pontuacao_total?: number;
        scores?: Record<string, number>;
        desejabilidade?: number; viabilidade?: number; factibilidade?: number; escalabilidade?: number; timing?: number;
        recomendacao?: string;
      }>(raw);
      if (!data) return { state: "unknown" };
      let avg: number | null = data.media ?? data.pontuacao_media ?? null;
      if (avg == null) {
        const flat = [data.desejabilidade, data.viabilidade, data.factibilidade, data.escalabilidade, data.timing]
          .filter((v): v is number => typeof v === "number");
        if (flat.length >= 3) avg = flat.reduce((a, b) => a + b, 0) / flat.length;
      }
      if (avg == null && data.scores) {
        const vals = Object.values(data.scores).filter((v): v is number => typeof v === "number");
        if (vals.length) avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      }
      if (avg == null && typeof data.pontuacao_total === "number") avg = data.pontuacao_total / 5;
      if (avg == null) {
        if (data.recomendacao === "AVANÇAR" || data.recomendacao === "AVANCAR") {
          return { state: "pass", message: "Recomendação AVANÇAR" };
        }
        if (data.recomendacao === "ABANDONAR" || data.recomendacao === "PIVOTAR") {
          return { state: "warn", message: `Recomendação ${data.recomendacao}` };
        }
        return { state: "unknown" };
      }
      if (avg >= 3.5) return { state: "pass", message: `Score médio ${avg.toFixed(1)} ≥ 3.5` };
      return { state: "warn", message: `Score médio ${avg.toFixed(1)} abaixo de 3.5 — revisar ideia` };
    },
  },
  // Phase 2
  2: {
    1: (arts) => {
      const persona = findContent(arts, "CARTAO_PERSONA");
      const dmu = findContent(arts, "MAPA_DECISAO_COMPRA");
      const prd = findContent(arts, "PRD");
      if (persona.length > 100 && dmu.length > 100 && prd.length > 200) {
        return { state: "pass", message: "Persona + decisão de compra + PRD preenchidos" };
      }
      return { state: "unknown" };
    },
    2: (arts) => {
      const data = parseJson<{ ganho_liquido?: { tempo_economizado?: string; dinheiro_economizado?: string } }>(findContent(arts, "VALOR_QUANTIFICADO"));
      const g = data?.ganho_liquido;
      if (g?.tempo_economizado || g?.dinheiro_economizado) {
        return { state: "pass", message: `Ganho quantificado: ${[g.tempo_economizado, g.dinheiro_economizado].filter(Boolean).join(" + ")}` };
      }
      return { state: "unknown" };
    },
    3: (arts) => {
      const data = parseJson<{ razao_ltv_cac?: number; veredito?: string }>(findContent(arts, "LTV_CAC"));
      if (data?.razao_ltv_cac != null) {
        if (data.razao_ltv_cac >= 3) return { state: "pass", message: `LTV÷CAC ${data.razao_ltv_cac.toFixed(1)}× ≥ 3` };
        return { state: "warn", message: `LTV÷CAC ${data.razao_ltv_cac.toFixed(1)}× abaixo de 3 — ver ações sugeridas` };
      }
      if (data?.veredito === "SAUDAVEL") return { state: "pass", message: "Unit economics saudáveis" };
      return { state: "unknown" };
    },
  },
  // Phase 3
  3: {
    1: (arts) => {
      const dm = findContent(arts, "DATA_MAP");
      if (dm.length > 300 && /base legal|art\.|lgpd/i.test(dm)) {
        return { state: "pass", message: "Data Map com base legal LGPD detectada" };
      }
      return { state: "unknown" };
    },
    2: (arts) => {
      const tm = findContent(arts, "THREAT_MODEL");
      if (tm.length > 300 && /STRIDE/i.test(tm)) return { state: "pass", message: "Threat Model STRIDE documentado" };
      return { state: "unknown" };
    },
    3: (arts) => {
      const raw = findContent(arts, "MATRIZ_RBAC");
      const data = parseJson<{
        recursos?: unknown[]; papeis?: ({ permissoes?: unknown[] } | unknown)[];
        recursos_protegidos?: unknown[];
      }>(raw);
      if (data?.recursos?.length && data?.papeis?.length) {
        return { state: "pass", message: `Matriz RBAC: ${data.papeis.length} papéis × ${data.recursos.length} recursos` };
      }
      const legacyPapeis = Array.isArray(data?.papeis) ? data!.papeis as { permissoes?: unknown[] }[] : [];
      const hasLegacyPerms = legacyPapeis.some((p) => Array.isArray(p?.permissoes) && p.permissoes!.length > 0);
      if (hasLegacyPerms || (Array.isArray(data?.recursos_protegidos) && data!.recursos_protegidos!.length)) {
        return { state: "pass", message: `${legacyPapeis.length} papéis com permissões (formato anterior)` };
      }
      if (raw.length > 400 && /papel|papeis|permiss(ao|ões)|RBAC/i.test(raw)) {
        return { state: "pass", message: "Modelo RBAC documentado (texto livre)" };
      }
      return { state: "unknown" };
    },
  },
  // Phase 4
  4: {
    1: (arts) => {
      const data = parseJson<{ entidades?: unknown[] }>(findContent(arts, "MODELO_DADOS"));
      if (data?.entidades?.length && data.entidades.length >= 3) {
        return { state: "pass", message: `${data.entidades.length} entidades modeladas` };
      }
      return { state: "unknown" };
    },
    2: (arts) => {
      const c = findContent(arts, "CONTRATOS_API");
      const endpoints = (c.match(/`?(GET|POST|PUT|PATCH|DELETE)\s+\/[^\s`]+/gi) ?? []).length;
      if (endpoints >= 6) return { state: "pass", message: `${endpoints} endpoints documentados` };
      return { state: "unknown" };
    },
    3: (arts) => {
      const s = findContent(arts, "SEGURANCA");
      if (s.length > 400 && /lgpd/i.test(s)) return { state: "pass", message: "Plano de segurança com LGPD endereçada" };
      return { state: "unknown" };
    },
  },
  // Phase 5
  5: {
    1: (arts) => {
      const data = parseJson<{ milestones?: { features?: unknown[]; criterio_aceitacao?: string }[] }>(findContent(arts, "MILESTONES"));
      if (data?.milestones?.length && data.milestones.length >= 4) {
        return { state: "pass", message: `${data.milestones.length} milestones com critérios` };
      }
      return { state: "unknown" };
    },
    2: (arts) => {
      const r = findContent(arts, "README");
      if (r.length > 500 && /setup|instala|install|pnpm|npm/i.test(r)) {
        return { state: "pass", message: "README com instruções de setup" };
      }
      return { state: "unknown" };
    },
    3: () => ({ state: "unknown" }), // requires runtime check
  },
  // Phase 6
  6: {
    1: (arts) => {
      const data = parseJson<{ casos?: { prioridade?: string }[] }>(findContent(arts, "CASOS_TESTE_CRITICOS"));
      if (data?.casos?.length) {
        const p0 = data.casos.filter((c) => c.prioridade === "P0").length;
        if (p0 > 0) return { state: "pass", message: `${data.casos.length} casos críticos (${p0} P0) catalogados` };
      }
      return { state: "unknown" };
    },
    2: () => ({ state: "unknown" }),
    3: (arts) => {
      const p = findContent(arts, "RELATORIO_PERFORMANCE");
      if (p.length > 300 && /(LCP|FID|CLS|TTFB|INP)/i.test(p)) {
        return { state: "pass", message: "Benchmarks de Core Web Vitals presentes" };
      }
      return { state: "unknown" };
    },
  },
  // Phase 7
  7: {
    1: () => ({ state: "unknown" }),
    2: (arts) => {
      const g = findContent(arts, "GTM");
      if (g.length > 400) return { state: "pass", message: "Plano GTM detalhado" };
      return { state: "unknown" };
    },
    3: (arts) => {
      const r = findContent(arts, "RUNBOOK_DEPLOY");
      if (r.length > 300 && /rollback/i.test(r)) return { state: "pass", message: "Runbook de rollback documentado" };
      return { state: "unknown" };
    },
  },
};

export function deriveGate(phaseNumber: number, gateIndex: number, artifacts: Artifact[]): GateDerivationResult {
  const fn = DERIVATIONS[phaseNumber]?.[gateIndex];
  return fn ? fn(artifacts) : { state: "unknown" };
}
