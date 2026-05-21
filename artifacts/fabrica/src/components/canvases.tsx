import { useState, useMemo } from "react";
import { ArtifactBody } from "./artifact-body";
import { Button } from "@/components/ui/button";
import { useUpdateArtifact } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

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

// ───────────────────────── 4b. VALOR QUANTIFICADO EDITOR (interactive) ─────────────────────────
type VqNumericData = VqData & {
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
function parseBrlFromStr(s?: string): number | null {
  if (!s) return null;
  const cleaned = s.replace(/r\$/gi, "").replace(/\./g, "").replace(",", ".").trim();
  const m = cleaned.match(/(\d+(?:\.\d+)?)/);
  return m ? Number(m[1]) : null;
}
function fmtBRLmes(n: number): string {
  return `R$ ${Math.round(n).toLocaleString("pt-BR")}/mês`;
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

// ───────────────────────── Cross-editor sync helpers ─────────────────────────
export type SiblingArtifact = { artifactKey: string; content: string };

function findSibling(siblings: SiblingArtifact[] | undefined, key: string): SiblingArtifact | undefined {
  return siblings?.find((s) => s.artifactKey === key && !!s.content?.trim());
}

function toPosNum(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  return Number.isFinite(n) && n > 0 ? n : null;
}

export function getArpuFromPricing(siblings?: SiblingArtifact[]): number | null {
  const sib = findSibling(siblings, "HIPOTESE_PRICING");
  if (!sib) return null;
  const d = parseJsonBlock<PricingData>(sib.content);
  if (!d?.tiers?.length) return null;
  const arpu = toPosNum(d.arpu_recomendado);
  if (arpu != null) return Math.round(arpu);
  const mid = toPosNum(d.tiers[1]?.preco_mensal);
  if (mid != null) return Math.round(mid);
  const prices = d.tiers.map((t) => toPosNum(t?.preco_mensal)).filter((n): n is number => n != null);
  if (!prices.length) return null;
  return Math.round(prices.reduce((a, b) => a + b, 0) / prices.length);
}

export function getCeilingFromValor(siblings?: SiblingArtifact[]): number | null {
  const sib = findSibling(siblings, "VALOR_QUANTIFICADO");
  if (!sib) return null;
  const d = parseJsonBlock<VqNumericData>(sib.content);
  if (!d) return null;
  let economia = d.ganho_liquido?.dinheiro_economizado_mensal;
  if (typeof economia !== "number" || economia <= 0) {
    economia = parseBrlFromStr(d.ganho_liquido?.dinheiro_economizado) ?? undefined;
  }
  if (typeof economia !== "number" || economia <= 0) return null;
  return Math.max(1, Math.round(economia * 0.1));
}

function SyncChip({ label, onClick, testId }: { label: string; onClick: () => void; testId: string }) {
  return (
    <button
      type="button"
      onClick={onClick}
      data-testid={testId}
      className="inline-flex items-center gap-1 text-[10px] font-mono px-2 py-0.5 rounded-full border border-primary/40 bg-primary/5 text-primary hover:bg-primary/10 transition-colors"
      title="Puxar valor do artefato relacionado"
    >
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3 h-3"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
      {label}
    </button>
  );
}

// ───────────────────────── 4c. HIPÓTESE PRICING (read + editor) ─────────────────────────
type PricingTier = { nome?: string; preco_mensal?: number; publico?: string; features?: string[] };
type PricingData = {
  modelo?: string;
  moeda?: string;
  tiers?: PricingTier[];
  perguntas_chave?: { valor_capturado?: string; alternativa_atual?: string; sensibilidade?: string };
  go_to_market?: string;
  comparacao_concorrentes?: string;
  arpu_recomendado?: number;
};

export function HipotesePricingCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<PricingData>(content);
  if (!data?.tiers?.length) return <Fallback content={content} />;
  const prices = data.tiers.map((t) => t.preco_mensal ?? 0).filter((n) => n > 0);
  const arpu = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
  return (
    <div className="space-y-4">
      {data.modelo && (
        <div className="text-xs text-muted-foreground">
          <span className="font-mono uppercase tracking-wider text-primary">Modelo:</span> {data.modelo}
        </div>
      )}
      <div className="grid md:grid-cols-3 gap-3">
        {data.tiers.map((t, i) => (
          <div key={i} className={`rounded-xl border p-4 ${i === 1 ? "border-primary/40 bg-primary/5" : "border-border bg-background"}`}>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Tier {i + 1}</div>
            <div className="text-base font-semibold text-foreground mt-0.5">{t.nome ?? "—"}</div>
            <div className="text-2xl font-bold text-primary mt-1">{t.preco_mensal != null ? fmtBRLmes(t.preco_mensal) : "—"}</div>
            {t.publico && <div className="text-xs text-muted-foreground mt-2 italic">{t.publico}</div>}
            {!!t.features?.length && (
              <ul className="mt-3 space-y-1 text-xs text-foreground/80">
                {t.features.map((f, j) => <li key={j} className="flex gap-1.5"><span className="text-primary">✓</span><span>{f}</span></li>)}
              </ul>
            )}
          </div>
        ))}
      </div>
      {arpu > 0 && (
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 text-xs text-foreground">
          <span className="font-mono uppercase text-primary">ARPU médio:</span> <span className="font-semibold">{fmtBRLmes(arpu)}</span>
          <span className="text-muted-foreground"> · use como `ticket_medio_mensal` no LTV÷CAC</span>
        </div>
      )}
      {data.perguntas_chave && (
        <div className="space-y-1.5 text-xs">
          {data.perguntas_chave.valor_capturado && <div><span className="text-muted-foreground">Valor capturado: </span><span className="text-foreground">{data.perguntas_chave.valor_capturado}</span></div>}
          {data.perguntas_chave.alternativa_atual && <div><span className="text-muted-foreground">Alternativa atual: </span><span className="text-foreground">{data.perguntas_chave.alternativa_atual}</span></div>}
          {data.perguntas_chave.sensibilidade && <div><span className="text-muted-foreground">Sensibilidade: </span><span className="text-foreground">{data.perguntas_chave.sensibilidade}</span></div>}
        </div>
      )}
      {data.go_to_market && <div className="text-xs text-muted-foreground"><span className="font-mono uppercase text-primary">GTM:</span> {data.go_to_market}</div>}
    </div>
  );
}

const DEFAULT_TIERS: PricingTier[] = [
  { nome: "Starter", preco_mensal: 97, publico: "", features: [] },
  { nome: "Pro", preco_mensal: 297, publico: "", features: [] },
  { nome: "Business", preco_mensal: 697, publico: "", features: [] },
];

export function EditableHipotesePricingCanvas({
  content, projectId, phaseNumber, artifactKey, canEdit, onUpdate, siblings,
}: {
  content: string;
  projectId: number;
  phaseNumber: number;
  artifactKey: string;
  canEdit: boolean;
  onUpdate?: () => void;
  siblings?: SiblingArtifact[];
}) {
  const ceiling = getCeilingFromValor(siblings);
  const original = parseJsonBlock<PricingData>(content);
  const hasJson = !!original?.tiers?.length;
  const [editing, setEditing] = useState(false);

  const seedTiers = (): PricingTier[] => {
    if (hasJson) {
      const arr = (original!.tiers ?? []).slice(0, 3);
      while (arr.length < 3) arr.push({ ...DEFAULT_TIERS[arr.length] });
      return arr.map((t) => ({
        nome: t.nome ?? "",
        preco_mensal: clampNonNeg(t.preco_mensal ?? 0),
        publico: t.publico ?? "",
        features: Array.isArray(t.features) ? t.features.map((f) => (typeof f === "string" ? f.trim() : "")).filter(Boolean) : [],
      }));
    }
    return DEFAULT_TIERS.map((t) => ({ ...t }));
  };
  const [tiers, setTiers] = useState<PricingTier[]>(seedTiers);
  const updateArtifact = useUpdateArtifact();
  const { toast } = useToast();

  const live = useMemo(() => {
    const prices = tiers.map((t) => clampNonNeg(t.preco_mensal ?? 0)).filter((n) => n > 0);
    const arpu = prices.length ? prices.reduce((a, b) => a + b, 0) / prices.length : 0;
    const min = prices.length ? Math.min(...prices) : 0;
    const max = prices.length ? Math.max(...prices) : 0;
    const spreadX = min > 0 ? max / min : 0;
    return { arpu, min, max, spreadX, mid: tiers[1]?.preco_mensal ?? 0 };
  }, [tiers]);

  if (!editing) {
    return (
      <div className="space-y-3">
        {hasJson ? <HipotesePricingCanvas content={content} /> : <Fallback content={content} />}
        {canEdit && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} data-testid="button-edit-pricing">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mr-1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              {hasJson ? "Editar tiers" : "Estruturar pricing"}
            </Button>
          </div>
        )}
      </div>
    );
  }

  function updateTier(i: number, patch: Partial<PricingTier>) {
    setTiers((prev) => prev.map((t, idx) => (idx === i ? { ...t, ...patch } : t)));
  }
  function updateFeatures(i: number, text: string) {
    const features = text.split("\n").map((s) => s.trim()).filter(Boolean);
    updateTier(i, { features });
  }

  function cancel() {
    setTiers(seedTiers());
    setEditing(false);
  }

  function save() {
    const cleanTiers: PricingTier[] = tiers.map((t) => ({
      nome: (t.nome ?? "").trim() || "Tier",
      preco_mensal: clampNonNeg(t.preco_mensal ?? 0),
      publico: (t.publico ?? "").trim() || undefined,
      features: (t.features ?? []).map((f) => (typeof f === "string" ? f.trim() : "")).filter(Boolean),
    }));
    const prices = cleanTiers.map((t) => t.preco_mensal ?? 0).filter((n) => n > 0);
    const arpu = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
    const next: PricingData = {
      ...original,
      modelo: original?.modelo ?? "SaaS recorrente",
      moeda: original?.moeda ?? "BRL",
      tiers: cleanTiers,
      arpu_recomendado: arpu,
    };
    const newContent = replaceJsonBlock(content, next as object);
    updateArtifact.mutate(
      { projectId, phaseNumber, artifactKey, data: { content: newContent, contentJson: null } },
      {
        onSuccess: () => {
          toast({ title: "Pricing atualizado", description: `ARPU: ${fmtBRLmes(arpu)} · use no LTV÷CAC` });
          setEditing(false);
          onUpdate?.();
        },
        onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
      }
    );
  }

  const spreadHint = live.spreadX >= 5
    ? { text: `Spread ${live.spreadX.toFixed(1)}× — bom: cobre econômico até enterprise`, color: "text-green-700 dark:text-green-400" }
    : live.spreadX >= 2.5
    ? { text: `Spread ${live.spreadX.toFixed(1)}× — saudável`, color: "text-amber-700 dark:text-amber-400" }
    : live.spreadX > 0
    ? { text: `Spread ${live.spreadX.toFixed(1)}× — tiers muito próximos, perde segmentação`, color: "text-red-700 dark:text-red-400" }
    : { text: "Defina preços nos 3 tiers", color: "text-muted-foreground" };

  return (
    <div className="space-y-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Editor de pricing · ARPU ao vivo</div>
        <div className="text-[10px] text-muted-foreground">3 tiers · regra: Pro ~3× Starter, Business ~2× Pro</div>
      </div>

      {ceiling != null && ceiling > 0 && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-accent/40 bg-accent/5 px-3 py-2">
          <div className="text-[11px] text-foreground">
            <span className="font-mono uppercase text-accent-foreground">Teto sugerido pelo Valor Quantificado:</span>{" "}
            <span className="font-semibold">{fmtBRLmes(ceiling)}</span>{" "}
            <span className="text-muted-foreground">(10% do ganho mensal do cliente)</span>
          </div>
          <SyncChip
            label={`Aplicar no Tier 2 (${fmtBRLmes(ceiling)})`}
            onClick={() => updateTier(1, { preco_mensal: ceiling })}
            testId="chip-sync-ceiling-tier2"
          />
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-3">
        {tiers.map((t, i) => (
          <div key={i} className={`rounded-lg border p-3 space-y-2 ${i === 1 ? "border-primary/40 bg-primary/5" : "border-border bg-background"}`}>
            <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Tier {i + 1}{i === 1 && " · destaque"}</div>
            <input
              type="text"
              value={t.nome ?? ""}
              onChange={(e) => updateTier(i, { nome: e.target.value })}
              placeholder="Nome do tier"
              data-testid={`input-tier-${i}-nome`}
              className="w-full px-2 py-1 rounded-md border border-border bg-background text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] text-muted-foreground">R$</span>
              <input
                type="number"
                min={0}
                step="any"
                inputMode="decimal"
                value={Number.isFinite(t.preco_mensal) ? t.preco_mensal : 0}
                onChange={(e) => updateTier(i, { preco_mensal: Number(e.target.value) })}
                data-testid={`input-tier-${i}-preco`}
                className="flex-1 px-2 py-1 rounded-md border border-border bg-background text-lg font-bold text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-[10px] text-muted-foreground whitespace-nowrap">/mês</span>
            </div>
            <input
              type="text"
              value={t.publico ?? ""}
              onChange={(e) => updateTier(i, { publico: e.target.value })}
              placeholder="Para quem é este tier"
              data-testid={`input-tier-${i}-publico`}
              className="w-full px-2 py-1 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <textarea
              value={(t.features ?? []).join("\n")}
              onChange={(e) => updateFeatures(i, e.target.value)}
              placeholder="Uma feature por linha"
              data-testid={`textarea-tier-${i}-features`}
              rows={4}
              className="w-full px-2 py-1 rounded-md border border-border bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
          </div>
        ))}
      </div>

      <div className="grid md:grid-cols-3 gap-3 pt-3 border-t border-border/40">
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">ARPU médio</div>
          <div className="text-2xl font-bold text-primary">{fmtBRLmes(live.arpu)}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Faixa</div>
          <div className="text-sm font-semibold text-foreground">{fmtBRLmes(live.min)} → {fmtBRLmes(live.max)}</div>
          <div className={`text-[10px] mt-0.5 ${spreadHint.color}`}>{spreadHint.text}</div>
        </div>
        <div className="rounded-lg border border-primary/30 bg-primary/5 px-3 py-2 flex flex-col justify-center">
          <div className="text-[10px] font-mono uppercase text-primary">→ usar no LTV÷CAC</div>
          <div className="text-sm font-semibold text-foreground">{fmtBRLmes(live.mid > 0 ? live.mid : live.arpu)}</div>
          <div className="text-[10px] text-muted-foreground">tier do meio (mais provável)</div>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-border/40">
        <Button variant="outline" size="sm" onClick={cancel} disabled={updateArtifact.isPending}>Cancelar</Button>
        <Button size="sm" onClick={save} disabled={updateArtifact.isPending} data-testid="button-save-pricing">
          {updateArtifact.isPending ? "Salvando…" : "Salvar pricing"}
        </Button>
      </div>
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

// ───────────────────────── 5b. LTV ÷ CAC EDITOR (interactive) ─────────────────────────
function replaceJsonBlock(original: string, newJson: object): string {
  const pretty = "```json\n" + JSON.stringify(newJson, null, 2) + "\n```";
  // Only replace fences whose contents parse as JSON (avoids corrupting unrelated code blocks)
  const fenceRe = /```(?:json)?\s*(\{[\s\S]*?\})\s*```/g;
  let replaced = false;
  const out = original.replace(fenceRe, (match, body) => {
    if (replaced) return match;
    try { JSON.parse(body); replaced = true; return pretty; }
    catch { return match; }
  });
  if (replaced) return out;
  const trimmed = original.trim();
  if (trimmed.startsWith("{")) {
    try { JSON.parse(trimmed); return pretty; } catch { /* fall through */ }
  }
  return original.trim() ? `${original.trim()}\n\n${pretty}\n` : pretty;
}

function clampNonNeg(n: number, max?: number): number {
  if (!isFinite(n) || n < 0) return 0;
  if (max != null && n > max) return max;
  return n;
}

function computeLtvCac(ticket: number, margemPct: number, churnPct: number, cac: number) {
  const ticketSafe = isFinite(ticket) && ticket > 0 ? ticket : 0;
  const margemSafe = isFinite(margemPct) && margemPct > 0 ? margemPct / 100 : 0;
  const churnSafe = isFinite(churnPct) && churnPct > 0 ? churnPct / 100 : 0;
  const cacSafe = isFinite(cac) && cac > 0 ? cac : 0;
  const vidaMeses = churnSafe > 0 ? 1 / churnSafe : 0;
  const ltv = ticketSafe * margemSafe * vidaMeses;
  const margemMensal = ticketSafe * margemSafe;
  const payback = margemMensal > 0 && cacSafe > 0 ? cacSafe / margemMensal : 0;
  const razao = cacSafe > 0 ? ltv / cacSafe : 0;
  let veredito: "SAUDAVEL" | "AJUSTAR" | "INVIAVEL" = "AJUSTAR";
  if (razao >= 3) veredito = "SAUDAVEL";
  else if (razao < 1 && razao > 0) veredito = "INVIAVEL";
  return { ltv, payback, razao, veredito, vidaMeses };
}

export function EditableLtvCacCanvas({
  content, projectId, phaseNumber, artifactKey, canEdit, onUpdate, siblings,
}: {
  content: string;
  projectId: number;
  phaseNumber: number;
  artifactKey: string;
  canEdit: boolean;
  onUpdate?: () => void;
  siblings?: SiblingArtifact[];
}) {
  const original = parseJsonBlock<LtvCacData>(content);
  const arpuFromPricing = getArpuFromPricing(siblings);
  const [editing, setEditing] = useState(false);
  const [ticket, setTicket] = useState<number>(original?.premissas?.ticket_medio_mensal ?? 0);
  const [margem, setMargem] = useState<number>(original?.premissas?.margem_bruta_pct ?? 70);
  const [churn, setChurn] = useState<number>(original?.premissas?.churn_mensal_pct ?? 5);
  const [cac, setCac] = useState<number>(original?.cac?.valor_calculado ?? 0);
  const updateArtifact = useUpdateArtifact();
  const { toast } = useToast();

  const live = useMemo(() => computeLtvCac(ticket, margem, churn, cac), [ticket, margem, churn, cac]);

  if (!editing) {
    return (
      <div className="space-y-3">
        <LtvCacCanvas content={content} />
        {canEdit && original && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} data-testid="button-edit-ltv-cac">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mr-1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Editar premissas
            </Button>
          </div>
        )}
      </div>
    );
  }

  const vMap = {
    SAUDAVEL: { bg: "bg-green-50 dark:bg-green-950/20", border: "border-green-300 dark:border-green-900/50", text: "text-green-700 dark:text-green-400", label: "SAUDÁVEL ✓" },
    AJUSTAR: { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-300 dark:border-amber-900/50", text: "text-amber-700 dark:text-amber-400", label: "AJUSTAR ⚠" },
    INVIAVEL: { bg: "bg-red-50 dark:bg-red-950/20", border: "border-red-300 dark:border-red-900/50", text: "text-red-700 dark:text-red-400", label: "INVIÁVEL ✕" },
  } as const;
  const v = vMap[live.veredito];

  function cancel() {
    setTicket(original?.premissas?.ticket_medio_mensal ?? 0);
    setMargem(original?.premissas?.margem_bruta_pct ?? 70);
    setChurn(original?.premissas?.churn_mensal_pct ?? 5);
    setCac(original?.cac?.valor_calculado ?? 0);
    setEditing(false);
  }

  function save() {
    const ticketC = clampNonNeg(ticket);
    const margemC = clampNonNeg(margem, 100);
    const churnC = clampNonNeg(churn, 100);
    const cacC = clampNonNeg(cac);
    const next: LtvCacData = {
      ...original,
      premissas: {
        ...original?.premissas,
        ticket_medio_mensal: ticketC,
        margem_bruta_pct: margemC,
        churn_mensal_pct: churnC,
        tempo_vida_estimado_meses: Math.round(live.vidaMeses * 10) / 10,
      },
      ltv: {
        ...original?.ltv,
        valor_calculado: Math.round(live.ltv),
        formula: `Ticket × Margem × (1 / Churn) = ${ticketC} × ${margemC}% × ${(live.vidaMeses).toFixed(1)}`,
      },
      cac: {
        ...original?.cac,
        valor_calculado: Math.round(cacC),
      },
      razao_ltv_cac: Math.round(live.razao * 10) / 10,
      payback_meses: Math.round(live.payback * 10) / 10,
      veredito: live.veredito,
    };
    const newContent = replaceJsonBlock(content, next as object);
    updateArtifact.mutate(
      { projectId, phaseNumber, artifactKey, data: { content: newContent, contentJson: null } },
      {
        onSuccess: () => {
          toast({ title: "Premissas atualizadas", description: `Nova razão LTV÷CAC: ${(Math.round(live.razao * 10) / 10).toFixed(1)}×` });
          setEditing(false);
          onUpdate?.();
        },
        onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
      }
    );
  }

  const inputCls = "w-full px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="space-y-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Editor de premissas · cálculo ao vivo</div>
        <div className="text-[10px] text-muted-foreground">Não usa IA — pura matemática</div>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <label className="block">
          <div className="flex items-center justify-between gap-2 mb-1">
            <div className="text-xs text-muted-foreground">Ticket médio/mês (R$)</div>
            {arpuFromPricing != null && arpuFromPricing > 0 && arpuFromPricing !== Math.round(ticket) && (
              <SyncChip
                label={`Pricing: ${fmtBRLmes(arpuFromPricing)}`}
                onClick={() => setTicket(arpuFromPricing)}
                testId="chip-sync-arpu-ticket"
              />
            )}
          </div>
          <input type="number" min={0} step="1" value={ticket || ""} onChange={(e) => setTicket(parseFloat(e.target.value) || 0)} className={inputCls} data-testid="input-ticket" />
        </label>
        <label className="block">
          <div className="text-xs text-muted-foreground mb-1">Margem bruta (%)</div>
          <input type="number" min={0} max={100} step="1" value={margem || ""} onChange={(e) => setMargem(parseFloat(e.target.value) || 0)} className={inputCls} data-testid="input-margem" />
        </label>
        <label className="block">
          <div className="text-xs text-muted-foreground mb-1">Churn mensal (%)</div>
          <input type="number" min={0} max={100} step="0.1" value={churn || ""} onChange={(e) => setChurn(parseFloat(e.target.value) || 0)} className={inputCls} data-testid="input-churn" />
        </label>
        <label className="block">
          <div className="text-xs text-muted-foreground mb-1">CAC (R$)</div>
          <input type="number" min={0} step="1" value={cac || ""} onChange={(e) => setCac(parseFloat(e.target.value) || 0)} className={inputCls} data-testid="input-cac" />
        </label>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-border/40">
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">LTV calculado</div>
          <div className="text-xl font-bold text-primary">{formatBRL(live.ltv)}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Vida média</div>
          <div className="text-xl font-bold text-foreground">{live.vidaMeses > 0 ? `${live.vidaMeses.toFixed(1)} m` : "—"}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Payback</div>
          <div className="text-xl font-bold text-foreground">{live.payback > 0 ? `${live.payback.toFixed(1)} m` : "—"}</div>
        </div>
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Razão LTV÷CAC</div>
          <div className={`text-xl font-bold ${v.text}`}>{live.razao > 0 ? `${live.razao.toFixed(1)}×` : "—"}</div>
        </div>
      </div>
      <div className={`rounded-lg border-2 px-3 py-2 ${v.bg} ${v.border} flex items-center justify-between flex-wrap gap-2`}>
        <div className={`text-sm font-bold ${v.text}`}>Veredito: {v.label}</div>
        <div className="text-xs text-muted-foreground">
          {live.razao >= 3 && "Unit economics saudáveis — pode escalar"}
          {live.razao >= 1 && live.razao < 3 && "Funciona mas margem apertada — otimizar CAC ou ticket"}
          {live.razao < 1 && live.razao > 0 && "Cada cliente gera prejuízo — não escalar antes de corrigir"}
          {live.razao === 0 && "Preencha CAC e premissas pra calcular"}
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2 border-t border-border/40">
        <Button variant="outline" size="sm" onClick={cancel} disabled={updateArtifact.isPending}>Cancelar</Button>
        <Button size="sm" onClick={save} disabled={updateArtifact.isPending || live.razao === 0} data-testid="button-save-ltv-cac">
          {updateArtifact.isPending ? "Salvando…" : "Salvar premissas"}
        </Button>
      </div>
    </div>
  );
}

