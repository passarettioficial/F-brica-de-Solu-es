import { Link } from "wouter";
import { Button } from "@/components/ui/button";

const base = import.meta.env.BASE_URL.replace(/\/$/, "");

const highlights = [
  "Da ideia ao lançamento em 7 fases",
  "45+ artefatos para produto, design e execução",
  "Brand system premium com azul #1A3FAB e laranja #FF8C42",
];

const steps = [
  { title: "Valide", text: "Descubra se a ideia merece virar produto." },
  { title: "Especifique", text: "PRD, personas e roadmap em um fluxo guiado." },
  { title: "Lance", text: "Compartilhe artefatos e avance com clareza." },
];

const faqs = [
  { q: "Preciso de cartão?", a: "Não. Você começa grátis." },
  { q: "Serve para time?", a: "Sim. O fluxo é feito para colaboração." },
  { q: "Posso evoluir depois?", a: "Sim. O upgrade acontece dentro do produto." },
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
            <div>
              <div className="font-serif text-lg text-foreground">FoundersFlow</div>
            </div>
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
        <section className="px-6 py-20">
          <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-mono uppercase tracking-[0.2em] text-primary">
                Landing page SaaS
              </div>
              <h1 className="mb-5 text-5xl font-serif leading-[0.95] text-foreground md:text-7xl">
                Transforme ideias
                <span className="text-primary"> em produtos prontos.</span>
              </h1>
              <p className="max-w-2xl text-lg leading-relaxed text-muted-foreground">
                Uma plataforma para founders estruturarem briefing, fases, artefatos e colaboração em um fluxo único e premium.
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link href={`${base}/sign-up`}>
                  <Button className="bg-primary text-white hover:bg-primary/90">Começar agora →</Button>
                </Link>
                <Link href={`${base}/dashboard`}>
                  <Button variant="outline">Ver produto</Button>
                </Link>
              </div>
              <div className="mt-8 grid gap-3 sm:grid-cols-3">
                {highlights.map((item) => (
                  <div key={item} className="glass-card rounded-2xl p-4 text-sm text-foreground">
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card rounded-[2rem] p-6 shadow-xl">
              <div className="rounded-[1.5rem] border border-border/70 bg-background/80 p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Preview</div>
                    <div className="font-serif text-2xl text-foreground">Fluxo em 7 fases</div>
                  </div>
                  <div className="rounded-2xl border border-primary/15 bg-primary/10 px-3 py-2 text-sm text-primary">Live</div>
                </div>
                <div className="space-y-3">
                  {steps.map((step, index) => (
                    <div key={step.title} className="rounded-2xl border border-border bg-card p-4">
                      <div className="text-xs font-mono text-muted-foreground">0{index + 1}</div>
                      <div className="mt-1 font-semibold text-foreground">{step.title}</div>
                      <div className="text-sm text-muted-foreground">{step.text}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-y border-border/50 bg-muted/20 px-6 py-16">
          <div className="mx-auto max-w-6xl">
            <div className="mb-8 text-center">
              <div className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Por que agora</div>
              <h2 className="mt-3 text-3xl font-serif text-foreground">Uma landing focada em conversão</h2>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ["Clareza", "Explica o valor sem ruído."],
                ["Prova", "Mostra fases, artefatos e resultado."],
                ["Ação", "CTA direto para signup."],
              ].map(([title, text]) => (
                <div key={title} className="glass-card rounded-2xl p-5">
                  <div className="mb-2 font-semibold text-foreground">{title}</div>
                  <div className="text-sm text-muted-foreground">{text}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-6 py-16">
          <div className="mx-auto max-w-6xl grid gap-4 md:grid-cols-3">
            {faqs.map((item) => (
              <div key={item.q} className="glass-card rounded-2xl p-5">
                <div className="mb-2 text-sm font-semibold text-foreground">{item.q}</div>
                <div className="text-sm text-muted-foreground">{item.a}</div>
              </div>
            ))}
          </div>
        </section>

        <section className="px-6 pb-20">
          <div className="mx-auto max-w-6xl rounded-[2rem] border border-border bg-card px-6 py-8">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Pronto para lançar</div>
                <h2 className="text-2xl font-serif text-foreground">A landing agora encaminha para conversão.</h2>
              </div>
              <div className="flex flex-wrap gap-3">
                <Link href={`${base}/sign-up`}>
                  <Button className="bg-primary text-white hover:bg-primary/90">Criar conta</Button>
                </Link>
                <Link href={`${base}/pricing`}>
                  <Button variant="outline">Ver planos</Button>
                </Link>
                <Link href={`${base}/dashboard`} className="text-sm text-muted-foreground hover:text-foreground self-center">
                  Ir ao app →
                </Link>
              </div>
            </div>
            <div className="mt-6 grid gap-3 md:grid-cols-5">
              {footerLinks.map((item) => (
                <Link key={item.href} href={`${base}${item.href}`}>
                  <div className="rounded-xl border border-border/70 px-4 py-3 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                    {item.label}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}