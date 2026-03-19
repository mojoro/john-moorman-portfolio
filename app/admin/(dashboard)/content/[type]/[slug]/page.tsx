import { notFound } from "next/navigation"
import { getPost } from "@/lib/content"
import { ContentEditor } from "@/components/admin/content-editor"

interface PageProps {
  params: Promise<{ type: string; slug: string }>
}

export default async function ContentEditPage({ params }: PageProps) {
  const { type, slug } = await params

  if (type !== "blog" && type !== "work") {
    notFound()
  }

  const post = await getPost(type, slug)
  if (!post) {
    notFound()
  }

  return (
    <ContentEditor
      slug={slug}
      type={type}
      initialFrontmatter={post.frontmatter as unknown as Record<string, unknown>}
      initialContent={post.content}
    />
  )
}
