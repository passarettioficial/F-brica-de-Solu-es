export default function Mercado() {
  return (
    <div className="relative w-screen h-screen overflow-hidden blueprint-grid" style={{ background: "#F4F5F9" }}>
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex justify-between items-center">
        <span className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "#1A3FAB" }}>MERCADO</span>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(20,30,60,0.3)" }}>07 / 11</span>
      </div>

      <div className="absolute left-[6vw]" style={{ top: "16vh", width: "42vw" }}>
        <h2 className="font-display font-bold leading-tight tracking-tight mb-[3vh]" style={{ fontSize: "3.8vw", color: "#141e3c" }}>
          Founders early-stage no Brasil e América Latina.
        </h2>
        <p className="font-body" style={{ fontSize: "2vw", color: "#6b7280", lineHeight: 1.5, marginBottom: "4vh" }}>
          Times de produto que precisam de estrutura, não de mais ferramentas.
        </p>
        <div className="rounded-xl px-[2vw] py-[2vh]" style={{ background: "rgba(26,63,171,0.06)", border: "1px solid rgba(26,63,171,0.1)" }}>
          <p className="font-body" style={{ fontSize: "1.5vw", color: "#6b7280" }}>
            Inclua números de mercado verificados (TAM/SAM/SOM) antes de apresentar.
          </p>
        </div>
      </div>

      <div className="absolute right-[6vw]" style={{ top: "16vh", bottom: "8vh", width: "38vw" }}>
        <div className="h-full flex flex-col gap-[3vh] justify-center">
          <div className="flex flex-col gap-[1.2vh] p-[2.5vh_2.5vw] rounded-2xl" style={{ background: "white", border: "1px solid rgba(26,63,171,0.12)" }}>
            <div className="flex items-baseline gap-[1vw]">
              <span className="font-display font-bold" style={{ fontSize: "4vw", color: "#1A3FAB" }}>TAM</span>
              <span className="font-display font-bold" style={{ fontSize: "2.5vw", color: "#141e3c" }}>[estimar]</span>
            </div>
            <p className="font-body" style={{ fontSize: "1.6vw", color: "#6b7280" }}>startups ativos na região</p>
          </div>
          <div className="flex flex-col gap-[1.2vh] p-[2.5vh_2.5vw] rounded-2xl" style={{ background: "white", border: "1px solid rgba(26,63,171,0.12)" }}>
            <div className="flex items-baseline gap-[1vw]">
              <span className="font-display font-bold" style={{ fontSize: "4vw", color: "#1A3FAB" }}>SAM</span>
              <span className="font-display font-bold" style={{ fontSize: "2.5vw", color: "#141e3c" }}>[estimar]</span>
            </div>
            <p className="font-body" style={{ fontSize: "1.6vw", color: "#6b7280" }}>founders que pagam por ferramentas de produto</p>
          </div>
          <div className="flex flex-col gap-[1.2vh] p-[2.5vh_2.5vw] rounded-2xl" style={{ background: "rgba(255,140,66,0.08)", border: "1px solid rgba(255,140,66,0.25)" }}>
            <div className="flex items-baseline gap-[1vw]">
              <span className="font-display font-bold" style={{ fontSize: "4vw", color: "#FF8C42" }}>SOM</span>
              <span className="font-display font-bold" style={{ fontSize: "2.5vw", color: "#141e3c" }}>[estimar]</span>
            </div>
            <p className="font-body" style={{ fontSize: "1.6vw", color: "#6b7280" }}>early-adopters com perfil técnico-estratégico</p>
          </div>
        </div>
      </div>
    </div>
  );
}
