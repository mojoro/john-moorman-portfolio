import { slugify } from "@/lib/toc"

/**
 * The pure half of the tag helpers, split out of `lib/tags.ts` so client
 * components can build a tag href without dragging the MDX loader (and with
 * it `fs`) into the browser bundle.
 */

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
