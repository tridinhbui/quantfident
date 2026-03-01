// Rate limiting middleware for API routes
// Implements sliding window counter pattern to prevent abuse

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry[]> = new Map();
  private windowMs: number; // Time window in milliseconds
  private maxRequests: number; // Max requests per window

  constructor(windowMs: number = 15 * 60 * 1000, maxRequests: number = 100) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;

    // Cleanup expired entries every minute
    this.startCleanup();
  }

  private startCleanup() {
    setInterval(() => {
      const now = Date.now();
      for (const [key, entries] of this.store) {
        const filtered = entries.filter((entry) => entry.resetTime > now);
        if (filtered.length === 0) {
          this.store.delete(key);
        } else {
          this.store.set(key, filtered);
        }
      }
    }, 60 * 1000);
  }

  /**
   * Check if a request should be rate limited
   * @param identifier Unique identifier (IP address, user ID, etc)
   * @returns Object with allowed status and remaining requests
   */
  check(identifier: string): {
    allowed: boolean;
    remaining: number;
    retryAfter?: number;
  } {
    const now = Date.now();

    // Get or create entry list for this identifier
    let entries = this.store.get(identifier) || [];

    // Remove expired entries
    entries = entries.filter((entry) => entry.resetTime > now);

    // Count allowed requests (within window)
    const windowStart = now - this.windowMs;
    const requestsInWindow = entries.filter(
      (entry) => entry.resetTime - this.windowMs > windowStart,
    );

    const allowed = requestsInWindow.length < this.maxRequests;
    const remaining = Math.max(0, this.maxRequests - requestsInWindow.length);

    // Add new entry
    entries.push({
      count: 1,
      resetTime: now + this.windowMs,
    });

    this.store.set(identifier, entries);

    return {
      allowed,
      remaining,
      retryAfter: allowed ? undefined : Math.ceil(this.windowMs / 1000),
    };
  }
}

// Create instances for different rate limit configs
export const authLimiter = new RateLimiter(15 * 60 * 1000, 10); // 10 requests per 15 minutes per IP
export const blogLimiter = new RateLimiter(60 * 1000, 5); // 5 requests per minute per admin
export const likesLimiter = new RateLimiter(60 * 1000, 20); // 20 requests per minute per user
export const contactLimiter = new RateLimiter(10 * 60 * 1000, 6); // 6 submissions per 10 min per IP
export const contactEmailLimiter = new RateLimiter(60 * 60 * 1000, 3); // 3 submissions per hour per email

/**
 * Get client identifier from request (IP address)
 */
export function getClientIdentifier(headers: Headers): string {
  // Try to get real IP from headers (in order of preference)
  const xForwardedFor = headers.get("x-forwarded-for");
  if (xForwardedFor) {
    // x-forwarded-for can contain multiple IPs, get the first one
    return xForwardedFor.split(",")[0].trim();
  }

  const xRealIp = headers.get("x-real-ip");
  if (xRealIp) {
    return xRealIp;
  }

  // Fallback to unknown
  return "unknown";
}

/**
 * Get user identifier for authenticated requests (combines IP + user ID)
 */
export function getUserIdentifier(headers: Headers, userId?: string): string {
  const clientIp = getClientIdentifier(headers);
  return userId ? `${userId}:${clientIp}` : clientIp;
}
