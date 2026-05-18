import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const base = () => import.meta.env.BASE_URL.replace(/\/$/, "");

const PHASES = [
  { num: 1, name: "Ideia", out: "Lean Canvas, JTBD, Análise competitiva, Score de potencial" },
  { num: 2, name: "PRD", out: "Requisitos, Personas, User Stories, Roadmap, Métricas" },
  { num: 3, name: "Segurança & LGPD", out: "Data Map, Threat Model, RBAC, Política de privacidade" },
  { num: 4, name: "Spec", out: "Arquitetura, Modelo de dados, Contratos de API, Fluxos UX" },
  { num: 5, name: "Implementação", out: "Milestones, Sprint 1, README, Definition of Done" },
  { num: 6, name: "Teste", out: "Plano de testes, Casos críticos, QA, Observabilidade" },
  { num: 7, name: "Deploy", out: "Runbook, Go-to-Market, Launch Checklist, Pitch" },
];

export function FluxoContinuoPage() {
  const b = base();
  return (
    <div className="min-h-screen bg-background flex flex-col overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 opacity-70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(26,63,171,0.12),transparent_32%),radial-gradient(circle_at_top_right,rgba(255,140,66,0.12),transparent_28%)]" />
      </div>

      <header className="py-4 px-6 md:px-8 flex justify-between items-center border-b border-border/60 bg-background/75 sticky top-0 z-20 backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3">
          <img src={`${b}/logo.png`} alt="FoundersFlow" className="w-8 h-8 rounded-full" />
          <span className="font-serif text-base font-semibold text-foreground tracking-tight">FoundersFlow</span>
        </Link>
        <nav className="flex gap-1 items-center">
          <Link href="/" className="text-muted-foreground hover:text-foreground text-sm px-3 py-1.5 rounded-md hover:bg-muted/60 transition-all hidden md:inline-block">← Voltar</Link>
          <Link href="/sign-in" className="text-muted-foreground hover:text-foreground text-sm font-medium px-3 py-1.5 rounded-md hover:bg-muted/60 transition-all">Entrar</Link>
          <Link href="/sign-up" className="bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-medium py-1.5 px-4 rounded-lg transition-colors ml-1 font-semibold">Começar grátis</Link>
        </nav>
      </header>

      <main className="flex-1 flex flex-col">

        {/* Hero */}
        <section className="relative px-6 pt-20 pb-16 overflow-hidden">
          <div className="hero-glow" />
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            <p className="text-sm font-mono font-semibold text-primary uppercase tracking-[0.2em] mb-4">METODOLOGIA</p>
            <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-[0.94] tracking-tight mb-6">
              Fluxo<br />
              <span className="text-primary underline underline-offset-4 decoration-accent decoration-4">contínuo</span>.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Cada fase entrega o contexto exato que a próxima precisa. Você nunca fica parado sem saber o que fazer agora.
            </p>
            <Link href="/sign-up">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 text-base font-semibold py-3 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 duration-200">
                Experimentar agora →
              </Button>
            </Link>
          </div>
        </section>

        {/* O problema */}
        <section className="px-6 py-16 max-w-4xl mx-auto w-full">
          <div className="glass-card rounded-2xl p-8 md:p-12">
            <p className="text-sm font-mono text-primary uppercase tracking-[0.2em] mb-4">O PROBLEMA</p>
            <h2 className="text-3xl font-serif text-foreground mb-6">Todo processo de produto tem pontos de travamento.</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              Você termina a ideação e não sabe exatamente o que deve ir para o PRD. Termina o PRD e não sabe que decisões de arquitetura deve tomar. Cada transição vira uma reunião, um retrabalho, uma perda de contexto.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              O fluxo contínuo da FoundersFlow elimina essas lacunas. Os artefatos de cada fase alimentam automaticamente a geração da fase seguinte — com contexto preservado e coerência garantida entre todas as decisões.
            </p>
          </div>
        </section>

        {/* Pipeline */}
        <section className="px-6 py-8 max-w-4xl mx-auto w-full">
          <p className="text-sm font-mono text-primary uppercase tracking-[0.2em] mb-4">AS 7 FASES</p>
          <h2 className="text-3xl font-serif text-foreground mb-10">Um pipeline com saída clara em cada etapa.</h2>
          <div className="space-y-3">
            {PHASES.map((phase, i) => (
              <div key={phase.num} className="glass-card rounded-2xl p-5 flex items-start gap-5 group hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-200">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold font-mono flex-shrink-0 border-2 transition-all duration-300 ${
                  i === 0 ? "bg-primary border-primary text-primary-foreground" : "bg-card border-border text-muted-foreground group-hover:border-primary/40 group-hover:text-primary"
                }`}>
                  {phase.num}
                </div>
                <div className="flex-1">
                  <div className="font-medium text-foreground mb-1">{phase.name}</div>
                  <p className="text-sm text-muted-foreground">{phase.out}</p>
                </div>
                {i < PHASES.length - 1 && (
                  <div className="hidden md:block text-primary/30 text-lg self-center">↓</div>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Vantagem do contexto */}
        <section className="px-6 py-16 max-w-4xl mx-auto w-full">
          <p className="text-sm font-mono text-primary uppercase tracking-[0.2em] mb-4">POR QUE FUNCIONA</p>
          <h2 className="text-3xl font-serif text-foreground mb-10">Contexto que não se perde.</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Briefing único", desc: "Você preenche uma vez. Todas as fases usam o mesmo contexto como base — sem repetição, sem inconsistência." },
              { title: "Artefatos encadeados", desc: "O PRD leva em conta o Lean Canvas. A arquitetura leva em conta o PRD. Cada fase constrói sobre a anterior." },
              { title: "Sem retrabalho", desc: "Quando a IA gera a Fase 4, ela já sabe o que você decidiu na Fase 1, 2 e 3. Zero perda de contexto entre transições." },
            ].map(item => (
              <div key={item.title} className="glass-card rounded-2xl p-6 flex flex-col gap-3 hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-200">
                <h3 className="font-serif text-xl text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-serif text-foreground mb-4">Comece o fluxo hoje.</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">Grátis para começar. Sem cartão de crédito.</p>
            <Link href="/sign-up">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg font-semibold py-4 px-12 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 duration-200">
                Começar gratuitamente →
              </Button>
            </Link>
            <div className="mt-6 flex items-center justify-center gap-8 text-sm font-mono text-muted-foreground">
              <span>✓ 7 FASES ESTRUTURADAS</span>
              <span>✓ GRÁTIS PARA COMEÇAR</span>
            </div>
          </div>
        </section>

      </main>

      <footer className="py-8 px-8 border-t border-border/60">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-medium text-foreground">FoundersFlow</span>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/clareza-imediata" className="hover:text-foreground transition-colors">← Clareza Imediata</Link>
            <Link href="/pronto-para-vender" className="hover:text-foreground transition-colors">Pronto para Vender →</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
