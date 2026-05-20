import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MarketingVideo } from "@/components/marketing-video";
import { ThemeToggle } from "@/components/theme-toggle";

const STATS = [
  { value: "7", label: "fases" },
  { value: "45+", label: "artefatos" },
  { value: "100%", label: "estruturado" },
];

const PHASES = [
  { num: 1, name: "Ideia", icon: "◈", desc: "Validação e potencial", artifacts: "8 artefatos" },
  { num: 2, name: "PRD", icon: "◈", desc: "Definição de produto", artifacts: "7 artefatos" },
  { num: 3, name: "Segurança", icon: "◈", desc: "LGPD e privacidade", artifacts: "6 artefatos" },
  { num: 4, name: "Spec", icon: "◈", desc: "Arquitetura técnica", artifacts: "8 artefatos" },
  { num: 5, name: "Implementação", icon: "◈", desc: "Plano de execução", artifacts: "7 artefatos" },
  { num: 6, name: "Teste", icon: "◈", desc: "QA e validação", artifacts: "7 artefatos" },
  { num: 7, name: "Deploy", icon: "◈", desc: "Lançamento real", artifacts: "7 artefatos" },
];

const FEATURES = [
  {
    step: "01",
    icon: "◎",
    title: "Audite sua ideia — ou o que já existe",
    desc: "Lean Canvas, JTBD, análise competitiva e Score de Potencial — a IA processa o que você tem e mapeia o que falta antes de qualquer decisão cara.",
    tag: "Fase 1 — Diagnóstico de Ideia",
  },
  {
    step: "02",
    icon: "◎",
    title: "Especifique com precisão",
    desc: "PRD completo, personas, 15 user stories, estratégia de pricing, roadmap trimestral. O produto inteiro estruturado em minutos — com ou sem versão anterior.",
    tag: "Fase 2 — PRD",
  },
  {
    step: "03",
    icon: "◎",
    title: "Segurança e LGPD sem lacunas",
    desc: "Threat model, matriz RBAC, política de privacidade e plano de conformidade LGPD — gerados para o seu produto real, não para um template genérico.",
    tag: "Fase 3 — Segurança & LGPD",
  },
  {
    step: "04",
    icon: "◎",
    title: "Arquitetura documentada",
    desc: "Modelo de dados, contratos de API, ADRs no padrão Michael Nygard e plano de segurança técnica. Chegue ao dev com tudo documentado e sem ambiguidades.",
    tag: "Fase 4 — Spec",
  },
  {
    step: "05",
    icon: "◎",
    title: "Construa e valide com rigor",
    desc: "Plano de milestones, sprint detalhado, plano de testes com 20 casos críticos e script de teste com usuários reais.",
    tag: "Fases 5–6 — Impl. & Teste",
  },
  {
    step: "06",
    icon: "◎",
    title: "Lance com estratégia",
    desc: "Runbook de deploy, plano Go-to-Market, Launch Checklist e Pitch para investidores. Do produto validado ao mercado — sem improvisar.",
    tag: "Fase 7 — Deploy",
  },
];

const TESTIMONIALS = [
  {
    quote: "Levei 3 dias para ter um PRD que meu dev conseguiu usar de verdade. Antes disso ficava rodando em círculos no Notion por semanas.",
    name: "Rodrigo Almeida",
    role: "Co-founder, Contlify (SaaS fiscal)",
    initials: "RA",
    plan: "Plano Avançado",
  },
  {
    quote: "A fase de validação me salvou de construir o produto errado. Descobri na Fase 1 que meu público-alvo real era completamente diferente do que eu imaginava.",
    name: "Mariana Luz",
    role: "Founder, CareerSpark (HR Tech)",
    initials: "ML",
    plan: "Plano Pro",
  },
  {
    quote: "Fui ao investidor com o deck + PRD + análise competitiva gerados aqui. O termo sheet veio duas semanas depois. Qualidade enterprise, custo de founder solo.",
    name: "Felipe Magno",
    role: "CEO, Stockly (Logística)",
    initials: "FM",
    plan: "Plano Avançado",
  },
];

const VALUE_CARDS = [
  {
    title: "Diagnóstico imediato",
    text: "Calibre o que você já construiu em minutos.",
    detail: "Traga o briefing do que você tem. A IA mapeia mercado, público-alvo, hipóteses e riscos — revelando o que está sólido e o que precisa de atenção.",
    href: "/clareza-imediata",
    cta: "Entender a metodologia →",
  },
  {
    title: "Fluxo contínuo",
    text: "Cada fase alimenta a próxima — sem lacunas de contexto.",
    detail: "Os artefatos de uma fase viram insumo da próxima. Você sai de cada etapa sabendo exatamente o que fazer agora.",
    href: "/fluxo-continuo",
    cta: "Ver como funciona →",
  },
  {
    title: "Pronto para vender",
    text: "Artefatos compartilháveis que apoiam decisão e execução.",
    detail: "PRD, personas, arquitetura, go-to-market — tudo exportável e apresentável para investidores, parceiros e dev.",
    href: "/pronto-para-vender",
    cta: "Ver os artefatos →",
  },
];

