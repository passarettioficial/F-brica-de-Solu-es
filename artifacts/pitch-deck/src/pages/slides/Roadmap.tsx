export default function Roadmap() {
  return (
    <div className="relative w-screen h-screen overflow-hidden blueprint-grid" style={{ background: "#F4F5F9" }}>
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex justify-between items-center">
        <span className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "#1A3FAB" }}>ROADMAP</span>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(20,30,60,0.3)" }}>12 / 13</span>
      </div>

      <div className="absolute left-[6vw] right-[6vw]" style={{ top: "15vh" }}>
        <h2 className="font-display font-bold leading-tight tracking-tight mb-[4.5vh]" style={{ fontSize: "3.8vw", color: "#141e3c" }}>
          Execução em 4 fases. 2026–2027.
        </h2>

        <div className="grid gap-[2vw]" style={{ gridTemplateColumns: "1fr 1fr 1fr 1fr" }}>
          {[
            {
              quarter: "Q2 2026",
              label: "Lançamento",
              color: "#1A3FAB",
              items: ["Produto público ao vivo", "Free tier + Básico", "100 founders early-access", "Feedback loop ativo"],
            },
            {
              quarter: "Q3 2026",
              label: "Crescimento",
              color: "#1A3FAB",
              items: ["500 usuários ativos", "AI Advisor (Pro)", "Parceria com 3 aceleradoras", "Export PDF/MD"],
            },
            {
              quarter: "Q4 2026",
              label: "Escala",
              color: "#1A3FAB",
              items: ["2.000 usuários", "Plano times (Avançado)", "Integração Notion/Jira", "MRR R$ 100k"],
            },
            {
              quarter: "2027",
              label: "Expansão LatAm",
              color: "#FF8C42",
              items: ["Inglês e Espanhol", "5.000 founders ativos", "API pública", "Marketplace de templates"],
              accent: true,
            },
          ].map(({ quarter, label, color, items, accent }) => (
            <div
              key={quarter}
              className="rounded-2xl flex flex-col gap-[1.5vh] p-[2.5vh_2vw]"
              style={{
                background: accent ? "rgba(255,140,66,0.08)" : "white",
                border: `1px solid ${accent ? "rgba(255,140,66,0.3)" : "rgba(26,63,171,0.12)"}`,
              }}
            >
              <div>
                <div className="font-body font-medium uppercase tracking-widest mb-[0.5vh]" style={{ fontSize: "0.9vw", color }}>
                  {quarter}
                </div>
                <div className="font-display font-bold" style={{ fontSize: "1.8vw", color: "#141e3c" }}>{label}</div>
              </div>
              <div className="flex flex-col gap-[0.8vh]">
                {items.map((item) => (
                  <div key={item} className="flex items-start gap-[0.8vw]">
                    <span className="flex-shrink-0 mt-[0.4vh]" style={{ width: "0.5vw", height: "0.5vw", borderRadius: "50%", background: color, display: "inline-block" }} />
                    <span className="font-body" style={{ fontSize: "1.3vw", color: "#141e3c", lineHeight: 1.4 }}>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
