import { useEffect } from "react";

export function ThemeToggle() {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);
  return null;
}
