import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { useUpdateArtifact } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend,
  Tooltip,
} from "recharts";
import { parseJsonBlock, Fallback, Attribution, replaceJsonBlock, clampNonNeg, fmtBRLmes, parseBrlFromStr } from "./shared";

const CHART_SERIES_COLORS = ["hsl(var(--primary))", "#d97706", "#64748b"];

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
  const top3 = segs.slice(0, 3);
  const radarData = criterios.map((c) => {
    const row: Record<string, string | number> = { criterio: c.label };
    for (const s of top3) row[s.nome] = (s as any)[c.key] as number;
    return row;
  });
  return (
    <div className="space-y-4">
      {top3.length > 1 && (
        <div className="rounded-xl border border-border bg-card/50 p-2">
          <ResponsiveContainer width="100%" height={260}>
            <RadarChart data={radarData} outerRadius="70%">
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="criterio" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <PolarRadiusAxis domain={[0, 5]} tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} tickCount={6} />
              {top3.map((s, i) => (
                <Radar
                  key={s.nome}
                  name={s.nome}
                  dataKey={s.nome}
                  stroke={CHART_SERIES_COLORS[i]}
                  fill={CHART_SERIES_COLORS[i]}
                  fillOpacity={0.15}
                  strokeWidth={2}
                />
              ))}
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      )}
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

// ───────────────────────── 4b. VALOR QUANTIFICADO EDITOR (interactive) ─────────────────────────
export type VqNumericData = VqData & {
  situacao_atual?: VqData["situacao_atual"] & { horas_semana?: number; custo_mensal_brl?: number };
  situacao_possivel?: VqData["situacao_possivel"] & { horas_semana?: number; custo_mensal_brl?: number };
  ganho_liquido?: VqData["ganho_liquido"] & { horas_economizadas_semana?: number; dinheiro_economizado_mensal?: number };
};

function parseHoursFromStr(s?: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/(\d)\.(\d{3})(?!\d)/g, "$1$2").replace(",", ".");
  const m = cleaned.match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}
function fmtHorasSemana(n: number): string {
  const r = Math.round(n * 10) / 10;
  return `${r} ${r === 1 ? "hora" : "horas"}/semana`;
}

