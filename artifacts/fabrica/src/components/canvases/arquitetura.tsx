import { parseJsonBlock, Fallback, Attribution } from "./shared";

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

// ───────────────────────── Threat Model / STRIDE (Fase 3) ─────────────────────────
type ThreatModelData = {
  features?: Array<{
    feature: string;
    ameacas?: Array<{
      categoria: string;
      ameaca?: string;
      probabilidade?: number;
      impacto?: number;
      score?: number;
      controle?: string;
    }>;
  }>;
  superficie_ataque?: {
    endpoints_api?: string[];
    mecanismos_auth?: string[];
    upload_arquivos?: string[];
    webhooks_integracoes?: string[];
    dados_sensiveis_transito?: string[];
  };
  riscos_criticos?: string[];
  riscos_altos?: string[];
  riscos_medios?: string[];
  controles_prioritarios?: string[];
};

const STRIDE_CATEGORIES: Array<{ key: string; short: string }> = [
  { key: "Spoofing", short: "Spoof" },
  { key: "Tampering", short: "Tamper" },
  { key: "Repudiation", short: "Repud" },
  { key: "Information Disclosure", short: "Info" },
  { key: "Denial of Service", short: "DoS" },
  { key: "Elevation of Privilege", short: "Priv." },
];

function threatScoreColor(score: number): string {
  if (score >= 15) return "bg-red-500/15 text-red-700 dark:text-red-400 font-semibold";
  if (score >= 8) return "bg-amber-500/15 text-amber-700 dark:text-amber-400 font-semibold";
  if (score > 0) return "bg-green-500/15 text-green-700 dark:text-green-400 font-medium";
  return "bg-muted/40 text-muted-foreground";
}

