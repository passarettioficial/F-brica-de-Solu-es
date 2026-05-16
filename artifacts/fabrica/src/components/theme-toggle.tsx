import { useState, useEffect } from "react";

function getInitialTheme(): boolean {
  try {
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return true;
  }
}

function applyTheme(isDark: boolean) {
  const root = document.documentElement;
  if (isDark) {
    root.classList.add("dark");
    root.style.colorScheme = "dark";
    localStorage.setItem("theme", "dark");
  } else {
    root.classList.remove("dark");
    root.style.colorScheme = "light";
    localStorage.setItem("theme", "light");
  }
}

export function ThemeToggle({ size = 18 }: { size?: number }) {
  const [isDark, setIsDark] = useState(getInitialTheme);

  useEffect(() => {
    applyTheme(isDark);
  }, [isDark]);

  return (
    <button
      onClick={() => setIsDark((d) => !d)}
      className="w-8 h-8 flex items-center justify-center rounded-lg transition-colors hover:bg-muted"
      style={{ color: "var(--text-tertiary)" }}
      aria-label={isDark ? "Mudar para modo claro" : "Mudar para modo escuro"}
      title={isDark ? "Modo claro" : "Modo escuro"}
    >
      {isDark ? <SunIcon size={size} /> : <MoonIcon size={size} />}
    </button>
  );
}

function SunIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="10" cy="10" r="4" />
      <path d="M10 2v1.5M10 16.5V18M2 10h1.5M16.5 10H18M4.22 4.22l1.06 1.06M14.72 14.72l1.06 1.06M15.78 4.22l-1.06 1.06M5.28 14.72l-1.06 1.06" />
    </svg>
  );
}

function MoonIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.5 12A7.5 7.5 0 0 1 8 2.5a7.5 7.5 0 1 0 9.5 9.5Z" />
    </svg>
  );
}
