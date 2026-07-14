"use client";

import { useCallback, type MouseEvent } from "react";
import { Moon, Sun } from "@phosphor-icons/react";
import { useTheme } from "./ThemeProvider";
import { useHasMounted } from "@/lib/useHasMounted";

/**
 * Light/dark control — stable SSR markup (Sun / "light mode" until mounted).
 */
export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const hasMounted = useHasMounted();
  // SSR + first paint: always dark-default icon (matches themeInitScript)
  const isDark = !hasMounted || theme === "dark";

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
      suppressHydrationWarning
    >
      {isDark ? (
        <Sun size={16} weight="regular" className="pointer-events-none" aria-hidden />
      ) : (
        <Moon size={16} weight="regular" className="pointer-events-none" aria-hidden />
      )}
    </button>
  );
}