export function ThreatModelCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<ThreatModelData>(content);
  if (!data?.features?.length) return <Fallback content={content} />;
  const superficie = data.superficie_ataque
    ? ([
        ["Endpoints de API", data.superficie_ataque.endpoints_api],
        ["Mecanismos de autenticação", data.superficie_ataque.mecanismos_auth],
        ["Upload de arquivos", data.superficie_ataque.upload_arquivos],
        ["Webhooks/integrações", data.superficie_ataque.webhooks_integracoes],
        ["Dados sensíveis em trânsito", data.superficie_ataque.dados_sensiveis_transito],
      ] as const).filter(([, v]) => v?.length)
    : [];
  return (
    <div className="space-y-4">
      <div className="flex items-baseline justify-between flex-wrap gap-2">
        <h4 className="font-serif text-base">Matriz STRIDE por feature</h4>
        <span className="text-[10px] font-mono uppercase text-muted-foreground">Score = probabilidade × impacto</span>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-secondary/50">
              <th className="text-left px-3 py-2 font-medium text-xs uppercase tracking-wider">Feature</th>
              {STRIDE_CATEGORIES.map((c) => (
                <th key={c.key} className="px-2 py-2 text-center font-mono text-[10px]" title={c.key}>{c.short}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.features.map((f) => (
              <tr key={f.feature} className="border-t border-border">
                <td className="px-3 py-2 font-medium text-foreground align-top">{f.feature}</td>
                {STRIDE_CATEGORIES.map((cat) => {
                  const a = f.ameacas?.find((x) => x.categoria === cat.key);
                  const score = a?.score ?? (a?.probabilidade && a?.impacto ? a.probabilidade * a.impacto : 0);
                  return (
                    <td key={cat.key} className="px-2 py-1.5 text-center align-top">
                      {a ? (
                        <span
                          className={`inline-block min-w-[32px] px-2 py-1 rounded text-[12px] font-mono ${threatScoreColor(score)}`}
                          title={[a.ameaca, a.controle].filter(Boolean).join(" — ")}
                        >
                          {score}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!!superficie.length && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {superficie.map(([label, items]) => (
            <div key={label} className="rounded-lg border border-border bg-muted/20 p-3">
              <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">{label}</div>
              <ul className="space-y-1">
                {items!.map((it, i) => <li key={i} className="text-xs text-foreground">{it}</li>)}
              </ul>
            </div>
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {!!data.riscos_criticos?.length && (
          <div className="rounded-lg border border-red-300 bg-red-50 dark:border-red-900/50 dark:bg-red-950/20 p-3">
            <div className="text-[10px] font-mono uppercase text-red-700 dark:text-red-400 mb-1.5">Riscos críticos</div>
            <ul className="space-y-1">{data.riscos_criticos.map((r, i) => <li key={i} className="text-xs text-foreground">{r}</li>)}</ul>
          </div>
        )}
        {!!data.riscos_altos?.length && (
          <div className="rounded-lg border border-amber-300 bg-amber-50 dark:border-amber-900/50 dark:bg-amber-950/20 p-3">
            <div className="text-[10px] font-mono uppercase text-amber-700 dark:text-amber-400 mb-1.5">Riscos altos</div>
            <ul className="space-y-1">{data.riscos_altos.map((r, i) => <li key={i} className="text-xs text-foreground">{r}</li>)}</ul>
          </div>
        )}
      </div>
      {!!data.controles_prioritarios?.length && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="text-[10px] font-mono uppercase text-primary mb-1.5">Controles prioritários</div>
          <ol className="space-y-1.5">
            {data.controles_prioritarios.map((c, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2">
                <span className="text-primary font-mono text-xs flex-shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <span>{c}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
      <Attribution>Modelagem de ameaças STRIDE (Microsoft, 1999). Escala de score (probabilidade × impacto) própria do Método FoundersFlow.</Attribution>
    </div>
  );
}

// ───────────────────────── Arquitetura do Sistema (Fase 4) ─────────────────────────
type ArquiteturaData = {
  estilo_arquitetural?: { escolha?: string; justificativa?: string };
  componentes?: Array<{ nome: string; tipo?: string; descricao?: string }>;
  conexoes?: Array<{ de: string; para: string; protocolo?: string; descricao?: string }>;
  stack_tecnologica?: Array<{ camada: string; escolha?: string; justificativa?: string }>;
  fluxos_dados_principais?: string[];
  decisoes_trade_off?: string[];
};

const COMPONENT_TYPE_LABELS: Record<string, string> = {
  frontend: "Frontend",
  backend: "Backend",
  database: "Banco de Dados",
  cache: "Cache",
  queue: "Fila",
  external: "Externo",
  infra: "Infraestrutura",
};

const COMPONENT_TYPE_ORDER = ["frontend", "backend", "database", "cache", "queue", "external", "infra"];

export function ArquiteturaCanvas({ content }: { content: string }) {
  const data = parseJsonBlock<ArquiteturaData>(content);
  if (!data?.componentes?.length) return <Fallback content={content} />;
  const byType = new Map<string, NonNullable<ArquiteturaData["componentes"]>>();
  for (const c of data.componentes) {
    const t = c.tipo ?? "infra";
    if (!byType.has(t)) byType.set(t, []);
    byType.get(t)!.push(c);
  }
  const orderedTypes = [
    ...COMPONENT_TYPE_ORDER.filter((t) => byType.has(t)),
    ...[...byType.keys()].filter((t) => !COMPONENT_TYPE_ORDER.includes(t)),
  ];

  return (
    <div className="space-y-4">
      {data.estilo_arquitetural?.escolha && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-4">
          <div className="text-[10px] font-mono uppercase tracking-wider text-primary mb-1">Estilo arquitetural</div>
          <div className="text-base font-semibold text-foreground">{data.estilo_arquitetural.escolha}</div>
          {data.estilo_arquitetural.justificativa && <p className="text-sm text-foreground/80 mt-1">{data.estilo_arquitetural.justificativa}</p>}
        </div>
      )}

      <div>
        <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Componentes</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {orderedTypes.map((t) => (
            <div key={t} className="rounded-xl border border-border bg-card/50 p-3">
              <div className="text-[10px] font-mono uppercase text-muted-foreground mb-2">{COMPONENT_TYPE_LABELS[t] ?? t}</div>
              <div className="space-y-2">
                {byType.get(t)!.map((c) => (
                  <div key={c.nome} className="rounded-lg border border-border/60 bg-background px-2.5 py-2">
                    <div className="text-sm font-medium text-foreground">{c.nome}</div>
                    {c.descricao && <div className="text-xs text-muted-foreground mt-0.5">{c.descricao}</div>}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {!!data.conexoes?.length && (
        <div className="rounded-lg border border-border bg-muted/20 p-3">
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Conexões</div>
          <ul className="space-y-1.5">
            {data.conexoes.map((cx, i) => (
              <li key={i} className="text-sm text-foreground flex flex-wrap items-center gap-1.5">
                <span className="font-medium">{cx.de}</span>
                <span className="text-muted-foreground">→</span>
                <span className="font-medium">{cx.para}</span>
                {cx.protocolo && <span className="text-xs font-mono text-primary ml-1">{cx.protocolo}</span>}
                {cx.descricao && <span className="text-xs text-muted-foreground">— {cx.descricao}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      {!!data.stack_tecnologica?.length && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-[10px] font-mono uppercase text-muted-foreground border-b border-border">
                <th className="text-left px-2 py-1.5">Camada</th>
                <th className="text-left px-2 py-1.5">Escolha</th>
                <th className="text-left px-2 py-1.5">Justificativa</th>
              </tr>
            </thead>
            <tbody>
              {data.stack_tecnologica.map((s, i) => (
                <tr key={i} className="border-b border-border/40">
                  <td className="px-2 py-2 text-muted-foreground capitalize">{s.camada}</td>
                  <td className="px-2 py-2 font-medium text-foreground">{s.escolha}</td>
                  <td className="px-2 py-2 text-foreground/70 text-xs">{s.justificativa}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!!data.fluxos_dados_principais?.length && (
        <div>
          <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">Fluxos de dados principais</div>
          <ul className="space-y-1.5">
            {data.fluxos_dados_principais.map((f, i) => (
              <li key={i} className="text-sm text-foreground flex gap-2"><span className="text-primary mt-0.5">→</span><span>{f}</span></li>
            ))}
          </ul>
        </div>
      )}

      {!!data.decisoes_trade_off?.length && (
        <div className="rounded-lg bg-amber-500/5 border border-amber-500/20 p-3">
          <div className="text-[10px] font-mono uppercase text-amber-700 dark:text-amber-400 mb-1">Decisões de trade-off</div>
          <ul className="space-y-1">{data.decisoes_trade_off.map((d, i) => <li key={i} className="text-sm text-foreground">{d}</li>)}</ul>
        </div>
      )}
    </div>
  );
}
