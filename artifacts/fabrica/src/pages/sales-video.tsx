import { Link } from "wouter";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

const scenes = [
  {
    k: "01",
    title: "Pare de começar pelo código",
    text: "Uma ideia sem estrutura vira retrabalho. A Fábrica organiza tudo antes da execução.",
  },
  {
    k: "02",
    title: "6 fases, 45+ artefatos",
    text: "Lean Canvas, PRD, arquitetura, roadmap, go-to-market e muito mais — em um fluxo guiado.",
  },
  {
    k: "03",
    title: "Visual limpo, processo sério",
    text: "Branding consistente, leitura rápida e decisões mais claras para founders e times.",
  },
  {
    k: "04",
    title: "Pronto para vender",
    text: "Crie, valide e lance com uma narrativa de produto mais convincente.",
  },
];

const script = [
  "Todo bom produto começa com clareza.",
  "A Fábrica de Soluções transforma briefing em direção.",
  "Você avança por 6 fases, com artefatos que reduzem ambiguidade.",
  "O resultado é um produto mais forte, mais rápido e pronto para vender.",
];

export function SalesVideoPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-background/85 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={`${base}/logo.svg`} alt="Fábrica de Soluções" className="w-9 h-9 rounded-xl bg-card ring-1 ring-border/70" />
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Vídeo de vendas</p>
              <h1 className="font-serif text-lg text-foreground">Fábrica de Soluções</h1>
            </div>
          </div>
          <Link href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Voltar ao painel</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-10 space-y-8">
        <section className="grid lg:grid-cols-[1.1fr_0.9fr] gap-6 items-stretch">
          <div className="glass-card rounded-3xl p-8">
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-3">Roteiro principal</p>
            <h2 className="font-serif text-4xl text-foreground leading-tight mb-4">A linha de montagem para founders sérios.</h2>
            <p className="text-sm text-muted-foreground max-w-xl leading-relaxed">
              Um vídeo curto, direto e premium para mostrar a proposta: sair da ideia solta e chegar em produto com estrutura, artefatos e direção.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <span className="text-xs px-3 py-1 rounded-full border border-border bg-secondary/50 text-foreground">Brandbook aplicado</span>
              <span className="text-xs px-3 py-1 rounded-full border border-border bg-secondary/50 text-foreground">6 fases</span>
              <span className="text-xs px-3 py-1 rounded-full border border-border bg-secondary/50 text-foreground">45+ artefatos</span>
            </div>
            <div className="mt-8 space-y-3">
              {script.map((line, index) => (
                <div key={index} className="flex items-start gap-3 rounded-2xl border border-border bg-background px-4 py-3">
                  <span className="text-xs font-mono text-primary mt-0.5">0{index + 1}</span>
                  <p className="text-sm text-foreground leading-relaxed">{line}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-6 flex flex-col justify-between">
            <div>
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-muted-foreground mb-3">Estrutura do vídeo</p>
              <div className="space-y-3">
                {scenes.map((scene) => (
                  <div key={scene.k} className="rounded-2xl border border-border bg-background p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono text-primary">Cena {scene.k}</span>
                      <span className="text-[11px] text-muted-foreground uppercase tracking-wider">6–8s</span>
                    </div>
                    <p className="font-serif text-lg text-foreground mb-1">{scene.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{scene.text}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-6 rounded-2xl bg-primary/5 border border-primary/15 p-4">
              <p className="text-xs font-mono uppercase tracking-[0.18em] text-primary mb-1">Fechamento</p>
              <p className="text-sm text-foreground">Crie seu primeiro projeto em menos de 2 minutos. Sem cartão de crédito.</p>
            </div>
          </div>
        </section>

        <section className="grid lg:grid-cols-3 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground mb-2">Abertura</p>
            <p className="font-serif text-xl text-foreground mb-2">Problema</p>
            <p className="text-sm text-muted-foreground">Você tem uma ideia, mas ainda não tem produto, narrativa nem estrutura.</p>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground mb-2">Meio</p>
            <p className="font-serif text-xl text-foreground mb-2">Processo</p>
            <p className="text-sm text-muted-foreground">A plataforma organiza validação, especificação e execução em etapas claras.</p>
          </div>
          <div className="glass-card rounded-2xl p-6">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground mb-2">Final</p>
            <p className="font-serif text-xl text-foreground mb-2">Resultado</p>
            <p className="text-sm text-muted-foreground">Mais clareza, mais velocidade e um produto que parece pronto para mercado.</p>
          </div>
        </section>

        <section className="glass-card rounded-3xl p-8 flex items-center justify-between gap-6 flex-wrap">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">CTA final</p>
            <h3 className="font-serif text-2xl text-foreground">Pronto para transformar ideia em produto?</h3>
          </div>
          <Link href="/sign-up" className="bg-accent text-accent-foreground hover:bg-accent/90 text-sm font-semibold px-5 py-3 rounded-xl transition-colors">
            Começar agora
          </Link>
        </section>
      </main>
    </div>
  );
}
