"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ConnectButton } from "@/components/wallet/ConnectButton";
import { cn } from "@/lib/utils";

const LINKS = [
  { href: "/", label: "Dashboard" },
  { href: "/scan", label: "Scan" },
  { href: "/history", label: "History" },
  { href: "/tx-explainer", label: "TX Explainer" },
];

export function Navbar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-white/5 bg-[#0b0b12]/80 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-2.5">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#836EF9] to-[#4f46e5] text-lg shadow-lg shadow-violet-500/25">
              🩺
            </span>
            <div className="leading-tight">
              <div className="text-sm font-bold tracking-tight text-white group-hover:text-violet-200">
                Wallet Doctor
              </div>
              <div className="text-[10px] font-medium uppercase tracking-widest text-violet-300/70">
                Monad
              </div>
            </div>
          </Link>
          <nav className="hidden items-center gap-1 sm:flex">
            {LINKS.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "rounded-lg px-3 py-1.5 text-sm font-medium transition",
                    active
                      ? "bg-white/10 text-white"
                      : "text-zinc-400 hover:bg-white/5 hover:text-white",
                  )}
                >
                  {l.label}
                </Link>
              );
            })}
          </nav>
        </div>
        <ConnectButton />
      </div>
      <nav className="flex gap-1 overflow-x-auto border-t border-white/5 px-4 py-2 sm:hidden">
        {LINKS.map((l) => {
          const active = pathname === l.href;
          return (
            <Link
              key={l.href}
              href={l.href}
              className={cn(
                "whitespace-nowrap rounded-lg px-3 py-1 text-xs font-medium",
                active ? "bg-white/10 text-white" : "text-zinc-400",
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
