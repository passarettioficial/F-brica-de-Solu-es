export function DiagonalTrail() {
  return (
    <div
      className="min-h-screen"
      style={{ background: "hsl(220 20% 97%)", fontFamily: "Inter, sans-serif" }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;700&family=Inter:wght@400;500;600&display=swap');
        .hero-grid-mock2 {
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(26,63,171,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(26,63,171,0.045) 1px, transparent 1px);
          background-size: 48px 48px;
        }
        .stat-shimmer-mock2 {
          background: linear-gradient(90deg, #1A3FAB 0%, #6b8ef5 40%, #1A3FAB 100%);
          background-size: 200% 100%;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
      `}</style>

      <div style={{ position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", inset: 0, background: "radial-gradient(circle at top left, rgba(26,63,171,0.10) 0%, transparent 32%), radial-gradient(circle at top right, rgba(255,140,66,0.09) 0%, transparent 28%)" }} />
      </div>

      {/* ── Paper Airplane — Trilha Diagonal com caminho tracejado ── */}
      <div style={{
        position: "absolute",
        inset: 0,
        zIndex: 1,
        pointerEvents: "none",
        overflow: "hidden",
      }}>
        <svg width="100%" height="100%" viewBox="0 0 1280 820" preserveAspectRatio="xMidYMid slice" fill="none">
          {/* Dashed trail path — gentle arc from lower-left to upper-right */}
          <path
            d="M -40 750 C 200 600, 500 350, 950 90"
            stroke="#1A3FAB"
            strokeWidth="1.5"
            strokeDasharray="6 10"
            opacity="0.13"
            strokeLinecap="round"
          />
          {/* Small dots along the path to suggest trajectory */}
          <circle cx="120" cy="660" r="2.5" fill="#1A3FAB" opacity="0.1" />
          <circle cx="280" cy="540" r="2" fill="#1A3FAB" opacity="0.09" />
          <circle cx="470" cy="390" r="2" fill="#1A3FAB" opacity="0.08" />
          <circle cx="680" cy="240" r="1.5" fill="#1A3FAB" opacity="0.07" />

          {/* Paper airplane at end of trail — upper right area */}
          <g transform="translate(920, 78) rotate(-32)" opacity="0.12">
            {/* Main body */}
            <path d="M0 56 L160 0 L112 56 L160 112 Z" fill="#1A3FAB" />
            {/* Belly fold */}
            <path d="M0 56 L112 56 L90 88 Z" fill="#1A3FAB" />
            {/* Wing crease highlight */}
            <line x1="0" y1="56" x2="160" y2="0" stroke="white" strokeWidth="1" opacity="0.3" />
          </g>
        </svg>
      </div>

      {/* Header */}
      <header style={{
        padding: "16px 32px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        borderBottom: "1px solid rgba(0,0,0,0.07)",
        background: "rgba(244,245,249,0.85)",
        position: "sticky",
        top: 0,
        zIndex: 20,
        backdropFilter: "blur(12px)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: "50%", background: "#1A3FAB", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M3 12l9-9 9 9M5 10v9a1 1 0 001 1h4v-5h4v5h4a1 1 0 001-1v-9" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
          </div>
          <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontWeight: 600, fontSize: 15, color: "#141e3c" }}>FoundersFlow</span>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <span style={{ fontSize: 13, color: "#6b7280", cursor: "pointer" }}>Entrar</span>
          <div style={{ background: "#FF8C42", color: "white", fontSize: 13, fontWeight: 600, padding: "6px 16px", borderRadius: 8, cursor: "pointer" }}>
            Analisar meu projeto
          </div>
        </div>
      </header>

      {/* Hero */}
      <section style={{ position: "relative", padding: "80px 32px", overflow: "hidden" }}>
        <div className="hero-grid-mock2" />

        <div style={{ position: "relative", zIndex: 10, maxWidth: 1100, margin: "0 auto", display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 48, alignItems: "center" }}>
          <div>
            <h1 style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: 72,
              fontWeight: 700,
              lineHeight: 0.94,
              letterSpacing: "-2px",
              color: "#141e3c",
              margin: "0 0 32px",
            }}>
              Você já<br />
              começou.<br />
              <span style={{ color: "#1A3FAB", textDecoration: "underline", textDecorationColor: "#FF8C42", textDecorationThickness: 4, textUnderlineOffset: 4 }}>Na direção certa?</span>
            </h1>

            <p style={{ fontSize: 17, color: "#6b7280", marginBottom: 16, maxWidth: 540, lineHeight: 1.65 }}>
              Em 7 fases estruturadas, a IA <strong style={{ color: "#141e3c" }}>audita o que você já construiu</strong>, valida suas hipóteses e gera os artefatos que alimentam cada próxima decisão.
            </p>

            <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,0.8)", border: "1px solid rgba(0,0,0,0.09)", borderRadius: 999, padding: "8px 16px", marginBottom: 20 }}>
              <span style={{ fontSize: 11, fontFamily: "monospace", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.15em" }}>vs ChatGPT</span>
              <span style={{ width: 1, height: 12, background: "#e5e7eb" }} />
              <span style={{ fontSize: 12, color: "#141e3c", fontWeight: 500 }}>O ChatGPT te dá uma resposta. A FoundersFlow audita seu produto.</span>
            </div>

            <p style={{ fontSize: 13, color: "rgba(107,114,128,0.7)", fontStyle: "italic", marginBottom: 36, lineHeight: 1.6 }}>
              Não importa onde você está. As primeiras fases calibram o que você já construiu.
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", border: "1px solid rgba(0,0,0,0.08)", borderRadius: 16, overflow: "hidden", background: "rgba(255,255,255,0.7)", marginBottom: 40 }}>
              {[{ v: "7", l: "fases" }, { v: "45+", l: "artefatos" }, { v: "100%", l: "estruturado" }].map((s, i) => (
                <div key={i} style={{ padding: "20px 24px", textAlign: "center", borderRight: i < 2 ? "1px solid rgba(0,0,0,0.07)" : "none" }}>
                  <div className="stat-shimmer-mock2" style={{ fontSize: 28, fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif" }}>{s.v}</div>
                  <div style={{ fontSize: 11, color: "#9ca3af", fontFamily: "monospace", textTransform: "uppercase", letterSpacing: "0.15em", marginTop: 2 }}>{s.l}</div>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <div style={{ background: "#FF8C42", color: "white", fontSize: 15, fontWeight: 600, padding: "12px 28px", borderRadius: 12, cursor: "pointer", boxShadow: "0 4px 16px rgba(255,140,66,0.3)" }}>
                Analisar meu projeto agora →
              </div>
              <div style={{ fontSize: 14, color: "#6b7280", padding: "12px 16px", border: "1px solid rgba(0,0,0,0.1)", borderRadius: 12, cursor: "pointer" }}>
                Ver o que a IA gera →
              </div>
            </div>

            <p style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(107,114,128,0.5)", marginTop: 16, letterSpacing: "0.1em" }}>
              SEM CARTÃO DE CRÉDITO · 3 FASES GRATUITAS COMPLETAS
            </p>
          </div>

          <div style={{ transform: "rotate(-1.5deg)" }}>
            <div style={{ border: "1px solid rgba(0,0,0,0.1)", borderRadius: 16, background: "rgba(255,255,255,0.8)", backdropFilter: "blur(12px)", boxShadow: "0 20px 60px rgba(26,63,171,0.1)", overflow: "hidden" }}>
              <div style={{ background: "rgba(0,0,0,0.04)", borderBottom: "1px solid rgba(0,0,0,0.07)", padding: "12px 16px", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ display: "flex", gap: 6 }}>
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(255,100,100,0.6)" }} />
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(255,200,50,0.6)" }} />
                  <div style={{ width: 12, height: 12, borderRadius: "50%", background: "rgba(80,200,80,0.6)" }} />
                </div>
                <div style={{ flex: 1, background: "rgba(0,0,0,0.04)", borderRadius: 6, padding: "4px 12px", fontSize: 11, fontFamily: "monospace", color: "rgba(107,114,128,0.5)" }}>
                  app.foundersflow.com.br/p/quantum-saas/prd
                </div>
              </div>
              <div style={{ padding: 20, maxHeight: 340, overflow: "hidden", position: "relative" }}>
                <div style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(26,63,171,0.6)", textTransform: "uppercase", letterSpacing: "0.15em", marginBottom: 4 }}>PRD — Fase 2</div>
                <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 17, fontWeight: 600, color: "#141e3c", marginBottom: 4 }}>QuantumSaaS</div>
                <div style={{ fontSize: 11, color: "#9ca3af", marginBottom: 16 }}>Gerado em 12s · 4.200 palavras · Exportável</div>
                {[
                  { label: "Visão do Produto", preview: "Plataforma de análise preditiva para gestores de e-commerce..." },
                  { label: "Personas (3)", preview: "Marina — Gestora  ·  Rafael — CTO  ·  Carla — Analista" },
                  { label: "User Stories (15)", preview: "Como Marina, quero ver os top 20 SKUs em risco de ruptura..." },
                  { label: "Roadmap Q1–Q4", preview: "Q1: MVP  ·  Q2: VTEX e API REST  ·  Q3: Simulador  ·  Q4: Enterprise" },
                ].map((item, i) => (
                  <div key={i} style={{ borderLeft: "2px solid rgba(26,63,171,0.2)", paddingLeft: 12, marginBottom: 12 }}>
                    <div style={{ fontSize: 10, fontFamily: "monospace", color: "rgba(26,63,171,0.7)", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: 2, fontWeight: 600 }}>{item.label}</div>
                    <p style={{ fontSize: 11, color: "#9ca3af", lineHeight: 1.5, margin: 0 }}>{item.preview}</p>
                  </div>
                ))}
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 80, background: "linear-gradient(to top, rgba(255,255,255,0.95), transparent)" }} />
              </div>
              <div style={{ padding: "12px 20px", borderTop: "1px solid rgba(0,0,0,0.06)", background: "rgba(0,0,0,0.02)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "#9ca3af" }}>45 artefatos gerados</span>
                <span style={{ fontSize: 11, fontFamily: "monospace", color: "rgba(26,63,171,0.6)" }}>↓ Exportar Markdown</span>
              </div>
            </div>
          </div>
        </div>

        <div style={{ position: "absolute", bottom: 20, left: "50%", transform: "translateX(-50%)", background: "rgba(26,63,171,0.08)", borderRadius: 999, padding: "6px 16px", fontSize: 11, fontFamily: "monospace", color: "#1A3FAB", letterSpacing: "0.1em", whiteSpace: "nowrap" }}>
          B — TRILHA DIAGONAL TRACEJADA · 12% OPACIDADE · ARCO SUAVE
        </div>
      </section>
    </div>
  );
}
