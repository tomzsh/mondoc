"use client";

import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "./ThemeProvider";

export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
      title={theme === "dark" ? "Light mode" : "Dark mode"}
      className="inline-flex h-8 w-8 shrink-0 items-center justify-center border border-border bg-transparent text-muted transition hover:border-accent hover:text-foreground sm:h-8 sm:w-8"
    >
      {!mounted ? (
        <span className="font-mono text-[10px]">·</span>
      ) : theme === "dark" ? (
        <Sun size={14} weight="regular" />
      ) : (
        <Moon size={14} weight="regular" />
      )}
    </button>
  );
}
