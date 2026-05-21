import { ArtifactBody } from "./artifact-body";

function parseJsonBlock<T = Record<string, unknown>>(content: string): T | null {
  try {
    const jsonMatch = content.match(/```(?:json)?\s*(\{[\s\S]*?\})\s*```/);
    if (jsonMatch) return JSON.parse(jsonMatch[1]) as T;
    const t = content.trim();
    if (t.startsWith("{")) return JSON.parse(t) as T;
  } catch { /* fall through */ }
  return null;
}

function Fallback({ content }: { content: string }) {
  return <ArtifactBody content={content} />;
}

function Attribution({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] text-muted-foreground mt-4 pt-3 border-t border-border/60 italic">
      {children}
    </p>
  );
}

// ───────────────────────── 1. Seletor de Nicho Inicial ─────────────────────────
type SeletorData = {
  segmentos?: Array<{
    nome: string;
    tamanho: number; intensidade_dor: number; alcance_canal: number;
    capacidade_pagar: number; sinergia_produto: number; urgencia: number;
    total?: number; justificativa?: string;
  }>;
  recomendacao?: { segmento_escolhido?: string; justificativa?: string; primeiros_passos?: string[] };
};

export function SeletorNichoCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<SeletorData>(content);
  if (!data?.segmentos?.length) return <Fallback content={content} />;
  const segs = [...data.segmentos]
    .map((s) => ({ ...s, total: s.total ?? (s.tamanho + s.intensidade_dor + s.alcance_canal + s.capacidade_pagar + s.sinergia_produto + s.urgencia) }))
    .sort((a, b) => (b.total ?? 0) - (a.total ?? 0));
  const max = Math.max(...segs.map((s) => s.total ?? 0));
  const criterios = [
    { key: "tamanho", label: "Tamanho" },
    { key: "intensidade_dor", label: "Dor" },
    { key: "alcance_canal", label: "Alcance" },
    { key: "capacidade_pagar", label: "Pagar" },
    { key: "sinergia_produto", label: "Sinergia" },
    { key: "urgencia", label: "Urgência" },
  ] as const;
  return (
    <div className="space-y-4">
      <div className="overflow-x-auto -mx-1">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground border-b border-border">
              <th className="text-left px-2 py-2 w-8">#</th>
              <th className="text-left px-2 py-2">Segmento candidato</th>
              {criterios.map((c) => <th key={c.key} className="text-center px-1 py-2 w-12">{c.label}</th>)}
              <th className="text-center px-2 py-2 w-14">Total</th>
            </tr>
          </thead>
          <tbody>
            {segs.map((s, i) => {
              const isTop = i === 0;
              return (
                <tr key={s.nome} className={`border-b border-border/40 ${isTop ? "bg-primary/5" : ""}`}>
                  <td className="px-2 py-2 text-muted-foreground">{i + 1}</td>
                  <td className="px-2 py-2">
                    <div className={isTop ? "font-semibold text-primary" : "font-medium text-foreground"}>{s.nome}</div>
                    {s.justificativa && <div className="text-xs text-muted-foreground mt-0.5">{s.justificativa}</div>}
                  </td>
                  {criterios.map((c) => {
                    const v = (s as any)[c.key] as number;
                    return (
                      <td key={c.key} className="text-center px-1 py-2">
                        <span className={`inline-block w-7 h-7 leading-7 rounded-full text-xs font-medium ${v >= 4 ? "bg-primary/15 text-primary" : v >= 3 ? "bg-muted text-foreground" : "bg-muted/40 text-muted-foreground"}`}>{v}</span>
                      </td>
                    );
                  })}
                  <td className="text-center px-2 py-2">
                    <div className={`font-bold text-base ${isTop ? "text-primary" : "text-foreground"}`}>{s.total}</div>
                    <div className="h-1 mt-1 rounded-full bg-muted overflow-hidden">
                      <div className="h-full bg-primary transition-all" style={{ width: `${((s.total ?? 0) / max) * 100}%` }} />
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {data.recomendacao?.segmento_escolhido && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">Recomendação</div>
          <div className="font-semibold text-foreground">{data.recomendacao.segmento_escolhido}</div>
          {data.recomendacao.justificativa && <p className="text-sm text-foreground/80 mt-1">{data.recomendacao.justificativa}</p>}
          {!!data.recomendacao.primeiros_passos?.length && (
            <ol className="mt-3 space-y-1.5">
              {data.recomendacao.primeiros_passos.map((p, i) => (
                <li key={i} className="text-sm text-foreground flex gap-2">
                  <span className="text-primary font-mono text-xs flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                  <span>{p}</span>
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
      <Attribution>Inspirado em conceito de "mercado de entrada" — Moore, <i>Crossing the Chasm</i> (1991). Critérios e fórmula próprios do Método FoundersFlow.</Attribution>
    </div>
  );
}

// ───────────────────────── 2. Cartão de Persona ─────────────────────────
type PersonaData = {
  nome_ficticio?: string; cargo_papel?: string;
  contexto?: { empresa_segmento?: string; porte?: string; localizacao?: string };
  demografia?: { idade?: number; renda_aproximada?: string; formacao?: string };
  dia_tipico?: string[]; prioridades_top3?: string[]; dores_top3?: string[];
  objetivos_top3?: string[]; gatilhos_de_compra?: string[]; objecoes_provaveis?: string[];
  fontes_informacao?: string[]; watering_holes?: string[]; ferramentas_atuais?: string[];
  citacao_representativa?: string; disposicao_pagar?: string;
};

export function CartaoPersonaCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<PersonaData>(content);
  if (!data?.nome_ficticio) return <Fallback content={content} />;
  const List = ({ title, items }: { title: string; items?: string[] }) =>
    items?.length ? (
      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1.5">{title}</div>
        <ul className="space-y-1">
          {items.map((it, i) => <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-primary flex-shrink-0">•</span><span>{it}</span></li>)}
        </ul>
      </div>
    ) : null;
  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-4">
        <div className="flex items-baseline gap-3 flex-wrap">
          <div className="text-xl font-serif font-medium text-foreground">{data.nome_ficticio}</div>
          {data.cargo_papel && <div className="text-sm text-muted-foreground">{data.cargo_papel}</div>}
        </div>
        {data.contexto && (
          <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
            {data.contexto.empresa_segmento && <span>📍 {data.contexto.empresa_segmento}</span>}
            {data.contexto.porte && <span>👥 {data.contexto.porte}</span>}
            {data.contexto.localizacao && <span>🗺 {data.contexto.localizacao}</span>}
          </div>
        )}
        {data.citacao_representativa && (
          <blockquote className="mt-3 pl-3 border-l-2 border-primary text-sm italic text-foreground/80">
            "{data.citacao_representativa}"
          </blockquote>
        )}
      </div>
      <div className="grid md:grid-cols-2 gap-4">
        <List title="Prioridades top 3" items={data.prioridades_top3} />
        <List title="Dores top 3" items={data.dores_top3} />
        <List title="Objetivos 12 meses" items={data.objetivos_top3} />
        <List title="Gatilhos de compra" items={data.gatilhos_de_compra} />
        <List title="Objeções prováveis" items={data.objecoes_provaveis} />
        <List title="Ferramentas atuais" items={data.ferramentas_atuais} />
        <List title="Fontes de informação" items={data.fontes_informacao} />
        <List title="Onde encontrar (watering holes)" items={data.watering_holes} />
        <List title="Dia típico" items={data.dia_tipico} />
      </div>
      {data.disposicao_pagar && (
        <div className="rounded-lg border border-border bg-card p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-0.5">Disposição a pagar</div>
          <div className="text-sm text-foreground">{data.disposicao_pagar}</div>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── 3. Mapa de Decisão de Compra ─────────────────────────
type DmuData = {
  contexto_compra?: string;
  papeis?: {
    usuario_final?: { quem?: string; interesse?: string; influencia?: string };
    campeao_interno?: { quem?: string; como_engajar?: string };
    comprador_economico?: { quem?: string; criterio_decisao?: string };
    influenciadores?: Array<{ quem: string; tipo?: string; papel?: string }>;
    veto?: { quem?: string; como_neutralizar?: string };
  };
  estrategia_por_papel?: string[];
  ciclo_venda_estimado?: string;
  principais_riscos?: string[];
};

export function MapaDecisaoCompraCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<DmuData>(content);
  if (!data?.papeis) return <Fallback content={content} />;
  const p = data.papeis;
  const RoleCard = ({ label, who, detail, tone = "default" }: { label: string; who?: string; detail?: string; tone?: "default" | "primary" | "danger" }) => {
    if (!who) return null;
    const tones = {
      default: "border-border bg-card",
      primary: "border-primary/30 bg-primary/5",
      danger: "border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20",
    };
    return (
      <div className={`rounded-lg border p-3 ${tones[tone]}`}>
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">{label}</div>
        <div className="text-sm font-semibold text-foreground">{who}</div>
        {detail && <div className="text-xs text-foreground/70 mt-1">{detail}</div>}
      </div>
    );
  };
  return (
    <div className="space-y-4">
      {data.contexto_compra && (
        <div className="text-sm text-muted-foreground border-l-2 border-primary/40 pl-3">{data.contexto_compra}</div>
      )}
      <div className="grid md:grid-cols-2 gap-3">
        <RoleCard label="Usuário final" who={p.usuario_final?.quem} detail={p.usuario_final?.interesse} />
        <RoleCard label="Campeão interno" who={p.campeao_interno?.quem} detail={p.campeao_interno?.como_engajar} tone="primary" />
        <RoleCard label="Comprador econômico (assina o cheque)" who={p.comprador_economico?.quem} detail={p.comprador_economico?.criterio_decisao} tone="primary" />
        <RoleCard label="Quem pode vetar" who={p.veto?.quem} detail={p.veto?.como_neutralizar} tone="danger" />
      </div>
      {!!p.influenciadores?.length && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Influenciadores</div>
          <div className="grid md:grid-cols-3 gap-2">
            {p.influenciadores.map((inf, i) => (
              <div key={i} className="rounded-lg border border-border bg-muted/30 p-3">
                <div className="text-sm font-medium text-foreground">{inf.quem}</div>
                {inf.tipo && <div className="text-[10px] font-mono uppercase text-primary mt-0.5">{inf.tipo}</div>}
                {inf.papel && <div className="text-xs text-foreground/70 mt-1">{inf.papel}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
      {!!data.estrategia_por_papel?.length && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1.5">Estratégia por papel</div>
          <ul className="space-y-1">
            {data.estrategia_por_papel.map((s, i) => <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-primary">→</span><span>{s}</span></li>)}
          </ul>
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        {data.ciclo_venda_estimado && (
          <div className="rounded-lg border border-border bg-card px-3 py-2 text-sm">
            <span className="text-muted-foreground">Ciclo de venda: </span>
            <span className="font-medium text-foreground">{data.ciclo_venda_estimado}</span>
          </div>
        )}
      </div>
      {!!data.principais_riscos?.length && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-amber-700 dark:text-amber-400 mb-1.5">Riscos do processo de compra</div>
          <ul className="space-y-1">
            {data.principais_riscos.map((r, i) => <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-amber-600">⚠</span><span>{r}</span></li>)}
          </ul>
        </div>
      )}
      <Attribution>Conceito de comitê de decisão de compra — Webster & Wind (1972). Naming e estrutura próprios do Método FoundersFlow.</Attribution>
    </div>
  );
}

// ───────────────────────── 4. Valor Quantificado ─────────────────────────
type VqData = {
  situacao_atual?: { descricao?: string; tempo_gasto?: string; custo_financeiro?: string; custos_ocultos?: string[] };
  situacao_possivel?: { descricao?: string; tempo_gasto?: string; custo_financeiro?: string; novos_ganhos?: string[] };
  ganho_liquido?: { tempo_economizado?: string; dinheiro_economizado?: string; ganho_qualitativo?: string };
  payback_estimado?: string;
  premissas?: string[];
};

export function ValorQuantificadoCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<VqData>(content);
  if (!data?.situacao_atual && !data?.situacao_possivel) return <Fallback content={content} />;
  const Col = ({ title, data: d, tone }: { title: string; data?: VqData["situacao_atual"]; tone: "muted" | "primary" }) => (
    <div className={`rounded-xl border p-4 ${tone === "primary" ? "border-primary/30 bg-primary/5" : "border-border bg-muted/30"}`}>
      <div className={`text-[10px] font-mono uppercase tracking-wider mb-2 ${tone === "primary" ? "text-primary" : "text-muted-foreground"}`}>{title}</div>
      {d?.descricao && <p className="text-sm text-foreground/90 mb-3">{d.descricao}</p>}
      <div className="space-y-1.5 text-sm">
        {d?.tempo_gasto && <div className="flex justify-between"><span className="text-muted-foreground">Tempo</span><span className="font-medium text-foreground">{d.tempo_gasto}</span></div>}
        {d?.custo_financeiro && <div className="flex justify-between"><span className="text-muted-foreground">Custo</span><span className="font-medium text-foreground">{d.custo_financeiro}</span></div>}
      </div>
      {!!(d as any)?.custos_ocultos?.length && (
        <ul className="mt-3 space-y-1 text-xs text-foreground/70">
          {(d as any).custos_ocultos.map((c: string, i: number) => <li key={i}>• {c}</li>)}
        </ul>
      )}
      {!!(d as any)?.novos_ganhos?.length && (
        <ul className="mt-3 space-y-1 text-xs text-foreground/80">
          {(d as any).novos_ganhos.map((c: string, i: number) => <li key={i} className="flex gap-1.5"><span className="text-primary">+</span>{c}</li>)}
        </ul>
      )}
    </div>
  );
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-[1fr_auto_1fr] gap-3 items-stretch">
        <Col title="Situação atual" data={data.situacao_atual} tone="muted" />
        <div className="flex items-center justify-center text-3xl text-primary/40 font-light px-2">→</div>
        <Col title="Situação possível" data={data.situacao_possivel} tone="primary" />
      </div>
      {data.ganho_liquido && (
        <div className="rounded-xl border border-primary/40 bg-gradient-to-br from-primary/10 to-transparent p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-2">Ganho líquido</div>
          <div className="grid md:grid-cols-3 gap-4">
            {data.ganho_liquido.tempo_economizado && (
              <div>
                <div className="text-xs text-muted-foreground">Tempo economizado</div>
                <div className="text-lg font-bold text-primary">{data.ganho_liquido.tempo_economizado}</div>
              </div>
            )}
            {data.ganho_liquido.dinheiro_economizado && (
              <div>
                <div className="text-xs text-muted-foreground">Dinheiro economizado</div>
                <div className="text-lg font-bold text-primary">{data.ganho_liquido.dinheiro_economizado}</div>
              </div>
            )}
            {data.ganho_liquido.ganho_qualitativo && (
              <div>
                <div className="text-xs text-muted-foreground">Ganho qualitativo</div>
                <div className="text-sm text-foreground/90 mt-0.5">{data.ganho_liquido.ganho_qualitativo}</div>
              </div>
            )}
          </div>
          {data.payback_estimado && (
            <div className="mt-3 pt-3 border-t border-primary/20 text-sm">
              <span className="text-muted-foreground">Payback: </span>
              <span className="font-semibold text-foreground">{data.payback_estimado}</span>
            </div>
          )}
        </div>
      )}
      {!!data.premissas?.length && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Premissas</div>
          <ul className="space-y-1">
            {data.premissas.map((p, i) => <li key={i} className="text-xs text-muted-foreground flex gap-2"><span>·</span><span>{p}</span></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── 5. LTV ÷ CAC ─────────────────────────
type LtvCacData = {
  premissas?: { ticket_medio_mensal?: number; margem_bruta_pct?: number; churn_mensal_pct?: number; tempo_vida_estimado_meses?: number };
  ltv?: { valor_calculado?: number; formula?: string; explicacao?: string };
  cac?: { valor_calculado?: number; canais?: Array<{ canal: string; custo_estimado_lead: number; taxa_conversao_pct: number; cac_canal: number }>; explicacao?: string };
  razao_ltv_cac?: number;
  payback_meses?: number;
  veredito?: "SAUDAVEL" | "AJUSTAR" | "INVIAVEL" | string;
  interpretacao?: string;
  acoes_recomendadas?: string[];
};

function formatBRL(n?: number) {
  if (n == null) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL", maximumFractionDigits: 0 });
}

export function LtvCacCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<LtvCacData>(content);
  if (!data?.ltv && !data?.cac) return <Fallback content={content} />;
  const vMap = {
    SAUDAVEL: { bg: "bg-green-50 dark:bg-green-950/20", border: "border-green-300 dark:border-green-900/50", text: "text-green-700 dark:text-green-400", label: "SAUDÁVEL" },
    AJUSTAR: { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-300 dark:border-amber-900/50", text: "text-amber-700 dark:text-amber-400", label: "AJUSTAR" },
    INVIAVEL: { bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-300 dark:border-red-900/50", text: "text-red-700 dark:text-red-400", label: "INVIÁVEL" },
  } as const;
  const v = (data.veredito && vMap[data.veredito as keyof typeof vMap]) || vMap.AJUSTAR;
  return (
    <div className="space-y-4">
      {data.premissas && (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Premissas</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div><div className="text-xs text-muted-foreground">Ticket/mês</div><div className="font-semibold text-foreground">{formatBRL(data.premissas.ticket_medio_mensal)}</div></div>
            <div><div className="text-xs text-muted-foreground">Margem bruta</div><div className="font-semibold text-foreground">{data.premissas.margem_bruta_pct ?? "—"}%</div></div>
            <div><div className="text-xs text-muted-foreground">Churn/mês</div><div className="font-semibold text-foreground">{data.premissas.churn_mensal_pct ?? "—"}%</div></div>
            <div><div className="text-xs text-muted-foreground">Vida estimada</div><div className="font-semibold text-foreground">{data.premissas.tempo_vida_estimado_meses ?? "—"} m</div></div>
          </div>
        </div>
      )}
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">LTV — Valor do cliente</div>
          <div className="text-3xl font-bold text-primary">{formatBRL(data.ltv?.valor_calculado)}</div>
          {data.ltv?.formula && <div className="text-xs text-muted-foreground mt-1 font-mono">{data.ltv.formula}</div>}
          {data.ltv?.explicacao && <p className="text-xs text-foreground/70 mt-2">{data.ltv.explicacao}</p>}
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">CAC — Custo de aquisição</div>
          <div className="text-3xl font-bold text-foreground">{formatBRL(data.cac?.valor_calculado)}</div>
          {data.cac?.explicacao && <p className="text-xs text-foreground/70 mt-2">{data.cac.explicacao}</p>}
        </div>
      </div>
      {!!data.cac?.canais?.length && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">CAC por canal</div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-[10px] font-mono uppercase text-muted-foreground border-b border-border">
                  <th className="text-left px-2 py-1.5">Canal</th>
                  <th className="text-right px-2 py-1.5">Custo/lead</th>
                  <th className="text-right px-2 py-1.5">Conv.</th>
                  <th className="text-right px-2 py-1.5">CAC</th>
                </tr>
              </thead>
              <tbody>
                {data.cac.canais.map((c) => (
                  <tr key={c.canal} className="border-b border-border/40">
                    <td className="px-2 py-2 text-foreground">{c.canal}</td>
                    <td className="px-2 py-2 text-right text-foreground">{formatBRL(c.custo_estimado_lead)}</td>
                    <td className="px-2 py-2 text-right text-foreground">{c.taxa_conversao_pct}%</td>
                    <td className="px-2 py-2 text-right font-medium text-foreground">{formatBRL(c.cac_canal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <div className={`rounded-xl border-2 p-4 ${v.bg} ${v.border}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Razão LTV ÷ CAC</div>
            <div className={`text-4xl font-bold ${v.text}`}>{data.razao_ltv_cac?.toFixed(1) ?? "—"}×</div>
          </div>
          <div className="text-right">
            <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold border-2 ${v.border} ${v.text} ${v.bg}`}>{v.label}</div>
            {data.payback_meses != null && <div className="text-xs text-muted-foreground mt-2">Payback: <span className="font-medium text-foreground">{data.payback_meses} meses</span></div>}
          </div>
        </div>
        {data.interpretacao && <p className="text-sm text-foreground/80 mt-3 pt-3 border-t border-border/40">{data.interpretacao}</p>}
      </div>
      {!!data.acoes_recomendadas?.length && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1.5">Ações recomendadas</div>
          <ol className="space-y-1.5">
            {data.acoes_recomendadas.map((a, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-primary font-mono text-xs flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span>{a}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

// ───────────────────────── 6. Matriz Competitiva 2×2 ─────────────────────────
type MatrizData = {
  eixo_x?: { label?: string; min_label?: string; max_label?: string };
  eixo_y?: { label?: string; min_label?: string; max_label?: string };
  concorrentes?: Array<{ nome: string; x: number; y: number; observacao?: string }>;
  nossa_posicao?: { x: number; y: number; justificativa?: string };
  quadrante_alvo?: string;
  vacuo_identificado?: string;
};

export function MatrizCompetitivaCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<MatrizData>(content);
  if (!data?.eixo_x || !data?.eixo_y || !data?.concorrentes?.length) return <Fallback content={content} />;
  const clamp = (n: number) => Math.max(0, Math.min(5, n));
  const pct = (n: number) => `${(clamp(n) / 5) * 100}%`;
  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-[1fr_300px] gap-4 items-start">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Eixo Y:</span>
            <span className="text-sm font-medium text-foreground">{data.eixo_y.label}</span>
          </div>
          <div className="relative w-full aspect-square max-w-md mx-auto border-2 border-border rounded-lg bg-gradient-to-tr from-muted/30 to-card">
            {/* Quadrant lines */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute left-1/2 top-0 bottom-0 w-px bg-border" />
              <div className="absolute top-1/2 left-0 right-0 h-px bg-border" />
            </div>
            {/* Axis labels */}
            <div className="absolute -bottom-6 left-0 text-[10px] font-mono uppercase text-muted-foreground">{data.eixo_x.min_label}</div>
            <div className="absolute -bottom-6 right-0 text-[10px] font-mono uppercase text-muted-foreground">{data.eixo_x.max_label}</div>
            <div className="absolute -left-2 -translate-x-full top-0 text-[10px] font-mono uppercase text-muted-foreground whitespace-nowrap">{data.eixo_y.max_label}</div>
            <div className="absolute -left-2 -translate-x-full bottom-0 text-[10px] font-mono uppercase text-muted-foreground whitespace-nowrap">{data.eixo_y.min_label}</div>
            {/* Competitors */}
            {data.concorrentes.map((c, i) => (
              <div
                key={i}
                className="absolute -translate-x-1/2 -translate-y-1/2 group"
                style={{ left: pct(c.x), bottom: pct(c.y) }}
              >
                <div className="w-3 h-3 rounded-full bg-muted-foreground border-2 border-card shadow" />
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[11px] text-foreground bg-card/90 backdrop-blur px-1.5 py-0.5 rounded border border-border whitespace-nowrap">
                  {c.nome}
                </div>
              </div>
            ))}
            {/* Our position */}
            {data.nossa_posicao && (
              <div className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: pct(data.nossa_posicao.x), bottom: pct(data.nossa_posicao.y) }}>
                <div className="w-5 h-5 rounded-full bg-primary border-2 border-card shadow-lg animate-pulse" />
                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded border border-primary/40 whitespace-nowrap">
                  Nós
                </div>
              </div>
            )}
          </div>
          <div className="flex justify-center mt-8 text-xs text-muted-foreground">
            <span className="font-medium">Eixo X: {data.eixo_x.label}</span>
          </div>
        </div>
        <div className="space-y-3">
          {!!data.concorrentes.length && (
            <div>
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Concorrentes</div>
              <ul className="space-y-1.5">
                {data.concorrentes.map((c, i) => (
                  <li key={i} className="text-xs">
                    <div className="font-medium text-foreground">{c.nome}</div>
                    {c.observacao && <div className="text-muted-foreground">{c.observacao}</div>}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
      {(data.nossa_posicao?.justificativa || data.quadrante_alvo || data.vacuo_identificado) && (
        <div className="grid md:grid-cols-2 gap-3">
          {data.nossa_posicao?.justificativa && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">Nossa posição</div>
              <p className="text-sm text-foreground">{data.nossa_posicao.justificativa}</p>
            </div>
          )}
          {data.vacuo_identificado && (
            <div className="rounded-lg border border-border bg-muted/30 p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Vácuo identificado</div>
              <p className="text-sm text-foreground">{data.vacuo_identificado}</p>
            </div>
          )}
        </div>
      )}
      <Attribution>Matriz de posicionamento competitivo — conceito clássico (Porter, anos 80). Escolha de eixos e estrutura próprias.</Attribution>
    </div>
  );
}
