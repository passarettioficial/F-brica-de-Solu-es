export default function Produto() {
  return (
    <div className="relative w-screen h-screen overflow-hidden blueprint-grid" style={{ background: "#F4F5F9" }}>
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex justify-between items-center">
        <span className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "#1A3FAB" }}>PRODUTO</span>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(20,30,60,0.3)" }}>04 / 13</span>
      </div>

      <div className="absolute left-[6vw] right-[6vw]" style={{ top: "15vh" }}>
        <h2 className="font-display font-bold leading-tight tracking-tight mb-[3.5vh]" style={{ fontSize: "3.8vw", color: "#141e3c" }}>
          7 fases. 45+ artefatos.<br />Tudo no seu ritmo.
        </h2>

        <div className="grid gap-[1.2vw]" style={{ gridTemplateColumns: "repeat(7, 1fr)" }}>
          {[
            { n: "1", label: "Diagnóstico", sub: "Validação de hipóteses", accent: false },
            { n: "2", label: "PRD & Personas", sub: "Documento de produto", accent: false },
            { n: "3", label: "Arquitetura", sub: "Stack e estrutura técnica", accent: false },
            { n: "4", label: "Pricing", sub: "Modelo e posicionamento", accent: false },
            { n: "5", label: "GTM", sub: "Estratégia de lançamento", accent: false },
            { n: "6", label: "MVP", sub: "Teste com mercado real", accent: false },
            { n: "7", label: "Investimento", sub: "Deck e narrativa prontos", accent: true },
          ].map(({ n, label, sub, accent }) => (
            <div
              key={n}
              className="rounded-xl flex flex-col gap-[1.2vh] p-[1.8vh_1.2vw]"
              style={{
                background: accent ? "rgba(255,140,66,0.08)" : "white",
                border: `1px solid ${accent ? "rgba(255,140,66,0.3)" : "rgba(26,63,171,0.12)"}`,
              }}
            >
              <div className="font-display font-bold leading-none" style={{ fontSize: "2.8vw", color: accent ? "#FF8C42" : "#1A3FAB" }}>{n}</div>
              <div className="font-body font-medium" style={{ fontSize: "1.25vw", color: "#141e3c", lineHeight: 1.3 }}>{label}</div>
              <div className="font-body" style={{ fontSize: "1.1vw", color: "#6b7280", lineHeight: 1.3 }}>{sub}</div>
            </div>
          ))}
        </div>

        <div className="mt-[3.5vh] flex items-stretch gap-[2vw]">
          <div className="flex-1 rounded-xl p-[2vh_2vw] flex items-center gap-[1.5vw]" style={{ background: "rgba(26,63,171,0.06)", border: "1px solid rgba(26,63,171,0.1)" }}>
            <div className="font-display font-bold" style={{ fontSize: "3vw", color: "#1A3FAB" }}>45+</div>
            <div className="font-body" style={{ fontSize: "1.5vw", color: "#141e3c", lineHeight: 1.4 }}>artefatos exportáveis<br /><span style={{ color: "#6b7280" }}>Markdown e PDF prontos</span></div>
          </div>
          <div className="flex-1 rounded-xl p-[2vh_2vw] flex items-center gap-[1.5vw]" style={{ background: "rgba(26,63,171,0.06)", border: "1px solid rgba(26,63,171,0.1)" }}>
            <div className="font-display font-bold" style={{ fontSize: "3vw", color: "#1A3FAB" }}>100%</div>
            <div className="font-body" style={{ fontSize: "1.5vw", color: "#141e3c", lineHeight: 1.4 }}>self-serve<br /><span style={{ color: "#6b7280" }}>O founder avança no próprio ritmo</span></div>
          </div>
          <div className="flex-1 rounded-xl p-[2vh_2vw] flex items-center gap-[1.5vw]" style={{ background: "rgba(255,140,66,0.08)", border: "1px solid rgba(255,140,66,0.25)" }}>
            <div className="font-display font-bold" style={{ fontSize: "3vw", color: "#FF8C42" }}>IA</div>
            <div className="font-body" style={{ fontSize: "1.5vw", color: "#141e3c", lineHeight: 1.4 }}>embutida em cada fase<br /><span style={{ color: "#6b7280" }}>Não é um chatbot genérico</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
