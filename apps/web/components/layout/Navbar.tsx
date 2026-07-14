"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { AppWordmark } from "@/components/brand/AppLogo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home", short: "Home" },
  { href: "/scan", label: "Scan", short: "Scan" },
  { href: "/history", label: "Log", short: "Log" },
];

/**
 * Site header — high z-index + pointer-events so theme/connect always receive clicks.
 * ConnectButton is a static import (no next/dynamic disabled placeholder forever).
 */
export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header-inner">
        <Link href="/" className="min-w-0 shrink">
          <AppWordmark size={28} showTagline />
        </Link>

        <nav className="site-header-nav" aria-label="Primary">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "border-b-2 px-3 py-2 font-mono text-[11px] font-medium uppercase tracking-[0.14em] transition",
                  active
                    ? "border-accent text-foreground"
                    : "border-transparent text-muted hover:text-foreground",
                )}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        <div className="site-header-actions">
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>

      <nav className="site-header-mobile-nav" aria-label="Mobile">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "relative flex min-h-10 items-center justify-center px-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] transition",
                active
                  ? "bg-accent-soft text-foreground"
                  : "text-muted active:bg-accent-soft/60",
              )}
            >
              {l.short}
              {active && (
                <span
                  className="absolute inset-x-3 bottom-0 h-0.5 bg-accent"
                  aria-hidden
                />
              )}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
