"use client";

import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      className="inline-flex h-7 min-w-7 shrink-0 items-center justify-center border border-border bg-transparent px-1.5 font-mono text-[10px] uppercase tracking-[0.12em] text-muted transition hover:border-foreground hover:text-foreground sm:h-8 sm:min-w-8"
    >
      {!mounted ? "·" : theme === "dark" ? "LT" : "DK"}
    </button>
  );
}
