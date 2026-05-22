import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");
const DEMO_SHARE_ID = import.meta.env.VITE_DEMO_SHARE_ID as string | undefined;

const highlights = [
  "Da ideia ao lançamento em 7 fases",
  "45+ artefatos para produto, design e execução",
  "Validação de coerência cross-fase com IA",
];

const phases = [
  { n: "01", name: "Ideia", desc: "Lean Canvas, JTBD, score de potencial" },
  { n: "02", name: "PRD", desc: "Personas, métricas, user stories, LTV/CAC" },
  { n: "03", name: "Segurança", desc: "STRIDE, RBAC, mapa de dados LGPD" },
  { n: "04", name: "Spec", desc: "Modelo de dados, arquitetura, APIs" },
  { n: "05", name: "Execução", desc: "Milestones, MVP, backlog priorizado" },
  { n: "06", name: "Testes", desc: "Casos críticos P0/P1, riscos, QA" },
  { n: "07", name: "Lançamento", desc: "GTM, checklist, métricas pós-launch" },
];

const proofs = [
  { stat: "45+", label: "artefatos por projeto" },
  { stat: "7", label: "fases sequenciais com gates" },
  { stat: "<5min", label: "do briefing à primeira entrega" },
];

const sampleArtifact = {
  title: "PRD — GestaoPro (SaaS B2B PME)",
  lines: [
    "## Problema",
    "PMEs brasileiras gastam 6-12h/mês conciliando planilhas de operação,",
    "perdendo decisões em tempo real e gerando retrabalho de 20-30%.",
    "",
    "## Persona principal",
    "Sócio-operador (35-50 anos), 10-50 funcionários, sem TI dedicado.",
    "",
    "## Métricas de sucesso",
    "Ativação: 60% dos signups conectam 1ª integração em 7 dias.",
    "Retenção: D30 ≥ 40%. NRR ≥ 110% em 6m.",
  ],
};

const painPoints = [
  {
    before: "3 semanas no Notion virando spaghetti",
    after: "PRD + LGPD + arquitetura em uma tarde, com coerência entre as fases.",
  },
  {
    before: "Prompts soltos no ChatGPT sem memória",
    after: "Cada fase lê as anteriores. A IA conhece o seu negócio no fim da Fase 1.",
  },
  {
    before: "Consultoria de R$8k por documento",
    after: "Lean Canvas, threat model STRIDE, RBAC e GTM gerados — sem sair da plataforma.",
  },
];

const faqs = [
  { q: "Preciso de cartão?", a: "Não. Você começa grátis com 1 projeto, 3 fases e 3 gerações de IA por dia." },
  { q: "Funciona pra qualquer vertical?", a: "Sim — temos templates de SaaS B2B, App de Consumo, Marketplace, Fintech, Edtech, Healthtech, D2C e Creator." },
  { q: "Posso exportar?", a: "Sim. Cada artefato vira Markdown ou PDF branded; o projeto inteiro também vira PDF viral." },
  { q: "Meus dados são meus?", a: "Sim. LGPD compliant — você pode pedir portabilidade ou deleção a qualquer momento em Configurações." },
];

