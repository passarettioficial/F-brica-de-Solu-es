import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const base = () => import.meta.env.BASE_URL.replace(/\/$/, "");

const ARTIFACTS = [
  { key: "LEAN_CANVAS", label: "Lean Canvas", desc: "Modelo de negócio completo em uma página — problema, solução, segmentos, canais, receita." },
  { key: "JTBD", label: "Jobs to Be Done", desc: "O trabalho real que seu cliente quer resolver, além do produto em si." },
  { key: "HIPOTESE_CENTRAL", label: "Hipótese Central", desc: "A aposta principal do produto, formulada de forma testável e falsificável." },
  { key: "SCORE_POTENCIAL", label: "Score de Potencial", desc: "Avaliação quantitativa em 5 dimensões: desejabilidade, viabilidade, factibilidade, escalabilidade e timing." },
  { key: "VALIDACAO_RAPIDA", label: "Script de Validação", desc: "Roteiro de entrevistas com usuários para testar hipóteses antes de construir." },
  { key: "ANALISE_COMPETITIVA", label: "Análise Competitiva", desc: "Mapeamento de concorrentes, diferenciais e espaços de oportunidade." },
];

export function ClarezaImediataPage() {
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
              Clareza<br />
              <span className="text-primary underline underline-offset-4 decoration-accent decoration-4">imediata</span>.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              O maior inimigo do founder não é falta de ideia — é falta de estrutura para avaliá-la. A FoundersFlow resolve isso nos primeiros minutos.
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
            <h2 className="text-3xl font-serif text-foreground mb-6">A folha em branco paralisa.</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              Você tem uma ideia. Sabe que é boa. Mas quando senta para estruturar — por onde começa? PRD? Personas? Modelo de negócio? A dispersão entre frameworks paralisa mais do que a falta de conhecimento.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A FoundersFlow elimina esse atrito com um único briefing inicial. Você responde sobre o problema que quer resolver, o público-alvo e o contexto — e a IA faz o trabalho pesado de organizar tudo em artefatos prontos para uso.
            </p>
          </div>
        </section>

        {/* Como funciona */}
        <section className="px-6 py-8 max-w-4xl mx-auto w-full">
          <p className="text-sm font-mono text-primary uppercase tracking-[0.2em] mb-4">COMO FUNCIONA</p>
          <h2 className="text-3xl font-serif text-foreground mb-10">Do briefing aos artefatos em minutos.</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { step: "01", title: "Briefing", desc: "Você descreve o problema, o público e o contexto do produto em linguagem natural. Sem formulários rígidos." },
              { step: "02", title: "IA analisa", desc: "O modelo processa o briefing usando frameworks validados: Lean Startup, Design Thinking, Jobs to Be Done." },
              { step: "03", title: "Artefatos prontos", desc: "Em segundos, você recebe documentos estruturados, editáveis e exportáveis. Clareza completa." },
            ].map(item => (
              <div key={item.step} className="glass-card rounded-2xl p-6 flex flex-col gap-3 hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-200">
                <span className="text-xs font-mono text-primary/60 tracking-wider">{item.step}</span>
                <h3 className="font-serif text-xl text-foreground">{item.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Artefatos gerados */}
        <section className="px-6 py-16 max-w-4xl mx-auto w-full">
          <p className="text-sm font-mono text-primary uppercase tracking-[0.2em] mb-4">FASE 1 — IDEIA</p>
          <h2 className="text-3xl font-serif text-foreground mb-3">O que você recebe.</h2>
          <p className="text-muted-foreground mb-10">Todos os artefatos abaixo são gerados automaticamente a partir do seu briefing, editáveis e exportáveis.</p>
          <div className="grid gap-3 md:grid-cols-2">
            {ARTIFACTS.map(a => (
              <div key={a.key} className="glass-card rounded-2xl p-5 flex gap-4 hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-200">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 flex-shrink-0" />
                <div>
                  <div className="font-medium text-foreground mb-1">{a.label}</div>
                  <p className="text-sm text-muted-foreground leading-relaxed">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="px-6 py-20 text-center">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl font-serif text-foreground mb-4">Pronto para sair da dispersão?</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">Crie seu primeiro projeto grátis. Sem cartão de crédito.</p>
            <Link href="/sign-up">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg font-semibold py-4 px-12 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 duration-200">
                Começar gratuitamente →
              </Button>
            </Link>
            <div className="mt-6 flex items-center justify-center gap-8 text-sm font-mono text-muted-foreground">
              <span>✓ GRÁTIS PARA COMEÇAR</span>
              <span>✓ SEM CARTÃO</span>
            </div>
          </div>
        </section>

      </main>

      <footer className="py-8 px-8 border-t border-border/60">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-medium text-foreground">FoundersFlow</span>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/fluxo-continuo" className="hover:text-foreground transition-colors">Fluxo Contínuo →</Link>
            <Link href="/pronto-para-vender" className="hover:text-foreground transition-colors">Pronto para Vender →</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
