import { Link } from "wouter";

const DIMENSIONS = [
  {
    title: "1. Proposta de valor",
    score: 7,
    summary: "Resolve a dor de estruturar produtos e artefatos; problema latente no topo e manifesto na execução.",
    points: [
      "Problema central: founders perdem semanas transformando ideia em especificação acionável.",
      "10x melhor em velocidade e estrutura, mas ainda depende da qualidade do briefing.",
      "JTBD dominante: sair do caos de ideia para um plano executável com artefatos concretos.",
      "Dor intensa para B2B founders; disposição a pagar cresce quando o custo do erro é alto.",
    ],
  },
  {
    title: "2. Moat & vantagens competitivas",
    score: 5,
    summary: "Moat moderado e ainda frágil; marca + workflow + dados podem virar defensáveis, mas não hoje.",
    points: [
      "Há algum custo de troca via projetos, artefatos e contexto acumulado.",
      "Sem efeitos de rede fortes; concorrente capitalizado pode copiar o fluxo visível.",
      "Flywheel de dados existe se o produto capturar decisões, outcomes e benchmarks.",
      "Hoje o negócio é fragmentado; no máximo winner-takes-most por nicho vertical.",
    ],
  },
  {
    title: "3. Engajamento & retenção",
    score: 6,
    summary: "Aha moment rápido, mas retenção depende de projetos recorrentes e uso profissional contínuo.",
    points: [
      "Loop: briefing → geração de artefatos → progresso visível → próximo passo.",
      "Aha moment acontece em minutos, quando o usuário vê um PRD/arquitetura prontos.",
      "Retenção provável é episódica, centrada em novos projetos e revisões de roadmap.",
      "Risco de churn precoce se o usuário só quiser um documento e não um sistema contínuo.",
    ],
  },
  {
    title: "4. Mercado & timing",
    score: 8,
    summary: "Timing bom: LLMs, pressão por velocidade e cultura de productization criam demanda agora.",
    points: [
      "TAM amplo: PMs, founders, consultorias, agências e times de inovação.",
      "SAM inicial: founders early-stage e builders sem PM maduro.",
      "SOM realista: nicho B2B tech com dor alta e ticket médio de produtividade.",
      "Risco de comoditização existe, mas a oportunidade ainda está em expansão.",
    ],
  },
  {
    title: "5. Receita & unit economics",
    score: 6,
    summary: "Preço faz sentido para produtividade; margem tende a ser boa, CAC precisa ser controlado.",
    points: [
      "Preço captura parte da willingness to pay, mas há espaço para tier de equipe/empresa.",
      "CAC deve ser baixo via conteúdo e produto, alto via paid se o funil não converter.",
      "LTV melhora com multi-projetos, AI Advisor e expansão por equipe.",
      "Margem cresce com escala se inference e suporte forem bem controlados.",
    ],
  },
  {
    title: "6. Go-to-market & distribuição",
    score: 7,
    summary: "PLG + conteúdo + comunidade é o motion correto; beachhead em founders e builders.",
    points: [
      "Canal primário: conteúdo educacional, demos e SEO de dor específica.",
      "Product-led é o motion dominante; sales-led só em planos altos.",
      "Beachhead: founders early-stage, incubadoras e consultorias de produto.",
      "Expansão para times e squads acontece depois de provar valor individual.",
    ],
  },
  {
    title: "7. Riscos críticos",
    score: 5,
    summary: "Os riscos estão concentrados em replicação, retenção e dependência de LLMs/plataformas.",
    points: [
      "Risco tecnológico: qualidade inconsistente de geração e custo de inferência.",
      "Risco competitivo: big tech ou copilots generalistas replicarem o fluxo.",
      "Risco comportamental: valor percebido cair após o primeiro projeto.",
      "Risco financeiro: CAC subir antes de retenção e expansão estarem maduras.",
    ],
  },
];

export function MarketAnalysisPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Voltar ao painel
          </Link>
          <Link href="/pricing" className="text-sm text-primary hover:underline">
            Ver planos
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12">
        <div className="max-w-3xl">
          <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mb-3">Análise mercadológica</p>
          <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-4">Fábrica de Soluções</h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-10">
            Leitura executiva direta, com premissas explícitas onde faltam dados.
          </p>
        </div>

        <div className="grid gap-6">
          {DIMENSIONS.map((d) => (
            <section key={d.title} className="bg-card border border-card-border rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <h2 className="text-xl font-serif text-foreground mb-1">{d.title}</h2>
                  <p className="text-sm text-muted-foreground">{d.summary}</p>
                </div>
                <div className="text-center shrink-0">
                  <div className="text-3xl font-bold text-primary">{d.score}</div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">Score</div>
                </div>
              </div>
              <ul className="space-y-2">
                {d.points.map((p) => (
                  <li key={p} className="text-sm text-foreground leading-relaxed flex gap-2">
                    <span className="text-primary mt-1">•</span>
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>

        <section className="mt-8 bg-primary/5 border border-primary/15 rounded-2xl p-6">
          <h2 className="text-2xl font-serif text-foreground mb-4">Síntese executiva</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 text-sm">
            <div><strong>Scores:</strong> 7, 5, 6, 8, 6, 7, 5</div>
            <div><strong>Forças:</strong> velocidade, clareza, dor real</div>
            <div><strong>Vulnerabilidades:</strong> moat, retenção, CAC</div>
            <div><strong>Veredicto:</strong> tem potencial, mas precisa provar retenção e diferenciação defensável.</div>
          </div>
        </section>
      </main>
    </div>
  );
}
