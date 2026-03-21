import { getPosts, getPost } from "@/lib/content"
import { extractHeadings, slugify } from "@/lib/toc"
import { MDXRemote } from "next-mdx-remote/rsc"
import { LightboxProvider } from "@/components/lightbox-provider"
import { MdxImage } from "@/components/mdx-image"
import { MdxAudio } from "@/components/mdx-audio"
import { TableOfContents } from "@/components/table-of-contents"
import { TagPill } from "@/components/tag-pill"
import { CommentList } from "@/components/comment-list"
import { CommentForm } from "@/components/comment-form"
import Link from "next/link"
import { Suspense } from "react"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import type React from "react"

function estimateReadTime(content: string): number {
  const words = content.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 238))
}

function extractText(children: React.ReactNode): string {
  if (typeof children === "string") return children
  if (Array.isArray(children)) return children.map(extractText).join("")
  if (
    typeof children === "object" &&
    children !== null &&
    "props" in children
  ) {
    return extractText((children as React.ReactElement<{ children?: React.ReactNode }>).props.children)
  }
  return ""
}

const mdxComponents = {
  img: MdxImage,
  Audio: MdxAudio,
  p: ({ children }: { children: React.ReactNode }) => {
    const hasImage = Array.isArray(children)
      ? children.some((c) => typeof c === "object" && c !== null && "type" in c && (c as React.ReactElement).type === MdxImage)
      : typeof children === "object" && children !== null && "type" in children && (children as React.ReactElement).type === MdxImage
    return hasImage ? <div>{children}</div> : <p>{children}</p>
  },
  a: (props: React.ComponentProps<"a">) => (
    <a
      {...props}
      className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
      target={props.href?.startsWith("http") ? "_blank" : undefined}
      rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
    />
  ),
  h2: ({ children }: { children: React.ReactNode }) => (
    <h2 id={slugify(extractText(children))}>{children}</h2>
  ),
  h3: ({ children }: { children: React.ReactNode }) => (
    <h3 id={slugify(extractText(children))}>{children}</h3>
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

  const headings = extractHeadings(post.content)
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""

  return (
    <>
      <article className="py-20 mx-auto max-w-[680px]">
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
                <TagPill key={tag}>{tag}</TagPill>
              ))}
            </div>
          )}
        </header>

        <div className="relative mt-12">
          <TableOfContents items={headings} />
          <LightboxProvider>
            <div className="prose-custom">
              <MDXRemote source={post.content} components={mdxComponents} />
            </div>
          </LightboxProvider>
        </div>
      </article>

      <section className="mx-auto max-w-[680px] border-t border-border pb-20">
        <h2 className="mt-12 font-display text-xl font-semibold text-text-primary">
          Comments
        </h2>

        <div className="mt-6">
          <Suspense
            fallback={
              <p className="text-sm text-text-muted">Loading comments...</p>
            }
          >
            <CommentList postSlug={slug} />
          </Suspense>
        </div>

        <div className="mt-10">
          <h3 className="mb-4 font-display text-base font-semibold text-text-primary">
            Leave a comment
          </h3>
          <CommentForm postSlug={slug} turnstileSiteKey={turnstileSiteKey} />
        </div>
      </section>
    </>
  )
}
