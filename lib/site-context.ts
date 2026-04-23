import { getPosts, type Post, type PostFrontmatter } from "./content"

/**
 * Two-tier site context for the chatbot.
 *
 * `siteIndex()` returns a compact listing (slug, date, challenge/week, URL,
 * description, tags) of every published project on the site. It's meant to
 * live in the cached prefix of every chat system prompt so the router and
 * the main call can reason about which projects exist without loading the
 * full content of any of them. ~2-3K tokens.
 *
 * `loadPosts(slugs)` returns the full text of the requested projects,
 * newest first, formatted with the same headers used in the index so URLs
 * and week numbers line up. Returns empty string for an empty slug list.
 *
 * `allSlugs()` is a convenience for fallback paths that want to load
 * everything (e.g. when the router fails and we'd rather be slow than
 * answer thin).
 *
 * For slugs that exist as both a blog post and a work case study, the blog
 * version supplies the long-form narrative and the work frontmatter
 * supplies the project metadata (challenge, week, status). Work-only slugs
 * (BOA, finalflow, serenity-retreat, portfolio-site, real-estate-pipeline,
 * open-source) use the work content directly.
 */

interface IndexEntry {
  slug: string
  url: string
  title: string
  date: string
  description: string
  challenge?: string
  week?: number
  tags?: string[]
}

let entriesCache: Promise<IndexEntry[]> | null = null
let bodyCache: Promise<Map<string, string>> | null = null

export async function siteIndex(): Promise<string> {
  const entries = await ensureEntries()
  return entries.map(formatIndexLine).join("\n")
}

export async function loadPosts(slugs: string[]): Promise<string> {
  if (!slugs.length) return ""
  const [entries, bodies] = await Promise.all([ensureEntries(), ensureBodies()])
  const wanted = new Set(slugs)
  const matched = entries.filter((e) => wanted.has(e.slug))
  return matched.map((e) => formatFullEntry(e, bodies.get(e.slug) ?? "")).join("\n\n---\n\n")
}

export async function allSlugs(): Promise<string[]> {
  const entries = await ensureEntries()
  return entries.map((e) => e.slug)
}

function ensureEntries(): Promise<IndexEntry[]> {
  if (!entriesCache) entriesCache = computeEntries()
  return entriesCache
}

function ensureBodies(): Promise<Map<string, string>> {
  if (!bodyCache) bodyCache = computeBodies()
  return bodyCache
}

async function computeEntries(): Promise<IndexEntry[]> {
  const [blog, work] = await Promise.all([getPosts("blog"), getPosts("work")])
  const workBySlug = new Map(work.map((p) => [p.slug, p]))
  const blogSlugs = new Set(blog.map((p) => p.slug))

  const entries: IndexEntry[] = [
    ...blog.map((post) => toEntry(post, "blog", workBySlug.get(post.slug)?.frontmatter)),
    ...work.filter((p) => !blogSlugs.has(p.slug)).map((post) => toEntry(post, "work")),
  ]

  entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  return entries
}

async function computeBodies(): Promise<Map<string, string>> {
  const [blog, work] = await Promise.all([getPosts("blog"), getPosts("work")])
  const map = new Map<string, string>()
  for (const post of work) map.set(post.slug, post.content.trim())
  // Blog wins on slug conflict — longer-form narrative preferred over case study
  for (const post of blog) map.set(post.slug, post.content.trim())
  return map
}

function toEntry(
  post: Post,
  type: "blog" | "work",
  workMeta?: PostFrontmatter
): IndexEntry {
  const fm = post.frontmatter
  return {
    slug: post.slug,
    url: `/${type}/${post.slug}`,
    title: fm.title,
    date: fm.date,
    description: fm.description ?? "",
    challenge: fm.challenge ?? workMeta?.challenge,
    week: fm.week ?? workMeta?.week,
    tags: fm.tags,
  }
}

function formatIndexLine(e: IndexEntry): string {
  const weekPart =
    e.challenge && e.week != null
      ? ` · ${e.challenge} W${e.week}`
      : e.challenge
        ? ` · ${e.challenge}`
        : ""
  const tagsPart = e.tags && e.tags.length ? ` [${e.tags.slice(0, 5).join(", ")}]` : ""
  const descPart = e.description ? ` — ${e.description}` : ""
  return `- ${e.slug} · ${e.date}${weekPart} · ${e.url}${tagsPart}\n    ${e.title}${descPart}`
}

function formatFullEntry(e: IndexEntry, body: string): string {
  const weekPart = e.challenge && e.week != null ? ` · ${e.challenge} Week ${e.week}` : ""
  const header = `### ${e.title} · ${e.date}${weekPart} (${e.url})`
  const desc = e.description ? `\n${e.description}` : ""
  return `${header}${desc}\n\n${body}`
}
