export default function ModeloNegocio() {
  return (
    <div className="relative w-screen h-screen overflow-hidden blueprint-grid" style={{ background: "#F4F5F9" }}>
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex justify-between items-center">
        <span className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "#1A3FAB" }}>MODELO DE NEGÓCIO</span>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(20,30,60,0.3)" }}>06 / 11</span>
      </div>

      <div className="absolute left-[6vw] right-[6vw]" style={{ top: "16vh" }}>
        <h2 className="font-display font-bold leading-tight tracking-tight mb-[4.5vh]" style={{ fontSize: "3.8vw", color: "#141e3c" }}>
          SaaS recorrente. Churn naturalmente baixo.
        </h2>

        <div className="grid gap-[2.5vw]" style={{ gridTemplateColumns: "1fr 1fr 1fr", marginBottom: "4vh" }}>
          <div className="rounded-2xl p-[3vh_2.5vw] flex flex-col gap-[1.5vh]" style={{ background: "white", border: "1px solid rgba(26,63,171,0.12)" }}>
            <div className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "#6b7280" }}>FREE</div>
            <div className="font-display font-bold" style={{ fontSize: "3.5vw", color: "#141e3c" }}>R$ 0</div>
            <div className="font-body" style={{ fontSize: "1.5vw", color: "#6b7280", lineHeight: 1.4 }}>3 fases completas sem cartão de crédito</div>
            <div className="mt-auto pt-[1.5vh]" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <span className="font-body font-medium" style={{ fontSize: "1.4vw", color: "#1A3FAB" }}>Aquisição</span>
            </div>
          </div>
          <div className="rounded-2xl p-[3vh_2.5vw] flex flex-col gap-[1.5vh]" style={{ background: "rgba(26,63,171,0.06)", border: "1.5px solid #1A3FAB" }}>
            <div className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "#1A3FAB" }}>STARTER</div>
            <div className="font-display font-bold" style={{ fontSize: "3.5vw", color: "#1A3FAB" }}>R$ [X]<span style={{ fontSize: "1.6vw", fontWeight: 400 }}>/mês</span></div>
            <div className="font-body" style={{ fontSize: "1.5vw", color: "#141e3c", lineHeight: 1.4 }}>Fases ilimitadas, 1 projeto ativo</div>
            <div className="mt-auto pt-[1.5vh]" style={{ borderTop: "1px solid rgba(26,63,171,0.2)" }}>
              <span className="font-body font-medium" style={{ fontSize: "1.4vw", color: "#1A3FAB" }}>Principal volume</span>
            </div>
          </div>
          <div className="rounded-2xl p-[3vh_2.5vw] flex flex-col gap-[1.5vh]" style={{ background: "rgba(255,140,66,0.08)", border: "1.5px solid #FF8C42" }}>
            <div className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "#FF8C42" }}>ADVANCED</div>
            <div className="font-display font-bold" style={{ fontSize: "3.5vw", color: "#FF8C42" }}>R$ [X]<span style={{ fontSize: "1.6vw", fontWeight: 400, color: "#141e3c" }}>/mês</span></div>
            <div className="font-body" style={{ fontSize: "1.5vw", color: "#141e3c", lineHeight: 1.4 }}>Times + suporte prioritário</div>
            <div className="mt-auto pt-[1.5vh]" style={{ borderTop: "1px solid rgba(255,140,66,0.3)" }}>
              <span className="font-body font-medium" style={{ fontSize: "1.4vw", color: "#FF8C42" }}>Expansão de receita</span>
            </div>
          </div>
        </div>

        <p className="font-body" style={{ fontSize: "1.8vw", color: "#6b7280" }}>
          Churn baixo estrutural — o founder investe tempo no próprio projeto e não abandona a meio caminho.
        </p>
      </div>
    </div>
  );
}
