import { useEffect, useRef, useState } from "react";

export function useCountUp(target: number | null | undefined, durationMs = 700) {
  const [value, setValue] = useState<number | null>(target == null ? null : 0);
  const currentRef = useRef<number>(0);
  useEffect(() => {
    if (target == null) { setValue(null); currentRef.current = 0; return; }
    const from = currentRef.current;
    const to = target;
    if (from === to) { setValue(to); return; }
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = Math.round(from + (to - from) * eased);
      currentRef.current = v;
      setValue(v);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs]);
  return value;
}
