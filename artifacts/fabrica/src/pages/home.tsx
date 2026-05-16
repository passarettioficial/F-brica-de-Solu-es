import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MarketingVideo } from "@/components/marketing-video";
import { ThemeToggle } from "@/components/theme-toggle";

const STATS = [
  { value: "6", label: "fases" },
  { value: "45+", label: "artefatos" },
  { value: "2min", label: "para comecar" },
  { value: "100%", label: "estruturado" },
];

const PHASES = [
  { num: 1, name: "Ideia", icon: "◈", desc: "Validacao e potencial", artifacts: "8 artefatos" },
  { num: 2, name: "PRD", icon: "◈", desc: "Definicao de produto", artifacts: "7 artefatos" },
  { num: 3, name: "Spec", icon: "◈", desc: "Arquitetura tecnica", artifacts: "8 artefatos" },
  { num: 4, name: "Impl.", icon: "◈", desc: "Plano de execucao", artifacts: "7 artefatos" },
  { num: 5, name: "Teste", icon: "◈", desc: "QA e validacao", artifacts: "7 artefatos" },
  { num: 6, name: "Deploy", icon: "◈", desc: "Lancamento real", artifacts: "7 artefatos" },
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
    title: "Arquitetura documentada",
    desc: "Modelo de dados, contratos de API, plano de seguranca e ADRs. Chegue ao dev com tudo documentado e sem ambiguidades.",
    tag: "Fase 3 — Spec",
  },
  {
    step: "04",
    icon: "◎",
    title: "Lance com estrategia",
    desc: "Runbook de deploy, plano Go-to-Market, Launch Checklist e Pitch para investidores. Da ideia ao mercado.",
    tag: "Fases 4–6 — Execucao",
  },
];

