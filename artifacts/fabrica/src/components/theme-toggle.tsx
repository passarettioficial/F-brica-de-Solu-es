import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

function getInitialTheme() {
  if (typeof window === "undefined") return "light";
  const saved = localStorage.getItem("fabrica_theme");
  if (saved === "light" || saved === "dark") return saved;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("fabrica_theme", theme);
  }, [theme]);

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="theme-toggle-button"
      aria-label={theme === "dark" ? "Mudar para modo claro" : "Mudar para modo escuro"}
    >
      {theme === "dark" ? "☀️ Claro" : "🌙 Escuro"}
    </Button>
  );
}
