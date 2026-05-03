import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const STATS = [
  { value: "6", label: "fases estruturadas" },
  { value: "45+", label: "artefatos por projeto" },
  { value: "2min", label: "para comecar" },
];

const FEATURES = [
  {
    icon: "🧠",
    title: "Valide antes de construir",
    desc: "Lean Canvas, JTBD, analise competitiva e Score de Potencial — tudo gerado pela IA com base na sua ideia para voce decidir se vale a pena antes de escrever uma linha de codigo.",
  },
  {
    icon: "📐",
    title: "Defina com precisao",
    desc: "PRD completo, personas detalhadas, 15 user stories, estrategia de pricing e roadmap trimestral — o produto inteiro especificado em minutos.",
  },
  {
    icon: "⚙️",
    title: "Especifique tecnicamente",
    desc: "Arquitetura do sistema, modelo de dados, contratos de API, plano de segurança e ADRs. Chegue ao dev com tudo documentado.",
  },
  {
    icon: "🚀",
    title: "Lance com estrategia",
    desc: "Runbook de deploy, plano Go-to-Market, Launch Checklist, métricas pos-lancamento e Pitch para Investidores — da ideia ao mercado.",
  },
];

const TESTIMONIALS = [
  {
    text: "Antes eu passava semanas tentando estruturar minha ideia. Com a Fabrica, tive meu PRD completo em menos de uma hora.",
    name: "Founder de SaaS B2B",
    role: "Plano Pro",
  },
  {
    text: "O processo de 6 fases me forcou a pensar em coisas que eu nunca teria considerado. A fase de validacao salvou meu produto.",
    name: "Empreendedor de tecnologia",
    role: "Plano Avancado",
  },
  {
    text: "Mostrei os artefatos para meu co-founder e ele ficou impressionado. A qualidade dos documentos e nivel enterprise.",
    name: "CEO de startup de fintech",
    role: "Plano Pro",
  },
];

