const base = import.meta.env.BASE_URL;

export default function Cover() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0F1F5C" }}>
      <div className="blueprint-grid-dark absolute inset-0" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 70% 50%, rgba(26,63,171,0.35) 0%, transparent 60%)" }} />
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
        <div className="text-right">
          <div className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "rgba(255,255,255,0.5)" }}>CONFIDENCIAL · MAIO 2026</div>
        </div>
      </div>

      <div className="absolute bottom-[12vh] left-[6vw]" style={{ maxWidth: "58vw" }}>
        <div className="font-body font-medium uppercase tracking-widest mb-[2vh]" style={{ fontSize: "1vw", color: "#FF8C42" }}>PITCH DECK</div>
        <h1 className="font-display font-bold text-white leading-none tracking-tight mb-[3vh]" style={{ fontSize: "7vw", textWrap: "balance" }}>
          FoundersFlow
        </h1>
        <p className="font-body text-white" style={{ fontSize: "2.2vw", lineHeight: 1.5, color: "rgba(255,255,255,0.75)", maxWidth: "46vw" }}>
          IA que audita produtos de founders — da ideia ao lançamento em 7 fases estruturadas.
        </p>
      </div>

      <div className="absolute bottom-[5vh] right-[6vw]">
        <div className="w-[12vw] h-[12vw] rounded-full" style={{ border: "1px solid rgba(255,255,255,0.08)", background: "rgba(26,63,171,0.2)" }} />
      </div>
      <div className="absolute bottom-[18vh] right-[14vw]">
        <div className="w-[6vw] h-[6vw] rounded-full" style={{ border: "1px solid rgba(255,140,66,0.2)", background: "rgba(255,140,66,0.08)" }} />
      </div>
    </div>
  );
}
