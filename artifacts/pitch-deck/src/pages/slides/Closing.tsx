export default function Closing() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0F1F5C" }}>
      <div className="blueprint-grid-dark absolute inset-0" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 40% 60%, rgba(26,63,171,0.45) 0%, transparent 60%)" }} />
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[5vh] left-[6vw] right-[6vw] flex justify-between items-start">
        <div className="flex items-center gap-[1vw]">
          <div className="w-[2.2vw] h-[2.2vw] rounded-full flex items-center justify-center" style={{ background: "#1A3FAB" }}>
            <svg width="60%" height="60%" viewBox="0 0 24 24" fill="none">
              <path d="M2 12L12 2l10 10M4 10v9a1 1 0 001 1h5v-5h4v5h5a1 1 0 001-1v-9" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span className="font-display font-bold text-white" style={{ fontSize: "1.4vw", letterSpacing: "-0.02em" }}>FoundersFlow</span>
        </div>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(255,255,255,0.25)" }}>11 / 11</span>
      </div>

      <div className="absolute left-[6vw]" style={{ top: "28vh", maxWidth: "56vw" }}>
        <p className="font-body font-medium uppercase tracking-widest mb-[3vh]" style={{ fontSize: "1vw", color: "#FF8C42" }}>OBRIGADO</p>
        <h2 className="font-display font-bold text-white leading-tight tracking-tight mb-[4vh]" style={{ fontSize: "5.5vw", textWrap: "balance" }}>
          Founders que já começaram merecem um processo à altura.
        </h2>

        <div className="flex flex-col gap-[1.5vh]">
          <div className="flex items-center gap-[1.5vw]">
            <div className="h-[1px] w-[2vw]" style={{ background: "#FF8C42" }} />
            <span className="font-body font-medium text-white" style={{ fontSize: "2vw" }}>contato@foundersflow.com.br</span>
          </div>
          <div className="flex items-center gap-[1.5vw]">
            <div className="h-[1px] w-[2vw]" style={{ background: "#FF8C42" }} />
            <span className="font-body font-medium text-white" style={{ fontSize: "2vw" }}>www.foundersflow.com.br</span>
          </div>
        </div>
      </div>

      <div className="absolute bottom-[6vh] right-[6vw]">
        <div className="w-[18vw] h-[18vw] rounded-full" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(26,63,171,0.15)" }} />
      </div>
      <div className="absolute bottom-[22vh] right-[18vw]">
        <div className="w-[8vw] h-[8vw] rounded-full" style={{ border: "1px solid rgba(255,140,66,0.15)", background: "rgba(255,140,66,0.06)" }} />
      </div>
    </div>
  );
}
