export type ArtifactBadge = {
  state: "ok" | "warn" | "alert";
  label: string;
  tooltip?: string;
};

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

type Deriver = (content: string) => ArtifactBadge | null;

const DERIVERS: Record<string, Deriver> = {
  SELETOR_NICHO_INICIAL: (c) => {
    const d = parseJson<{ recomendacao?: { segmento_escolhido?: string }; segmentos?: unknown[] }>(c);
    const seg = d?.recomendacao?.segmento_escolhido;
    if (seg) return { state: "ok", label: "Segmento escolhido", tooltip: seg };
    if (d?.segmentos?.length) return { state: "warn", label: `${d.segmentos.length} segmentos · sem escolha` };
    return null;
  },
  MATRIZ_COMPETITIVA: (c) => {
    const d = parseJson<{ competidores?: unknown[]; concorrentes?: unknown[] }>(c);
    const n = d?.competidores?.length ?? d?.concorrentes?.length ?? 0;
    if (n >= 3) return { state: "ok", label: `${n} competidores` };
    if (n > 0) return { state: "warn", label: `apenas ${n} competidores` };
    return null;
  },
  SCORE_POTENCIAL: (c) => {
    const d = parseJson<{
      media?: number; pontuacao_media?: number; pontuacao_total?: number;
      desejabilidade?: number; viabilidade?: number; factibilidade?: number; escalabilidade?: number; timing?: number;
      recomendacao?: string;
    }>(c);
    if (!d) return null;
    let avg: number | null = d.media ?? d.pontuacao_media ?? null;
    if (avg == null) {
      const flat = [d.desejabilidade, d.viabilidade, d.factibilidade, d.escalabilidade, d.timing]
        .filter((v): v is number => typeof v === "number");
      if (flat.length >= 3) avg = flat.reduce((a, b) => a + b, 0) / flat.length;
    }
    if (avg == null && typeof d.pontuacao_total === "number") avg = d.pontuacao_total / 5;
    if (avg == null) {
      if (d.recomendacao) return { state: d.recomendacao.includes("AVAN") ? "ok" : "warn", label: d.recomendacao };
      return null;
    }
    const label = `Score ${avg.toFixed(1)}/5`;
    if (avg >= 3.5) return { state: "ok", label };
    if (avg >= 2.5) return { state: "warn", label: `${label} · revisar` };
    return { state: "alert", label: `${label} · risco alto` };
  },
  CARTAO_PERSONA: (c) => {
    const d = parseJson<{ nome?: string; persona?: { nome?: string } }>(c);
    const nome = d?.nome ?? d?.persona?.nome;
    if (nome) return { state: "ok", label: nome, tooltip: "Persona definida" };
    if (c.trim().length > 200) return { state: "ok", label: "Persona definida" };
    return null;
  },
  MAPA_DECISAO_COMPRA: (c) => {
    const d = parseJson<{ unidade_decisao?: unknown[]; papeis?: unknown[]; gatilhos?: unknown[] }>(c);
    const n = d?.unidade_decisao?.length ?? d?.papeis?.length ?? 0;
    if (n > 0) return { state: "ok", label: `${n} papéis na DMU` };
    if (c.trim().length > 300) return { state: "ok", label: "Decisão mapeada" };
    return null;
  },
  VALOR_QUANTIFICADO: (c) => {
    const d = parseJson<{ ganho_liquido?: { tempo_economizado?: string; dinheiro_economizado?: string } }>(c);
    const g = d?.ganho_liquido;
    if (g?.dinheiro_economizado) return { state: "ok", label: g.dinheiro_economizado, tooltip: "Ganho líquido" };
    if (g?.tempo_economizado) return { state: "ok", label: g.tempo_economizado, tooltip: "Tempo economizado" };
    return null;
  },
  HIPOTESE_PRICING: (c) => {
    const d = parseJson<{ tiers?: Array<{ preco_mensal?: number }>; arpu_recomendado?: number }>(c);
    if (!d?.tiers?.length) return null;
    const prices = d.tiers.map((t) => t?.preco_mensal ?? 0).filter((n) => typeof n === "number" && n > 0);
    const arpu = typeof d.arpu_recomendado === "number" && d.arpu_recomendado > 0
      ? d.arpu_recomendado
      : prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    if (arpu <= 0) return { state: "warn", label: `${d.tiers.length} tiers · sem preço` };
    const label = `ARPU R$ ${Math.round(arpu).toLocaleString("pt-BR")}`;
    return { state: "ok", label, tooltip: `${d.tiers.length} tiers definidos` };
  },
  LTV_CAC: (c) => {
    const d = parseJson<{ razao_ltv_cac?: number; veredito?: string; ltv?: number; cac?: number }>(c);
    if (typeof d?.razao_ltv_cac === "number") {
      const r = d.razao_ltv_cac;
      const label = `LTV÷CAC ${r.toFixed(1)}×`;
      if (r >= 3) return { state: "ok", label };
      if (r >= 1) return { state: "warn", label: `${label} · abaixo de 3` };
      return { state: "alert", label: `${label} · insustentável` };
    }
    if (d?.veredito) {
      const v = d.veredito.toUpperCase();
      if (v.includes("SAUDAVEL") || v.includes("SAUDÁVEL")) return { state: "ok", label: "Unit economics saudáveis" };
      return { state: "warn", label: d.veredito };
    }
    return null;
  },
  MATRIZ_RBAC: (c) => {
    const d = parseJson<{ papeis?: unknown[]; recursos?: unknown[] }>(c);
    if (d?.papeis?.length && d?.recursos?.length) {
      return { state: "ok", label: `${d.papeis.length} papéis × ${d.recursos.length} recursos` };
    }
    return null;
  },
  MODELO_DADOS: (c) => {
    const d = parseJson<{ entidades?: unknown[] }>(c);
    const n = d?.entidades?.length ?? 0;
    if (n >= 4) return { state: "ok", label: `${n} entidades` };
    if (n > 0) return { state: "warn", label: `${n} entidades · mín. 4` };
    return null;
  },
  MILESTONES: (c) => {
    const d = parseJson<{ milestones?: unknown[]; duracao_total_estimada?: string }>(c);
    const n = d?.milestones?.length ?? 0;
    if (n >= 5) return { state: "ok", label: `${n} milestones · ${d?.duracao_total_estimada ?? ""}`.trim() };
    if (n > 0) return { state: "warn", label: `${n} milestones · mín. 5` };
    return null;
  },
  CASOS_TESTE_CRITICOS: (c) => {
    const d = parseJson<{ casos?: { prioridade?: string }[] }>(c);
    if (!d?.casos?.length) return null;
    const p0 = d.casos.filter((x) => x.prioridade === "P0").length;
    const label = `${d.casos.length} casos · ${p0} P0`;
    if (p0 >= 1 && d.casos.length >= 15) return { state: "ok", label };
    return { state: "warn", label: `${label} · expandir` };
  },
  METRICAS_POS_LAUNCH: (c) => {
    const d = parseJson<{ north_star?: { nome?: string }; semanas?: unknown[] }>(c);
    if (d?.north_star?.nome && (d.semanas?.length ?? 0) >= 4) {
      return { state: "ok", label: "NSM + 4 semanas" };
    }
    if (d?.semanas?.length) return { state: "warn", label: `${d.semanas.length} semanas` };
    return null;
  },
};

export function deriveArtifactBadge(artifactKey: string, content: string): ArtifactBadge | null {
  if (!content?.trim()) return null;
  const fn = DERIVERS[artifactKey];
  return fn ? fn(content) : null;
}
