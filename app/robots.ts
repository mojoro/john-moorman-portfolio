import type { MetadataRoute } from "next"

const SITE_URL = "https://johnmoorman.com"

// Explicit allowlist for AI search and citation crawlers. Per 2026 best practices
// (Princeton GEO research, ai-seo skill): a Disallow on these bots removes the
// site from that platform's AI citations. Opt them in for visibility.
const AI_CITATION_BOTS = [
  "GPTBot",
  "ChatGPT-User",
  "OAI-SearchBot",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "Perplexity-User",
  "Google-Extended",
  "Applebot-Extended",
  "Bingbot",
  "DuckDuckBot",
  "CCBot",
] as const

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/"],
      },
      ...AI_CITATION_BOTS.map((bot) => ({
        userAgent: bot,
        allow: "/",
        disallow: ["/admin/", "/api/"],
      })),
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
    host: SITE_URL,
  }
}
