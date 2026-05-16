import { useEffect } from "react";

export function usePhaseTheme(phaseNumber: number | undefined) {
  useEffect(() => {
    const root = document.documentElement;
    if (phaseNumber && phaseNumber >= 1 && phaseNumber <= 6) {
      root.setAttribute("data-phase", String(phaseNumber));
    } else {
      root.removeAttribute("data-phase");
    }
    return () => {
      root.removeAttribute("data-phase");
    };
  }, [phaseNumber]);
}
