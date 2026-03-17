import { getPosts } from "@/lib/content"
import { HomeClient } from "@/components/home-client"

export default async function Home() {
  const [blogPosts, workPosts] = await Promise.all([
    getPosts("blog"),
    getPosts("work"),
  ])

  const recentBlog = blogPosts.slice(0, 2).map((p) => ({
    title: p.frontmatter.title,
    date: p.frontmatter.date,
    description: p.frontmatter.description,
    tags: p.frontmatter.tags ?? [],
    href: `/blog/${p.slug}`,
  }))

  const featuredWork = workPosts
    .filter((p) => p.frontmatter.featured)
    .map((p) => ({
      title: p.frontmatter.title,
      summary: p.frontmatter.description,
      stats: p.frontmatter.stats ?? [],
      tags: p.frontmatter.tags ?? [],
      href: `/work/${p.slug}`,
    }))

  const challengeWork = workPosts
    .filter((p) => p.frontmatter.challenge === "10-in-10" && p.frontmatter.week != null)
    .sort((a, b) => (a.frontmatter.week ?? 0) - (b.frontmatter.week ?? 0))
    .map((p) => ({
      week: p.frontmatter.week as number,
      title: p.frontmatter.title,
      status: p.frontmatter.status ?? "upcoming",
      href: p.frontmatter.status !== "upcoming" ? `/work/${p.slug}` : undefined,
    }))

  return (
    <HomeClient
      blogPosts={recentBlog}
      featuredWork={featuredWork}
      challengeWork={challengeWork}
    />
  )
}
