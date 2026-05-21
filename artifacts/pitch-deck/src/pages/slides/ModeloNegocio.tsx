export default function ModeloNegocio() {
  return (
    <div className="relative w-screen h-screen overflow-hidden blueprint-grid" style={{ background: "#F4F5F9" }}>
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex justify-between items-center">
        <span className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "#1A3FAB" }}>MODELO DE NEGÓCIO</span>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(20,30,60,0.3)" }}>06 / 13</span>
      </div>

      <div className="absolute left-[6vw] right-[6vw]" style={{ top: "15vh" }}>
        <h2 className="font-display font-bold leading-tight tracking-tight mb-[2.5vh]" style={{ fontSize: "3.6vw", color: "#141e3c" }}>
          SaaS recorrente. Ticket alto. Churn estrutural baixo.
        </h2>
        <p className="font-body mb-[3vh]" style={{ fontSize: "1.5vw", color: "#6b7280", lineHeight: 1.4 }}>
          ICP: founders sérios e serial entrepreneurs. Pricing posicionado em valor, não em commodity.
        </p>

        <div className="grid gap-[1.8vw]" style={{ gridTemplateColumns: "1fr 1.15fr 1fr", marginBottom: "3vh" }}>
          {/* Free / Explorar */}
          <div className="rounded-2xl p-[2.8vh_1.8vw] flex flex-col gap-[1.4vh]" style={{ background: "white", border: "1px solid rgba(26,63,171,0.12)" }}>
            <div className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "0.9vw", color: "#6b7280" }}>EXPLORAR</div>
            <div className="font-display font-bold" style={{ fontSize: "3.2vw", color: "#141e3c" }}>R$ 0</div>
            <div className="font-body" style={{ fontSize: "1.35vw", color: "#6b7280", lineHeight: 1.4 }}>
              3 IA/dia · 1 projeto · sem export
            </div>
            <div className="mt-auto pt-[1.4vh]" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <span className="font-body font-medium" style={{ fontSize: "1.2vw", color: "#1A3FAB" }}>Funil de aquisição</span>
            </div>
          </div>

          {/* Founder — destaque principal */}
          <div className="rounded-2xl p-[2.8vh_1.8vw] flex flex-col gap-[1.4vh] relative" style={{ background: "rgba(26,63,171,0.07)", border: "2px solid #1A3FAB" }}>
            <div className="absolute -top-[1.3vh] left-1/2 -translate-x-1/2 px-[1vw] py-[0.4vh] rounded-full" style={{ background: "#1A3FAB" }}>
              <span className="font-body font-bold uppercase tracking-widest" style={{ fontSize: "0.75vw", color: "white" }}>Mais escolhido</span>
            </div>
            <div className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "0.9vw", color: "#1A3FAB" }}>FOUNDER ✦</div>
            <div>
              <span className="font-display font-bold" style={{ fontSize: "3.4vw", color: "#1A3FAB" }}>R$ 197</span>
              <span className="font-body" style={{ fontSize: "1.3vw", color: "#6b7280" }}>/mês</span>
            </div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#1A3FAB", fontWeight: 500 }}>
              ou R$ 1.970/ano (≈ R$ 164/mês)
            </div>
            <div className="font-body" style={{ fontSize: "1.35vw", color: "#141e3c", lineHeight: 1.4 }}>
              30 IA/dia · 5 projetos · AI Advisor · export completo
            </div>
            <div className="mt-auto pt-[1.4vh]" style={{ borderTop: "1px solid rgba(26,63,171,0.2)" }}>
              <span className="font-body font-medium" style={{ fontSize: "1.2vw", color: "#1A3FAB" }}>80% do volume esperado</span>
            </div>
          </div>

          {/* Studio */}
          <div className="rounded-2xl p-[2.8vh_1.8vw] flex flex-col gap-[1.4vh]" style={{ background: "rgba(255,140,66,0.08)", border: "1.5px solid #FF8C42" }}>
            <div className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "0.9vw", color: "#FF8C42" }}>STUDIO</div>
            <div>
              <span className="font-display font-bold" style={{ fontSize: "3.2vw", color: "#FF8C42" }}>R$ 697</span>
              <span className="font-body" style={{ fontSize: "1.3vw", color: "#6b7280" }}>/mês</span>
            </div>
            <div className="font-body" style={{ fontSize: "1.05vw", color: "#FF8C42", fontWeight: 500 }}>
              ou R$ 6.970/ano (≈ R$ 581/mês)
            </div>
            <div className="font-body" style={{ fontSize: "1.35vw", color: "#141e3c", lineHeight: 1.4 }}>
              Ilimitado · 3 seats · white-label · SLA prioritário
            </div>
            <div className="mt-auto pt-[1.4vh]" style={{ borderTop: "1px solid rgba(255,140,66,0.3)" }}>
              <span className="font-body font-medium" style={{ fontSize: "1.2vw", color: "#FF8C42" }}>Expansão de receita</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-[1.5vw]">
          <div className="rounded-xl p-[1.8vh_1.4vw]" style={{ background: "white", border: "1px solid rgba(26,63,171,0.1)" }}>
            <div className="font-body font-medium uppercase tracking-widest mb-[0.6vh]" style={{ fontSize: "0.8vw", color: "#6b7280" }}>ARPU alvo</div>
            <div className="font-display font-bold" style={{ fontSize: "1.8vw", color: "#1A3FAB" }}>R$ 230/mês</div>
          </div>
          <div className="rounded-xl p-[1.8vh_1.4vw]" style={{ background: "white", border: "1px solid rgba(26,63,171,0.1)" }}>
            <div className="font-body font-medium uppercase tracking-widest mb-[0.6vh]" style={{ fontSize: "0.8vw", color: "#6b7280" }}>LTV/CAC alvo</div>
            <div className="font-display font-bold" style={{ fontSize: "1.8vw", color: "#1A3FAB" }}>≥ 4×</div>
          </div>
          <div className="rounded-xl p-[1.8vh_1.4vw]" style={{ background: "white", border: "1px solid rgba(26,63,171,0.1)" }}>
            <div className="font-body font-medium uppercase tracking-widest mb-[0.6vh]" style={{ fontSize: "0.8vw", color: "#6b7280" }}>Anual c/ 2 meses grátis</div>
            <div className="font-display font-bold" style={{ fontSize: "1.8vw", color: "#FF8C42" }}>Cash flow + retenção</div>
          </div>
        </div>
      </div>
    </div>
  );
}
