import { Helmet } from "react-helmet-async";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const base = () => import.meta.env.BASE_URL.replace(/\/$/, "");

const DELIVERABLES = [
  { phase: "PRD (Fase 2)", items: ["Product Requirements Document completo", "Personas detalhadas com contexto real", "User Stories priorizadas", "Framework de Métricas de Sucesso", "Estratégia de Pricing"] },
  { phase: "Segurança (Fase 3)", items: ["Política de Privacidade pronta para publicar", "Plano de Resposta a Incidentes", "Checklist OWASP Top 10", "Matriz RBAC"] },
  { phase: "Spec (Fase 4)", items: ["Arquitetura do Sistema documentada", "Contratos de API", "Fluxos de UX", "ADRs — Architecture Decision Records"] },
  { phase: "Deploy (Fase 7)", items: ["Plano Go-to-Market completo", "Narrativa para Investidores", "Launch Checklist", "Dashboard Pós-Lançamento", "Plano de Crescimento 90 Dias"] },
];

export function ProntoParaVenderPage() {
  const b = base();
  return (
    <>
    <Helmet>
      <title>Pronto para Vender — FoundersFlow</title>
      <meta name="description" content="PRD, personas, arquitetura, go-to-market e pitch para investidores gerados automaticamente. Artefatos exportáveis e apresentáveis prontos em cada fase do produto." />
      <link rel="canonical" href="https://www.foundersflow.com.br/pronto-para-vender" />
    </Helmet>
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
              Pronto para<br />
              <span className="text-primary underline underline-offset-4 decoration-accent decoration-4">vender</span>.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed mb-10">
              Documentos de nível enterprise — exportáveis, apresentáveis e prontos para convencer investidores, fechar contratos e alinhar equipes.
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
            <h2 className="text-3xl font-serif text-foreground mb-6">Boa ideia não vende. Documentação vende.</h2>
            <p className="text-lg text-muted-foreground leading-relaxed mb-4">
              Investidores pedem pitch deck. Parceiros pedem arquitetura. Devs pedem PRD. Advogados pedem política de privacidade. Sem esses documentos, você trava. Com eles feitos por você, demora semanas.
            </p>
            <p className="text-lg text-muted-foreground leading-relaxed">
              A FoundersFlow entrega tudo isso como produto do processo — não como tarefa extra. Cada fase gera artefatos que são ao mesmo tempo insumo para a próxima fase e documento pronto para stakeholders externos.
            </p>
          </div>
        </section>

        {/* Artefatos por fase */}
        <section className="px-6 py-8 max-w-4xl mx-auto w-full">
          <p className="text-sm font-mono text-primary uppercase tracking-[0.2em] mb-4">O QUE VOCÊ RECEBE</p>
          <h2 className="text-3xl font-serif text-foreground mb-10">Artefatos prontos, fase a fase.</h2>
          <div className="space-y-4">
            {DELIVERABLES.map(d => (
              <div key={d.phase} className="glass-card rounded-2xl p-6 hover:-translate-y-0.5 hover:border-primary/40 transition-all duration-200">
                <div className="text-sm font-mono text-primary uppercase tracking-[0.15em] mb-3">{d.phase}</div>
                <ul className="space-y-2">
                  {d.items.map(item => (
                    <li key={item} className="flex items-start gap-3 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Formatos */}
        <section className="px-6 py-16 max-w-4xl mx-auto w-full">
          <p className="text-sm font-mono text-primary uppercase tracking-[0.2em] mb-4">FORMATOS E USOS</p>
          <h2 className="text-3xl font-serif text-foreground mb-10">Feitos para sair do produto.</h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { title: "Exportável em Markdown", desc: "Copie ou faça download de qualquer artefato para Notion, Confluence, Google Docs ou qualquer ferramenta de documentação." },
              { title: "Apresentável de imediato", desc: "PRD, pitch, go-to-market — redigidos em linguagem clara, sem jargão excessivo. Prontos para apresentar sem edição." },
              { title: "Editável e vivo", desc: "Nenhum documento é definitivo. Edite diretamente na plataforma e regenere partes específicas quando o contexto mudar." },
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
            <h2 className="text-4xl font-serif text-foreground mb-4">Comece a construir hoje.</h2>
            <p className="text-muted-foreground text-lg mb-8 leading-relaxed">Sua primeira geração de artefatos é gratuita.</p>
            <Link href="/sign-up">
              <Button className="bg-accent text-accent-foreground hover:bg-accent/90 text-lg font-semibold py-4 px-12 rounded-xl transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1 duration-200">
                Começar gratuitamente →
              </Button>
            </Link>
            <div className="mt-6 flex items-center justify-center gap-8 text-sm font-mono text-muted-foreground">
              <span>✓ 45+ ARTEFATOS</span>
              <span>✓ SEM CARTÃO</span>
            </div>
          </div>
        </section>

      </main>

      <footer className="py-8 px-8 border-t border-border/60">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="text-sm font-medium text-foreground">FoundersFlow</span>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link href="/clareza-imediata" className="hover:text-foreground transition-colors">← Clareza Imediata</Link>
            <Link href="/fluxo-continuo" className="hover:text-foreground transition-colors">← Fluxo Contínuo</Link>
          </div>
        </div>
      </footer>
    </div>
    </>
  );
}
