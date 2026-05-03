import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";

const ACTION_PLAN = [
  {
    score: "9,2+",
    title: "1. Proposta de valor",
    objective: "Transformar o produto em uma categoria própria: sistema de construção guiada, não gerador de documentos.",
    moves: [
      "Definir promessa única e específica: da ideia ao plano executável em 6 fases com saída padronizada e auditável.",
      "Amarrar o JTBD dominante em 1 frase: 'quero sair do caos e saber exatamente o que construir agora'.",
      "Adicionar prova concreta de resultado: antes/depois, ROI estimado, tempo economizado e checklist de decisão.",
      "Especializar por nicho inicial (founders B2B tech) até virar a melhor opção para esse segmento.",
    ],
    proof: "Validar com 20 entrevistas, 10 casos reais e um benchmark de tempo/qualidade versus alternativa manual.",
  },
  {
    score: "9,2+",
    title: "2. Moat & vantagens competitivas",
    objective: "Criar defensabilidade por dados, workflow e contexto proprietário acumulado.",
    moves: [
      "Capturar dados estruturados de briefing, decisões, artefatos aceitos e resultados pós-lançamento.",
      "Criar flywheel: mais projetos → melhor geração → melhores decisões → mais retenção → mais dados.",
      "Desenvolver formatos e templates proprietários por vertical, com forte custo de troca.",
      "Construir marca de categoria e distribuição de autoridade para dificultar cópia por players genéricos.",
    ],
    proof: "Medir retenção por projeto, taxa de reuso de artefatos e aumento de qualidade por coorte.",
  },
  {
    score: "9,2+",
    title: "3. Engajamento & retenção",
    objective: "Trocar uso episódico por loop recorrente e progressão clara de maturidade.",
    moves: [
      "Adicionar hábitos estruturais: check-ins semanais, revisão automática e alertas de próxima etapa.",
      "Exibir progresso visível e status do projeto como painel operacional vivo, não só biblioteca de arquivos.",
      "Criar camadas: casual → power → time → defensor, com benefícios reais em cada estágio.",
      "Inserir capital social positivo: compartilhamento de artefatos, validação de time e sensação de avanço.",
    ],
    proof: "Medir retenção D7/D30, frequência de retorno por projeto e percentual de usuários que criam 2+ projetos.",
  },
  {
    score: "9,2+",
    title: "4. Mercado & timing",
    objective: "Concentrar o mercado inicial onde a dor é máxima e a disposição a pagar é clara.",
    moves: [
      "Escolher beachhead único: founders early-stage de SaaS B2B, com expansão posterior para agências e consultorias.",
      "Comunicar economia de tempo + redução de risco + velocidade de execução como tripé de compra.",
      "Explorar o timing de LLMs e a pressão por velocidade como janela de entrada, não como diferencial sozinho.",
      "Preparar expansão por segmento apenas após dominar o primeiro nicho com alta penetração.",
    ],
    proof: "Validar TAM/SAM/SOM com dados de conversão por nicho e CAC aceitável em canal orgânico.",
  },
  {
    score: "9,2+",
    title: "5. Receita & unit economics",
    objective: "Aumentar ARPU, reduzir CAC e proteger margem com eficiência operacional.",
    moves: [
      "Reprecificar por valor: tiers por projetos, time, volume de IA e acesso a Advisor estratégico.",
      "Criar expansão orgânica via upsell de time, multi-projeto, exportação e automações premium.",
      "Limitar custo de inferência com cache, batching, modelos por tarefa e quotas inteligentes.",
      "Aumentar conversão com prova de ROI, trial guiado e upgrade dentro do fluxo de uso.",
    ],
    proof: "Acompanhar CAC, LTV, payback e margem de contribuição por coorte e por canal.",
  },
  {
    score: "9,2+",
    title: "6. Go-to-market & distribuição",
    objective: "Construir um motor PLG + conteúdo + comunidade com distribuição própria.",
    moves: [
      "Criar conteúdo de alta intenção: dores específicas, comparativos e playbooks de fundação.",
      "Transformar artefatos em ativos compartilháveis para gerar aquisição por exposição natural.",
      "Usar comunidade e parceiros como aceleradores, não como dependência central.",
      "Rodar o motion: nicho → profundidade → prova → expansão, evitando atacar o mainstream cedo demais.",
    ],
    proof: "Acompanhar CAC por canal, share orgânico, taxa de convite e conversão de conteúdo para signup.",
  },
  {
    score: "9,2+",
    title: "7. Riscos críticos",
    objective: "Reduzir fragilidade competitiva, regulatória e financeira com execução disciplinada.",
    moves: [
      "Blindar contra big tech com workflow proprietário, dados próprios e velocidade de iteração.",
      "Mitigar risco regulatório com políticas claras de privacidade, LGPD e governança de dados.",
      "Evitar concentração excessiva em poucos clientes ou em um único fornecedor de modelo.",
      "Stress-testar cenários adversos: recessão, compressão de CAC e deterioração de qualidade de IA.",
    ],
    proof: "Definir gatilhos de risco, limites de exposição e planos de contingência por cenário.",
  },
];

