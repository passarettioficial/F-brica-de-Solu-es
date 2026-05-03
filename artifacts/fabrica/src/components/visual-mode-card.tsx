export function VisualModeCard() {
  return (
    <div className="glass-card rounded-2xl p-5 mb-8 overflow-hidden relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-blue-500/10 pointer-events-none" />
      <div className="relative">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">Visual</p>
        <h3 className="font-serif text-lg text-foreground mb-2">Liquid Glass leve, nao como skin pesada</h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Faz sentido usar transparencias, blur sutil e bordas suaves para destacar premium e atencao. Evite exagero: o foco deve ser clareza, contraste e velocidade.
        </p>
      </div>
    </div>
  );
}
