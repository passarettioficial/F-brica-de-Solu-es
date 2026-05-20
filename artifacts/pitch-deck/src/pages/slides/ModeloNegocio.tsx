export default function ModeloNegocio() {
  return (
    <div className="relative w-screen h-screen overflow-hidden blueprint-grid" style={{ background: "#F4F5F9" }}>
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex justify-between items-center">
        <span className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "#1A3FAB" }}>MODELO DE NEGÓCIO</span>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(20,30,60,0.3)" }}>06 / 13</span>
      </div>

      <div className="absolute left-[6vw] right-[6vw]" style={{ top: "16vh" }}>
        <h2 className="font-display font-bold leading-tight tracking-tight mb-[3.5vh]" style={{ fontSize: "3.8vw", color: "#141e3c" }}>
          SaaS recorrente. Churn naturalmente baixo.
        </h2>

        <div className="grid gap-[1.5vw]" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr", marginBottom: "3.5vh" }}>
          {/* Free */}
          <div className="rounded-2xl p-[2.5vh_1.8vw] flex flex-col gap-[1.2vh]" style={{ background: "white", border: "1px solid rgba(26,63,171,0.12)" }}>
            <div className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "0.85vw", color: "#6b7280" }}>FREE</div>
            <div className="font-display font-bold" style={{ fontSize: "3vw", color: "#141e3c" }}>R$ 0</div>
            <div className="font-body" style={{ fontSize: "1.3vw", color: "#6b7280", lineHeight: 1.4 }}>5 usos de IA/dia · 1 projeto · 3 fases</div>
            <div className="mt-auto pt-[1.2vh]" style={{ borderTop: "1px solid rgba(0,0,0,0.07)" }}>
              <span className="font-body font-medium" style={{ fontSize: "1.2vw", color: "#1A3FAB" }}>Aquisição</span>
            </div>
          </div>

          {/* Básico */}
          <div className="rounded-2xl p-[2.5vh_1.8vw] flex flex-col gap-[1.2vh]" style={{ background: "rgba(26,63,171,0.05)", border: "1px solid rgba(26,63,171,0.2)" }}>
            <div className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "0.85vw", color: "#1A3FAB" }}>BÁSICO</div>
            <div>
              <span className="font-display font-bold" style={{ fontSize: "3vw", color: "#1A3FAB" }}>R$ 49</span>
              <span className="font-body" style={{ fontSize: "1.2vw", color: "#6b7280" }}>/mês</span>
            </div>
            <div className="font-body" style={{ fontSize: "1.3vw", color: "#141e3c", lineHeight: 1.4 }}>5 usos/dia · 3 projetos · fases ilimitadas</div>
            <div className="mt-auto pt-[1.2vh]" style={{ borderTop: "1px solid rgba(26,63,171,0.15)" }}>
              <span className="font-body font-medium" style={{ fontSize: "1.2vw", color: "#1A3FAB" }}>Entrada paga</span>
            </div>
          </div>

          {/* Pro */}
          <div className="rounded-2xl p-[2.5vh_1.8vw] flex flex-col gap-[1.2vh]" style={{ background: "rgba(26,63,171,0.07)", border: "1.5px solid #1A3FAB" }}>
            <div className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "0.85vw", color: "#1A3FAB" }}>PRO ✦</div>
            <div>
              <span className="font-display font-bold" style={{ fontSize: "3vw", color: "#1A3FAB" }}>R$ 149</span>
              <span className="font-body" style={{ fontSize: "1.2vw", color: "#6b7280" }}>/mês</span>
            </div>
            <div className="font-body" style={{ fontSize: "1.3vw", color: "#141e3c", lineHeight: 1.4 }}>20 usos/dia · 10 projetos · export + AI Advisor</div>
            <div className="mt-auto pt-[1.2vh]" style={{ borderTop: "1px solid rgba(26,63,171,0.2)" }}>
              <span className="font-body font-medium" style={{ fontSize: "1.2vw", color: "#1A3FAB" }}>Principal volume</span>
            </div>
          </div>

          {/* Avançado */}
          <div className="rounded-2xl p-[2.5vh_1.8vw] flex flex-col gap-[1.2vh]" style={{ background: "rgba(255,140,66,0.08)", border: "1.5px solid #FF8C42" }}>
            <div className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "0.85vw", color: "#FF8C42" }}>AVANÇADO</div>
            <div>
              <span className="font-display font-bold" style={{ fontSize: "3vw", color: "#FF8C42" }}>R$ 349</span>
              <span className="font-body" style={{ fontSize: "1.2vw", color: "#6b7280" }}>/mês</span>
            </div>
            <div className="font-body" style={{ fontSize: "1.3vw", color: "#141e3c", lineHeight: 1.4 }}>Ilimitado · times · suporte prioritário · print</div>
            <div className="mt-auto pt-[1.2vh]" style={{ borderTop: "1px solid rgba(255,140,66,0.3)" }}>
              <span className="font-body font-medium" style={{ fontSize: "1.2vw", color: "#FF8C42" }}>Expansão de receita</span>
            </div>
          </div>
        </div>

        <p className="font-body" style={{ fontSize: "1.7vw", color: "#6b7280" }}>
          Churn baixo estrutural — o founder investe tempo no próprio projeto e não abandona a meio caminho.
        </p>
      </div>
    </div>
  );
}