const footerLinks = [
  { href: "/pricing", label: "Preços" },
  { href: "/privacidade", label: "Privacidade" },
  { href: "/atendimento", label: "Atendimento" },
];

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-20 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src={`${base}/logo.png`} alt="FoundersFlow" className="h-9 w-9 rounded-full" />
            <div className="font-serif text-lg text-foreground">FoundersFlow</div>
          </div>
          <div className="flex items-center gap-2">
            <Link href={`${base}/pricing`} className="hidden text-sm text-muted-foreground hover:text-foreground md:inline-block">Preços</Link>
            <Link href={`${base}/sign-in`}>
              <Button variant="outline">Entrar</Button>
            </Link>
            <Link href={`${base}/sign-up`}>
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Começar grátis</Button>
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* HERO */}
        <section className="px-6 py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-[0.2em] text-primary">
                Para founders no Brasil
              </div>
              <h1 className="mb-5 text-5xl font-serif leading-[0.95] text-foreground md:text-7xl">
                Da ideia ao produto
                <span className="text-primary"> validado</span>
                <span className="block text-3xl md:text-4xl text-muted-foreground font-sans font-normal mt-3">
                  em 7 fases guiadas por IA, sem sair da plataforma.
                </span>
              </h1>
              <p className="max-w-2xl text-base leading-relaxed text-muted-foreground">
                Briefing → Lean Canvas → PRD → LGPD → Arquitetura → MVP → Lançamento.
                Cada fase aprende com a anterior e gera artefatos prontos pra apresentar a sócios, devs e investidores.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`${base}/sign-up`}>
                  <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Começar grátis →</Button>
                </Link>
                {DEMO_SHARE_ID ? (
                  <Link href={`${base}/p/${DEMO_SHARE_ID}`}>
                    <Button variant="outline">Ver projeto demo (sem cadastro)</Button>
                  </Link>
                ) : (
                  <Link href={`${base}/sign-up`}>
                    <Button variant="outline">Explorar templates</Button>
                  </Link>
                )}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
                <span>✓ Sem cartão</span>
                <span>✓ LGPD compliant</span>
                <span>✓ Exporta PDF + Markdown</span>
              </div>
            </div>

            {/* Sample output preview */}
            <div className="glass-card rounded-[2rem] p-2 shadow-xl">
              <div className="rounded-[1.5rem] border border-border/70 bg-background overflow-hidden">
                <div className="flex items-center gap-2 border-b border-border/50 bg-muted/40 px-4 py-2.5">
                  <div className="flex gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-400/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-400/60" />
                    <span className="w-2.5 h-2.5 rounded-full bg-green-400/60" />
                  </div>
                  <span className="ml-2 text-[11px] font-mono text-muted-foreground truncate">artefato gerado · Fase 2</span>
                </div>
                <div className="p-5">
                  <div className="text-xs font-mono uppercase tracking-[0.15em] text-primary mb-2">Exemplo de output</div>
                  <div className="font-serif text-lg text-foreground mb-3">{sampleArtifact.title}</div>
                  <pre className="text-[11px] leading-relaxed text-muted-foreground font-mono whitespace-pre-wrap">
                    {sampleArtifact.lines.join("\n")}
                  </pre>
                  <div className="mt-3 flex gap-2 text-[10px] font-mono">
                    <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">PRD</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-foreground border border-border">Markdown</span>
                    <span className="px-2 py-0.5 rounded-full bg-secondary text-foreground border border-border">PDF</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Proof bar */}
          <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-3">
            {proofs.map((p) => (
              <div key={p.label} className="text-center">
                <div className="font-serif text-4xl text-primary stat-shimmer">{p.stat}</div>
                <div className="text-xs text-muted-foreground uppercase tracking-wider mt-1">{p.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* 7 PHASES */}
        <section className="border-y border-border/50 bg-muted/20 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-10 text-center">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-primary">O método</div>
              <h2 className="mt-3 text-3xl font-serif text-foreground md:text-4xl">7 fases sequenciais — cada uma alimenta a próxima</h2>
              <p className="mt-3 text-sm text-muted-foreground max-w-2xl mx-auto">
                Ao contrário de prompts soltos no ChatGPT, aqui o contexto acumula. Sua Fase 1 vira input da 2, e assim por diante.
              </p>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
              {phases.map((p) => (
                <div key={p.n} className="glass-card rounded-2xl p-4 hover:border-primary/40 transition-colors">
                  <div className="text-xs font-mono text-muted-foreground">{p.n}</div>
                  <div className="mt-1 font-semibold text-foreground">{p.name}</div>
                  <div className="text-xs text-muted-foreground mt-1 leading-relaxed">{p.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* WHY WE EXIST */}
        <section className="bg-foreground px-6 py-16 text-background">
          <div className="mx-auto max-w-5xl">
            <div className="mb-10 text-center">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-accent">Por que a FoundersFlow existe</div>
              <h2 className="mt-3 text-3xl font-serif md:text-4xl">Você não precisa de mais um documento em branco.</h2>
              <p className="mt-4 text-sm leading-relaxed text-background/70 max-w-2xl mx-auto">
                Founder no Brasil queima semanas montando PRD genérico, traduzindo LGPD do zero e copiando prompt no ChatGPT
                que esquece tudo na próxima sessão. A FoundersFlow existe para fechar esse ciclo.
              </p>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {painPoints.map((p) => (
                <div key={p.before} className="rounded-2xl border border-background/15 bg-background/5 p-5">
                  <div className="text-[11px] font-mono uppercase tracking-wider text-background/50 mb-2">Antes</div>
                  <p className="text-sm leading-relaxed text-background/80 mb-4 line-through decoration-accent/60">{p.before}</p>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-accent mb-2">Com FoundersFlow</div>
                  <p className="text-sm leading-relaxed text-background">{p.after}</p>
                </div>
              ))}
            </div>
            <p className="mt-8 text-center text-[11px] text-background/40">
              Estamos coletando os primeiros depoimentos de founders ativos. Quer ser case study?{" "}
              <Link href={`${base}/atendimento`} className="underline hover:text-accent">Fale com a gente.</Link>
            </p>
          </div>
        </section>

        {/* FAQ */}
        <section className="px-6 py-16">
          <div className="mx-auto max-w-3xl">
            <div className="mb-8 text-center">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Perguntas frequentes</div>
              <h2 className="mt-3 text-3xl font-serif text-foreground">Antes de começar</h2>
            </div>
            <div className="space-y-3">
              {faqs.map((item) => (
                <div key={item.q} className="glass-card rounded-2xl p-5">
                  <div className="mb-2 text-sm font-semibold text-foreground">{item.q}</div>
                  <div className="text-sm text-muted-foreground">{item.a}</div>
                </div>
              ))}
            </div>
            <div className="mt-6 text-center">
              {highlights.map((h) => (
                <span key={h} className="inline-block text-xs text-muted-foreground mx-2">· {h}</span>
              ))}
            </div>
          </div>
        </section>

        {/* FINAL CTA */}
        <section className="px-6 pb-20">
          <div className="mx-auto max-w-4xl rounded-[2rem] border border-border bg-card px-8 py-10 text-center">
            <div className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Pronto pra começar</div>
            <h2 className="text-3xl font-serif text-foreground mb-3 md:text-4xl">Sua próxima ideia merece um plano de verdade.</h2>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto mb-6">
              Comece grátis. Sem cartão. Em menos de 5 minutos você tem seu primeiro Lean Canvas + score de potencial gerado por IA.
            </p>
            <div className="flex flex-wrap justify-center gap-3">
              <Link href={`${base}/sign-up`}>
                <Button className="bg-accent text-accent-foreground hover:bg-accent/90">Começar grátis →</Button>
              </Link>
              <Link href={`${base}/pricing`}>
                <Button variant="outline">Ver planos</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 px-6 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 text-xs text-muted-foreground md:flex-row md:justify-between">
          <div>© {new Date().getFullYear()} FoundersFlow · foundersflow.com.br</div>
          <div className="flex gap-4">
            {footerLinks.map((l) => (
              <Link key={l.href} href={`${base}${l.href}`} className="hover:text-foreground">{l.label}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
