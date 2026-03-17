import { getPosts } from "@/lib/content"
import { HomeClient } from "@/components/home-client"

export default async function Home() {
  const posts = await getPosts("blog")
  const blogPosts = posts.slice(0, 2).map((p) => ({
    title: p.frontmatter.title,
    date: p.frontmatter.date,
    description: p.frontmatter.description,
    tags: p.frontmatter.tags ?? [],
    href: `/blog/${p.slug}`,
  }))

  return <HomeClient blogPosts={blogPosts} />
}
