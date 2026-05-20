export default function GoToMarket() {
  return (
    <div className="relative w-screen h-screen overflow-hidden blueprint-grid" style={{ background: "#F4F5F9" }}>
      <div className="absolute top-0 left-0 right-0 h-[0.4vh]" style={{ background: "#FF8C42" }} />

      <div className="absolute top-[6vh] left-[6vw] right-[6vw] flex justify-between items-center">
        <span className="font-body font-medium uppercase tracking-widest" style={{ fontSize: "1vw", color: "#1A3FAB" }}>GO-TO-MARKET</span>
        <span className="font-body" style={{ fontSize: "1vw", color: "rgba(20,30,60,0.3)" }}>08 / 13</span>
      </div>

      <div className="absolute left-[6vw]" style={{ top: "16vh", width: "38vw" }}>
        <h2 className="font-display font-bold leading-tight tracking-tight mb-[3vh]" style={{ fontSize: "3.8vw", color: "#141e3c" }}>
          Product-led growth.<br />Comunidade primeiro.
        </h2>
        <p className="font-body" style={{ fontSize: "1.8vw", color: "#6b7280", lineHeight: 1.5 }}>
          O produto se vende ao entregar valor na fase 1 — sem cartão, sem atrito. O founder que termina uma fase convida o próximo.
        </p>
      </div>

      <div className="absolute right-[6vw]" style={{ top: "14vh", bottom: "7vh", width: "46vw" }}>
        <div className="h-full flex flex-col gap-[2vh] justify-center">

          <div className="flex items-start gap-[2vw] p-[2vh_2vw] rounded-2xl" style={{ background: "white", border: "1px solid rgba(26,63,171,0.12)" }}>
            <div className="flex-shrink-0 w-[3vw] h-[3vw] rounded-xl flex items-center justify-center font-display font-bold text-white" style={{ background: "#1A3FAB", fontSize: "1.4vw" }}>1</div>
            <div>
              <div className="font-body font-medium mb-[0.4vh]" style={{ fontSize: "1.7vw", color: "#141e3c" }}>Product-Led Growth (PLG)</div>
              <div className="font-body" style={{ fontSize: "1.4vw", color: "#6b7280", lineHeight: 1.4 }}>Free tier como funil. Fase 1 grátis gera resultado tangível — upgrade natural para continuar.</div>
            </div>
          </div>

          <div className="flex items-start gap-[2vw] p-[2vh_2vw] rounded-2xl" style={{ background: "white", border: "1px solid rgba(26,63,171,0.12)" }}>
            <div className="flex-shrink-0 w-[3vw] h-[3vw] rounded-xl flex items-center justify-center font-display font-bold text-white" style={{ background: "#1A3FAB", fontSize: "1.4vw" }}>2</div>
            <div>
              <div className="font-body font-medium mb-[0.4vh]" style={{ fontSize: "1.7vw", color: "#141e3c" }}>Conteúdo & SEO</div>
              <div className="font-body" style={{ fontSize: "1.4vw", color: "#6b7280", lineHeight: 1.4 }}>Blog, guias e templates para founders. Captura orgânica de "como validar minha startup".</div>
            </div>
          </div>

          <div className="flex items-start gap-[2vw] p-[2vh_2vw] rounded-2xl" style={{ background: "white", border: "1px solid rgba(26,63,171,0.12)" }}>
            <div className="flex-shrink-0 w-[3vw] h-[3vw] rounded-xl flex items-center justify-center font-display font-bold text-white" style={{ background: "#1A3FAB", fontSize: "1.4vw" }}>3</div>
            <div>
              <div className="font-body font-medium mb-[0.4vh]" style={{ fontSize: "1.7vw", color: "#141e3c" }}>Comunidade & Parceiros</div>
              <div className="font-body" style={{ fontSize: "1.4vw", color: "#6b7280", lineHeight: 1.4 }}>Aceleradoras, hubs e comunidades de founders. Deal com 1 hub = acesso a centenas de founders.</div>
            </div>
          </div>

          <div className="flex items-start gap-[2vw] p-[2vh_2vw] rounded-2xl" style={{ background: "rgba(255,140,66,0.08)", border: "1px solid rgba(255,140,66,0.25)" }}>
            <div className="flex-shrink-0 w-[3vw] h-[3vw] rounded-xl flex items-center justify-center font-display font-bold text-white" style={{ background: "#FF8C42", fontSize: "1.4vw" }}>4</div>
            <div>
              <div className="font-body font-medium mb-[0.4vh]" style={{ fontSize: "1.7vw", color: "#141e3c" }}>Referral + Artefatos como Vitrine</div>
              <div className="font-body" style={{ fontSize: "1.4vw", color: "#6b7280", lineHeight: 1.4 }}>PRD e deck exportados com branding FoundersFlow. Cada entregável compartilhado é um anúncio.</div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
