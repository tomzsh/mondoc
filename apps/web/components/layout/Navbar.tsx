"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { AppWordmark } from "@/components/brand/AppLogo";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/scan", label: "Scan" },
  { href: "/history", label: "History" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:h-16 sm:gap-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-6 sm:gap-10">
          <Link href="/" className="min-w-0">
            <AppWordmark size={30} showTagline />
          </Link>

          <nav className="hidden items-center gap-0 md:flex">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "border-b-2 px-3 py-4 font-mono text-[11px] font-medium uppercase tracking-[0.14em] transition",
                    active
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted hover:text-foreground",
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

      <nav className="flex border-t border-border md:hidden">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "flex-1 border-b-2 py-2.5 text-center font-mono text-[10px] font-medium uppercase tracking-[0.12em]",
                active
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted",
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
