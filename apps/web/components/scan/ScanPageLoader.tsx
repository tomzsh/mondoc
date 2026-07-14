"use client";

import { lazy, Suspense } from "react";

const ScanClient = lazy(() =>
  import("@/components/scan/ScanClient").then((m) => ({
    default: m.ScanClient,
  })),
);

function ScanSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <div className="h-8 w-48 animate-pulse bg-border" />
      <div className="h-4 w-full max-w-xl animate-pulse bg-border" />
      <div className="h-64 animate-pulse border border-border bg-surface" />
    </div>
  );
}

export function ScanPageLoader() {
  return (
    <Suspense fallback={<ScanSkeleton />}>
      <ScanClient />
    </Suspense>
  );
}
