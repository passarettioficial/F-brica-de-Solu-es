import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <div className="text-center max-w-md">
        <div className="relative inline-flex items-center justify-center mb-8">
          <div className="w-24 h-24 rounded-2xl bg-primary/8 border border-primary/15 flex items-center justify-center">
            <span className="font-serif text-4xl font-bold text-primary">404</span>
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 border-t border-r border-primary/25" />
          <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b border-l border-primary/20" />
        </div>

        <p className="text-xs font-mono text-primary uppercase tracking-[0.2em] mb-3">Página não encontrada</p>
        <h1 className="text-3xl font-serif text-foreground mb-3">Esta rota não existe</h1>
        <p className="text-muted-foreground text-sm leading-relaxed mb-8">
          O endereço que você acessou não existe ou foi movido.
          Verifique o URL ou volte ao painel.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 items-center justify-center">
          <Link href="/dashboard">
            <Button className="bg-primary hover:bg-primary/90 text-white font-semibold px-6">
              Ir ao painel →
            </Button>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Página inicial
          </Link>
        </div>
      </div>
    </div>
  );
}