export function EditableValorQuantificadoCanvas({
  content, projectId, phaseNumber, artifactKey, canEdit, onUpdate,
}: {
  content: string;
  projectId: number;
  phaseNumber: number;
  artifactKey: string;
  canEdit: boolean;
  onUpdate?: () => void;
}) {
  const original = parseJsonBlock<VqNumericData>(content);
  const [editing, setEditing] = useState(false);

  const initialAtualH = original?.situacao_atual?.horas_semana ?? parseHoursFromStr(original?.situacao_atual?.tempo_gasto) ?? 0;
  const initialAtualC = original?.situacao_atual?.custo_mensal_brl ?? parseBrlFromStr(original?.situacao_atual?.custo_financeiro) ?? 0;
  const initialPosH = original?.situacao_possivel?.horas_semana ?? parseHoursFromStr(original?.situacao_possivel?.tempo_gasto) ?? 0;
  const initialPosC = original?.situacao_possivel?.custo_mensal_brl ?? parseBrlFromStr(original?.situacao_possivel?.custo_financeiro) ?? 0;

  const [horasAtual, setHorasAtual] = useState<number>(clampNonNeg(initialAtualH));
  const [custoAtual, setCustoAtual] = useState<number>(clampNonNeg(initialAtualC));
  const [horasPos, setHorasPos] = useState<number>(clampNonNeg(initialPosH));
  const [custoPos, setCustoPos] = useState<number>(clampNonNeg(initialPosC));

  const updateArtifact = useUpdateArtifact();
  const { toast } = useToast();

  const live = useMemo(() => {
    const ganhoHoras = Math.max(0, horasAtual - horasPos);
    const ganhoCusto = Math.max(0, custoAtual - custoPos);
    const ganhoHorasMes = ganhoHoras * 4.33;
    const ganhoPct = custoAtual > 0 ? (ganhoCusto / custoAtual) * 100 : 0;
    return { ganhoHoras, ganhoCusto, ganhoHorasMes, ganhoPct };
  }, [horasAtual, custoAtual, horasPos, custoPos]);

  if (!editing) {
    return (
      <div className="space-y-3">
        <ValorQuantificadoCanvas content={content} />
        {canEdit && (original?.situacao_atual || original?.situacao_possivel) && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} data-testid="button-edit-valor-quantificado">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mr-1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Editar números
            </Button>
          </div>
        )}
      </div>
    );
  }

  function cancel() {
    setHorasAtual(clampNonNeg(initialAtualH));
    setCustoAtual(clampNonNeg(initialAtualC));
    setHorasPos(clampNonNeg(initialPosH));
    setCustoPos(clampNonNeg(initialPosC));
    setEditing(false);
  }

  function save() {
    const hA = clampNonNeg(horasAtual);
    const cA = clampNonNeg(custoAtual);
    const hP = clampNonNeg(horasPos);
    const cP = clampNonNeg(custoPos);
    const ganhoHoras = Math.max(0, hA - hP);
    const ganhoCusto = Math.max(0, cA - cP);

    const next: VqNumericData = {
      ...original,
      situacao_atual: {
        ...original?.situacao_atual,
        horas_semana: hA,
        custo_mensal_brl: cA,
        tempo_gasto: fmtHorasSemana(hA),
        custo_financeiro: fmtBRLmes(cA),
      },
      situacao_possivel: {
        ...original?.situacao_possivel,
        horas_semana: hP,
        custo_mensal_brl: cP,
        tempo_gasto: fmtHorasSemana(hP),
        custo_financeiro: fmtBRLmes(cP),
      },
      ganho_liquido: {
        ...original?.ganho_liquido,
        horas_economizadas_semana: ganhoHoras,
        dinheiro_economizado_mensal: ganhoCusto,
        tempo_economizado: fmtHorasSemana(ganhoHoras),
        dinheiro_economizado: fmtBRLmes(ganhoCusto),
      },
    };
    const newContent = replaceJsonBlock(content, next as object);
    updateArtifact.mutate(
      { projectId, phaseNumber, artifactKey, data: { content: newContent, contentJson: null } },
      {
        onSuccess: () => {
          toast({
            title: "Valor atualizado",
            description: `Economia: ${fmtBRLmes(ganhoCusto)} · ${fmtHorasSemana(ganhoHoras)}`,
          });
          setEditing(false);
          onUpdate?.();
        },
        onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
      }
    );
  }

  const NumInput = ({ value, onChange, suffix, testId }: { value: number; onChange: (n: number) => void; suffix: string; testId: string }) => (
    <div className="flex items-center gap-1.5">
      <input
        type="number"
        min={0}
        step="any"
        inputMode="decimal"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        data-testid={testId}
        className="w-24 px-2 py-1 rounded-md border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
      />
      <span className="text-[10px] text-muted-foreground whitespace-nowrap">{suffix}</span>
    </div>
  );

  const vereditoCor = live.ganhoPct >= 50
    ? { bg: "bg-green-50 dark:bg-green-950/20", border: "border-green-300 dark:border-green-900/50", text: "text-green-700 dark:text-green-400", label: "Valor forte — vale comunicar" }
    : live.ganhoPct >= 20
    ? { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-300 dark:border-amber-900/50", text: "text-amber-700 dark:text-amber-400", label: "Valor médio — refine o pitch" }
    : { bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-300 dark:border-red-900/50", text: "text-red-700 dark:text-red-400", label: "Valor fraco — cliente não vai pagar" };

  return (
    <div className="space-y-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Editor de valor · ganho recalculado ao vivo</div>
        <div className="text-[10px] text-muted-foreground">Use os números reais do seu cliente</div>
      </div>
      <div className="grid md:grid-cols-2 gap-3">
        <div className="rounded-lg border border-border bg-background p-3 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Situação atual (sem você)</div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground">Tempo gasto</span>
            <NumInput value={horasAtual} onChange={setHorasAtual} suffix="horas/semana" testId="input-horas-atual" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground">Custo financeiro</span>
            <NumInput value={custoAtual} onChange={setCustoAtual} suffix="R$/mês" testId="input-custo-atual" />
          </div>
        </div>
        <div className="rounded-lg border border-primary/40 bg-primary/5 p-3 space-y-2">
          <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Situação possível (com você)</div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground">Tempo gasto</span>
            <NumInput value={horasPos} onChange={setHorasPos} suffix="horas/semana" testId="input-horas-possivel" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-foreground">Custo financeiro</span>
            <NumInput value={custoPos} onChange={setCustoPos} suffix="R$/mês" testId="input-custo-possivel" />
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-3 pt-3 border-t border-border/40">
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Tempo economizado</div>
          <div className="text-2xl font-bold text-primary">{live.ganhoHoras.toFixed(1)}<span className="text-sm text-muted-foreground"> h/sem</span></div>
          <div className="text-[10px] text-muted-foreground">≈ {live.ganhoHorasMes.toFixed(0)} h/mês</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Dinheiro economizado</div>
          <div className="text-2xl font-bold text-primary">{fmtBRLmes(live.ganhoCusto)}</div>
          <div className="text-[10px] text-muted-foreground">{custoAtual > 0 ? `${live.ganhoPct.toFixed(0)}% do gasto atual` : "—"}</div>
        </div>
        <div className={`rounded-lg border-2 px-3 py-2 ${vereditoCor.bg} ${vereditoCor.border} flex flex-col justify-center`}>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Veredito</div>
          <div className={`text-xs font-bold leading-tight ${vereditoCor.text}`}>{vereditoCor.label}</div>
        </div>
      </div>

      <div className="text-xs text-muted-foreground">
        {live.ganhoCusto > 0 && custoAtual > 0
          ? `Esse é o número que o cliente repete em voz alta: "${fmtBRLmes(live.ganhoCusto)} de economia". Use no pitch.`
          : "Sem economia mensurável — revise os números ou o ganho está no qualitativo (preencha no JSON original)."}
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-border/40">
        <Button variant="outline" size="sm" onClick={cancel} disabled={updateArtifact.isPending}>Cancelar</Button>
        <Button size="sm" onClick={save} disabled={updateArtifact.isPending} data-testid="button-save-valor-quantificado">
          {updateArtifact.isPending ? "Salvando…" : "Salvar valor"}
        </Button>
      </div>
    </div>
  );
}
