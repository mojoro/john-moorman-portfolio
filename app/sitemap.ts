import { getPosts } from "@/lib/content"
import type { MetadataRoute } from "next"

const BASE_URL = "https://johnmoorman.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const blogPosts = await getPosts("blog")
  const workPosts = await getPosts("work")

  const blogEntries = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}/`,
    lastModified: new Date(post.frontmatter.date),
  }))

  const workEntries = workPosts.map((post) => ({
    url: `${BASE_URL}/work/${post.slug}/`,
    lastModified: new Date(post.frontmatter.date),
  }))

  return [
    { url: `${BASE_URL}/`, lastModified: new Date() },
    { url: `${BASE_URL}/about/`, lastModified: new Date() },
    { url: `${BASE_URL}/blog/`, lastModified: new Date() },
    { url: `${BASE_URL}/work/`, lastModified: new Date() },
    ...blogEntries,
    ...workEntries,
  ]
}
