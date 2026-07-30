import { useCountUp } from "@/hooks/use-count-up";

const CX = 50;
const CY = 50;
const R = 40;

function pointOnGauge(score: number, cx = CX, cy = CY, r = R) {
  const clamped = Math.max(0, Math.min(100, score));
  const theta = (180 - (clamped / 100) * 180) * (Math.PI / 180);
  return { x: cx + r * Math.cos(theta), y: cy - r * Math.sin(theta) };
}

function gaugeArcPath(scoreFrom: number, scoreTo: number, cx = CX, cy = CY, r = R) {
  const p1 = pointOnGauge(scoreFrom, cx, cy, r);
  const p2 = pointOnGauge(scoreTo, cx, cy, r);
  return `M ${p1.x} ${p1.y} A ${r} ${r} 0 0 1 ${p2.x} ${p2.y}`;
}

const VARIANT_GOOD_COLOR: Record<"coherence" | "potential", string> = {
  coherence: "#10b981",
  potential: "#2563eb",
};

const VARIANT_GOOD_TEXT: Record<"coherence" | "potential", string> = {
  coherence: "text-emerald-600 dark:text-emerald-400",
  potential: "text-blue-600 dark:text-blue-400",
};

/** Semicircle "speedometer" gauge with red/amber/good zones — used for coherenceScore/marketPotentialScore. */
export function CoherenceGauge({
  score,
  variant,
  size = 110,
  testId,
}: {
  score: number | null | undefined;
  variant: "coherence" | "potential";
  size?: number;
  testId?: string;
}) {
  const animatedScore = useCountUp(score);
  const displayScore = animatedScore ?? 0;
  const goodColor = VARIANT_GOOD_COLOR[variant];

  const scoreColor = score == null
    ? "text-muted-foreground"
    : score >= 75 ? VARIANT_GOOD_TEXT[variant]
    : score >= 50 ? "text-amber-600 dark:text-amber-400"
    : "text-destructive";

  const progressColor = score == null ? "#94a3b8" : score >= 75 ? goodColor : score >= 50 ? "#f59e0b" : "#ef4444";

  return (
    <div className="relative flex-shrink-0" style={{ width: size, height: size * 0.58 }}>
      <svg viewBox="0 0 100 58" width="100%" height="100%">
        <path d={gaugeArcPath(0, 50)} fill="none" stroke="#ef4444" strokeOpacity={0.15} strokeWidth={8} strokeLinecap="round" />
        <path d={gaugeArcPath(50, 75)} fill="none" stroke="#f59e0b" strokeOpacity={0.15} strokeWidth={8} strokeLinecap="round" />
        <path d={gaugeArcPath(75, 100)} fill="none" stroke={goodColor} strokeOpacity={0.15} strokeWidth={8} strokeLinecap="round" />
        {score != null && (
          <path d={gaugeArcPath(0, displayScore)} fill="none" stroke={progressColor} strokeWidth={8} strokeLinecap="round" />
        )}
      </svg>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center" style={{ top: "36%" }}>
        <span className={`text-lg font-bold tabular-nums ${scoreColor}`} data-testid={testId}>
          {animatedScore != null ? animatedScore : "—"}
        </span>
      </div>
    </div>
  );
}
