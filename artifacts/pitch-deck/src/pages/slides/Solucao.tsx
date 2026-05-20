export default function Solucao() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0F1F5C" }}>
      <div className="blueprint-grid-dark absolute inset-0" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 30% 60%, rgba(26,63,171,0.4) 0%, transparent 55%)" }} />
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex justify-between items-center">
        <span className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "rgba(255,140,66,0.8)" }}>A SOLUÇÃO</span>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(255,255,255,0.25)" }}>03 / 11</span>
      </div>

      <div className="absolute left-[6vw]" style={{ top: "18vh", maxWidth: "52vw" }}>
        <h2 className="font-display font-bold text-white leading-tight tracking-tight mb-[4vh]" style={{ fontSize: "4.8vw", textWrap: "balance" }}>
          7 fases sequenciais.<br />Artefatos acionáveis.
        </h2>
        <p className="font-body text-white mb-[4vh]" style={{ fontSize: "2.2vw", lineHeight: 1.55, color: "rgba(255,255,255,0.78)" }}>
          Auditamos o produto existente e geramos PRD, personas, arquitetura e go-to-market — tudo exportável, tudo no seu ritmo.
        </p>
        <div className="inline-block rounded-full px-[2vw] py-[1.2vh] font-body font-medium" style={{ fontSize: "1.8vw", background: "rgba(255,140,66,0.15)", border: "1px solid rgba(255,140,66,0.4)", color: "#FF8C42" }}>
          Não é um chatbot. É um processo de produto com IA embutida.
        </div>
      </div>

      <div className="absolute right-[6vw]" style={{ top: "20vh", bottom: "8vh", width: "34vw" }}>
        <div className="h-full rounded-2xl flex flex-col justify-center gap-[2.5vh] px-[2.5vw] py-[3vh]" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <div className="flex items-center gap-[1.2vw]">
            <div className="w-[2.4vw] h-[2.4vw] rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold" style={{ background: "#1A3FAB", color: "white", fontSize: "1.1vw" }}>1</div>
            <span className="font-body" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.85)" }}>Diagnóstico da ideia</span>
          </div>
          <div className="flex items-center gap-[1.2vw]">
            <div className="w-[2.4vw] h-[2.4vw] rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold" style={{ background: "#1A3FAB", color: "white", fontSize: "1.1vw" }}>2</div>
            <span className="font-body" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.85)" }}>PRD e personas</span>
          </div>
          <div className="flex items-center gap-[1.2vw]">
            <div className="w-[2.4vw] h-[2.4vw] rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold" style={{ background: "#1A3FAB", color: "white", fontSize: "1.1vw" }}>3</div>
            <span className="font-body" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.85)" }}>Arquitetura técnica</span>
          </div>
          <div className="flex items-center gap-[1.2vw]">
            <div className="w-[2.4vw] h-[2.4vw] rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold" style={{ background: "#1A3FAB", color: "white", fontSize: "1.1vw" }}>4</div>
            <span className="font-body" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.85)" }}>Estratégia de pricing</span>
          </div>
          <div className="flex items-center gap-[1.2vw]">
            <div className="w-[2.4vw] h-[2.4vw] rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold" style={{ background: "#1A3FAB", color: "white", fontSize: "1.1vw" }}>5</div>
            <span className="font-body" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.85)" }}>Go-to-market</span>
          </div>
          <div className="flex items-center gap-[1.2vw]">
            <div className="w-[2.4vw] h-[2.4vw] rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold" style={{ background: "#1A3FAB", color: "white", fontSize: "1.1vw" }}>6</div>
            <span className="font-body" style={{ fontSize: "1.6vw", color: "rgba(255,255,255,0.85)" }}>MVP e validação</span>
          </div>
          <div className="flex items-center gap-[1.2vw]">
            <div className="w-[2.4vw] h-[2.4vw] rounded-full flex items-center justify-center flex-shrink-0 font-display font-bold" style={{ background: "#FF8C42", color: "white", fontSize: "1.1vw" }}>7</div>
            <span className="font-body font-medium" style={{ fontSize: "1.6vw", color: "#FF8C42" }}>Preparação para investimento</span>
          </div>
        </div>
      </div>
    </div>
  );
}