const PRIORITIES = [
  "1) Nicho único: founders B2B early-stage.",
  "2) Workflow proprietário com dados estruturados.",
  "3) Retenção por uso recorrente e progresso visível.",
  "4) Monetização por valor e expansão de conta.",
  "5) Distribuição por conteúdo e ativos compartilháveis.",
];

export function MarketAnalysisPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card/50 sticky top-0 z-10 backdrop-blur">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            ← Início
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link href="/pricing" className="text-sm text-primary hover:underline font-medium">
              Ver planos →
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 space-y-10">
        <div className="max-w-4xl">
          <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mb-3">Plano de ação</p>
          <h1 className="text-4xl md:text-5xl font-serif text-foreground mb-4">Como levar todos os scores para 9,2+</h1>
          <p className="text-muted-foreground text-lg leading-relaxed mb-6">
            A prioridade não é melhorar tudo ao mesmo tempo; é criar alavancas que elevem defensabilidade, retenção e monetização em sequência.
          </p>
        </div>

        <section className="bg-card border border-card-border rounded-2xl p-6">
          <h2 className="text-xl font-serif text-foreground mb-4">Ordem de execução</h2>
          <ol className="grid gap-2 text-sm text-foreground">
            {PRIORITIES.map((item) => (
              <li key={item} className="flex gap-2">
                <span className="text-primary">•</span>
                <span>{item}</span>
              </li>
            ))}
          </ol>
        </section>

        <div className="grid gap-6">
          {ACTION_PLAN.map((d) => (
            <section key={d.title} className="bg-card border border-card-border rounded-2xl p-6">
              <div className="flex items-start justify-between gap-4 mb-4">
                <div>
                  <div className="text-xs font-mono text-primary uppercase tracking-[0.2em] mb-1">{d.score}</div>
                  <h2 className="text-xl font-serif text-foreground mb-1">{d.title}</h2>
                  <p className="text-sm text-muted-foreground">{d.objective}</p>
                </div>
              </div>
              <div className="grid gap-5 md:grid-cols-[1.3fr_0.7fr]">
                <ul className="space-y-2">
                  {d.moves.map((p) => (
                    <li key={p} className="text-sm text-foreground leading-relaxed flex gap-2">
                      <span className="text-primary mt-1">•</span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-primary/5 border border-primary/15 rounded-xl p-4">
                  <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mb-2">Validação</p>
                  <p className="text-sm text-foreground leading-relaxed">{d.proof}</p>
                </div>
              </div>
            </section>
          ))}
        </div>

        <section className="mt-2 bg-primary/5 border border-primary/15 rounded-2xl p-6">
          <h2 className="text-2xl font-serif text-foreground mb-4">Síntese executiva</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 text-sm">
            <div><strong>Meta:</strong> elevar cada dimensão com uma alavanca específica, não com branding genérico.</div>
            <div><strong>Estratégia:</strong> nicho estreito, dados próprios, retenção recorrente e monetização por valor.</div>
            <div><strong>Risco principal:</strong> virar ferramenta bonita sem defensabilidade operacional.</div>
            <div><strong>Critério de sucesso:</strong> provar repetição de uso, expansão de conta e custo de troca alto.</div>
          </div>
        </section>
      </main>
    </div>
  );
}
