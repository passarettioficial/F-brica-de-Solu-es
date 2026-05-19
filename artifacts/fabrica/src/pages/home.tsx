import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MarketingVideo } from "@/components/marketing-video";
import { ThemeToggle } from "@/components/theme-toggle";

const STATS = [
  { value: "7", label: "fases" },
  { value: "45+", label: "artefatos" },
  { value: "100%", label: "estruturado" },
];

const PHASES = [
  { num: 1, name: "Ideia", icon: "◈", desc: "Validacao e potencial", artifacts: "8 artefatos" },
  { num: 2, name: "PRD", icon: "◈", desc: "Definicao de produto", artifacts: "7 artefatos" },
  { num: 3, name: "Segurança", icon: "◈", desc: "LGPD e privacidade", artifacts: "6 artefatos" },
  { num: 4, name: "Spec", icon: "◈", desc: "Arquitetura tecnica", artifacts: "8 artefatos" },
  { num: 5, name: "Impl.", icon: "◈", desc: "Plano de execucao", artifacts: "7 artefatos" },
  { num: 6, name: "Teste", icon: "◈", desc: "QA e validacao", artifacts: "7 artefatos" },
  { num: 7, name: "Deploy", icon: "◈", desc: "Lancamento real", artifacts: "7 artefatos" },
];

const FEATURES = [
  {
    step: "01",
    icon: "◎",
    title: "Valide antes de construir",
    desc: "Lean Canvas, JTBD, analise competitiva e Score de Potencial — a IA processa sua ideia e diz se vale a pena antes de escrever uma linha de codigo.",
    tag: "Fase 1 — Ideia",
  },
  {
    step: "02",
    icon: "◎",
    title: "Especifique com precisao",
    desc: "PRD completo, personas, 15 user stories, estrategia de pricing, roadmap trimestral. O produto inteiro especificado em minutos.",
    tag: "Fase 2 — PRD",
  },
  {
    step: "03",
    icon: "◎",
    title: "Seguranca e LGPD embutidos",
    desc: "Threat model, matriz RBAC, politica de privacidade e plano de conformidade LGPD — gerados antes de qualquer linha de codigo.",
    tag: "Fase 3 — Segurança & LGPD",
  },
  {
    step: "04",
    icon: "◎",
    title: "Arquitetura documentada",
    desc: "Modelo de dados, contratos de API, ADRs e plano de seguranca tecnica. Chegue ao dev com tudo documentado e sem ambiguidades.",
    tag: "Fase 4 — Spec",
  },
  {
    step: "05",
    icon: "◎",
    title: "Construa e valide com rigor",
    desc: "Plano de milestones, sprint detalhado, plano de testes com 20 casos criticos e script de teste com usuarios reais.",
    tag: "Fases 5–6 — Impl. & Teste",
  },
  {
    step: "06",
    icon: "◎",
    title: "Lance com estrategia",
    desc: "Runbook de deploy, plano Go-to-Market, Launch Checklist e Pitch para investidores. Da ideia ao mercado.",
    tag: "Fase 7 — Deploy",
  },
];

const TESTIMONIALS = [
  {
    quote: "Antes eu passava semanas estruturando minha ideia. Com o FoundersFlow, tive meu PRD completo em menos de uma hora.",
    name: "Founder de SaaS B2B",
    plan: "Plano Pro",
  },
  {
    quote: "A fase de validacao salvou meu produto. Percebi que estava resolvendo o problema errado antes de investir qualquer coisa.",
    name: "Empreendedor de tecnologia",
    plan: "Plano Avancado",
  },
  {
    quote: "Os artefatos chegaram em nivel enterprise. Meu co-founder ficou impressionado com a qualidade dos documentos.",
    name: "CEO de startup de fintech",
    plan: "Plano Pro",
  },
];

const VALUE_CARDS = [
  {
    title: "Clareza imediata",
    text: "Transforme ideia solta em direção concreta em minutos.",
    detail: "Responda um briefing e a IA organiza tudo: mercado, público-alvo, hipóteses e riscos — sem dispersão e sem folha em branco.",
    href: "/clareza-imediata",
    cta: "Entender a metodologia →",
  },
  {
    title: "Fluxo contínuo",
    text: "Cada fase entrega o próximo passo sem travar o time.",
    detail: "Os artefatos de uma fase alimentam automaticamente a próxima. Você nunca fica sem saber o que fazer agora.",
    href: "/fluxo-continuo",
    cta: "Ver como funciona →",
  },
  {
    title: "Pronto para vender",
    text: "Artefatos compartilháveis que apoiam decisão e execução.",
    detail: "PRD, personas, arquitetura, go-to-market — tudo exportável e apresentável para investidores, parceiros e equipe.",
    href: "/pronto-para-vender",
    cta: "Ver os artefatos →",
  },
];