// ───────────────────────── 5c. SCORE POTENCIAL EDITOR (interactive) ─────────────────────────
type ScorePotencialData = {
  desejabilidade?: number; viabilidade?: number; factibilidade?: number; escalabilidade?: number; timing?: number;
  media?: number; pontuacao_media?: number;
  justificativas?: Record<string, string>;
  recomendacao?: string;
  proximos_passos?: string[];
};

const SCORE_DIMS: Array<{ key: keyof ScorePotencialData & string; label: string; hint: string }> = [
  { key: "desejabilidade", label: "Desejabilidade", hint: "Cliente quer essa solução?" },
  { key: "viabilidade",    label: "Viabilidade",    hint: "Faz sentido econômico?" },
  { key: "factibilidade",  label: "Factibilidade",  hint: "Conseguimos construir?" },
  { key: "escalabilidade", label: "Escalabilidade", hint: "Cresce sem custo linear?" },
  { key: "timing",         label: "Timing",         hint: "Momento certo de mercado?" },
];

function clamp1to5(n: number): number {
  if (!isFinite(n)) return 1;
  return Math.min(5, Math.max(1, Math.round(n)));
}

function recommendFromAvg(avg: number): "AVANCAR" | "PIVOTAR" | "ABANDONAR" {
  if (avg >= 4) return "AVANCAR";
  if (avg >= 3) return "PIVOTAR";
  return "ABANDONAR";
}

