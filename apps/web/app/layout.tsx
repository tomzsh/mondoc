import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

const mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Monad Wallet Doctor",
  description:
    "Check your wallet health, revoke risky approvals, and prove onchain that your wallet is clean — on Monad.",
  openGraph: {
    title: "Monad Wallet Doctor",
    description:
      "Scan approvals, one-click revoke, log cleanups onchain, security score + badge.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#6E54FF" },
    { media: "(prefers-color-scheme: dark)", color: "#0E091C" },
  ],
};

const themeInitScript = `
(function(){
  try {
    var k = 'wallet-doctor-theme';
    var s = localStorage.getItem(k);
    var d = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var t = s === 'light' || s === 'dark' ? s : (d ? 'dark' : 'light');
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
