/**
 * Simple in-memory sliding-window rate limiter.
 * Each instance tracks hits per key (typically IP) within `windowMs`.
 * Not shared across serverless instances — acceptable for single-process deploys.
 */

interface Entry {
  count: number;
  resetAt: number;
}

export class RateLimiter {
  private map = new Map<string, Entry>();
  private readonly max: number;
  private readonly windowMs: number;

  constructor(opts: { max: number; windowMs: number }) {
    this.max = opts.max;
    this.windowMs = opts.windowMs;

    // Prune expired entries every 60s to prevent unbounded growth
    const interval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.map) {
        if (now >= entry.resetAt) this.map.delete(key);
      }
    }, 60_000);
    // Allow process to exit without waiting for this timer
    if (typeof interval === "object" && "unref" in interval) interval.unref();
  }

  /** Returns `true` if the request is allowed, `false` if rate-limited. */
  check(key: string): boolean {
    const now = Date.now();
    const entry = this.map.get(key);
    if (!entry || now >= entry.resetAt) {
      this.map.set(key, { count: 1, resetAt: now + this.windowMs });
      return true;
    }
    entry.count++;
    return entry.count <= this.max;
  }
}

/** Extract client IP from request headers (x-real-ip → x-forwarded-for → fallback "unknown"). */
export function clientIp(req: Request): string {
  const realIp = req.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;
  const xff = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim();
  return xff || "unknown";
}