export function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="py-5 px-8 flex justify-between items-center border-b bg-card/50 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo.svg`} alt="Fabrica de Solucoes Logo" className="w-8 h-8 rounded" />
          <span className="font-serif text-xl font-bold text-foreground">Fabrica de Solucoes</span>
        </div>
        <div className="flex gap-3 items-center">
          <Link href="/privacidade" className="text-muted-foreground hover:text-foreground text-sm transition-colors hidden md:inline">
            Privacidade
          </Link>
          <Link href="/sign-in" className="text-muted-foreground hover:text-foreground text-sm font-medium py-2 px-4 transition-colors">
            Entrar
          </Link>
          <Link href="/sign-up" className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium py-2 px-4 rounded-lg transition-colors shadow-sm">
            Comecar gratis
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <section className="flex flex-col items-center justify-center px-6 py-24 text-center max-w-5xl mx-auto w-full">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-6 border border-primary/20">
            <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
            Plataforma de construcao de produtos com IA
          </div>

          <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-tight mb-6 max-w-3xl">
            A linha de montagem para{" "}
            <span className="text-primary italic">founders serios</span>.
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl font-sans leading-relaxed">
            Da ideia ao lancamento em 6 fases estruturadas. A IA gera artefatos detalhados — PRD, personas, arquitetura, plano de go-to-market — tudo baseado no seu briefing.
          </p>

          {/* Stats */}
          <div className="flex items-center gap-6 mb-10">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl font-bold font-serif text-primary">{stat.value}</div>
                <div className="text-xs text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 items-center">
            <Link href="/sign-up">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-base font-medium py-3 px-8 rounded-lg transition-colors shadow-md">
                Comecar gratuitamente
              </Button>
            </Link>
            <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Ver planos →
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-3">Sem cartao de credito. 2 geracoes de IA gratuitas por dia.</p>
        </section>

        {/* Features */}
        <section className="bg-card/30 border-y border-card-border py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">O processo</p>
              <h2 className="text-3xl md:text-4xl font-serif text-foreground mb-3">6 fases. Cada uma com proposito.</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">
                Nao e so gerador de texto. E um processo rigoroso que forca voce a pensar em cada dimensao do produto.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {FEATURES.map((f, i) => (
                <div key={i} className="bg-card border border-card-border rounded-2xl p-6 hover:border-primary/30 hover:shadow-sm transition-all">
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="font-serif text-lg font-bold mb-2 text-foreground">{f.title}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Phase pipeline visual */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-10">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Pipeline</p>
              <h2 className="text-3xl font-serif text-foreground mb-3">Do zero ao lancamento</h2>
            </div>
            <div className="flex items-center justify-center gap-0 overflow-x-auto pb-4">
              {[
                { num: 1, name: "IDEIA", desc: "8 artefatos" },
                { num: 2, name: "PRD", desc: "7 artefatos" },
                { num: 3, name: "SPEC", desc: "8 artefatos" },
                { num: 4, name: "IMPL.", desc: "7 artefatos" },
                { num: 5, name: "TESTE", desc: "7 artefatos" },
                { num: 6, name: "DEPLOY", desc: "7 artefatos" },
              ].map((phase, i) => (
                <div key={i} className="flex items-center">
                  {i > 0 && <div className="h-0.5 w-6 md:w-10 bg-primary/30 flex-shrink-0" />}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-primary/10 border-2 border-primary/30 flex items-center justify-center text-sm font-bold text-primary mb-1.5">
                      {phase.num}
                    </div>
                    <div className="text-xs font-semibold text-foreground text-center">{phase.name}</div>
                    <div className="text-[10px] text-muted-foreground text-center">{phase.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="bg-card/30 border-y border-card-border py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <p className="text-xs font-semibold text-primary uppercase tracking-widest mb-3">Depoimentos</p>
              <h2 className="text-3xl font-serif text-foreground">O que dizem os founders</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {TESTIMONIALS.map((t, i) => (
                <div key={i} className="bg-card border border-card-border rounded-2xl p-6">
                  <div className="text-primary text-2xl mb-3">"</div>
                  <p className="text-sm text-foreground leading-relaxed mb-4 italic">{t.text}</p>
                  <div className="border-t border-border pt-4">
                    <div className="text-sm font-medium text-foreground">{t.name}</div>
                    <div className="text-xs text-muted-foreground">{t.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-24 px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-serif text-foreground mb-4">
              Sua ideia merece um processo serio.
            </h2>
            <p className="text-muted-foreground text-lg mb-8">
              Comece hoje. Crie seu primeiro projeto em menos de 2 minutos.
            </p>
            <Link href="/sign-up">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-medium py-4 px-10 rounded-lg transition-colors shadow-md">
                Comecar gratuitamente
              </Button>
            </Link>
            <div className="mt-6 flex items-center justify-center gap-6 text-xs text-muted-foreground">
              <span>✓ Sem cartao de credito</span>
              <span>✓ 2 geracoes gratuitas/dia</span>
              <span>✓ Cancele quando quiser</span>
            </div>
          </div>
        </section>
      </main>

      <footer className="py-8 px-8 border-t bg-card/50">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo.svg`} alt="Logo" className="w-6 h-6 rounded" />
            <span className="text-sm font-medium text-foreground">Fabrica de Solucoes</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-muted-foreground">
            <Link href="/pricing" className="hover:text-foreground transition-colors">Planos</Link>
            <Link href="/privacidade" className="hover:text-foreground transition-colors">Privacidade e LGPD</Link>
            <Link href="/atendimento" className="hover:text-foreground transition-colors">Atendimento</Link>
          </div>
          <p className="text-xs text-muted-foreground">&copy; {new Date().getFullYear()} Fabrica de Solucoes. Um instrumento de precisao.</p>
        </div>
      </footer>
    </div>
  );
}
