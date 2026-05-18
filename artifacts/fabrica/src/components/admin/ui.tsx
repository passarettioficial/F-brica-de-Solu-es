export function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
        active
          ? "bg-primary text-white"
          : "text-muted-foreground hover:text-foreground hover:bg-muted"
      }`}
    >
      {label}
    </button>
  );
}

export function StatCard({ label, value, sub }: { label: string; value: number | string; sub?: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-5">
      <div className="text-2xl font-serif font-normal text-foreground">{value}</div>
      <div className="text-sm font-medium text-foreground mt-1">{label}</div>
      {sub && <div className="text-xs text-muted-foreground mt-0.5">{sub}</div>}
    </div>
  );
}

export function Sparkline({ data, color = "var(--color-primary)" }: { data: Array<{ day: string; count: number }>; color?: string }) {
  if (!data || data.length === 0) return <div className="text-xs text-muted-foreground">Sem dados</div>;
  const max = Math.max(...data.map(d => d.count), 1);
  const w = 280; const h = 48; const pts = data.length;
  const points = data.map((d, i) => {
    const x = (i / (pts - 1)) * w;
    const y = h - (d.count / max) * h;
    return `${x},${y}`;
  }).join(" ");
  return (
    <svg width="100%" viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ height: 48 }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
