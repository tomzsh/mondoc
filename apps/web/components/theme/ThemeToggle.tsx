"use client";

import { useCallback, type MouseEvent } from "react";
import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "./ThemeProvider";

/**
 * Light/dark control — Phosphor icons (same family as brand mark).
 */
export function ThemeToggle() {
  const { theme, toggleTheme, mounted } = useTheme();
  const isDark = !mounted || theme === "dark";

  const onActivate = useCallback(
    (e: MouseEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.stopPropagation();
      toggleTheme();
    },
    [toggleTheme],
  );

  return (
    <button
      type="button"
      onClick={onActivate}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light mode" : "Dark mode"}
      className="rk-header-btn rk-header-btn-network rk-header-btn-icon"
      data-theme-toggle=""
    >
      {isDark ? (
        <Sun size={16} weight="regular" className="pointer-events-none" aria-hidden />
      ) : (
        <Moon size={16} weight="regular" className="pointer-events-none" aria-hidden />
      )}
    </button>
  );
}
