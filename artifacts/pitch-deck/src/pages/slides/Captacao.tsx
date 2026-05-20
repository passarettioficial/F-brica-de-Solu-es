export default function Captacao() {
  return (
    <div className="relative w-screen h-screen overflow-hidden blueprint-grid" style={{ background: "#F4F5F9" }}>
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex justify-between items-center">
        <span className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "#1A3FAB" }}>O QUE BUSCAMOS</span>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(20,30,60,0.3)" }}>10 / 11</span>
      </div>

      <div className="absolute left-[6vw]" style={{ top: "16vh", width: "44vw" }}>
        <div className="font-body font-medium uppercase tracking-widest mb-[2vh]" style={{ fontSize: "1vw", color: "#FF8C42" }}>RODADA [ANJO / PRE-SEED / SEED]</div>
        <div className="font-display font-bold leading-none tracking-tight mb-[4vh]" style={{ fontSize: "8vw", color: "#1A3FAB", letterSpacing: "-0.04em" }}>
          R$ [X]
        </div>
        <p className="font-body" style={{ fontSize: "2vw", color: "#6b7280", lineHeight: 1.5, marginBottom: "2vh" }}>
          Preencha o valor e a modalidade da rodada acima. Substitua os percentuais abaixo com o uso real do capital.
        </p>
      </div>

      <div className="absolute right-[6vw]" style={{ top: "16vh", bottom: "8vh", width: "38vw" }}>
        <div className="h-full flex flex-col gap-[2.5vh] justify-center">
          <h3 className="font-display font-bold" style={{ fontSize: "2.2vw", color: "#141e3c" }}>Uso do capital</h3>

          <div className="flex flex-col gap-[2vh]">
            <div>
              <div className="flex justify-between items-baseline mb-[1vh]">
                <span className="font-body font-medium" style={{ fontSize: "1.8vw", color: "#141e3c" }}>Produto e engenharia</span>
                <span className="font-display font-bold" style={{ fontSize: "2.2vw", color: "#1A3FAB" }}>[%]</span>
              </div>
              <div className="rounded-full h-[0.8vh]" style={{ background: "rgba(26,63,171,0.12)" }}>
                <div className="rounded-full h-full" style={{ width: "50%", background: "#1A3FAB" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-[1vh]">
                <span className="font-body font-medium" style={{ fontSize: "1.8vw", color: "#141e3c" }}>Growth e aquisição</span>
                <span className="font-display font-bold" style={{ fontSize: "2.2vw", color: "#1A3FAB" }}>[%]</span>
              </div>
              <div className="rounded-full h-[0.8vh]" style={{ background: "rgba(26,63,171,0.12)" }}>
                <div className="rounded-full h-full" style={{ width: "30%", background: "#1A3FAB" }} />
              </div>
            </div>

            <div>
              <div className="flex justify-between items-baseline mb-[1vh]">
                <span className="font-body font-medium" style={{ fontSize: "1.8vw", color: "#141e3c" }}>Operações e time</span>
                <span className="font-display font-bold" style={{ fontSize: "2.2vw", color: "#FF8C42" }}>[%]</span>
              </div>
              <div className="rounded-full h-[0.8vh]" style={{ background: "rgba(255,140,66,0.15)" }}>
                <div className="rounded-full h-full" style={{ width: "20%", background: "#FF8C42" }} />
              </div>
            </div>
          </div>

          <div className="rounded-xl px-[2vw] py-[1.8vh] mt-[1vh]" style={{ background: "rgba(26,63,171,0.06)", border: "1px solid rgba(26,63,171,0.1)" }}>
            <p className="font-body" style={{ fontSize: "1.5vw", color: "#6b7280" }}>
              Ajuste as barras de progresso para refletir os percentuais reais do uso do capital.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
