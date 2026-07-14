"use client";

import { useEffect } from "react";
import { ArrowsClockwise, WarningCircle } from "@phosphor-icons/react";
import {
  isChunkLoadError,
  reloadForChunkError,
} from "@/lib/chunkLoadRecovery";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (isChunkLoadError(error)) {
      reloadForChunkError();
    }
  }, [error]);

  const chunk = isChunkLoadError(error);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-16 text-center">
      <div className="flex h-12 w-12 items-center justify-center border border-border bg-accent-soft text-accent">
        {chunk ? (
          <ArrowsClockwise size={24} weight="regular" aria-hidden />
        ) : (
          <WarningCircle size={24} weight="regular" aria-hidden />
        )}
      </div>
      <p className="section-kicker text-accent">
        {chunk ? "Updating app" : "Something went wrong"}
      </p>
      <h1 className="text-xl font-semibold tracking-tight">
        {chunk
          ? "A newer version of MonDoc is available"
          : "Unexpected error"}
      </h1>
      <p className="text-sm text-muted">
        {chunk
          ? "Reloading to load the latest build. If this screen stays, use the button below."
          : error.message?.slice(0, 200) || "Please try again."}
      </p>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button
          type="button"
          className="ui-btn"
          onClick={() => window.location.reload()}
        >
          Reload page
        </button>
        {!chunk && (
          <button type="button" className="ui-btn-secondary" onClick={reset}>
            Try again
          </button>
        )}
      </div>
    </div>
  );
}