export function EditableScorePotencialCanvas({
  content, projectId, phaseNumber, artifactKey, canEdit, onUpdate,
}: {
  content: string;
  projectId: number;
  phaseNumber: number;
  artifactKey: string;
  canEdit: boolean;
  onUpdate?: () => void;
}) {
  const original = parseJsonBlock<ScorePotencialData>(content);
  const [editing, setEditing] = useState(false);
  const [scores, setScores] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    for (const d of SCORE_DIMS) {
      const raw = typeof original?.[d.key] === "number" ? (original[d.key] as number) : 3;
      init[d.key] = clamp1to5(raw);
    }
    return init;
  });
  const updateArtifact = useUpdateArtifact();
  const { toast } = useToast();

  const avg = useMemo(() => {
    const vals = SCORE_DIMS.map((d) => scores[d.key] ?? 0).filter((v) => v > 0);
    return vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;
  }, [scores]);
  const live = useMemo(() => ({ avg, recomendacao: recommendFromAvg(avg) }), [avg]);

  if (!editing) {
    return (
      <div className="space-y-3">
        <InlineScoreView content={content} />
        {canEdit && original?.desejabilidade != null && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={() => setEditing(true)} data-testid="button-edit-score-potencial">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-3.5 h-3.5 mr-1.5"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
              Editar scores
            </Button>
          </div>
        )}
      </div>
    );
  }

  const recColors: Record<string, { bg: string; border: string; text: string; label: string }> = {
    AVANCAR:   { bg: "bg-green-50 dark:bg-green-950/20", border: "border-green-300 dark:border-green-900/50", text: "text-green-700 dark:text-green-400", label: "AVANÇAR ✓" },
    PIVOTAR:   { bg: "bg-amber-50 dark:bg-amber-950/20", border: "border-amber-300 dark:border-amber-900/50", text: "text-amber-700 dark:text-amber-400", label: "PIVOTAR ⚠" },
    ABANDONAR: { bg: "bg-red-50 dark:bg-red-950/20",     border: "border-red-300 dark:border-red-900/50",     text: "text-red-700 dark:text-red-400",     label: "ABANDONAR ✕" },
  };
  const rec = recColors[live.recomendacao];

  function cancel() {
    const reset: Record<string, number> = {};
    for (const d of SCORE_DIMS) reset[d.key] = typeof original?.[d.key] === "number" ? original[d.key] as number : 3;
    setScores(reset);
    setEditing(false);
  }

  function save() {
    const clamped: Record<string, number> = {};
    for (const d of SCORE_DIMS) clamped[d.key] = clamp1to5(scores[d.key] ?? 3);
    const clampedVals = SCORE_DIMS.map((d) => clamped[d.key]);
    const clampedAvg = clampedVals.reduce((a, b) => a + b, 0) / clampedVals.length;
    const avgRounded = Math.round(clampedAvg * 10) / 10;
    const clampedRec = recommendFromAvg(clampedAvg);
    const next: ScorePotencialData = {
      ...original,
      ...clamped,
      media: avgRounded,
      pontuacao_media: avgRounded,
      recomendacao: clampedRec,
    };
    const newContent = replaceJsonBlock(content, next as object);
    updateArtifact.mutate(
      { projectId, phaseNumber, artifactKey, data: { content: newContent, contentJson: null } },
      {
        onSuccess: () => {
          toast({ title: "Scores atualizados", description: `Nova média: ${avgRounded.toFixed(1)}/5 → ${clampedRec}` });
          setEditing(false);
          onUpdate?.();
        },
        onError: () => toast({ title: "Erro ao salvar", variant: "destructive" }),
      }
    );
  }

  return (
    <div className="space-y-4 rounded-xl border-2 border-primary/30 bg-primary/5 p-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="text-[10px] font-mono uppercase tracking-wider text-primary">Editor de scores · média ao vivo</div>
        <div className="text-[10px] text-muted-foreground">Escala 1 (fraco) — 5 (excelente)</div>
      </div>
      <div className="space-y-3">
        {SCORE_DIMS.map((d) => {
          const val = scores[d.key] ?? 3;
          return (
            <div key={d.key} className="space-y-1">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{d.label}</div>
                  <div className="text-[10px] text-muted-foreground">{d.hint}</div>
                </div>
                <div className="flex items-center gap-1.5">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScores((s) => ({ ...s, [d.key]: n }))}
                      data-testid={`button-score-${d.key}-${n}`}
                      className={`w-8 h-8 rounded-md border text-sm font-bold transition-colors ${
                        val === n
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
                      }`}
                      aria-label={`${d.label} = ${n}`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-border/40">
        <div>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Média ao vivo</div>
          <div className={`text-3xl font-bold ${rec.text}`}>{live.avg.toFixed(1)}<span className="text-base text-muted-foreground">/5</span></div>
        </div>
        <div className={`rounded-lg border-2 px-3 py-2 ${rec.bg} ${rec.border} flex flex-col justify-center`}>
          <div className="text-[10px] font-mono uppercase text-muted-foreground">Recomendação derivada</div>
          <div className={`text-sm font-bold ${rec.text}`}>{rec.label}</div>
        </div>
      </div>
      <div className="text-xs text-muted-foreground">
        {live.avg >= 4 && "Score forte — momentum pra avançar pra Fase 2 com confiança."}
        {live.avg >= 3 && live.avg < 4 && "Score médio — vale revisitar a dimensão mais fraca antes de avançar."}
        {live.avg < 3 && live.avg > 0 && "Score baixo — considere pivotar a hipótese central antes de gastar mais tempo aqui."}
      </div>
      <div className="flex gap-2 justify-end pt-2 border-t border-border/40">
        <Button variant="outline" size="sm" onClick={cancel} disabled={updateArtifact.isPending}>Cancelar</Button>
        <Button size="sm" onClick={save} disabled={updateArtifact.isPending} data-testid="button-save-score-potencial">
          {updateArtifact.isPending ? "Salvando…" : "Salvar scores"}
        </Button>
      </div>
    </div>
  );
}

// Read-only view of Score Potencial (extracted from phase.tsx so the editor can compose it)
function InlineScoreView({ content }: { content: string }) {
  const data = parseJsonBlock<ScorePotencialData & Record<string, unknown>>(content);
  if (!data?.desejabilidade) return <Fallback content={content} />;
  const rec = data.recomendacao;
  const recColors: Record<string, string> = {
    AVANCAR: "bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/30",
    PIVOTAR: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
    ABANDONAR: "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30",
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-5 gap-2">
        {SCORE_DIMS.map((d) => (
          <div key={d.key} className="text-center">
            <div className="text-2xl font-bold text-primary">{(data as any)[d.key] ?? "—"}</div>
            <div className="text-[10px] text-muted-foreground capitalize mt-0.5">{d.key}</div>
            {data.justificativas?.[d.key] && <div className="text-[10px] text-foreground mt-1 leading-snug">{data.justificativas[d.key]}</div>}
          </div>
        ))}
      </div>
      {rec && (
        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold border ${recColors[rec] ?? "bg-muted text-muted-foreground border-border"}`}>
          Recomendação: {rec}
        </div>
      )}
      {Array.isArray(data.proximos_passos) && data.proximos_passos.length > 0 && (
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

// ───────────────────────── 7. Matriz RBAC (Fase 3) ─────────────────────────
type RbacData = {
  papeis?: { nome: string; descricao?: string; usuarios_esperados?: string }[];
  recursos?: { nome: string; operacoes: Record<string, string>; observacao?: string }[];
  convencao?: string;
  auth_flow?: string;
  armadilhas_evitar?: string[];
};

function opCellColor(op: string): string {
  const v = (op || "").trim();
  if (v === "-" || v === "" || v.toLowerCase() === "sem acesso") return "bg-muted/40 text-muted-foreground";
  if (v === "CRUD") return "bg-primary/15 text-primary font-bold";
  if (v.includes("D")) return "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold";
  if (v.includes("U") || v.includes("C")) return "bg-blue-500/15 text-blue-700 dark:text-blue-400 font-semibold";
  if (v.includes("R")) return "bg-green-500/15 text-green-700 dark:text-green-400 font-medium";
  return "bg-secondary text-foreground";
}

export function MatrizRbacCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<RbacData>(content);
  if (!data?.papeis?.length || !data?.recursos?.length) return <Fallback content={content} />;
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h4 className="font-serif text-base">Matriz de papéis × recursos</h4>
        <span className="text-[10px] font-mono uppercase text-muted-foreground">{data.convencao ?? "C=Criar · R=Ler · U=Atualizar · D=Deletar"}</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wider">Recurso</th>
              {data.papeis.map((p) => (
                <th key={p.nome} className="px-2 py-2 text-center font-mono text-[11px]" title={p.descricao}>{p.nome}</th>
              ))}
              <th className="text-left px-3 py-2 text-[11px] text-muted-foreground">Obs.</th>
            </tr>
          </thead>
          <tbody>
            {data.recursos.map((r) => (
              <tr key={r.nome} className="border-t border-border">
                <td className="px-3 py-2 font-medium text-foreground">{r.nome}</td>
                {data.papeis!.map((p) => {
                  const op = r.operacoes?.[p.nome] ?? "-";
                  return (
                    <td key={p.nome} className="px-2 py-1.5 text-center">
                      <span className={`inline-block min-w-[44px] px-2 py-1 rounded text-[12px] font-mono ${opCellColor(op)}`}>{op}</span>
                    </td>
                  );
                })}
                <td className="px-3 py-2 text-[11px] text-muted-foreground">{r.observacao ?? ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
        {data.papeis.map((p) => (
          <div key={p.nome} className="rounded-lg border border-border p-3 bg-secondary/30">
            <div className="font-mono text-[11px] uppercase text-primary">{p.nome}</div>
            <div className="text-foreground mt-0.5">{p.descricao}</div>
            {p.usuarios_esperados && <div className="text-muted-foreground text-[11px] mt-1">{p.usuarios_esperados}</div>}
          </div>
        ))}
      </div>
      {data.auth_flow && (
        <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
          <div className="text-[10px] font-mono uppercase text-primary mb-1">Fluxo de autenticação</div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{data.auth_flow}</p>
        </div>
      )}
      {!!data.armadilhas_evitar?.length && (
        <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
          <div className="text-[10px] font-mono uppercase text-amber-700 dark:text-amber-400 mb-1">Armadilhas a evitar</div>
          <ul className="text-sm space-y-1 list-disc list-inside text-foreground">
            {data.armadilhas_evitar.map((a, i) => <li key={i}>{a}</li>)}
          </ul>
        </div>
      )}
      <Attribution>RBAC — padrão NIST RBAC (Sandhu et al., 1996). Princípio do menor privilégio + negação por padrão.</Attribution>
    </div>
  );
}

// ───────────────────────── 8. Modelo de Dados (Fase 4) ─────────────────────────
type ModeloDadosData = {
  entidades?: {
    nome: string;
    descricao?: string;
    campos?: { nome: string; tipo: string; pk?: boolean; unique?: boolean; nullable?: boolean; default?: string; obs?: string }[];
    indices?: string[];
    relacoes?: string[];
  }[];
  estrategia_soft_delete?: string;
  estrategia_auditoria?: string;
  multi_tenancy?: string;
  notas_migracao?: string;
};

export function ModeloDadosCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<ModeloDadosData>(content);
  if (!data?.entidades?.length) return <Fallback content={content} />;
  return (
    <div className="space-y-4">
      <h4 className="font-serif text-base">{data.entidades.length} entidades</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {data.entidades.map((e) => (
          <div key={e.nome} className="rounded-xl border border-border bg-card overflow-hidden">
            <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
              <div className="font-mono text-sm font-bold text-primary">{e.nome}</div>
              {e.descricao && <div className="text-xs text-muted-foreground mt-0.5">{e.descricao}</div>}
            </div>
            <div className="divide-y divide-border">
              {e.campos?.map((c) => (
                <div key={c.nome} className="px-4 py-1.5 flex items-center gap-2 text-xs">
                  <span className="font-mono font-medium text-foreground flex-1 truncate">{c.nome}</span>
                  <span className="font-mono text-muted-foreground">{c.tipo}</span>
                  <div className="flex gap-1">
                    {c.pk && <span className="px-1.5 py-0.5 rounded bg-accent/20 text-accent-foreground text-[9px] font-bold">PK</span>}
                    {c.unique && <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-700 dark:text-blue-400 text-[9px] font-bold">UQ</span>}
                    {c.nullable === false && <span className="px-1.5 py-0.5 rounded bg-muted text-foreground text-[9px]">NN</span>}
                  </div>
                </div>
              ))}
            </div>
            {(e.indices?.length || e.relacoes?.length) && (
              <div className="bg-secondary/30 px-4 py-2 text-[11px] space-y-1">
                {!!e.indices?.length && <div><span className="font-mono uppercase text-muted-foreground">Idx:</span> {e.indices.join(", ")}</div>}
                {!!e.relacoes?.length && <div><span className="font-mono uppercase text-muted-foreground">Rel:</span> {e.relacoes.join(" · ")}</div>}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
        {data.estrategia_soft_delete && (
          <div className="rounded-lg border border-border p-3 bg-secondary/30">
            <div className="font-mono text-[10px] uppercase text-muted-foreground mb-1">Soft-delete</div>
            <div className="text-foreground">{data.estrategia_soft_delete}</div>
          </div>
        )}
        {data.estrategia_auditoria && (
          <div className="rounded-lg border border-border p-3 bg-secondary/30">
            <div className="font-mono text-[10px] uppercase text-muted-foreground mb-1">Auditoria</div>
            <div className="text-foreground">{data.estrategia_auditoria}</div>
          </div>
        )}
        {data.multi_tenancy && (
          <div className="rounded-lg border border-border p-3 bg-secondary/30">
            <div className="font-mono text-[10px] uppercase text-muted-foreground mb-1">Multi-tenancy</div>
            <div className="text-foreground">{data.multi_tenancy}</div>
          </div>
        )}
        {data.notas_migracao && (
          <div className="rounded-lg border border-border p-3 bg-secondary/30">
            <div className="font-mono text-[10px] uppercase text-muted-foreground mb-1">Migração</div>
            <div className="text-foreground">{data.notas_migracao}</div>
          </div>
        )}
      </div>
      <Attribution>Modelo entidade-relacionamento (Chen, 1976) + padrões evolutivos de schema (Fowler, 2018).</Attribution>
    </div>
  );
}

// ───────────────────────── 9. Milestones (Fase 5) ─────────────────────────
type MilestonesData = {
  milestones?: {
    numero: number; nome: string; duracao?: string;
    features?: string[]; criterio_aceitacao?: string; demo?: string;
    risco?: "baixo" | "medio" | "alto"; dependencias?: (string | number)[];
  }[];
  duracao_total_estimada?: string;
  marco_mvp?: string | number;
};

const RISK_STYLE: Record<string, string> = {
  baixo: "bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30",
  medio: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30",
  alto: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30",
};

export function MilestonesCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<MilestonesData>(content);
  if (!data?.milestones?.length) return <Fallback content={content} />;
  const mvp = data.marco_mvp != null ? String(data.marco_mvp) : null;
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h4 className="font-serif text-base">{data.milestones.length} milestones</h4>
        {data.duracao_total_estimada && <span className="text-xs text-muted-foreground">Duração total: <strong className="text-foreground">{data.duracao_total_estimada}</strong></span>}
      </div>
      <div className="relative">
        <div className="absolute left-4 top-2 bottom-2 w-0.5 bg-border" />
        <div className="space-y-3">
          {data.milestones.map((m) => {
            const isMvp = mvp && String(m.numero) === mvp;
            return (
              <div key={m.numero} className="relative pl-12">
                <div className={`absolute left-1 top-2 w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold border-2 ${isMvp ? "bg-accent text-accent-foreground border-accent" : "bg-primary text-white border-primary"}`}>
                  {m.numero}
                </div>
                <div className={`rounded-xl border p-4 ${isMvp ? "border-accent/40 bg-accent/5" : "border-border bg-card"}`}>
                  <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h5 className="font-serif text-base text-foreground">{m.nome}</h5>
                        {isMvp && <span className="px-2 py-0.5 rounded-full bg-accent text-accent-foreground text-[10px] font-mono uppercase font-bold">MVP</span>}
                      </div>
                      {m.duracao && <div className="text-xs text-muted-foreground mt-0.5">{m.duracao}</div>}
                    </div>
                    {m.risco && (
                      <span className={`text-[10px] font-mono uppercase px-2 py-0.5 rounded border ${RISK_STYLE[m.risco] ?? RISK_STYLE.medio}`}>
                        risco {m.risco}
                      </span>
                    )}
                  </div>
                  {!!m.features?.length && (
                    <ul className="text-sm space-y-0.5 mb-2">
                      {m.features.map((f, i) => (
                        <li key={i} className="flex items-start gap-2 text-foreground"><span className="text-primary mt-0.5">▸</span><span>{f}</span></li>
                      ))}
                    </ul>
                  )}
                  {m.criterio_aceitacao && (
                    <div className="text-xs bg-secondary/40 rounded p-2 mt-2">
                      <span className="font-mono uppercase text-[10px] text-muted-foreground">Aceitação · </span>
                      <span className="text-foreground">{m.criterio_aceitacao}</span>
                    </div>
                  )}
                  {m.demo && <div className="text-[11px] text-muted-foreground mt-1.5">🎬 Demo: {m.demo}</div>}
                  {!!m.dependencias?.length && <div className="text-[11px] text-muted-foreground mt-1">Depende de: {m.dependencias.join(", ")}</div>}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <Attribution>Milestone-based delivery (Brooks, 1995 · Cockburn, 2004). Cada marco deve ser um entregável demonstrável.</Attribution>
    </div>
  );
}

// ───────────────────────── 10. Casos de Teste Críticos (Fase 6) ─────────────────────────
type CasosTesteData = {
  casos?: {
    id: string; titulo: string; prioridade: "P0" | "P1" | "P2";
    tipo?: string; preconds?: string; steps?: string[]; esperado?: string;
  }[];
  distribuicao_alvo?: string;
};

const PRIO_STYLE: Record<string, string> = {
  P0: "bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/40",
  P1: "bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/40",
  P2: "bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30",
};

export function CasosTesteCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<CasosTesteData>(content);
  if (!data?.casos?.length) return <Fallback content={content} />;
  const counts = data.casos.reduce<Record<string, number>>((acc, c) => {
    acc[c.prioridade] = (acc[c.prioridade] ?? 0) + 1; return acc;
  }, {});
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-3">
        <h4 className="font-serif text-base">{data.casos.length} casos de teste</h4>
        <div className="flex gap-2">
          {(["P0", "P1", "P2"] as const).map((p) => (
            <span key={p} className={`text-[11px] font-mono px-2 py-0.5 rounded border ${PRIO_STYLE[p]}`}>
              {p}: <strong>{counts[p] ?? 0}</strong>
            </span>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        {data.casos.map((c) => (
          <details key={c.id} className="rounded-xl border border-border bg-card group">
            <summary className="cursor-pointer px-4 py-3 flex items-center gap-3 hover:bg-secondary/30 transition-colors list-none">
              <span className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${PRIO_STYLE[c.prioridade] ?? PRIO_STYLE.P2}`}>{c.prioridade}</span>
              <span className="font-mono text-[11px] text-muted-foreground">{c.id}</span>
              <span className="flex-1 text-sm text-foreground">{c.titulo}</span>
              {c.tipo && <span className="text-[10px] font-mono uppercase text-muted-foreground">{c.tipo}</span>}
              <svg className="w-4 h-4 text-muted-foreground transition-transform group-open:rotate-180" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}><polyline points="6 9 12 15 18 9" /></svg>
            </summary>
            <div className="px-4 pb-3 pt-1 border-t border-border space-y-2 text-sm">
              {c.preconds && <div><span className="text-[10px] font-mono uppercase text-muted-foreground">Pré-condições · </span><span className="text-foreground">{c.preconds}</span></div>}
              {!!c.steps?.length && (
                <div>
                  <div className="text-[10px] font-mono uppercase text-muted-foreground mb-1">Steps</div>
                  <ol className="list-decimal list-inside space-y-0.5 text-foreground">
                    {c.steps.map((s, i) => <li key={i}>{s}</li>)}
                  </ol>
                </div>
              )}
              {c.esperado && (
                <div className="rounded bg-green-500/5 border border-green-500/20 p-2">
                  <span className="text-[10px] font-mono uppercase text-green-700 dark:text-green-400">Esperado · </span>
                  <span className="text-foreground">{c.esperado}</span>
                </div>
              )}
            </div>
          </details>
        ))}
      </div>
      {data.distribuicao_alvo && <p className="text-[11px] text-muted-foreground italic">{data.distribuicao_alvo}</p>}
      <Attribution>Test prioritization (Kaner et al., 1999 · Crispin & Gregory, 2009). P0 bloqueia release.</Attribution>
    </div>
  );
}

