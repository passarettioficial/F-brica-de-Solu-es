export default function Problema() {
  return (
    <div className="relative w-screen h-screen overflow-hidden blueprint-grid" style={{ background: "#F4F5F9" }}>
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex justify-between items-center">
        <span className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "#1A3FAB" }}>O PROBLEMA</span>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(20,30,60,0.3)" }}>02 / 13</span>
      </div>

      <div className="absolute left-[6vw] right-[6vw]" style={{ top: "16vh" }}>
        <h2 className="font-display font-bold leading-tight tracking-tight mb-[5vh]" style={{ fontSize: "4.5vw", color: "#141e3c", textWrap: "balance" }}>
          Founders gastam meses<br />construindo produtos errados.
        </h2>

        <div className="grid gap-[2.5vh]" style={{ gridTemplateColumns: "1fr 1fr 1fr", maxWidth: "80vw" }}>
          <div className="rounded-xl p-[2.5vh_2vw]" style={{ background: "rgba(26,63,171,0.06)", borderLeft: "3px solid #1A3FAB" }}>
            <div className="font-display font-bold mb-[1.2vh]" style={{ fontSize: "2.8vw", color: "#1A3FAB" }}>90%</div>
            <p className="font-body" style={{ fontSize: "1.6vw", color: "#141e3c", lineHeight: 1.4 }}>dos startups falham por falta de validação estruturada</p>
          </div>
          <div className="rounded-xl p-[2.5vh_2vw]" style={{ background: "rgba(26,63,171,0.06)", borderLeft: "3px solid #1A3FAB" }}>
            <div className="font-display font-bold mb-[1.2vh]" style={{ fontSize: "2.8vw", color: "#1A3FAB" }}>GPT</div>
            <p className="font-body" style={{ fontSize: "1.6vw", color: "#141e3c", lineHeight: 1.4 }}>e planilhas não substituem um processo de produto</p>
          </div>
          <div className="rounded-xl p-[2.5vh_2vw]" style={{ background: "rgba(26,63,171,0.06)", borderLeft: "3px solid #FF8C42" }}>
            <div className="font-display font-bold mb-[1.2vh]" style={{ fontSize: "2.8vw", color: "#FF8C42" }}>$$$</div>
            <p className="font-body" style={{ fontSize: "1.6vw", color: "#141e3c", lineHeight: 1.4 }}>Cada decisão sem dados custa tempo e capital</p>
          </div>
        </div>

        <div className="mt-[4vh]" style={{ paddingTop: "3vh", borderTop: "1px solid rgba(26,63,171,0.12)" }}>
          <p className="font-body font-medium" style={{ fontSize: "2vw", color: "#141e3c" }}>
            O mercado tem ferramentas. <span style={{ color: "#FF8C42" }}>Falta o método.</span>
          </p>
        </div>
      </div>
    </div>
  );
}
