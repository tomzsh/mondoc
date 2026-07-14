/**
 * Recover from Next.js ChunkLoadError after deploys / stale tabs.
 *
 * When a new build ships, old HTML/tabs may request chunks that no longer exist.
 * Reloading once fetches fresh HTML with matching chunk hashes.
 */

const RELOAD_KEY = "mondoc-chunk-reload-at";
const RELOAD_COOLDOWN_MS = 15_000;

export function isChunkLoadError(err: unknown): boolean {
  if (!err) return false;

  if (typeof err === "string") {
    return matchesChunkMessage(err);
  }

  if (err instanceof Error) {
    if (err.name === "ChunkLoadError") return true;
    if (matchesChunkMessage(err.message)) return true;
    // webpack nested cause
    const cause = (err as Error & { cause?: unknown }).cause;
    if (cause && cause !== err) return isChunkLoadError(cause);
  }

  // plain object from some bundlers
  if (typeof err === "object") {
    const o = err as { name?: string; message?: string; type?: string };
    if (o.name === "ChunkLoadError" || o.type === "missing") return true;
    if (o.message && matchesChunkMessage(o.message)) return true;
  }

  return false;
}

function matchesChunkMessage(msg: string): boolean {
  return (
    /Loading chunk [\w/.-]+ failed/i.test(msg) ||
    /\(timeout:.*\/_next\/static\/chunks/i.test(msg) ||
    /\(missing:.*\/_next\/static\/chunks/i.test(msg) ||
    /ChunkLoadError/i.test(msg) ||
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /\/_next\/static\/chunks\//i.test(msg)
  );
}

/** Reload the page at most once per cooldown to avoid infinite loops. */
export function reloadForChunkError(): boolean {
  if (typeof window === "undefined") return false;
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || "0");
    const now = Date.now();
    if (last && now - last < RELOAD_COOLDOWN_MS) {
      return false;
    }
    sessionStorage.setItem(RELOAD_KEY, String(now));
  } catch {
    // private mode — still try reload once
  }
  window.location.reload();
  return true;
}

/** Install global listeners (call once from a client root component). */
export function installChunkLoadRecovery(): () => void {
  if (typeof window === "undefined") return () => {};

  const onError = (event: ErrorEvent) => {
    const msg = event.message || "";
    const target = event.target;
    // Script tag failed to load a /_next/static chunk
    if (
      target instanceof HTMLScriptElement &&
      typeof target.src === "string" &&
      target.src.includes("/_next/static/")
    ) {
      event.preventDefault();
      reloadForChunkError();
      return;
    }
    if (isChunkLoadError(msg) || isChunkLoadError(event.error)) {
      event.preventDefault();
      reloadForChunkError();
    }
  };

  const onRejection = (event: PromiseRejectionEvent) => {
    if (isChunkLoadError(event.reason)) {
      event.preventDefault();
      reloadForChunkError();
    }
  };

  window.addEventListener("error", onError, true);
  window.addEventListener("unhandledrejection", onRejection);
  return () => {
    window.removeEventListener("error", onError, true);
    window.removeEventListener("unhandledrejection", onRejection);
  };
}
