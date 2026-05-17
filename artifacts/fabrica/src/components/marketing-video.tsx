import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const SCENES = [
  {
    key: "hook",
    duration: 5000,
    tag: "O problema",
    headline: ["Toda grande", "ideia trava", "no início."],
    sub: "Sem estrutura, o esforço vira retrabalho.",
    accent: "#FF8C42",
  },
  {
    key: "solution",
    duration: 5200,
    tag: "A solução",
    headline: ["7 fases.", "53+ artefatos.", "Um processo."],
    sub: "Da validação ao lançamento — em sequência.",
    accent: "#1A3FAB",
  },
  {
    key: "proof",
    duration: 5000,
    tag: "O que você recebe",
    headline: ["PRD. Personas.", "Arquitetura.", "Go-to-market."],
    sub: "Tudo gerado com IA a partir do seu briefing.",
    accent: "#1A3FAB",
  },
  {
    key: "outcome",
    duration: 5200,
    tag: "O resultado",
    headline: ["Produto mais forte,", "mais rápido,", "pronto para vender."],
    sub: "Sem achismos. Sem retrabalho. Com direção.",
    accent: "#FF8C42",
  },
  {
    key: "cta",
    duration: 4800,
    tag: "FoundersFlow",
    headline: ["Comece em", "2 minutos."],
    sub: "Sem cartão de crédito.",
    accent: "#1A3FAB",
  },
] as const;

const TOTAL_MS = SCENES.reduce((s, sc) => s + sc.duration, 0);

export function MarketingVideo() {
  const [sceneIdx, setSceneIdx] = useState(0);
  const [phase, setPhase] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    let start = performance.now();
    let raf: number;

    function tick(now: number) {
      const t = (now - start) % TOTAL_MS;
      setElapsed(t);
      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    let acc = 0;
    for (let i = 0; i < SCENES.length; i++) {
      acc += SCENES[i].duration;
      if (elapsed < acc) {
        setSceneIdx(i);
        break;
      }
    }
  }, [elapsed]);

  useEffect(() => {
    setPhase(0);
    const t1 = setTimeout(() => setPhase(1), 200);
    const t2 = setTimeout(() => setPhase(2), 700);
    const t3 = setTimeout(() => setPhase(3), 1200);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [sceneIdx]);

  const scene = SCENES[sceneIdx];

  const progressPct =
    (elapsed / TOTAL_MS) * 100;

  const isOrange = scene.accent === "#FF8C42";

  return (
    <div className="relative w-full overflow-hidden rounded-2xl" style={{ aspectRatio: "16/9", background: "hsl(222 25% 10%)" }}>
      {/* Persistent animated background blobs */}
      <motion.div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{ width: "55%", height: "55%", top: "-10%", left: "-10%" }}
        animate={{
          background: isOrange
            ? "radial-gradient(circle, rgba(255,140,66,0.18), transparent)"
            : "radial-gradient(circle, rgba(26,63,171,0.25), transparent)",
          x: [0, 30, 0],
          y: [0, 20, 0],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute rounded-full blur-3xl pointer-events-none"
        style={{ width: "45%", height: "45%", bottom: "-10%", right: "-5%" }}
        animate={{
          background: isOrange
            ? "radial-gradient(circle, rgba(26,63,171,0.18), transparent)"
            : "radial-gradient(circle, rgba(255,140,66,0.15), transparent)",
          x: [0, -20, 0],
          y: [0, -15, 0],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />

      {/* Grid overlay */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.04]"
        style={{
          backgroundImage: "linear-gradient(rgba(255,255,255,1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,1) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Accent line — persists and transforms */}
      <motion.div
        className="absolute h-[2px] top-[50%]"
        style={{ transformOrigin: "left center" }}
        animate={{
          left: sceneIdx % 2 === 0 ? "6%" : "55%",
          width: sceneIdx % 2 === 0 ? "30%" : "18%",
          top: ["12%", "85%", "55%", "22%", "68%"][sceneIdx],
          backgroundColor: scene.accent,
          opacity: phase >= 1 ? 0.85 : 0,
          scaleX: phase >= 1 ? 1 : 0,
        }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Floating circle — persists and moves between scenes */}
      <motion.div
        className="absolute rounded-full border pointer-events-none"
        animate={{
          width: ["80px", "120px", "60px", "100px", "140px"][sceneIdx],
          height: ["80px", "120px", "60px", "100px", "140px"][sceneIdx],
          left: ["72%", "8%", "78%", "12%", "70%"][sceneIdx],
          top: ["10%", "60%", "70%", "15%", "55%"][sceneIdx],
          borderColor: scene.accent,
          opacity: 0.25,
        }}
        transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
      />

      {/* Scene content */}
      <AnimatePresence mode="popLayout">
        <motion.div
          key={scene.key}
          className="absolute inset-0 flex flex-col justify-center px-[8%]"
          initial={{ opacity: 0, clipPath: "inset(0 100% 0 0)" }}
          animate={{ opacity: 1, clipPath: "inset(0 0% 0 0)" }}
          exit={{ opacity: 0, x: -40, filter: "blur(6px)" }}
          transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        >
          {/* Tag */}
          <motion.div
            className="text-[11px] font-mono uppercase tracking-[0.22em] mb-4"
            style={{ color: scene.accent }}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: phase >= 1 ? 1 : 0, y: phase >= 1 ? 0 : 10 }}
            transition={{ duration: 0.4 }}
          >
            {scene.tag}
          </motion.div>

          {/* Headline lines stagger */}
          <div className="mb-5" style={{ fontFamily: "Space Grotesk, sans-serif" }}>
            {scene.headline.map((line, i) => (
              <motion.div
                key={i}
                className="text-white font-semibold leading-[1.08] overflow-hidden"
                style={{ fontSize: "clamp(1.4rem, 4vw, 2.6rem)", display: "block" }}
                initial={{ opacity: 0, y: 32 }}
                animate={{
                  opacity: phase >= 2 ? 1 : 0,
                  y: phase >= 2 ? 0 : 32,
                }}
                transition={{ duration: 0.55, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              >
                {line}
              </motion.div>
            ))}
          </div>

          {/* Sub */}
          <motion.p
            className="text-white/55 max-w-[340px]"
            style={{ fontSize: "clamp(0.72rem, 1.6vw, 0.95rem)", lineHeight: 1.55, fontFamily: "Inter, sans-serif" }}
            initial={{ opacity: 0, filter: "blur(8px)" }}
            animate={{
              opacity: phase >= 3 ? 1 : 0,
              filter: phase >= 3 ? "blur(0px)" : "blur(8px)",
            }}
            transition={{ duration: 0.5 }}
          >
            {scene.sub}
          </motion.p>
        </motion.div>
      </AnimatePresence>

      {/* Scene indicator dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
        {SCENES.map((_, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-300"
            style={{
              width: i === sceneIdx ? 20 : 6,
              height: 6,
              backgroundColor: i === sceneIdx ? scene.accent : "rgba(255,255,255,0.25)",
            }}
          />
        ))}
      </div>

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/10">
        <motion.div
          className="h-full"
          style={{ backgroundColor: scene.accent }}
          animate={{ width: `${progressPct}%` }}
          transition={{ duration: 0.1, ease: "linear" }}
        />
      </div>

      {/* Scene number */}
      <div
        className="absolute top-4 right-5 font-mono text-white/25"
        style={{ fontSize: "11px", letterSpacing: "0.15em" }}
      >
        {String(sceneIdx + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
      </div>
    </div>
  );
}