const CTA_CARDS = [
  {
    title: "Comece grátis",
    text: "Teste o fluxo e veja valor antes de decidir.",
    detail: "Sem cartão de crédito. Traga o que você tem, rode as 3 primeiras fases completas e veja os artefatos gerados para o seu produto.",
    href: "/sign-up",
    cta: "Criar conta →",
  },
  {
    title: "Veja os planos",
    text: "Escolha entre grátis, Pro e Avançado.",
    detail: "Do founder solo ao time de produto. Cada plano desbloqueia mais fases, artefatos e capacidade de geração de IA.",
    href: "/pricing",
    cta: "Ver preços →",
  },
  {
    title: "Entre no app",
    text: "Se já tem conta, continue construindo.",
    detail: "Seus projetos ficam salvos. Retome de onde parou e continue evoluindo cada fase no seu ritmo.",
    href: "/sign-in",
    cta: "Acessar →",
  },
];


const PRD_SECTIONS = [
  {
    heading: "Visão do Produto",
    content: `QuantumSaaS é uma plataforma de análise preditiva para gestores de e-commerce de médio porte que desejam antecipar tendências de demanda e otimizar estoques. A plataforma conecta-se às principais ferramentas do mercado (VTEX, Shopify, WooCommerce) e entrega previsões de demanda com horizonte de 90 dias, identificação automática de produtos em risco de ruptura e sugestões de reposição baseadas em sazonalidade e histórico.\n\nProblema central: gestores tomam decisões de compra com base em feeling ou planilhas manuais, gerando excesso em alguns SKUs e ruptura em outros — impactando receita e satisfação do cliente. Solução: motor de ML treinado com dados históricos do cliente + variáveis externas (feriados, eventos, tendências de busca) + interface de decisão clara e acionável.`,
  },
  {
    heading: "Personas",
    content: `1. Marina — Gestora de E-commerce (Usuária Principal)\nIdade: 34 anos. Gerente de Operações de E-commerce em varejista de moda com ticket médio R$180 e 15 mil SKUs ativos. Passa 3h/semana em reuniões de S&OP sem dados confiáveis; perde vendas por ruptura nas datas-chave. Objetivo: visibilidade de demanda 60–90 dias à frente sem precisar de analista de dados. Critério de sucesso: reduzir ruptura de estoque em 30% no primeiro trimestre.\n\n2. Rafael — CTO / Head de TI (Comprador Econômico)\nIdade: 29 anos. CTO de startup de e-commerce D2C de cosméticos, 2.000 pedidos/dia. Não quer manter pipeline de dados internamente. Objetivo: integração rápida (< 1 dia), API REST documentada, zero overhead de infraestrutura. Critério de sucesso: go-live em menos de 48h, SLA 99,9% de uptime.\n\n3. Carla — Analista de Marketing (Usuária Secundária)\nIdade: 27 anos. Analista de Mídia Paga em agência que gerencia 8 clientes de e-commerce. Campanha de remarketing desperdiça budget em produtos sem estoque. Objetivo: sincronizar campanhas de mídia com previsão de disponibilidade. Critério de sucesso: reduzir CPA em 15% ao evitar anunciar SKUs em risco de ruptura.`,
  },
  {
    heading: "User Stories (15)",
    content: `1. Como Marina, quero ver um dashboard com os top 20 SKUs em risco de ruptura nos próximos 30 dias, para priorizar pedidos de reposição.\n2. Como Marina, quero receber alertas por e-mail quando um SKU atingir menos de 15 dias de cobertura de estoque, para agir antes da ruptura.\n3. Como Rafael, quero uma API REST com autenticação OAuth 2.0 e documentação OpenAPI 3.0 completa, para integrar com nosso ERP em menos de 8 horas.\n4. Como Rafael, quero um webhook configurável que dispare quando a previsão de um SKU mudar mais de 20%, para acionar automações no sistema interno.\n5. Como Carla, quero exportar a lista de SKUs com estoque previsto > 30 dias para pausar campanhas associadas via Meta Ads API.\n6. Como Marina, quero comparar a previsão do modelo com as vendas reais da semana anterior, para calibrar minha confiança nas projeções.\n7. Como Rafael, quero que todos os dados sejam armazenados em servidores no Brasil (LGPD Art. 33), com certificação SOC 2 Type II.\n8. Como Marina, quero filtrar previsões por categoria, fornecedor e canal de vendas, para análises mais granulares.\n9. Como Carla, quero receber um relatório semanal automático em PDF com os SKUs críticos de cada cliente, para apresentações de resultado.\n10. Como Rafael, quero um painel de monitoramento de saúde da integração com alertas de falha de sincronização.\n11. Como Marina, quero simular cenários de demanda (ex: promoção de 20% em outubro) para dimensionar estoque antes da campanha.\n12. Como Marina, quero importar histórico de vendas dos últimos 36 meses via CSV, para o modelo ter dados suficientes desde o primeiro uso.\n13. Como Rafael, quero gerenciar permissões por perfil (admin, viewer, integração) para controlar o acesso entre equipes.\n14. Como Carla, quero uma extensão de Chrome que mostre a cobertura de estoque prevista enquanto navego no painel do Meta Ads.\n15. Como Marina, quero que o modelo re-treine automaticamente toda semana com os dados mais recentes, sem intervenção manual.`,
  },
  {
    heading: "Estratégia de Pricing",
    content: `Free — R$0/mês: até 500 SKUs, 1 integração. Público: validação e testes.\nStarter — R$249/mês: até 5.000 SKUs, 3 integrações. Público: e-commerces em crescimento.\nGrowth — R$749/mês: até 30.000 SKUs, integrações ilimitadas. Público: operações consolidadas.\nEnterprise — sob consulta: SKUs ilimitados, SLA dedicado. Público: grandes varejistas.\n\nCobrança mensal com desconto de 20% no plano anual. Expansão via upsell de integrações premium (ERP SAP, Oracle) e módulo de simulação de cenários.`,
  },
  {
    heading: "Roadmap Q1–Q4 2025",
    content: `Q1 — MVP: Integração com Shopify e WooCommerce, dashboard de risco de ruptura (top 20 SKUs), alertas por e-mail, previsão com horizonte de 30 dias.\n\nQ2 — Expansão de Integrações: Integração com VTEX e Bling, webhook configurável, API REST com documentação OpenAPI 3.0, extensão Chrome em beta fechado.\n\nQ3 — Inteligência: Simulador de cenários (promoções, sazonalidade), re-treinamento automático semanal, relatório em PDF automático, módulo de comparação previsão vs. realizado.\n\nQ4 — Enterprise: Integrações ERP (SAP, Oracle em beta), painel multi-cliente para agências, certificação SOC 2 Type II, SLA dedicado e suporte Premium.`,
  },
];

