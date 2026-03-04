import { getPosts, getPost } from "@/lib/content"
import { MDXRemote } from "next-mdx-remote/rsc"
import Image from "next/image"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"

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

const mdxComponents = {
  img: (props: React.ComponentProps<"img">) => {
    const src = typeof props.src === "string" ? props.src : ""
    return (
      <Image
        src={src}
        alt={props.alt ?? ""}
        width={900}
        height={500}
        className="my-6 rounded-lg"
        sizes="(max-width: 768px) 100vw, 680px"
      />
    )
  },
  a: (props: React.ComponentProps<"a">) => (
    <a
      {...props}
      className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
      target={props.href?.startsWith("http") ? "_blank" : undefined}
      rel={props.href?.startsWith("http") ? "noopener noreferrer" : undefined}
    />
  ),
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
        <time className="font-mono text-xs text-text-muted">
          {new Date(post.frontmatter.date).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </time>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {post.frontmatter.title}
        </h1>
        {post.frontmatter.tags && post.frontmatter.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {post.frontmatter.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-text-muted"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </header>

      <div className="prose-custom mt-12 max-w-[680px]">
        <MDXRemote source={post.content} components={mdxComponents} />
      </div>
    </article>
  )
}
