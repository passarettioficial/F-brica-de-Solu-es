export default function Time() {
  return (
    <div className="relative w-screen h-screen overflow-hidden blueprint-grid" style={{ background: "#F4F5F9" }}>
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex justify-between items-center">
        <span className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "#1A3FAB" }}>TIME</span>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(20,30,60,0.3)" }}>11 / 13</span>
      </div>

      <div className="absolute left-[6vw] right-[6vw]" style={{ top: "16vh" }}>
        <h2 className="font-display font-bold leading-tight tracking-tight mb-[5vh]" style={{ fontSize: "3.8vw", color: "#141e3c" }}>
          Construído por founders,<br />para founders.
        </h2>

        <div className="grid gap-[3vw]" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="flex flex-col gap-[2vh]">
            <div className="rounded-2xl flex items-center justify-center font-display font-bold text-white" style={{ width: "8vw", height: "8vw", background: "#1A3FAB", fontSize: "3vw" }}>
              [F]
            </div>
            <div>
              <div className="font-display font-bold mb-[0.5vh]" style={{ fontSize: "2.2vw", color: "#141e3c" }}>[Nome]</div>
              <div className="font-body font-medium mb-[1vh]" style={{ fontSize: "1.5vw", color: "#FF8C42" }}>CEO / Produto</div>
              <div className="font-body" style={{ fontSize: "1.4vw", color: "#6b7280", lineHeight: 1.4 }}>Adicione experiência e contexto relevante aqui.</div>
            </div>
          </div>
          <div className="flex flex-col gap-[2vh]">
            <div className="rounded-2xl flex items-center justify-center font-display font-bold text-white" style={{ width: "8vw", height: "8vw", background: "#1A3FAB", fontSize: "3vw" }}>
              [F]
            </div>
            <div>
              <div className="font-display font-bold mb-[0.5vh]" style={{ fontSize: "2.2vw", color: "#141e3c" }}>[Nome]</div>
              <div className="font-body font-medium mb-[1vh]" style={{ fontSize: "1.5vw", color: "#FF8C42" }}>CTO / Engenharia</div>
              <div className="font-body" style={{ fontSize: "1.4vw", color: "#6b7280", lineHeight: 1.4 }}>Adicione experiência e contexto relevante aqui.</div>
            </div>
          </div>
          <div className="flex flex-col gap-[2vh]">
            <div className="rounded-2xl flex items-center justify-center font-display font-bold text-white" style={{ width: "8vw", height: "8vw", background: "#1A3FAB", fontSize: "3vw" }}>
              [F]
            </div>
            <div>
              <div className="font-display font-bold mb-[0.5vh]" style={{ fontSize: "2.2vw", color: "#141e3c" }}>[Nome]</div>
              <div className="font-body font-medium mb-[1vh]" style={{ fontSize: "1.5vw", color: "#FF8C42" }}>Growth / GTM</div>
              <div className="font-body" style={{ fontSize: "1.4vw", color: "#6b7280", lineHeight: 1.4 }}>Adicione experiência e contexto relevante aqui.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