const CTA_CARDS = [
  {
    title: "Comece grátis",
    text: "Teste o fluxo e veja valor antes de decidir.",
    detail: "Sem cartão de crédito. Crie seu primeiro projeto, rode as fases e gere artefatos reais — 2 gerações gratuitas por dia.",
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


export function Home() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

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

      {/* ── Header ── */}
      <header className="py-4 px-6 md:px-8 flex justify-between items-center border-b border-border/60 bg-background/75 sticky top-0 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img src={`${base}/logo.png`} alt="FoundersFlow" className="w-8 h-8 rounded-full" />
          <div className="leading-tight">
            <span className="font-serif text-base font-semibold text-foreground tracking-tight block">FoundersFlow</span>
          </div>
        </div>
        <nav className="flex gap-1 items-center">
          <Link href="/privacidade" className="text-muted-foreground hover:text-foreground text-sm px-3 py-1.5 rounded-md hover:bg-muted/60 transition-all hidden md:inline-block">Privacidade</Link>
          <ThemeToggle size={16} />
          <Link href="/sign-in" className="text-muted-foreground hover:text-foreground text-sm font-medium px-3 py-1.5 rounded-md hover:bg-muted/60 transition-all">Entrar</Link>
          <Link href="/sign-up" className="bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-medium py-1.5 px-4 rounded-lg transition-colors ml-1 font-semibold">Comecar gratis</Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">

        {/* ── Hero ── */}
        <section className="relative px-6 pt-20 pb-20 overflow-hidden">
          <div className="hero-glow" />
          <div className="hero-grid" />

          <div className="relative z-10 max-w-6xl mx-auto w-full grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
            <div className="text-center lg:text-left">
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-foreground leading-[0.94] tracking-tight mb-8">
              A linha de<br />
              montagem para<br />
              <span className="text-primary underline underline-offset-4 decoration-accent decoration-4">founders</span>.
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl font-sans leading-relaxed">
              Da ideia ao lancamento em 7 fases estruturadas.
              A IA gera artefatos detalhados — PRD, personas, arquitetura, go-to-market —
              tudo baseado no seu briefing.
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
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-200">
                  Iniciar minha construcao →
                </Button>
              </Link>
              <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors link-underline py-2">Ver planos e preços</Link>
              </div>
              <p className="text-sm text-muted-foreground/70 mt-4 font-mono">SEM CARTAO DE CREDITO · 2 GERACOES GRATUITAS/DIA</p>
            </div>

          </div>
        </section>

        <section className="px-6 pb-8">
          <div className="max-w-6xl mx-auto grid gap-4 md:grid-cols-3">
            {VALUE_CARDS.map((card) => (
              <Link key={card.title} href={card.href} className="glass-card rounded-2xl p-6 flex flex-col gap-3 group hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
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
              <Link key={card.title} href={card.href} className="glass-card rounded-2xl p-6 flex flex-col gap-3 group hover:border-primary/40 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
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
              <h2 className="text-3xl md:text-4xl font-serif text-foreground">Do zero ao lancamento</h2>
            </div>

            {/* Desktop pipeline */}
            <div className="hidden md:grid grid-cols-7 gap-0 relative">
              {/* Connector line */}
              <div className="absolute top-[26px] left-[7.14%] right-[7.14%] h-px bg-gradient-to-r from-primary/15 via-primary/35 to-primary/15" />

              {PHASES.map((phase, i) => (
                <div key={i} className="flex flex-col items-center relative group">
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-lg font-bold font-mono z-10 mb-3 transition-all duration-300 border-2 ${
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

        <section className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-10">
              <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-4">Da ideia ao produto em 7 fases.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto text-base leading-relaxed">
                Veja como a plataforma transforma um briefing em artefatos prontos — PRD, arquitetura, go-to-market e mais.
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
              <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">Um processo com proposito em cada etapa.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Nao e so gerador de texto. E um processo rigoroso que forca voce a pensar em cada dimensao do produto.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {FEATURES.map((f, i) => (
                <div key={i} className="glass-card rounded-2xl p-7 group cursor-default hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-200">
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
                <div key={i} className="border border-background/10 rounded-2xl p-6 bg-background/6 backdrop-blur-sm hover:-translate-y-0.5 hover:border-primary/30 transition-all duration-200">
                  <div className="text-primary text-3xl font-serif mb-4 leading-none">"</div>
                  <p className="text-sm text-background/80 leading-relaxed mb-6 italic">{t.quote}</p>
                  <div className="flex items-center justify-between border-t border-background/10 pt-4">
                    <div className="text-sm font-medium text-background">{t.name}</div>
                    <div className="text-sm font-mono text-primary/80">{t.plan}</div>
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
            <p className="text-sm font-mono text-primary uppercase tracking-[0.2em] mb-6">PRONTO PARA COMECAR?</p>
            <h2 className="text-4xl md:text-6xl font-serif text-foreground mb-6 leading-tight">
              Sua ideia merece<br />
              <span className="text-primary underline underline-offset-4 decoration-accent decoration-4">um processo serio</span>.
            </h2>
            <p className="text-muted-foreground text-lg mb-10 leading-relaxed">
              Comece hoje. Crie seu primeiro projeto em menos de 2 minutos.
            </p>
            <Link href="/sign-up">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg font-semibold py-4 px-12 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 duration-200">
                Iniciar gratuitamente →
              </Button>
            </Link>
            <div className="mt-8 flex items-center justify-center gap-8 text-sm font-mono text-muted-foreground tracking-wider">
              <span>✓ SEM CARTAO</span>
              <span>✓ 2 GERACOES/DIA</span>
              <span>✓ CANCELE SEMPRE</span>
            </div>
          </div>
        </section>

      </main>

      {/* ── Footer ── */}
      <footer className="py-8 px-8 border-t border-border/60">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src={`${base}/logo.png`} alt="Logo" className="w-5 h-5 rounded-full" />
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
