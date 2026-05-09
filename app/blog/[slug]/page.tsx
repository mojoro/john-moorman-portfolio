import { getPosts, getPost } from "@/lib/content"
import { extractHeadings, slugify } from "@/lib/toc"
import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import { LightboxProvider } from "@/components/lightbox-provider"
import { MdxImage } from "@/components/mdx-image"
import { MdxAudio } from "@/components/mdx-audio"
import { OgLink } from "@/components/mdx-og-link"
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
  OgLink,
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
  table: (props: React.ComponentProps<"table">) => (
    <div className="overflow-x-auto">
      <table {...props} />
    </div>
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
  if (!post) return { title: "Post Not Found", robots: { index: false } }

  const url = `/blog/${slug}`
  const ogImage = `/og?title=${encodeURIComponent(post.frontmatter.title)}&eyebrow=${encodeURIComponent("johnmoorman.com / blog")}&subtitle=${encodeURIComponent(new Date(post.frontmatter.date).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }))}`

  return {
    title: post.frontmatter.title,
    description: post.frontmatter.description,
    keywords: post.frontmatter.tags,
    authors: [{ name: "John Moorman", url: "https://johnmoorman.com" }],
    alternates: { canonical: url },
    openGraph: {
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      url,
      type: "article",
      publishedTime: new Date(post.frontmatter.date).toISOString(),
      modifiedTime: new Date(post.frontmatter.date).toISOString(),
      authors: ["https://johnmoorman.com/about"],
      tags: post.frontmatter.tags,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: post.frontmatter.title,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.frontmatter.title,
      description: post.frontmatter.description,
      images: [ogImage],
      creator: "@John_Moorman",
      site: "@John_Moorman",
    },
  }
}

export default async function BlogPost({ params }: Props) {
  const { slug } = await params
  const post = await getPost("blog", slug)

  if (!post) notFound()

  const headings = extractHeadings(post.content)
  const turnstileSiteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""
  const url = `https://johnmoorman.com/blog/${slug}`
  const isoDate = new Date(post.frontmatter.date).toISOString()
  const ogImage = `https://johnmoorman.com/og?title=${encodeURIComponent(post.frontmatter.title)}&eyebrow=${encodeURIComponent("johnmoorman.com / blog")}`

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "@id": `${url}#article`,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    headline: post.frontmatter.title,
    description: post.frontmatter.description,
    image: [ogImage],
    keywords: post.frontmatter.tags,
    inLanguage: "en",
    datePublished: isoDate,
    dateModified: isoDate,
    author: {
      "@type": "Person",
      "@id": "https://johnmoorman.com/#person",
      name: "John Moorman",
      url: "https://johnmoorman.com",
    },
    publisher: { "@id": "https://johnmoorman.com/#person" },
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://johnmoorman.com/",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: "https://johnmoorman.com/blog",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: post.frontmatter.title,
        item: url,
      },
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <article className="py-20 mx-auto max-w-[680px] lg:max-w-none 2xl:max-w-[680px]">
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

        {/* Prose + TOC — relative context keeps absolute TOC flush with prose top */}
        <div className="relative mt-12 lg:flex lg:gap-8 2xl:block">
          <div className="min-w-0 lg:flex-1">
            <LightboxProvider>
              <div className="prose-custom">
                <MDXRemote source={post.content} components={mdxComponents} options={{ mdxOptions: { remarkPlugins: [remarkGfm] } }} />
              </div>
            </LightboxProvider>
          </div>
          <TableOfContents items={headings} />
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
