"use client";

import { type ReactNode } from "react";
import { ThemeProvider } from "@/components/theme/ThemeProvider";
import { Web3Providers } from "@/components/Web3Providers";

/**
 * Always mount wallet providers immediately (no async gate).
 * A previous dynamic-import + custom loader left the UI stuck on
 * "Loading wallet…" when chunk load failed or Strict Mode cancelled the effect.
 */
export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <Web3Providers>{children}</Web3Providers>
    </ThemeProvider>
  );
}
