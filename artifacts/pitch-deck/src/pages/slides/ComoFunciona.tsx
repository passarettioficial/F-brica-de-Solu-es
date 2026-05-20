export default function ComoFunciona() {
  return (
    <div className="relative w-screen h-screen overflow-hidden blueprint-grid" style={{ background: "#F4F5F9" }}>
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex justify-between items-center">
        <span className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "#1A3FAB" }}>COMO FUNCIONA</span>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(20,30,60,0.3)" }}>04 / 11</span>
      </div>

      <div className="absolute left-[6vw] right-[6vw]" style={{ top: "15vh" }}>
        <h2 className="font-display font-bold leading-tight tracking-tight mb-[4vh]" style={{ fontSize: "3.8vw", color: "#141e3c" }}>
          Cada fase gera entregáveis exportáveis.
        </h2>

        <div className="grid gap-[1.8vh]" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
          <div className="rounded-xl p-[1.8vh_1vw] flex flex-col gap-[1.2vh]" style={{ background: "white", border: "1px solid rgba(26,63,171,0.12)" }}>
            <div className="font-display font-bold" style={{ fontSize: "2.4vw", color: "#1A3FAB" }}>1</div>
            <div className="font-body font-medium" style={{ fontSize: "1.3vw", color: "#141e3c", lineHeight: 1.3 }}>Diagnóstico da ideia</div>
            <div className="font-body" style={{ fontSize: "1.1vw", color: "#6b7280", lineHeight: 1.3 }}>Validação de hipóteses</div>
          </div>
          <div className="rounded-xl p-[1.8vh_1vw] flex flex-col gap-[1.2vh]" style={{ background: "white", border: "1px solid rgba(26,63,171,0.12)" }}>
            <div className="font-display font-bold" style={{ fontSize: "2.4vw", color: "#1A3FAB" }}>2</div>
            <div className="font-body font-medium" style={{ fontSize: "1.3vw", color: "#141e3c", lineHeight: 1.3 }}>PRD e personas</div>
            <div className="font-body" style={{ fontSize: "1.1vw", color: "#6b7280", lineHeight: 1.3 }}>Doc de produto completo</div>
          </div>
          <div className="rounded-xl p-[1.8vh_1vw] flex flex-col gap-[1.2vh]" style={{ background: "white", border: "1px solid rgba(26,63,171,0.12)" }}>
            <div className="font-display font-bold" style={{ fontSize: "2.4vw", color: "#1A3FAB" }}>3</div>
            <div className="font-body font-medium" style={{ fontSize: "1.3vw", color: "#141e3c", lineHeight: 1.3 }}>Arquitetura técnica</div>
            <div className="font-body" style={{ fontSize: "1.1vw", color: "#6b7280", lineHeight: 1.3 }}>Stack e estrutura</div>
          </div>
          <div className="rounded-xl p-[1.8vh_1vw] flex flex-col gap-[1.2vh]" style={{ background: "white", border: "1px solid rgba(26,63,171,0.12)" }}>
            <div className="font-display font-bold" style={{ fontSize: "2.4vw", color: "#1A3FAB" }}>4</div>
            <div className="font-body font-medium" style={{ fontSize: "1.3vw", color: "#141e3c", lineHeight: 1.3 }}>Pricing</div>
            <div className="font-body" style={{ fontSize: "1.1vw", color: "#6b7280", lineHeight: 1.3 }}>Modelo e posicionamento</div>
          </div>
          <div className="rounded-xl p-[1.8vh_1vw] flex flex-col gap-[1.2vh]" style={{ background: "white", border: "1px solid rgba(26,63,171,0.12)" }}>
            <div className="font-display font-bold" style={{ fontSize: "2.4vw", color: "#1A3FAB" }}>5</div>
            <div className="font-body font-medium" style={{ fontSize: "1.3vw", color: "#141e3c", lineHeight: 1.3 }}>Go-to-market</div>
            <div className="font-body" style={{ fontSize: "1.1vw", color: "#6b7280", lineHeight: 1.3 }}>Estratégia de lançamento</div>
          </div>
          <div className="rounded-xl p-[1.8vh_1vw] flex flex-col gap-[1.2vh]" style={{ background: "white", border: "1px solid rgba(26,63,171,0.12)" }}>
            <div className="font-display font-bold" style={{ fontSize: "2.4vw", color: "#1A3FAB" }}>6</div>
            <div className="font-body font-medium" style={{ fontSize: "1.3vw", color: "#141e3c", lineHeight: 1.3 }}>MVP e validação</div>
            <div className="font-body" style={{ fontSize: "1.1vw", color: "#6b7280", lineHeight: 1.3 }}>Teste com mercado real</div>
          </div>
          <div className="rounded-xl p-[1.8vh_1vw] flex flex-col gap-[1.2vh]" style={{ background: "rgba(255,140,66,0.08)", border: "1px solid rgba(255,140,66,0.3)" }}>
            <div className="font-display font-bold" style={{ fontSize: "2.4vw", color: "#FF8C42" }}>7</div>
            <div className="font-body font-medium" style={{ fontSize: "1.3vw", color: "#141e3c", lineHeight: 1.3 }}>Investimento</div>
            <div className="font-body" style={{ fontSize: "1.1vw", color: "#6b7280", lineHeight: 1.3 }}>Deck e narrativa prontos</div>
          </div>
        </div>

        <div className="mt-[4vh] flex items-center gap-[2vw]">
          <div className="h-[1px] flex-1" style={{ background: "rgba(26,63,171,0.15)" }} />
          <p className="font-body font-medium" style={{ fontSize: "1.8vw", color: "#141e3c" }}>
            O founder avança no próprio ritmo. <span style={{ color: "#FF8C42" }}>45+ artefatos exportáveis.</span>
          </p>
          <div className="h-[1px] flex-1" style={{ background: "rgba(26,63,171,0.15)" }} />
        </div>
      </div>
    </div>
  );
}
