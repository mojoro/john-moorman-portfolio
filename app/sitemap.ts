import { getPosts } from "@/lib/content"
import type { MetadataRoute } from "next"

const BASE_URL = "https://johnmoorman.com"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [blogPosts, workPosts] = await Promise.all([
    getPosts("blog"),
    getPosts("work"),
  ])

  const now = new Date()

  const blogEntries: MetadataRoute.Sitemap = blogPosts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}/`,
    lastModified: new Date(post.frontmatter.date),
    changeFrequency: "yearly",
    priority: 0.7,
  }))

  const workEntries: MetadataRoute.Sitemap = workPosts.map((post) => ({
    url: `${BASE_URL}/work/${post.slug}/`,
    lastModified: new Date(post.frontmatter.date),
    changeFrequency: "yearly",
    priority: 0.8,
  }))

  return [
    {
      url: `${BASE_URL}/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/work/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog/`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/about/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/resume/`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    ...workEntries,
    ...blogEntries,
  ]
}
