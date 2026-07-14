import type { Metadata, Viewport } from "next";
import { IBM_Plex_Sans, IBM_Plex_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const body = IBM_Plex_Sans({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Wallet Doctor — Monad",
  description:
    "Clinical wallet diagnostics for Monad. Scan approvals, revoke risk, log cleanups onchain, earn a soulbound badge.",
  openGraph: {
    title: "Wallet Doctor — Monad",
    description:
      "Research-grade approval scanning, one-click revoke, onchain cleanup proof.",
  },
  icons: {
    icon: "/brand/logo-mark.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F4F3EF" },
    { media: "(prefers-color-scheme: dark)", color: "#050505" },
  ],
};

/** Default dark — research-lab aesthetic */
const themeInitScript = `
(function(){
  try {
    var k = 'wallet-doctor-theme';
    var s = localStorage.getItem(k);
    var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
    // default dark when no preference stored (lab aesthetic)
    var t = s === 'light' || s === 'dark' ? s : (d ? 'dark' : 'dark');
    if (t === 'dark') document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = t;
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${body.variable} ${mono.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="flex min-h-screen flex-col font-body antialiased">
        <Providers>
          <Navbar />
          <main className="page-shell">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
