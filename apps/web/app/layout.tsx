import type { Metadata, Viewport } from "next";
import { Inter, Roboto_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { ChunkLoadRecovery } from "@/components/ChunkLoadRecovery";
import "./globals.css";

/** Brand kit: Inter (body) · Britti Sans not on Google Fonts */
const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

/** Brand kit: Roboto Mono (labels, buttons, code) */
const mono = Roboto_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "MonDoc — Monad Wallet Diagnostics",
  description:
    "MonDoc: clinical wallet diagnostics for Monad. Scan approvals, revoke risk, log cleanups onchain.",
  openGraph: {
    title: "MonDoc — Monad Wallet Diagnostics",
    description:
      "Scan approvals, revoke risk, and log cleanups onchain — no custody.",
    images: [
      {
        url: "/brand/cover.jpg",
        width: 1920,
        height: 1080,
        alt: "MonDoc — Monad wallet diagnostics",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MonDoc — Monad Wallet Diagnostics",
    description:
      "Scan approvals, revoke risk, and log cleanups onchain — no custody.",
    images: ["/brand/cover.jpg"],
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
    { media: "(prefers-color-scheme: light)", color: "#F6F4FF" },
    { media: "(prefers-color-scheme: dark)", color: "#0E091C" },
  ],
};

/** Default dark — Monad brand night field (#0E091C) */
const themeInitScript = `
(function(){
  try {
    var k = 'mondoc-theme';
    var s = localStorage.getItem(k);
    var t = s === 'light' || s === 'dark' ? s : 'dark';
    if (t === 'dark') document.documentElement.classList.add('dark');
    document.documentElement.style.colorScheme = t;
  } catch (e) {}
})();
`;

/**
 * Earliest possible ChunkLoadError recovery (before React hydrates).
 * After deploys, stale tabs request deleted /_next/static chunks — one reload fixes it.
 */
const chunkRecoveryScript = `
(function(){
  var K='mondoc-chunk-reload-at';
  var COOL=15000;
  function isChunk(m){
    m=String(m||'');
    return /Loading chunk|ChunkLoadError|timeout:.*_next\\/static|missing:.*_next\\/static|dynamically imported module|Importing a module script failed|_next\\/static\\/chunks/i.test(m);
  }
  function reload(){
    try{
      var t=Number(sessionStorage.getItem(K)||0);
      if(t&&Date.now()-t<COOL)return;
      sessionStorage.setItem(K,String(Date.now()));
    }catch(e){}
    location.reload();
  }
  window.addEventListener('error',function(e){
    var el=e&&e.target;
    if(el&&el.tagName==='SCRIPT'&&el.src&&el.src.indexOf('/_next/static/')!==-1){reload();return;}
    if(isChunk(e&&e.message)||isChunk(e&&e.error&&e.error.message))reload();
  },true);
  window.addEventListener('unhandledrejection',function(e){
    var r=e&&e.reason;
    var m=r&&(r.message||r.name||r);
    if(isChunk(m)||(r&&r.name==='ChunkLoadError'))reload();
  });
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
        <script dangerouslySetInnerHTML={{ __html: chunkRecoveryScript }} />
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body
        className="flex min-h-screen flex-col font-body antialiased"
        suppressHydrationWarning
      >
        <ChunkLoadRecovery />
        <Providers>
          <Navbar />
          <main className="page-shell">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
