import { cache } from "react"
import { getPosts, type Post } from "@/lib/content"
import { slugify } from "@/lib/toc"

export type ContentType = "blog" | "work"

export interface TagSummary {
  /** Canonical display name, e.g. "Next.js". */
  name: string
  /** URL segment, e.g. "next-js". */
  slug: string
  blogCount: number
  workCount: number
  count: number
}

export interface TagArchive {
  name: string
  slug: string
  blog: Post[]
  work: Post[]
}

/**
 * Heading anchors and tag URLs share one slugifier, but a tag turns every run
 * of non-alphanumerics into a separator first so "Next.js" reads as "next-js"
 * rather than "nextjs". Returns "" for a tag with nothing sluggable in it;
 * such a tag is unaddressable and gets dropped from the vocabulary.
 */
export function tagSlug(tag: string): string {
  return slugify(tag.replace(/[^\p{L}\p{N}]+/gu, " ").trim())
}

export function tagHref(tag: string): string {
  return `/tags/${tagSlug(tag)}/`
}

/** Collapses whitespace so " Next.js " and "Next.js" are the same variant. */
function displayName(tag: string): string {
  return tag.trim().replace(/\s+/g, " ")
}

interface Bucket {
  slug: string
  /** Every spelling seen for this slug, with how often each occurred. */
  variants: Map<string, number>
  blog: Post[]
  work: Post[]
}

/**
 * Walks both content types once and buckets every post by tag slug. Drafts
 * follow `getPosts`, so an unpublished post never invents or inflates a tag.
 */
const collect = cache(
  async (includeDrafts: boolean): Promise<Map<string, Bucket>> => {
    const [blog, work] = await Promise.all([
      getPosts("blog", includeDrafts),
      getPosts("work", includeDrafts),
    ])

    const buckets = new Map<string, Bucket>()

    const absorb = (posts: Post[], type: ContentType) => {
      for (const post of posts) {
        const seen = new Set<string>()
        for (const raw of post.frontmatter.tags ?? []) {
          const name = displayName(raw)
          const slug = tagSlug(name)
          // A post that lists "Vue" and "vue" still counts once.
          if (!slug || seen.has(slug)) continue
          seen.add(slug)

          let bucket = buckets.get(slug)
          if (!bucket) {
            bucket = { slug, variants: new Map(), blog: [], work: [] }
            buckets.set(slug, bucket)
          }
          bucket.variants.set(name, (bucket.variants.get(name) ?? 0) + 1)
          bucket[type].push(post)
        }
      }
    }

    absorb(blog, "blog")
    absorb(work, "work")

    warnOnSilentMerges(buckets)

    return buckets
  }
)

/**
 * Folding case and spacing variants together is intended. Folding two tags
 * that are genuinely different words (say "C#" and "C++") is not, and it would
 * otherwise happen invisibly, so say so at build time.
 */
function warnOnSilentMerges(buckets: Map<string, Bucket>): void {
  for (const bucket of buckets.values()) {
    const spellings = [...bucket.variants.keys()]
    const folded = new Set(spellings.map((s) => s.toLowerCase()))
    if (folded.size > 1) {
      console.warn(
        `[tags] /tags/${bucket.slug}/ merges distinct tags: ${spellings.join(", ")}`
      )
    }
  }
}

/** The spelling used most often wins; ties break alphabetically so it is stable. */
function canonicalName(bucket: Bucket): string {
  const [name] = [...bucket.variants.entries()].sort(
    (a, b) => b[1] - a[1] || a[0].localeCompare(b[0])
  )[0]
  return name
}

function summarize(bucket: Bucket): TagSummary {
  return {
    name: canonicalName(bucket),
    slug: bucket.slug,
    blogCount: bucket.blog.length,
    workCount: bucket.work.length,
    count: bucket.blog.length + bucket.work.length,
  }
}

/** Every tag in use, heaviest first, then alphabetical. */
export async function getAllTags(includeDrafts = false): Promise<TagSummary[]> {
  const buckets = await collect(includeDrafts)
  return [...buckets.values()]
    .map(summarize)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
}

/** Everything carrying one tag, split by content type. Null if nothing does. */
export async function getTagArchive(
  slug: string,
  includeDrafts = false
): Promise<TagArchive | null> {
  const buckets = await collect(includeDrafts)
  const bucket = buckets.get(slug)
  if (!bucket) return null
  return {
    name: canonicalName(bucket),
    slug: bucket.slug,
    blog: bucket.blog,
    work: bucket.work,
  }
}

/** True when a post carries the given tag slug. */
export function postHasTag(post: Post, slug: string): boolean {
  return (post.frontmatter.tags ?? []).some((tag) => tagSlug(tag) === slug)
}
