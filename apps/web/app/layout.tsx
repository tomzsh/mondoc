import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Monad Wallet Doctor",
  description:
    "Check your wallet health, revoke risky approvals, and prove onchain that your wallet is clean.",
  openGraph: {
    title: "Monad Wallet Doctor",
    description:
      "Scan approvals, one-click revoke, log cleanups onchain, security score + badge.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <Providers>
          <Navbar />
          <main className="mx-auto min-h-[calc(100vh-4rem)] max-w-6xl px-4 py-8">
            {children}
          </main>
          <footer className="border-t border-white/5 py-8 text-center text-xs text-zinc-600">
            Monad Wallet Doctor · never custodies funds · revoke goes straight to the token contract
          </footer>
        </Providers>
      </body>
    </html>
  );
}
