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
      limiter: Ratelimit.slidingWindow(10, "1 h"),
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

export async function checkRateLimit(
  ip: string
): Promise<{ allowed: boolean; remaining?: number }> {
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
