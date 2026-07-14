"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AppLogo } from "@/components/brand/AppLogo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/scan", label: "Scan" },
  { href: "/history", label: "History" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-surface/80 backdrop-blur-md">
      <div className="mx-auto flex h-12 max-w-6xl items-center justify-between gap-2 px-3 sm:h-14 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-4 sm:gap-6">
          <Link href="/" className="flex min-w-0 items-center gap-2">
            <AppLogo size={28} className="sm:hidden" />
            <AppLogo size={32} className="hidden sm:block" />
            <div className="min-w-0 leading-tight">
              <div className="truncate text-xs font-semibold text-foreground sm:text-sm">
                Wallet Doctor
              </div>
              <div className="hidden text-[11px] text-muted sm:block">Monad</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                    active
                      ? "bg-accent-soft text-accent"
                      : "text-muted hover:bg-accent-soft/60 hover:text-foreground",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          <ConnectButton />
        </div>
      </div>

      <nav className="flex gap-1 overflow-x-auto border-t border-border px-3 py-1.5 md:hidden">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex-1 whitespace-nowrap rounded-md px-2 py-1.5 text-center text-[11px] font-medium",
                active
                  ? "bg-accent-soft text-accent"
                  : "text-muted hover:bg-accent-soft/50",
              )}
            >
              {l.label}
            </Link>
          );
        })}
      </nav>
    </header>
  );
}
