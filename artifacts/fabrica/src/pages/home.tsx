import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function Home() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="py-6 px-8 flex justify-between items-center border-b">
        <div className="flex items-center gap-3">
          <img src={`${import.meta.env.BASE_URL.replace(/\/$/, "")}/logo.svg`} alt="Fábrica de Soluções Logo" className="w-8 h-8 rounded" />
          <span className="font-serif text-xl font-bold text-foreground">Fábrica de Soluções</span>
        </div>
        <div className="flex gap-4">
          <Link href="/sign-in" className="text-muted-foreground hover:text-foreground text-sm font-medium py-2 px-4 transition-colors">
            Entrar
          </Link>
          <Link href="/sign-up" className="bg-primary text-primary-foreground hover:bg-primary/90 text-sm font-medium py-2 px-4 rounded-md transition-colors shadow-sm">
            Começar
          </Link>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20 text-center max-w-4xl mx-auto">
        <h1 className="text-5xl md:text-7xl font-serif text-foreground leading-tight mb-6">
          A linha de montagem para <br/><span className="text-primary italic">founders sérios</span>.
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground mb-12 max-w-2xl font-sans">
          Fábrica de Soluções é um cockpit de precisão guiado por IA que transforma ideias abstratas em produtos validados através de um processo de 6 fases.
        </p>

        <div className="grid md:grid-cols-3 gap-8 text-left mb-16">
          <div className="bg-card p-6 rounded-xl border border-card-border shadow-sm">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold mb-4">1</div>
            <h3 className="font-serif text-xl font-bold mb-2">Estruture com clareza</h3>
            <p className="text-muted-foreground text-sm">
              Cada produto passa por 6 fases rigorosas: da Ideia ao Deploy. Nada é deixado ao acaso.
            </p>
          </div>
          <div className="bg-card p-6 rounded-xl border border-card-border shadow-sm">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold mb-4">2</div>
            <h3 className="font-serif text-xl font-bold mb-2">Construa com IA</h3>
            <p className="text-muted-foreground text-sm">
              Gere artefatos detalhados — PRDs, diagramas e especificações em segundos, guiados pelo seu briefing.
            </p>
          </div>
          <div className="bg-card p-6 rounded-xl border border-card-border shadow-sm">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-full flex items-center justify-center font-bold mb-4">3</div>
            <h3 className="font-serif text-xl font-bold mb-2">Valide em cada etapa</h3>
            <p className="text-muted-foreground text-sm">
              Portões de aprovação rígidos garantem que você só avance quando a fundação estiver sólida.
            </p>
          </div>
        </div>

        <Link href="/sign-up" className="bg-primary text-primary-foreground hover:bg-primary/90 text-lg font-medium py-4 px-8 rounded-md transition-colors shadow-md">
          Iniciar nova construção
        </Link>
      </main>

      <footer className="py-8 text-center text-muted-foreground border-t text-sm">
        <p>&copy; {new Date().getFullYear()} Fábrica de Soluções. Um instrumento de precisão.</p>
      </footer>
    </div>
  );
}
