"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AppWordmark } from "@/components/brand/AppLogo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Home", short: "Home" },
  { href: "/scan", label: "Scan", short: "Scan" },
  { href: "/history", label: "History", short: "Log" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/95 backdrop-blur-md pt-[env(safe-area-inset-top)]">
      {/* Top bar */}
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-2 px-3 sm:h-14 sm:gap-3 sm:px-6">
        <Link href="/" className="min-w-0 shrink">
          <AppWordmark size={28} showTagline />
        </Link>

        <nav className="hidden items-center md:flex" aria-label="Primary">
          {LINKS.map((l) => {
            const active = pathname === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "border-b-2 px-3 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.14em] transition",
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

        <div className="flex min-w-0 shrink-0 items-center gap-1 sm:gap-1.5">
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>

      {/* Mobile tab nav */}
      <nav
        className="grid grid-cols-3 border-t border-border md:hidden"
        aria-label="Mobile"
      >
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "relative flex min-h-10 items-center justify-center px-1 font-mono text-[10px] font-medium uppercase tracking-[0.14em] transition",
                active ? "bg-accent-soft text-foreground" : "text-muted active:bg-accent-soft/60",
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
