/**
 * Lightweight in-memory rate limiter for hackathon demos.
 * Resets on server restart — enough to blunt casual API abuse.
 */

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export function rateLimit(
  key: string,
  opts: { limit: number; windowMs: number },
): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  let b = buckets.get(key);
  if (!b || now >= b.resetAt) {
    b = { count: 0, resetAt: now + opts.windowMs };
    buckets.set(key, b);
  }
  b.count += 1;
  if (b.count > opts.limit) {
    return {
      ok: false,
      retryAfterSec: Math.max(1, Math.ceil((b.resetAt - now) / 1000)),
    };
  }
  return { ok: true };
}

/** Best-effort client IP from common proxy headers. */
export function clientIp(req: Request): string {
  const xf = req.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim() || "unknown";
  return req.headers.get("x-real-ip") || "unknown";
}