// ───────────────────────── 11. Métricas Pós-Lançamento (Fase 7) ─────────────────────────
type MetricasData = {
  north_star?: { nome: string; meta_semana_4?: string };
  semanas?: {
    semana: number; foco?: string;
    metricas?: Record<string, { meta?: string; como_medir?: string }>;
    acoes_se_abaixo?: string;
  }[];
  criterios_product_market_fit?: string[];
};

const AARRR_LABELS: Record<string, string> = {
  aquisicao: "Aquisição", ativacao: "Ativação", retencao: "Retenção", receita: "Receita", indicacao: "Indicação",
};

export function MetricasPosLaunchCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<MetricasData>(content);
  if (!data?.semanas?.length) return <Fallback content={content} />;
  return (
    <div className="space-y-4">
      {data.north_star && (
        <div className="rounded-xl border-2 border-accent/40 bg-gradient-to-br from-accent/10 to-transparent p-4">
          <div className="text-[10px] font-mono uppercase text-accent font-bold tracking-wider mb-1">⭐ North Star</div>
          <div className="font-serif text-lg text-foreground">{data.north_star.nome}</div>
          {data.north_star.meta_semana_4 && <div className="text-xs text-muted-foreground mt-0.5">Meta semana 4: <strong className="text-foreground">{data.north_star.meta_semana_4}</strong></div>}
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wider">Semana</th>
              {Object.values(AARRR_LABELS).map((l) => (
                <th key={l} className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wider">{l}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.semanas.map((s) => (
              <tr key={s.semana} className="border-t border-border align-top">
                <td className="px-3 py-2">
                  <div className="font-mono font-bold text-primary">S{s.semana}</div>
                  {s.foco && <div className="text-[11px] text-muted-foreground mt-0.5 max-w-[120px]">{s.foco}</div>}
                </td>
                {Object.keys(AARRR_LABELS).map((key) => {
                  const m = s.metricas?.[key];
                  const isEmpty = !m?.meta || m.meta === "—" || m.meta === "-";
                  return (
                    <td key={key} className="px-3 py-2">
                      {isEmpty ? (
                        <span className="text-muted-foreground text-xs">—</span>
                      ) : (
                        <div>
                          <div className="text-foreground text-xs font-medium">{m!.meta}</div>
                          {m!.como_medir && <div className="text-[10px] text-muted-foreground mt-0.5">{m!.como_medir}</div>}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {data.semanas.some((s) => s.acoes_se_abaixo) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {data.semanas.filter((s) => s.acoes_se_abaixo).map((s) => (
            <div key={s.semana} className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3 text-xs">
              <div className="font-mono text-[10px] uppercase text-amber-700 dark:text-amber-400">S{s.semana} · se abaixo</div>
              <div className="text-foreground mt-0.5">{s.acoes_se_abaixo}</div>
            </div>
          ))}
        </div>
      )}
      {!!data.criterios_product_market_fit?.length && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="text-[10px] font-mono uppercase text-primary font-bold tracking-wider mb-2">Critérios de Product-Market Fit</div>
          <ul className="space-y-1.5">
            {data.criterios_product_market_fit.map((c, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-foreground"><span className="text-primary mt-0.5">✓</span><span>{c}</span></li>
            ))}
          </ul>
        </div>
      )}
      <Attribution>AARRR funnel (Dave McClure, 2007) + North Star Metric (Sean Ellis). Critério "muito decepcionado" (Ellis &amp; Brown, 2017).</Attribution>
    </div>
  );
}
