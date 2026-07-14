"use client";

import { useMemo, useState, type ReactNode } from "react";
import { WagmiProvider } from "wagmi";
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { wagmiConfig, monadTestnet } from "@/lib/wagmi";
import { ThemeProvider, useTheme } from "@/components/theme/ThemeProvider";
import "@rainbow-me/rainbowkit/styles.css";

function AppShell({ children }: { children: ReactNode }) {
  const { theme, mounted } = useTheme();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Chain data is user-driven (Rescan / after revoke); avoid surprise refetches
            refetchOnWindowFocus: false,
            refetchOnReconnect: false,
            retry: 1,
            staleTime: 30_000,
          },
        },
      }),
  );

  const rkTheme = useMemo(() => {
    const mode = mounted ? theme : "dark";
    // Monad primary #6E54FF (brand kit)
    if (mode === "dark") {
      return darkTheme({
        accentColor: "#6E54FF",
        accentColorForeground: "#FFFFFF",
        borderRadius: "none",
        fontStack: "system",
        overlayBlur: "small",
      });
    }
    return lightTheme({
      accentColor: "#6E54FF",
      accentColorForeground: "#FFFFFF",
      borderRadius: "none",
      fontStack: "system",
      overlayBlur: "small",
    });
  }, [theme, mounted]);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={monadTestnet}
          theme={rkTheme}
          locale="en-US"
          modalSize="compact"
          appInfo={{
            appName: "MonDoc",
            learnMoreUrl: "https://www.monad.xyz",
          }}
        >
          {children}
          <Toaster
            theme={mounted && theme === "light" ? "light" : "dark"}
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              style: {
                zIndex: 9999,
                borderRadius: 0,
                fontFamily: "var(--font-mono), ui-monospace, monospace",
                fontSize: 12,
              },
            }}
          />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider>
      <AppShell>{children}</AppShell>
    </ThemeProvider>
  );
}