function PrdDialog({ trigger }: { trigger: React.ReactNode }) {
  return (
    <Dialog>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-y-auto"
        aria-labelledby="prd-dialog-title"
      >
        <DialogHeader>
          <DialogTitle id="prd-dialog-title" className="font-serif text-xl text-foreground">
            Exemplo de PRD — QuantumSaaS
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Gerado pela FoundersFlow a partir de um briefing de 3 parágrafos. Editável e exportável em Markdown.
          </p>
        </DialogHeader>
        <div className="mt-4 space-y-6">
          {PRD_SECTIONS.map((section) => (
            <div key={section.heading}>
              <h3 className="font-serif text-base font-semibold text-foreground mb-2 pb-1 border-b border-border/60">
                {section.heading}
              </h3>
              <div className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
                {section.content}
              </div>
            </div>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}

const PREVIEW_TABS = [
  { id: "lean-canvas", label: "Lean Canvas" },
  { id: "prd", label: "PRD & Personas" },
  { id: "gtm", label: "Go-to-Market" },
  { id: "coerencia", label: "Score de Coerência" },
];

const PREVIEW_CONTENT: Record<string, React.ReactNode> = {
  "lean-canvas": (
    <div className="space-y-0">
      <p className="text-xs font-mono text-primary mb-4 uppercase tracking-wider">Lean Canvas — Fintrack (gestão financeira para MEIs)</p>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Problema", text: "MEIs perdem R$3–8k/ano por falta de controle financeiro. 68% pagam DAS com atraso por esquecimento. Contador cobra R$300/mês para tarefas automatizáveis." },
          { label: "Solução", text: "App que sincroniza todas as contas via Open Finance, calcula DAS automaticamente e gera relatório de IR com 1 clique." },
          { label: "Proposta de Valor", text: "O único app financeiro feito 100% para MEI — que conecta seu banco, calcula seus impostos e nunca deixa você perder prazo.", highlight: true },
          { label: "Segmentos", text: "MEIs de serviços digitais (dev, design, redação), 25–42 anos, faturamento R$40k–120k/ano, já usam apps de banco digital." },
          { label: "Canais", text: "SEO \"MEI imposto\", parcerias com contadores, YouTube sobre gestão MEI, ads no Instagram Stories." },
          { label: "Receita", text: "Freemium: grátis até 2 contas. Pro: R$29/mês. LTV médio estimado: R$290/ano. Meta CAC: abaixo de R$85." },
          { label: "Custos", text: "AWS + Open Finance APIs: R$1.2k/mês. Time inicial: 2 devs + 1 designer: R$18k/mês." },
          { label: "Métricas-chave", text: "% usuários com ≥1 conta conectada, churn mensal, NPS, DAS pago em dia pelos usuários." },
          { label: "Vantagem Injusta", text: "Parceria com Banco Inter e Nubank para onboarding integrado — sem tela de login, conta já conectada ao abrir o app." },
        ].map((b) => (
          <div key={b.label} className={`rounded-lg p-3 text-left ${b.highlight ? "border-primary/40 bg-primary/5 border" : "border border-border bg-background"}`}>
            <div className="text-[10px] font-bold text-primary uppercase tracking-widest mb-1">{b.label}</div>
            <div className="text-[11px] text-foreground leading-snug">{b.text}</div>
          </div>
        ))}
      </div>
    </div>
  ),
  "prd": (
    <div className="space-y-5">
      <p className="text-xs font-mono text-primary uppercase tracking-wider">Personas — geradas pela IA para Fintrack</p>
      {[
        { name: "Marcos, 31", role: "Dev freelancer MEI", pain: "Perde horas no Carnê Leão todo mês. Já levou multa de 20% por atraso no DAS.", need: "Automação total — não quer pensar em imposto, quer só trabalhar.", quote: "\"Eu sei programar sistemas financeiros mas não consigo controlar meu próprio dinheiro.\"" },
        { name: "Amanda, 38", role: "Designer UX MEI", pain: "Tem 3 contas bancárias e não sabe qual está sobrando dinheiro. Nunca sabe se pode aceitar um projeto novo.", need: "Visibilidade em tempo real do fluxo de caixa consolidado.", quote: "\"Meu contador só me fala o que aconteceu. Eu quero saber o que vai acontecer.\"" },
      ].map((p) => (
        <div key={p.name} className="border border-border rounded-xl p-4 bg-background">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center text-sm font-bold text-primary">{p.name[0]}</div>
            <div><div className="text-sm font-medium text-foreground">{p.name}</div><div className="text-xs text-muted-foreground">{p.role}</div></div>
          </div>
          <div className="space-y-2 text-xs text-foreground">
            <p><span className="text-muted-foreground font-medium">Dor: </span>{p.pain}</p>
            <p><span className="text-muted-foreground font-medium">Necessidade: </span>{p.need}</p>
            <p className="italic text-muted-foreground">{p.quote}</p>
          </div>
        </div>
      ))}
    </div>
  ),
  "gtm": (
    <div className="space-y-4">
      <p className="text-xs font-mono text-primary uppercase tracking-wider">Go-to-Market — Fintrack — 90 dias</p>
      {[
        { phase: "Dias 1–30 — Validação fechada", items: ["50 MEIs recrutados via grupos de dev e design no WhatsApp", "Entrevistas de descoberta com roteiro de 45 min (JTBD)", "Meta: 30% dos entrevistados dizem \"quando lança?\" espontaneamente", "Critério de avanço: ≥3 MEIs pagam R$29/mês antes do MVP pronto"] },
        { phase: "Dias 31–60 — Beta privado", items: ["MVP com Open Finance Fase 2, cálculo DAS automático, dashboard", "200 usuários beta via lista de espera (landing page + YouTube)", "NPS alvo ≥ 50. Churn < 5% no segundo mês", "Parceria com 3 contadores para co-marketing"] },
        { phase: "Dias 61–90 — Lançamento público", items: ["Product Hunt + comunidades (IndieHackers BR, Comunidade MEI)", "R$5k em Google Ads direcionado a buscas \"MEI imposto\"", "Meta: 500 usuários ativos, 80 pagantes, MRR de R$2.3k"] },
      ].map((p) => (
        <div key={p.phase} className="border border-border rounded-xl p-4 bg-background">
          <div className="text-xs font-semibold text-foreground mb-2">{p.phase}</div>
          <ul className="space-y-1">
            {p.items.map((item, i) => (
              <li key={i} className="text-xs text-muted-foreground flex gap-2"><span className="text-primary mt-0.5">·</span>{item}</li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  ),
  "coerencia": (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="text-center">
          <div className="text-5xl font-bold font-serif text-emerald-600">87</div>
          <div className="text-xs text-muted-foreground mt-1">Score de Coerência</div>
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-medium">Coeso</span>
            <span className="text-xs text-muted-foreground">Artefatos bem alinhados entre si</span>
          </div>
          <p className="text-sm text-foreground leading-relaxed">O projeto apresenta excelente coerência entre proposta de valor, segmentos e canais. O diferencial de Open Finance está consistentemente refletido no PRD e no GTM.</p>
        </div>
      </div>
      <div className="border-t border-border pt-4 space-y-3">
        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">1 conflito detectado</p>
        <div className="flex items-start gap-2.5">
          <span className="mt-1.5 flex-shrink-0 w-2 h-2 rounded-full bg-amber-500" />
          <div>
            <p className="text-xs text-foreground">O modelo freemium define limite de 2 contas bancárias, mas a persona Marcos usa 4 contas. O limite pode bloquear a conversão do usuário principal.</p>
            <p className="text-xs text-muted-foreground mt-0.5">HIPOTESE_PRICING · PERSONAS</p>
          </div>
        </div>
        <p className="text-xs text-primary mt-3">→ Sugestão: testar limite de 3 contas no freemium ou mudar critério para volume de transações.</p>
      </div>
    </div>
  ),
};

export function Home() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");
  const [activePreviewTab, setActivePreviewTab] = useState("lean-canvas");

  return (
    <>
    <Helmet>
      <title>FoundersFlow — Da ideia ao lançamento em 7 fases</title>
      <meta name="description" content="Plataforma com IA para founders: valide sua ideia, defina estratégia e lance seu produto em 7 fases estruturadas. PRD, personas, arquitetura e go-to-market gerados automaticamente." />
      <link rel="canonical" href="https://www.foundersflow.com.br/" />
    </Helmet>
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(26,63,171,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,140,66,0.12),transparent_28%),linear-gradient(to_bottom,rgba(255,255,255,0.65),transparent_18%)]" />
      </div>

      {/* Skip to content */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary focus:text-primary-foreground focus:rounded-lg focus:text-sm focus:font-medium focus-visible:ring-2 focus-visible:ring-primary"
      >
        Pular para o conteúdo principal
      </a>

      {/* ── Header ── */}
      <header className="py-4 px-6 md:px-8 flex justify-between items-center border-b border-border/60 bg-background/75 sticky top-0 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img src={`${base}/logo.png`} alt="Logotipo FoundersFlow" className="w-8 h-8 rounded-full" />
          <div className="leading-tight">
            <span className="font-serif text-base font-semibold text-foreground tracking-tight block">FoundersFlow</span>
          </div>
        </div>
        <nav className="flex gap-1 items-center">
          <Link href="/privacidade" className="text-muted-foreground hover:text-foreground text-sm px-3 py-1.5 rounded-md hover:bg-muted/60 transition-all hidden md:inline-block">Privacidade</Link>
          <ThemeToggle size={16} />
          <Link href="/sign-in" className="text-muted-foreground hover:text-foreground text-sm font-medium px-3 py-1.5 rounded-md hover:bg-muted/60 transition-all focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 rounded-md outline-none">Entrar</Link>
          <Link href="/sign-up" aria-label="Analisar meu projeto" className="bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-medium py-1.5 px-4 rounded-lg transition-all duration-300 ml-1 font-semibold focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none">Analisar meu projeto</Link>
        </nav>
      </header>

      <main id="main-content" className="flex-1 flex flex-col">

        {/* ── Hero ── */}
        <section className="relative px-6 pt-20 pb-20 overflow-hidden">
          <div className="hero-glow" />
          <div className="hero-grid" />

          <div className="relative z-10 max-w-6xl mx-auto w-full grid lg:grid-cols-[1.2fr_0.8fr] gap-8 lg:gap-12 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-foreground leading-[0.94] tracking-tight mb-8">
              Você já<br />
              começou.<br />
              <span className="text-primary underline underline-offset-4 decoration-accent decoration-4">Na direção certa?</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-3 max-w-2xl font-sans leading-relaxed">
              Em 7 fases estruturadas, a IA <strong className="text-foreground font-semibold">audita o que você já construiu</strong>, valida suas hipóteses e gera os artefatos que alimentam cada próxima decisão — PRD, personas, arquitetura, go-to-market.
              Sem achismo. Sem retrabalho caro.
              </p>

              <div className="inline-flex items-center gap-2.5 bg-card/80 border border-border/60 rounded-full px-4 py-2 mb-5 backdrop-blur-sm">
                <span className="text-[11px] font-mono text-muted-foreground uppercase tracking-widest">vs ChatGPT</span>
                <span className="w-px h-3 bg-border" />
                <span className="text-xs text-foreground font-medium">O ChatGPT te dá uma resposta. A FoundersFlow audita seu produto.</span>
              </div>

              <p className="text-sm text-muted-foreground/70 italic max-w-[540px] mb-10 leading-relaxed mx-auto lg:mx-0">
                Não importa onde você está. As primeiras fases calibram o que você já construiu. As seguintes aceleram o que vem a seguir.
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-3 gap-0 divide-x divide-border/60 mb-12 max-w-3xl lg:max-w-none bg-card/70 backdrop-blur-sm border border-border/60 rounded-2xl overflow-hidden">
              {STATS.map((stat, i) => (
                <div key={i} className="text-center px-6 py-5">
                    <div className="stat-shimmer text-3xl font-bold font-serif">{stat.value}</div>
                    <div className="text-sm text-muted-foreground font-mono uppercase tracking-widest mt-0.5">{stat.label}</div>
                </div>
              ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-3 items-center justify-center lg:justify-start">
              <Link href="/sign-up">
                <Button
                  aria-label="Analisar meu projeto agora"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold py-3 px-8 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-lg hover:shadow-xl hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none"
                >
                  Analisar meu projeto agora →
                </Button>
              </Link>
              <PrdDialog
                trigger={
                  <Button
                    variant="ghost"
                    className="text-sm text-muted-foreground border border-border/60 hover:bg-muted/60 hover:text-foreground transition-all duration-300 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
                  >
                    Ver o que a IA gera →
                  </Button>
                }
              />
              </div>
              <p className="text-sm text-muted-foreground/70 mt-4 font-mono">SEM CARTÃO DE CRÉDITO · 3 FASES GRATUITAS COMPLETAS</p>
              <p className="text-xs text-muted-foreground/50 mt-1.5 flex items-center gap-1.5 justify-center lg:justify-start">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                Dados criptografados · LGPD · Nunca treinamos IA com seu conteúdo
              </p>
            </div>

            {/* ── Hero Mockup (right column, desktop) ── */}
            <div className="hidden lg:block relative animate-hero-mockup">
              {/* Glow behind */}
              <div className="absolute inset-0 -m-8 bg-primary/10 blur-3xl rounded-full pointer-events-none" />
              {/* Browser frame card */}
              <div className="relative rotate-[-1.5deg] rounded-2xl border border-border/50 bg-card/80 backdrop-blur-md shadow-2xl shadow-primary/10 overflow-hidden">
                {/* Browser chrome */}
                <div className="bg-muted/60 border-b border-border/50 px-4 py-3 flex items-center gap-3">
                  <div className="flex gap-1.5 flex-shrink-0">
                    <div className="w-3 h-3 rounded-full bg-red-400/70" />
                    <div className="w-3 h-3 rounded-full bg-yellow-400/70" />
                    <div className="w-3 h-3 rounded-full bg-green-400/70" />
                  </div>
                  <div className="flex-1 bg-background/50 rounded-md px-3 py-1 text-[11px] font-mono text-muted-foreground/50 truncate">
                    app.foundersflow.com.br/p/quantum-saas/prd
                  </div>
                </div>
                {/* Document content */}
                <div className="p-5 space-y-4 relative max-h-[360px] overflow-hidden">
                  <div>
                    <div className="text-[10px] font-mono text-primary/60 uppercase tracking-widest mb-1">PRD — Fase 2</div>
                    <h3 className="font-serif text-lg text-foreground leading-tight">QuantumSaaS</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">Gerado em 12s · 4.200 palavras · Exportável</p>
                  </div>
                  <div className="space-y-3">
                    {[
                      { label: "Visão do Produto", preview: "Plataforma de análise preditiva para gestores de e-commerce que desejam antecipar demanda e otimizar estoques..." },
                      { label: "Personas (3)", preview: "Marina — Gestora de E-commerce  ·  Rafael — CTO  ·  Carla — Analista de Marketing" },
                      { label: "User Stories (15)", preview: "Como Marina, quero ver os top 20 SKUs em risco de ruptura nos próximos 30 dias, para priorizar pedidos..." },
                      { label: "Estratégia de Pricing", preview: "Free · Starter R$249/mês · Growth R$749/mês · Enterprise sob consulta" },
                      { label: "Roadmap Q1–Q4", preview: "Q1: MVP com Shopify e WooCommerce  ·  Q2: VTEX e API REST  ·  Q3: Simulador  ·  Q4: Enterprise" },
                    ].map((item) => (
                      <div key={item.label} className="border-l-2 border-primary/20 pl-3">
                        <div className="text-[11px] font-semibold font-mono text-primary/70 uppercase tracking-wider mb-0.5">{item.label}</div>
                        <p className="text-xs text-muted-foreground leading-relaxed">{item.preview}</p>
                      </div>
                    ))}
                  </div>
                  {/* Gradient fade suggesting more content */}
                  <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-card/95 to-transparent pointer-events-none" />
                </div>
                {/* Footer hint */}
                <div className="px-5 py-3 border-t border-border/40 bg-muted/30 flex items-center justify-between">
                  <span className="text-[11px] font-mono text-muted-foreground/60">45 artefatos gerados</span>
                  <span className="text-[11px] font-mono text-primary/60">↓ Exportar Markdown</span>
                </div>
              </div>
            </div>

          </div>
        </section>

        <section className="px-6 pb-8">
          <div className="max-w-6xl mx-auto grid gap-4 md:grid-cols-3">
            {VALUE_CARDS.map((card) => (
              <Link key={card.title} href={card.href} className="glass-card rounded-2xl p-6 flex flex-col gap-3 group hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none">
                <div className="text-sm font-mono uppercase tracking-[0.18em] text-primary">{card.title}</div>
                <p className="text-base font-medium text-foreground leading-snug">{card.text}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.detail}</p>
                <div className="mt-auto pt-2 text-sm font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-200">{card.cta}</div>
              </Link>
            ))}
          </div>
        </section>

        <section className="px-6 pb-8">
          <div className="max-w-6xl mx-auto grid gap-4 md:grid-cols-3">
            {CTA_CARDS.map((card) => (
              <Link key={card.title} href={card.href} className="glass-card rounded-2xl p-6 flex flex-col gap-3 group hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] cursor-pointer focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none">
                <div className="text-sm font-mono uppercase tracking-[0.18em] text-primary">{card.title}</div>
                <p className="text-base font-medium text-foreground leading-snug">{card.text}</p>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.detail}</p>
                <div className="mt-auto pt-2 text-sm font-medium text-primary group-hover:underline underline-offset-2 transition-all duration-200">{card.cta}</div>
              </Link>
            ))}
          </div>
        </section>


        {/* ── Pipeline Visual ── */}
        <section className="py-20 px-4 border-y border-border/50 bg-muted/20">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-sm font-mono font-semibold text-primary uppercase tracking-[0.2em] mb-3">PIPELINE</p>
              <h2 className="text-3xl md:text-4xl font-serif text-foreground">Do diagnóstico ao lançamento</h2>
            </div>

            {/* Desktop pipeline */}
            <div className="hidden md:grid grid-cols-7 gap-0 relative">
              {/* Connector line */}
              <div className="absolute top-[26px] left-[7.14%] right-[7.14%] h-px bg-gradient-to-r from-primary/15 via-primary/35 to-primary/15" />

              {PHASES.map((phase, i) => (
                <div key={i} className="flex flex-col items-center relative group">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold font-mono z-10 mb-3 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] border-2 ${
                    i === 0
                      ? "bg-primary border-primary text-primary-foreground phase-node-active"
                      : "bg-card border-border text-muted-foreground group-hover:border-primary/40 group-hover:text-primary"
                  }`}>
                    {phase.num}
                  </div>
                  <div className="text-sm font-semibold text-foreground text-center uppercase tracking-wider mb-1 whitespace-nowrap">{phase.name}</div>
                  <div className="text-[13px] text-muted-foreground text-center leading-tight mb-1 whitespace-nowrap">{phase.desc}</div>
                  <div className="text-[13px] font-mono text-primary/60 text-center whitespace-nowrap">{phase.artifacts}</div>
                </div>
              ))}
            </div>

            {/* Mobile pipeline */}
            <div className="md:hidden space-y-3">
              {PHASES.map((phase, i) => (
                <div key={i} className="flex items-center gap-4 glass-card rounded-2xl p-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-mono flex-shrink-0 border-2 ${
                    i === 0 ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground"
                  }`}>{phase.num}</div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-foreground">{phase.name}</div>
                    <div className="text-xs text-muted-foreground">{phase.desc} · {phase.artifacts}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Product Preview ── */}
        <section className="py-24 px-6 bg-card/30">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-sm font-mono font-semibold text-primary uppercase tracking-[0.2em] mb-3">EXEMPLO REAL DE OUTPUT</p>
              <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-4">Veja o que a IA gera.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
                Briefing: <em className="text-foreground/80">"App de gestão financeira para MEIs — controle de caixa, cálculo de DAS e Open Finance."</em>
              </p>
            </div>
            <div className="flex gap-2 flex-wrap justify-center mb-5">
              {PREVIEW_TABS.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActivePreviewTab(tab.id)}
                  className={`px-4 py-2 text-sm rounded-lg font-medium transition-all duration-200 ${
                    activePreviewTab === tab.id
                      ? "bg-primary text-white shadow-sm"
                      : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="bg-card border border-card-border rounded-2xl overflow-hidden shadow-sm">
              <div className="flex items-center gap-3 px-5 py-3 border-b border-border/50 bg-muted/20">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-400/50" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
                </div>
                <span className="text-xs font-mono text-muted-foreground">FoundersFlow — Fase 1 — {PREVIEW_TABS.find(t => t.id === activePreviewTab)?.label}</span>
                <span className="ml-auto text-[10px] font-mono text-primary bg-primary/10 px-2 py-0.5 rounded-full">gerado por IA</span>
              </div>
              <div className="p-6 max-h-[420px] overflow-y-auto">
                {PREVIEW_CONTENT[activePreviewTab]}
              </div>
            </div>
            <div className="text-center mt-8">
              <Link href={`${base}/sign-up`}>
                <Button size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">
                  Gerar para o meu negócio →
                </Button>
              </Link>
              <p className="text-xs text-muted-foreground mt-3">Grátis para começar · 3 fases completas sem cartão de crédito</p>
            </div>
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="py-24 px-6" id="precos">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-sm font-mono font-semibold text-primary uppercase tracking-[0.2em] mb-3">PLANOS</p>
              <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">Comece grátis. Cresça quando precisar.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Sem contrato. Sem cartão de crédito para começar. Cancele a qualquer momento.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-5 items-start">
              {/* Free */}
              <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">Gratuito</p>
                  <div className="text-3xl font-serif font-bold text-foreground">R$0</div>
                  <p className="text-xs text-muted-foreground mt-1">Para sempre</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Valide sua ideia e saia da folha em branco sem gastar nada. Fases 1 a 3 completas.
                </p>
                <ul className="space-y-2 text-sm flex-1">
                  {[
                    "3 fases gratuitas (Ideia, PRD, Segurança)",
                    "1 projeto ativo",
                    "5 execuções de IA por dia",
                    "Lean Canvas, personas, LGPD embutida",
                  ].map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/5">Começar grátis →</Button>
                </Link>
              </div>

              {/* Pro — destacado */}
              <div className="glass-card rounded-2xl p-6 flex flex-col gap-4 border-primary/40 relative shadow-lg shadow-primary/5">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className="bg-primary text-white text-[11px] font-semibold px-3 py-1 rounded-full tracking-wide">MAIS POPULAR</span>
                </div>
                <div>
                  <p className="text-xs font-mono text-primary uppercase tracking-widest mb-1">Pro</p>
                  <div className="text-3xl font-serif font-bold text-foreground">R$97<span className="text-base font-sans font-normal text-muted-foreground">/mês</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Cobrado mensalmente</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Para o founder que está construindo ativamente e precisa de todas as 7 fases.
                </p>
                <ul className="space-y-2 text-sm flex-1">
                  {[
                    "Todas as 7 fases desbloqueadas",
                    "Até 10 projetos simultâneos",
                    "20 execuções de IA por dia",
                    "Copiar e baixar todos os artefatos",
                    "PRD, arquitetura, go-to-market completos",
                  ].map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground font-semibold">Começar com Pro →</Button>
                </Link>
              </div>

              {/* Avançado */}
              <div className="glass-card rounded-2xl p-6 flex flex-col gap-4">
                <div>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-widest mb-1">Avançado</p>
                  <div className="text-3xl font-serif font-bold text-foreground">R$197<span className="text-base font-sans font-normal text-muted-foreground">/mês</span></div>
                  <p className="text-xs text-muted-foreground mt-1">Cobrado mensalmente</p>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Para quem vai ao mercado com velocidade máxima — IA sem limites e AI Advisor.
                </p>
                <ul className="space-y-2 text-sm flex-1">
                  {[
                    "Tudo do plano Pro",
                    "Projetos ilimitados",
                    "IA ilimitada — sem teto diário",
                    "AI Advisor personalizado por fase",
                    "Impressão de artefatos",
                    "Prioridade no suporte",
                  ].map(f => (
                    <li key={f} className="flex items-start gap-2">
                      <span className="text-primary mt-0.5 flex-shrink-0">✓</span>
                      <span className="text-muted-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/sign-up">
                  <Button variant="outline" className="w-full border-primary/30 hover:bg-primary/5">Começar com Avançado →</Button>
                </Link>
              </div>
            </div>

            <p className="text-center text-xs text-muted-foreground mt-8">
              Cancele a qualquer momento · Sem fidelidade · Acesso mantido até o fim do período pago
            </p>
          </div>
        </section>

        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-4">Do diagnóstico ao produto estruturado.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
                Veja como a plataforma audita o que você tem e gera os artefatos que faltam — PRD, arquitetura, go-to-market e mais.
              </p>
            </div>
            <MarketingVideo />
          </div>
        </section>

        {/* ── Features ── */}
        <section className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <p className="text-sm font-mono font-semibold text-primary uppercase tracking-[0.2em] mb-3">CAPACIDADES</p>
              <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">Uma estrutura com propósito em cada etapa.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Não é gerador de texto. É auditoria estruturada — cada fase valida o que existe e gera o insumo que a próxima precisa.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {FEATURES.map((f, i) => (
                <div key={i} className="glass-card rounded-2xl p-7 group cursor-default hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]">
                  <div className="flex items-start justify-between mb-5">
                    <span className="text-xs font-mono text-primary/60 tracking-wider">{f.step}</span>
                    <span className="text-xs font-mono text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-full border border-border/60">{f.tag}</span>
                  </div>
                  <div className="text-primary text-lg mb-3 font-mono">{f.icon}</div>
                  <h3 className="font-serif text-xl mb-3 text-foreground group-hover:text-primary transition-colors duration-200">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Social Proof / Manifesto ── */}
        <section className="py-20 px-6 bg-foreground text-background relative overflow-hidden">
          {/* Background grid on dark section */}
          <div className="absolute inset-0 pointer-events-none" style={{
            backgroundImage: "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }} />
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="text-center mb-14">
              <p className="text-sm font-mono text-primary uppercase tracking-[0.2em] mb-3">RESULTADOS REAIS</p>
              <h2 className="text-3xl md:text-4xl font-serif text-background">O que dizem os founders</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="border border-background/10 rounded-2xl p-6 bg-background/6 backdrop-blur-sm hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col">
                  <div className="text-primary text-3xl font-serif mb-4 leading-none">"</div>
                  <p className="text-sm text-background/80 leading-relaxed mb-6 italic flex-1">{t.quote}</p>
                  <div className="flex items-center gap-3 border-t border-background/10 pt-4">
                    <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-primary">{t.initials}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-background leading-tight">{t.name}</div>
                      <div className="text-xs text-background/50 truncate">{t.role}</div>
                    </div>
                    <div className="text-xs font-mono text-primary/70 whitespace-nowrap">{t.plan}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA Final ── */}
        <section className="py-28 px-6 text-center relative overflow-hidden">
          <div className="hero-glow" style={{ transform: "rotate(180deg)" }} />
          <div className="relative z-10 max-w-2xl mx-auto">
            <p className="text-sm font-mono text-primary uppercase tracking-[0.2em] mb-6">SEU PRODUTO ESTÁ NA DIREÇÃO CERTA?</p>
            <h2 className="text-4xl md:text-6xl font-serif text-foreground mb-6 leading-tight">
              Seu produto merece<br />
              <span className="text-primary underline underline-offset-4 decoration-accent decoration-4">uma estrutura séria</span>.
            </h2>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
              Traga o que você já tem. A IA audita, valida e entrega o próximo passo em minutos.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
              <Link href="/sign-up">
                <Button
                  aria-label="Analisar meu projeto agora"
                  className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg font-semibold py-4 px-12 rounded-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] shadow-xl hover:shadow-2xl hover:-translate-y-1 focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 outline-none"
                >
                  Analisar meu projeto agora →
                </Button>
              </Link>
              <PrdDialog
                trigger={
                  <Button
                    variant="ghost"
                    className="text-sm text-muted-foreground border border-border/60 hover:bg-muted/60 hover:text-foreground transition-all duration-300 py-4 px-6 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 outline-none"
                  >
                    Ver o que a IA gera →
                  </Button>
                }
              />
            </div>
            <div className="mt-8 flex items-center justify-center gap-8 text-sm font-mono text-muted-foreground tracking-wider">
              <span>✓ SEM CARTÃO</span>
              <span>✓ 3 FASES GRATUITAS</span>
              <span>✓ CANCELE QUANDO QUISER</span>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="py-8 px-8 border-t border-border/60">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={`${base}/logo.png`} alt="Logotipo FoundersFlow" className="w-5 h-5 rounded-full" />
            <span className="text-sm font-medium text-foreground">FoundersFlow</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground transition-colors link-underline">Planos</Link>
            <Link href="/privacidade" className="hover:text-foreground transition-colors link-underline">Privacidade e LGPD</Link>
            <Link href="/atendimento" className="hover:text-foreground transition-colors link-underline">Atendimento</Link>
          </div>
          <p className="text-sm font-mono text-muted-foreground/60">&copy; {new Date().getFullYear()} FOUNDERSFLOW</p>
        </div>
      </footer>

    </div>
    </>
  );
}
