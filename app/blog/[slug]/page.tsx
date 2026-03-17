import { getPosts, getPost } from "@/lib/content"
import { MDXRemote } from "next-mdx-remote/rsc"
import { LightboxProvider } from "@/components/lightbox-provider"
import { MdxImage } from "@/components/mdx-image"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 238))
}

const mdxComponents = {
  img: MdxImage,
  a: (props: React.ComponentProps<"a">) => (
    <a
      {...props}
      className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
      target={props.href?.startsWith("http") ? "_blank" : undefined}
      rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
    />
  ),
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getPosts("blog")
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost("blog", slug)
  if (!post) return { title: "Post Not Found" }

  return {
    title: `${post.frontmatter.title} | John Moorman`,
    description: post.frontmatter.description,
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const post = await getPost("blog", slug)

  if (!post) notFound()

  return (
    <article className="py-20">
      <Link
        href="/blog"
        className="font-mono text-xs text-text-muted transition-colors hover:text-accent"
      >
        &larr; Back to blog
      </Link>

      <header className="mt-8">
        <div className="flex items-center gap-3 font-mono text-xs text-text-muted">
          <time>
            {new Date(post.frontmatter.date).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </time>
          <span className="text-border">·</span>
          <span>{estimateReadTime(post.content)} min read</span>
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {post.frontmatter.title}
        </h1>
        {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.frontmatter.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-text-muted transition-colors duration-200 hover:border-accent hover:text-accent"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <LightboxProvider>
        <div className="prose-custom mt-12 max-w-[680px]">
          <MDXRemote source={post.content} components={mdxComponents} />
        </div>
      </LightboxProvider>
    </article>
  )
}
