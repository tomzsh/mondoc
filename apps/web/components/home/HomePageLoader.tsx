"use client";

import { lazy, Suspense, type ReactNode } from "react";

const HomeClient = lazy(() =>
  import("@/components/home/HomeClient").then((m) => ({
    default: m.HomeClient,
  })),
);

function BootSkeleton() {
  return (
    <div className="space-y-10 sm:space-y-14" aria-busy="true" aria-live="polite">
      <section className="hero-panel p-6 sm:p-10 lg:p-12">
        <div className="relative z-[1] max-w-2xl space-y-4">
          <div className="h-3 w-40 animate-pulse bg-border" />
          <div className="h-10 w-full max-w-md animate-pulse bg-border" />
          <div className="h-10 w-3/4 max-w-sm animate-pulse bg-border" />
          <div className="h-4 w-full max-w-xl animate-pulse bg-border" />
          <div className="mt-6 h-10 w-40 animate-pulse bg-accent/40" />
        </div>
      </section>
      <p className="text-center font-mono text-[11px] uppercase tracking-[0.14em] text-muted">
        Loading MonDoc…
      </p>
    </div>
  );
}

/** Tiny client entry — real home UI is React.lazy (true async chunk). */
export function HomePageLoader() {
  return (
    <Suspense fallback={<BootSkeleton />}>
      <HomeClient />
    </Suspense>
  );
}

export function RouteSuspense({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback?: ReactNode;
}) {
  return <Suspense fallback={fallback ?? <BootSkeleton />}>{children}</Suspense>;
}