const TESTIMONIALS = [
  {
    quote: "Antes eu passava semanas estruturando minha ideia. Com a Fabrica, tive meu PRD completo em menos de uma hora.",
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
  { title: "Clareza imediata", text: "Transforme ideia solta em direção concreta em minutos." },
  { title: "Fluxo contínuo", text: "Cada fase entrega o próximo passo sem travar o time." },
  { title: "Pronto para vender", text: "Artefatos compartilháveis que apoiam decisão e execução." },
];

const FAQ_CARDS = [
  { q: "Preciso começar no plano pago?", a: "Não. Você pode testar o fluxo e evoluir quando fizer sentido." },
  { q: "O produto serve para equipe?", a: "Sim. O processo foi desenhado para colaboração e alinhamento." },
  { q: "Tem saída para apresentação?", a: "Sim. Você chega em artefatos que ajudam a vender e executar." },
];

const CTA_CARDS = [
  { title: "Comece grátis", text: "Teste o fluxo e veja valor antes de decidir." },
  { title: "Veja os planos", text: "Escolha entre grátis, Pro e Avançado." },
  { title: "Entre no app", text: "Se já tem conta, continue construindo." },
];

const FINAL_CHECKLIST = [
  "Landing pública com CTA claro",
  "App com onboarding e pricing",
  "Brandbook e vídeo de vendas publicados",
];

export function Home() {
  const base = import.meta.env.BASE_URL.replace(/\/$/, "");

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(26,63,171,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,140,66,0.12),transparent_28%),linear-gradient(to_bottom,rgba(255,255,255,0.65),transparent_18%)]" />
      </div>

      {/* ── Header ── */}
      <header className="py-4 px-6 md:px-8 flex justify-between items-center border-b border-border/60 bg-background/75 sticky top-0 z-20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <img src={`${base}/logo.svg`} alt="Fabrica" className="w-8 h-8 rounded-xl ring-1 ring-border/70 bg-card" />
          <div className="leading-tight">
            <span className="font-serif text-base font-semibold text-foreground tracking-tight block">Fabrica de Solucoes</span>
            <span className="text-[11px] text-muted-foreground font-mono uppercase tracking-[0.18em]">SaaS product system</span>
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
              <div className="inline-flex items-center gap-2 text-primary text-xs font-mono font-semibold px-3 py-1.5 rounded-full mb-8 border border-primary/20 bg-primary/8 tracking-wider">
              <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
              PLATAFORMA DE PRODUTO COM IA — v2.0
              </div>

              <h1 className="text-5xl md:text-7xl lg:text-8xl font-serif text-foreground leading-[0.94] tracking-tight mb-8">
              A linha de<br />
              montagem para<br />
              <span className="text-primary underline underline-offset-4 decoration-accent decoration-4">founders</span>.
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl font-sans leading-relaxed">
              Da ideia ao lancamento em 6 fases estruturadas.
              A IA gera artefatos detalhados — PRD, personas, arquitetura, go-to-market —
              tudo baseado no seu briefing.
              </p>

              {/* Stats row */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-0 md:divide-x md:divide-border/60 mb-12 max-w-3xl lg:max-w-none bg-card/70 backdrop-blur-sm border border-border/60 rounded-2xl overflow-hidden">
              {STATS.map((stat, i) => (
                <div key={i} className="text-center px-6 py-5">
                    <div className="stat-shimmer text-3xl font-bold font-serif">{stat.value}</div>
                    <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest mt-0.5">{stat.label}</div>
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
              <Link href="/video-vendas" className="text-sm text-muted-foreground hover:text-foreground transition-colors link-underline py-2">Ver vídeo de vendas</Link>
              </div>
              <p className="text-xs text-muted-foreground/70 mt-4 font-mono">SEM CARTAO DE CREDITO · 2 GERACOES GRATUITAS/DIA</p>
            </div>

            <div className="relative">
              <div className="glass-card rounded-[2rem] p-4 md:p-5 shadow-xl">
                <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-5">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-xs font-mono text-primary uppercase tracking-[0.2em]">Produto pronto</p>
                      <h3 className="font-serif text-2xl text-foreground mt-1">SaaS com processo guiado</h3>
                    </div>
                    <div className="w-11 h-11 rounded-2xl bg-primary/10 border border-primary/15 flex items-center justify-center text-primary">◎</div>
                  </div>
                  <div className="grid gap-3">
                    <div className="rounded-xl bg-secondary/70 border border-border/60 p-4">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Fase atual</span>
                        <span className="text-xs font-mono text-primary">01</span>
                      </div>
                      <div className="text-lg font-serif text-foreground mt-1">Ideia e validacao</div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-border/60 bg-card p-4">
                        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Artefatos</div>
                        <div className="text-2xl font-serif text-foreground mt-1">45+</div>
                      </div>
                      <div className="rounded-xl border border-border/60 bg-card p-4">
                        <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Tempo</div>
                        <div className="text-2xl font-serif text-foreground mt-1">2 min</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="px-6 pb-8">
          <div className="max-w-6xl mx-auto grid gap-4 md:grid-cols-3">
            {VALUE_CARDS.map((card) => (
              <div key={card.title} className="glass-card rounded-2xl p-5">
                <div className="text-xs font-mono uppercase tracking-[0.18em] text-primary mb-2">{card.title}</div>
                <p className="text-sm text-muted-foreground leading-relaxed">{card.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-16">
          <div className="max-w-6xl mx-auto">
            <div className="grid gap-4 md:grid-cols-3">
              {FAQ_CARDS.map((item) => (
                <div key={item.q} className="glass-card rounded-2xl p-5">
                  <div className="text-sm font-semibold text-foreground mb-2">{item.q}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 pb-8">
          <div className="max-w-6xl mx-auto grid gap-4 md:grid-cols-3">
            {CTA_CARDS.map((card) => (
              <div key={card.title} className="glass-card rounded-2xl p-5">
                <div className="mb-2 text-xs font-mono uppercase tracking-[0.18em] text-primary">{card.title}</div>
                <p className="text-sm text-muted-foreground">{card.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-8">
          <div className="max-w-6xl mx-auto rounded-[2rem] border border-border bg-card p-6">
            <div className="flex items-center justify-between gap-4 flex-wrap">
              <div>
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Go live</div>
                <h2 className="text-2xl font-serif text-foreground">Checklist final de lançamento</h2>
              </div>
              <Link href="/landing" className="text-sm text-muted-foreground hover:text-foreground">
                Revisar landing →
              </Link>
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {FINAL_CHECKLIST.map((item) => (
                <div key={item} className="rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground">
                  {item}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pipeline Visual ── */}
        <section className="py-20 px-6 border-y border-border/50 bg-muted/20">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-14">
              <p className="text-xs font-mono font-semibold text-primary uppercase tracking-[0.2em] mb-3">PIPELINE</p>
              <h2 className="text-3xl md:text-4xl font-serif text-foreground">Do zero ao lancamento</h2>
            </div>

            {/* Desktop pipeline */}
            <div className="hidden md:grid grid-cols-6 gap-0 relative">
              {/* Connector line */}
              <div className="absolute top-[22px] left-[8.33%] right-[8.33%] h-px bg-gradient-to-r from-primary/15 via-primary/35 to-primary/15" />

              {PHASES.map((phase, i) => (
                <div key={i} className="flex flex-col items-center relative group">
                  <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold font-mono z-10 mb-3 transition-all duration-300 border-2 ${
                    i === 0
                      ? "bg-primary border-primary text-primary-foreground phase-node-active"
                      : "bg-card border-border text-muted-foreground group-hover:border-primary/40 group-hover:text-primary"
                  }`}>
                    {phase.num}
                  </div>
                  <div className="text-xs font-semibold text-foreground text-center uppercase tracking-wider mb-1">{phase.name}</div>
                  <div className="text-[10px] text-muted-foreground text-center leading-tight mb-1">{phase.desc}</div>
                  <div className="text-[10px] font-mono text-primary/60 text-center">{phase.artifacts}</div>
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
              <p className="text-xs font-mono font-semibold text-primary uppercase tracking-[0.2em] mb-3">VÍDEO DE APRESENTAÇÃO</p>
              <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-3">Da ideia ao produto em 6 fases.</h2>
              <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
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
              <p className="text-xs font-mono font-semibold text-primary uppercase tracking-[0.2em] mb-3">CAPACIDADES</p>
              <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-4">Um processo com proposito em cada etapa.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
                Nao e so gerador de texto. E um processo rigoroso que forca voce a pensar em cada dimensao do produto.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-5">
              {FEATURES.map((f, i) => (
                <div key={i} className="glass-card rounded-2xl p-7 group cursor-default">
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
              <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mb-3">RESULTADOS REAIS</p>
              <h2 className="text-3xl md:text-4xl font-serif text-background">O que dizem os founders</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="border border-background/10 rounded-2xl p-6 bg-background/6 backdrop-blur-sm">
                  <div className="text-primary text-3xl font-serif mb-4 leading-none">"</div>
                  <p className="text-sm text-background/80 leading-relaxed mb-6 italic">{t.quote}</p>
                  <div className="flex items-center justify-between border-t border-background/10 pt-4">
                    <div className="text-sm font-medium text-background">{t.name}</div>
                    <div className="text-xs font-mono text-primary/80">{t.plan}</div>
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
            <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mb-6">PRONTO PARA COMECAR?</p>
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
            <div className="mt-8 flex items-center justify-center gap-8 text-xs font-mono text-muted-foreground tracking-wider">
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
            <img src={`${base}/logo.svg`} alt="Logo" className="w-5 h-5 rounded" />
            <span className="text-sm font-medium text-foreground">Fabrica de Solucoes</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground transition-colors link-underline">Planos</Link>
            <Link href="/video-vendas" className="hover:text-foreground transition-colors link-underline">Video de vendas</Link>
            <Link href="/analise-mercado" className="hover:text-foreground transition-colors link-underline">Análise de mercado</Link>
            <Link href="/privacidade" className="hover:text-foreground transition-colors link-underline">Privacidade e LGPD</Link>
            <Link href="/atendimento" className="hover:text-foreground transition-colors link-underline">Atendimento</Link>
          </div>
          <p className="text-xs font-mono text-muted-foreground/60">&copy; {new Date().getFullYear()} FABRICA DE SOLUCOES</p>
        </div>
      </footer>

    </div>
  );
}
