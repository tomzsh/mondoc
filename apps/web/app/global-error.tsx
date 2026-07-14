"use client";

import { useEffect } from "react";
import {
  isChunkLoadError,
  reloadForChunkError,
} from "@/lib/chunkLoadRecovery";

/**
 * Root error boundary (replaces root layout when it fails).
 * Must include its own <html>/<body>.
 */
export default function GlobalError({
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
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "system-ui, sans-serif",
          background: "#0E091C",
          color: "#fff",
          padding: 24,
          textAlign: "center",
        }}
      >
        <div style={{ maxWidth: 420 }}>
          <p
            style={{
              fontSize: 11,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#6E54FF",
              marginBottom: 12,
            }}
          >
            MonDoc
          </p>
          <h1 style={{ fontSize: 20, margin: "0 0 12px" }}>
            {chunk ? "Updating to the latest build…" : "Something went wrong"}
          </h1>
          <p style={{ fontSize: 14, color: "#9b94b8", marginBottom: 20 }}>
            {chunk
              ? "A new deployment is live. Reloading automatically."
              : error.message?.slice(0, 180) || "Unexpected error"}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            style={{
              border: "none",
              background: "#6E54FF",
              color: "#fff",
              padding: "12px 20px",
              fontSize: 12,
              letterSpacing: "0.12em",
              textTransform: "uppercase",
              cursor: "pointer",
              marginRight: 8,
            }}
          >
            Reload
          </button>
          {!chunk && (
            <button
              type="button"
              onClick={reset}
              style={{
                border: "1px solid #2a2248",
                background: "transparent",
                color: "#fff",
                padding: "12px 20px",
                fontSize: 12,
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                cursor: "pointer",
              }}
            >
              Try again
            </button>
          )}
        </div>
      </body>
    </html>
  );
}
