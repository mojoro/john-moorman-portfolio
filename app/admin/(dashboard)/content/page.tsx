import { getPosts } from "@/lib/content"
import { ContentTable } from "@/components/admin/content-table"

export default async function ContentPage() {
  const [blogPosts, workPosts] = await Promise.all([
    getPosts("blog", true),
    getPosts("work", true),
  ])

  const rows = [
    ...blogPosts.map((p) => ({
      slug: p.slug,
      type: "blog" as const,
      title: p.frontmatter.title,
      date: p.frontmatter.date,
      draft: p.frontmatter.draft ?? false,
      status: p.frontmatter.status,
    })),
    ...workPosts.map((p) => ({
      slug: p.slug,
      type: "work" as const,
      title: p.frontmatter.title,
      date: p.frontmatter.date,
      draft: p.frontmatter.draft ?? false,
      status: p.frontmatter.status,
    })),
  ]

  return (
    <>
      <h1 className="mb-6 font-display text-2xl font-semibold text-text-primary">
        Content
      </h1>
      <ContentTable posts={rows} />
    </>
  )
}
