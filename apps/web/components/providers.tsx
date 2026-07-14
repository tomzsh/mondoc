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

const MONAD_PURPLE = "#6E54FF";

function AppShell({ children }: { children: ReactNode }) {
  const { theme, mounted } = useTheme();
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            refetchOnWindowFocus: false,
            retry: 1,
          },
        },
      }),
  );

  const rkTheme = useMemo(() => {
    const base = {
      accentColor: MONAD_PURPLE,
      accentColorForeground: "#FFFFFF",
      borderRadius: "large" as const,
      fontStack: "system" as const,
      overlayBlur: "small" as const,
    };
    const mode = mounted ? theme : "light";
    return mode === "dark" ? darkTheme(base) : lightTheme(base);
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
            appName: "Monad Wallet Doctor",
            learnMoreUrl: "https://www.monad.xyz",
          }}
        >
          {children}
          <Toaster
            theme={mounted && theme === "dark" ? "dark" : "light"}
            position="bottom-right"
            richColors
            closeButton
            toastOptions={{
              style: { zIndex: 9999 },
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
