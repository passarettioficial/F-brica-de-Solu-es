export default function Financeiro() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0F1F5C" }}>
      <div className="blueprint-grid-dark absolute inset-0" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 60%, rgba(26,63,171,0.4) 0%, transparent 55%)" }} />
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex justify-between items-center">
        <span className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "rgba(255,140,66,0.8)" }}>FINANCEIRO</span>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(255,255,255,0.25)" }}>13 / 13</span>
      </div>

      <div className="absolute left-[6vw] right-[6vw]" style={{ top: "15vh" }}>
        <h2 className="font-display font-bold text-white leading-tight tracking-tight mb-[4vh]" style={{ fontSize: "3.8vw" }}>
          Projeções. Unit economics saudável.
        </h2>

        <div className="grid gap-[2vw]" style={{ gridTemplateColumns: "1fr 1fr 1fr", marginBottom: "3.5vh" }}>
          <div className="rounded-2xl p-[2.5vh_2vw] flex flex-col gap-[1.5vh]" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "0.9vw", color: "rgba(255,255,255,0.45)" }}>ANO 1 — MRR ALVO</div>
            <div className="font-display font-bold text-white" style={{ fontSize: "4vw", letterSpacing: "-0.03em" }}>R$ 100k</div>
            <div className="font-body" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>~670 assinantes no plano Pro</div>
          </div>
          <div className="rounded-2xl p-[2.5vh_2vw] flex flex-col gap-[1.5vh]" style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
            <div className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "0.9vw", color: "rgba(255,255,255,0.45)" }}>ANO 2 — MRR ALVO</div>
            <div className="font-display font-bold text-white" style={{ fontSize: "4vw", letterSpacing: "-0.03em" }}>R$ 750k</div>
            <div className="font-body" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>~5.000 founders ativos (mix de planos)</div>
          </div>
          <div className="rounded-2xl p-[2.5vh_2vw] flex flex-col gap-[1.5vh]" style={{ background: "rgba(255,140,66,0.12)", border: "1px solid rgba(255,140,66,0.3)" }}>
            <div className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "0.9vw", color: "rgba(255,140,66,0.7)" }}>BREAK-EVEN</div>
            <div className="font-display font-bold" style={{ fontSize: "4vw", letterSpacing: "-0.03em", color: "#FF8C42" }}>12–18m</div>
            <div className="font-body" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.55)", lineHeight: 1.4 }}>Com custo de IA sob controle (cache + batch)</div>
          </div>
        </div>

        <div className="grid gap-[2vw]" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="rounded-xl p-[2vh_2vw]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="font-body font-medium uppercase tracking-widest mb-[0.8vh]" style={{ fontSize: "0.9vw", color: "rgba(255,255,255,0.35)" }}>LTV ESTIMADO</div>
            <div className="font-display font-bold text-white" style={{ fontSize: "2.4vw" }}>R$ 2.100</div>
            <div className="font-body" style={{ fontSize: "1.3vw", color: "rgba(255,255,255,0.45)" }}>14 meses × R$ 149 (churn ~7%)</div>
          </div>
          <div className="rounded-xl p-[2vh_2vw]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="font-body font-medium uppercase tracking-widest mb-[0.8vh]" style={{ fontSize: "0.9vw", color: "rgba(255,255,255,0.35)" }}>CAC ESTIMADO</div>
            <div className="font-display font-bold text-white" style={{ fontSize: "2.4vw" }}>R$ 120</div>
            <div className="font-body" style={{ fontSize: "1.3vw", color: "rgba(255,255,255,0.45)" }}>PLG + conteúdo (sem ads no início)</div>
          </div>
          <div className="rounded-xl p-[2vh_2vw]" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="font-body font-medium uppercase tracking-widest mb-[0.8vh]" style={{ fontSize: "0.9vw", color: "rgba(255,255,255,0.35)" }}>LTV / CAC</div>
            <div className="font-display font-bold" style={{ fontSize: "2.4vw", color: "#FF8C42" }}>17,5×</div>
            <div className="font-body" style={{ fontSize: "1.3vw", color: "rgba(255,255,255,0.45)" }}>Referência saudável: &gt; 3×</div>
          </div>
        </div>
      </div>
    </div>
  );
}
