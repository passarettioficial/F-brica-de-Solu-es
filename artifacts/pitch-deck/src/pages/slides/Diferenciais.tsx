export default function Diferenciais() {
  return (
    <div className="relative w-screen h-screen overflow-hidden" style={{ background: "#0F1F5C" }}>
      <div className="blueprint-grid-dark absolute inset-0" />
      <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse at 80% 30%, rgba(255,140,66,0.12) 0%, transparent 50%)" }} />
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex justify-between items-center">
        <span className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "rgba(255,140,66,0.8)" }}>DIFERENCIAIS</span>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(255,255,255,0.25)" }}>10 / 13</span>
      </div>

      <div className="absolute left-[6vw]" style={{ top: "16vh", width: "40vw" }}>
        <h2 className="font-display font-bold text-white leading-tight tracking-tight mb-[5vh]" style={{ fontSize: "4.2vw" }}>
          Por que a FoundersFlow<br />e não outra ferramenta?
        </h2>
      </div>

      <div className="absolute left-[6vw] right-[6vw]" style={{ top: "42vh" }}>
        <div className="grid gap-[2vw]" style={{ gridTemplateColumns: "1fr 1fr" }}>
          <div className="flex items-start gap-[1.5vw] p-[2vh_2vw] rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex-shrink-0 mt-[0.3vh]" style={{ width: "0.8vw", height: "0.8vw", borderRadius: "50%", background: "#FF8C42", marginTop: "0.8vh" }} />
            <div>
              <div className="font-body font-medium text-white mb-[0.5vh]" style={{ fontSize: "1.8vw" }}>Processo sequencial</div>
              <div className="font-body" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.55)" }}>Não prompt solto — método estruturado fase a fase</div>
            </div>
          </div>
          <div className="flex items-start gap-[1.5vw] p-[2vh_2vw] rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex-shrink-0" style={{ width: "0.8vw", height: "0.8vw", borderRadius: "50%", background: "#FF8C42", marginTop: "0.8vh" }} />
            <div>
              <div className="font-body font-medium text-white mb-[0.5vh]" style={{ fontSize: "1.8vw" }}>Artefatos exportáveis</div>
              <div className="font-body" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.55)" }}>Markdown e PDF prontos para usar com time e investidor</div>
            </div>
          </div>
          <div className="flex items-start gap-[1.5vw] p-[2vh_2vw] rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex-shrink-0" style={{ width: "0.8vw", height: "0.8vw", borderRadius: "50%", background: "#FF8C42", marginTop: "0.8vh" }} />
            <div>
              <div className="font-body font-medium text-white mb-[0.5vh]" style={{ fontSize: "1.8vw" }}>Calibrado por estágio</div>
              <div className="font-body" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.55)" }}>A fase 1 audita o que o founder já construiu</div>
            </div>
          </div>
          <div className="flex items-start gap-[1.5vw] p-[2vh_2vw] rounded-xl" style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.08)" }}>
            <div className="flex-shrink-0" style={{ width: "0.8vw", height: "0.8vw", borderRadius: "50%", background: "#FF8C42", marginTop: "0.8vh" }} />
            <div>
              <div className="font-body font-medium text-white mb-[0.5vh]" style={{ fontSize: "1.8vw" }}>LGPD compliant · sem lock-in</div>
              <div className="font-body" style={{ fontSize: "1.4vw", color: "rgba(255,255,255,0.55)" }}>Dados do founder permanecem do founder</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
