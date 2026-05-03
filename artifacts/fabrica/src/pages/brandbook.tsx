export function BrandbookPage() {
  const palette = [
    { name: "Azul principal", value: "#1A3FAB", note: "confiança, estrutura e ação" },
    { name: "Azul claro", value: "#EEF1FB", note: "superfícies e áreas suaves" },
    { name: "Laranja destaque", value: "#FF8C42", note: "atenção, CTA e calor humano" },
    { name: "Off-white", value: "#F8F9FD", note: "base limpa e editorial" },
  ];

  const principles = [
    "Clareza antes de enfeite.",
    "Estrutura forte, linguagem acessível.",
    "Produto sério, energia humana.",
    "UI com respiro e hierarquia visível.",
  ];

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/70 bg-background/85 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary">Brandbook</p>
            <h1 className="font-serif text-lg text-foreground">Fábrica de Soluções</h1>
          </div>
          <a href="/dashboard" className="text-sm text-muted-foreground hover:text-foreground transition-colors">Voltar ao painel</a>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-10 space-y-8">
        <section className="glass-card rounded-2xl p-8">
          <p className="text-xs font-mono uppercase tracking-[0.2em] text-primary mb-2">Guia de marca</p>
          <h2 className="font-serif text-3xl text-foreground mb-3">Base visual e verbal do produto</h2>
          <p className="text-sm text-muted-foreground max-w-2xl leading-relaxed">
            Identidade para uma marca SaaS clara, confiável e acolhedora.
          </p>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground mb-2">Arquétipo</p>
            <p className="font-serif text-2xl text-foreground">O conselheiro</p>
            <p className="text-sm text-muted-foreground mt-2">Guiar com clareza, reduzir fricção e transmitir confiança.</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground mb-2">Personalidade</p>
            <p className="font-serif text-2xl text-foreground">Precisa e humana</p>
            <p className="text-sm text-muted-foreground mt-2">Técnica sem rigidez, elegante sem excessos.</p>
          </div>
          <div className="glass-card rounded-2xl p-5">
            <p className="text-xs font-mono uppercase tracking-[0.18em] text-muted-foreground mb-2">Promessa</p>
            <p className="font-serif text-2xl text-foreground">Do caos à estrutura</p>
            <p className="text-sm text-muted-foreground mt-2">Transformar ideia em produto com método.</p>
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-serif text-xl mb-4">Princípios</h3>
            <ul className="space-y-3">
              {principles.map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm text-foreground">
                  <span className="mt-1 h-2 w-2 rounded-full bg-primary flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-serif text-xl mb-4">Tipografia</h3>
            <div className="space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-1">Headings</p>
                <p className="font-serif text-foreground text-lg">Space Grotesk</p>
              </div>
              <div>
                <p className="text-xs uppercase tracking-[0.16em] text-muted-foreground mb-1">Body</p>
                <p className="font-sans text-foreground text-lg">Inter</p>
              </div>
            </div>
          </div>
        </section>

        <section className="glass-card rounded-2xl p-6">
          <h3 className="font-serif text-xl mb-4">Paleta principal</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {palette.map((item) => (
              <div key={item.name} className="rounded-xl border border-border bg-background p-3">
                <div className="h-20 rounded-lg mb-3 border border-border" style={{ backgroundColor: item.value }} />
                <p className="text-sm font-medium text-foreground">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.value}</p>
                <p className="text-xs text-muted-foreground mt-1">{item.note}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-serif text-xl mb-4">Tom de voz</h3>
            <ul className="space-y-3 text-sm text-foreground">
              <li>• Direto e humano.</li>
              <li>• Técnico sem parecer frio.</li>
              <li>• Confiante, mas nunca arrogante.</li>
              <li>• Sempre claro sobre limites e próximos passos.</li>
            </ul>
          </div>

          <div className="glass-card rounded-2xl p-6">
            <h3 className="font-serif text-xl mb-4">Uso de marca</h3>
            <ul className="space-y-3 text-sm text-foreground">
              <li>• Azul como base de confiança.</li>
              <li>• Laranja só para ação e destaques.</li>
              <li>• Off-white e superfícies claras com muito respiro.</li>
              <li>• Evitar excesso de brilho, gradiente e ruído visual.</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
}
