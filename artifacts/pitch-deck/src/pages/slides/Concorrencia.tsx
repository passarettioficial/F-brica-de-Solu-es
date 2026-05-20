export default function Concorrencia() {
  return (
    <div className="relative w-screen h-screen overflow-hidden blueprint-grid" style={{ background: "#F4F5F9" }}>
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex justify-between items-center">
        <span className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "#1A3FAB" }}>CONCORRÊNCIA</span>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(20,30,60,0.3)" }}>09 / 13</span>
      </div>

      <div className="absolute left-[6vw] right-[6vw]" style={{ top: "15vh" }}>
        <h2 className="font-display font-bold leading-tight tracking-tight mb-[4vh]" style={{ fontSize: "3.4vw", color: "#141e3c" }}>
          O mercado tem partes da solução.<br />Ninguém tem o processo completo.
        </h2>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                <th className="font-body font-medium uppercase tracking-wider text-left" style={{ fontSize: "1vw", color: "#6b7280", padding: "0 1.5vw 1.5vh 0", width: "20%" }}></th>
                <th className="font-body font-medium uppercase tracking-wider text-center" style={{ fontSize: "1vw", color: "#6b7280", padding: "0 1vw 1.5vh", width: "16%" }}>Processo<br />Estruturado</th>
                <th className="font-body font-medium uppercase tracking-wider text-center" style={{ fontSize: "1vw", color: "#6b7280", padding: "0 1vw 1.5vh", width: "16%" }}>Artefatos<br />Exportáveis</th>
                <th className="font-body font-medium uppercase tracking-wider text-center" style={{ fontSize: "1vw", color: "#6b7280", padding: "0 1vw 1.5vh", width: "16%" }}>IA<br />Embutida</th>
                <th className="font-body font-medium uppercase tracking-wider text-center" style={{ fontSize: "1vw", color: "#6b7280", padding: "0 1vw 1.5vh", width: "16%" }}>Foco em<br />Founders</th>
                <th className="font-body font-medium uppercase tracking-wider text-center" style={{ fontSize: "1vw", color: "#6b7280", padding: "0 1vw 1.5vh", width: "16%" }}>Preço<br />Acessível</th>
              </tr>
            </thead>
            <tbody>
              {[
                { name: "ChatGPT / Claude", vals: [false, false, true, false, true] },
                { name: "Notion / Coda", vals: [false, true, false, false, true] },
                { name: "Consultores", vals: [true, true, false, true, false] },
                { name: "ProductBoard", vals: [false, true, false, false, false] },
                { name: "FoundersFlow", vals: [true, true, true, true, true], highlight: true },
              ].map(({ name, vals, highlight }) => (
                <tr key={name} style={{ borderTop: "1px solid rgba(26,63,171,0.08)" }}>
                  <td className="font-body font-medium" style={{ padding: "1.6vh 1.5vw 1.6vh 0", fontSize: "1.6vw", color: highlight ? "#1A3FAB" : "#141e3c" }}>
                    {highlight ? <strong>{name}</strong> : name}
                  </td>
                  {vals.map((v, i) => (
                    <td key={i} className="text-center" style={{ padding: "1.6vh 1vw" }}>
                      {v
                        ? <span className="font-display font-bold" style={{ fontSize: "1.8vw", color: highlight ? "#1A3FAB" : "#22c55e" }}>✓</span>
                        : <span style={{ fontSize: "1.8vw", color: "rgba(0,0,0,0.18)" }}>–</span>
                      }
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-[3vh] rounded-xl px-[2.5vw] py-[2vh]" style={{ background: "rgba(26,63,171,0.06)", border: "1px solid rgba(26,63,171,0.1)" }}>
          <p className="font-body font-medium" style={{ fontSize: "1.6vw", color: "#141e3c" }}>
            FoundersFlow é a única plataforma que une <span style={{ color: "#1A3FAB" }}>processo estruturado + IA + exportação + foco em founders</span> em um único produto acessível.
          </p>
        </div>
      </div>
    </div>
  );
}
