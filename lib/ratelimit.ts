import { Ratelimit } from "@upstash/ratelimit"
import { Redis } from "@upstash/redis"

/**
 * Two sliding-window rate limiters per IP:
 * - hourly: 10 requests per hour (generous for a real recruiter)
 * - daily:  30 requests per day  (hard cap against sustained abuse)
 *
 * Uses Upstash Redis (free tier: 10K commands/day). The env vars
 * UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN must be set.
 * If they're missing we return a no-op that always allows requests,
 * so local dev works without a Redis instance.
 */

const hasRedis =
  process.env.UPSTASH_REDIS_REST_URL?.startsWith("https://") &&
  process.env.UPSTASH_REDIS_REST_TOKEN &&
  process.env.UPSTASH_REDIS_REST_TOKEN !== "placeholder"

const redis = hasRedis ? Redis.fromEnv() : null

export const hourlyLimit = hasRedis
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(20, "1 h"),
      prefix: "rl:hourly",
      analytics: true,
    })
  : null

export const dailyLimit = hasRedis
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(30, "1 d"),
      prefix: "rl:daily",
      analytics: true,
    })
  : null

/**
 * Separate window and prefix from the chatbot limiter so visitor traffic cannot
 * exhaust the invoicing API's budget. Sized for scripted use, tight enough to
 * make brute-forcing the bearer token impractical.
 */
export const invoiceApiLimit = hasRedis
  ? new Ratelimit({
      redis: redis!,
      limiter: Ratelimit.slidingWindow(120, "1 h"),
      prefix: "rl:invoice-api",
      analytics: true,
    })
  : null

export async function checkInvoiceApiRateLimit(ip: string): Promise<{ allowed: boolean }> {
  if (!invoiceApiLimit) return { allowed: true }
  try {
    const { success } = await invoiceApiLimit.limit(ip)
    return { allowed: success }
  } catch {
    // Redis being unreachable must not take the API down. The bearer token is
    // the actual access control; this limiter is only brute-force padding.
    return { allowed: true }
  }
}

export async function checkRateLimit(
  ip: string
): Promise<{ allowed: boolean; remaining?: number }> {
  if (process.env.NODE_ENV !== "production") {
    return { allowed: true }
  }

  if (!hourlyLimit || !dailyLimit) {
    return { allowed: true }
  }

  const [hourly, daily] = await Promise.all([
    hourlyLimit.limit(ip),
    dailyLimit.limit(ip),
  ])

  if (!hourly.success || !daily.success) {
    return { allowed: false, remaining: 0 }
  }

  return { allowed: true, remaining: Math.min(hourly.remaining, daily.remaining) }
}
