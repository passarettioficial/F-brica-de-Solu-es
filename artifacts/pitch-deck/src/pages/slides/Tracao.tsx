export default function Tracao() {
  return (
    <div className="relative w-screen h-screen overflow-hidden blueprint-grid" style={{ background: "#F4F5F9" }}>
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex justify-between items-center">
        <span className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "#1A3FAB" }}>TRAÇÃO</span>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(20,30,60,0.3)" }}>07 / 13</span>
      </div>

      <div className="absolute left-[6vw] right-[6vw]" style={{ top: "16vh" }}>
        <h2 className="font-display font-bold leading-tight tracking-tight mb-[6vh]" style={{ fontSize: "3.8vw", color: "#141e3c" }}>
          Números reais. Produto vivo.
        </h2>

        <div className="grid gap-[3vw]" style={{ gridTemplateColumns: "1fr 1fr 1fr" }}>
          <div className="flex flex-col gap-[1vh]">
            <div className="font-display font-bold leading-none" style={{ fontSize: "10vw", color: "#1A3FAB", letterSpacing: "-0.04em" }}>[X]</div>
            <div className="font-body font-medium" style={{ fontSize: "2vw", color: "#141e3c" }}>founders ativos</div>
            <div className="font-body" style={{ fontSize: "1.5vw", color: "#6b7280" }}>usuários com projeto em andamento</div>
          </div>
          <div className="flex flex-col gap-[1vh]">
            <div className="font-display font-bold leading-none" style={{ fontSize: "10vw", color: "#1A3FAB", letterSpacing: "-0.04em" }}>[X]</div>
            <div className="font-body font-medium" style={{ fontSize: "2vw", color: "#141e3c" }}>artefatos gerados</div>
            <div className="font-body" style={{ fontSize: "1.5vw", color: "#6b7280" }}>PRDs, personas, roadmaps exportados</div>
          </div>
          <div className="flex flex-col gap-[1vh]">
            <div className="font-display font-bold leading-none" style={{ fontSize: "10vw", color: "#FF8C42", letterSpacing: "-0.04em" }}>[X]</div>
            <div className="font-body font-medium" style={{ fontSize: "2vw", color: "#141e3c" }}>fases completadas</div>
            <div className="font-body" style={{ fontSize: "1.5vw", color: "#6b7280" }}>etapas do processo concluídas</div>
          </div>
        </div>

        <div className="mt-[5vh] rounded-xl px-[2.5vw] py-[2vh]" style={{ background: "rgba(26,63,171,0.06)", border: "1px solid rgba(26,63,171,0.1)" }}>
          <p className="font-body" style={{ fontSize: "1.6vw", color: "#6b7280" }}>
            Substitua os placeholders [X] com seus números reais antes de apresentar.
          </p>
        </div>
      </div>
    </div>
  );
}
