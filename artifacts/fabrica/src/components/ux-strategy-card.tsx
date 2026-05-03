import { Link } from "wouter";

const ITEMS = [
  "Aha moment em 2 minutos",
  "Reengajamento diario por notificacoes e lembretes",
  "Uma fonte de verdade para evitar complexidade",
  "Padroes visuais consistentes em toda a jornada",
  "Roadmap de 1000 usuarios antes de upgrade",
];

export function UxStrategyCard() {
  return (
    <div className="glass-card rounded-2xl p-5 mb-8">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Proxima sprint</p>
          <h3 className="font-serif text-lg text-foreground">Aha, retencao e protecao de complexidade</h3>
        </div>
        <Link href="/pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Ver plano de escala →</Link>
      </div>
      <div className="space-y-2">
        {ITEMS.map((item) => (
          <div key={item} className="flex items-start gap-2 text-sm text-foreground">
            <span className="mt-0.5 text-primary">•</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
