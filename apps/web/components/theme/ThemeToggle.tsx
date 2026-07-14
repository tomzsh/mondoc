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
      className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-border bg-surface text-xs text-muted transition hover:bg-accent-soft hover:text-foreground sm:h-8 sm:w-8 sm:rounded-xl sm:text-sm"
    >
      {!mounted ? "·" : theme === "dark" ? "☀" : "☾"}
    </button>
  );
}
