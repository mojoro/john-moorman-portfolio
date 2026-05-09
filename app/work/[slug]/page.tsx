import { getPosts, getPost } from "@/lib/content"
import { extractHeadings, slugify } from "@/lib/toc"
import { MDXRemote } from "next-mdx-remote/rsc"
import remarkGfm from "remark-gfm"
import { LightboxProvider } from "@/components/lightbox-provider"
import { MdxImage } from "@/components/mdx-image"
import { MdxAudio } from "@/components/mdx-audio"
import { OgLink } from "@/components/mdx-og-link"
import { WorkDemo, LiveEmbed } from "@/components/work-demo"
import { TableOfContents } from "@/components/table-of-contents"
import { TagPill } from "@/components/tag-pill"
import Link from "next/link"
import { notFound } from "next/navigation"
import type { Metadata } from "next"
import type React from "react"

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

function buildMdxComponents(frontmatter: import("@/lib/content").PostFrontmatter) {
  return {
    img: MdxImage,
    Audio: MdxAudio,
    OgLink,
    Demo: (props: React.ComponentProps<typeof WorkDemo>) => (
      <WorkDemo
        stats={frontmatter.stats}
        status={frontmatter.status}
        {...props}
      />
    ),
    LiveEmbed,
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
}

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateStaticParams() {
  const posts = await getPosts("work")
  return posts.map((post) => ({ slug: post.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPost("work", slug)
  if (!post) return { title: "Project Not Found", robots: { index: false } }

  const url = `/work/${slug}`
  const ogImage = `/og?title=${encodeURIComponent(post.frontmatter.title)}&eyebrow=${encodeURIComponent("johnmoorman.com / work")}&subtitle=${encodeURIComponent("Case study · " + new Date(post.frontmatter.date).toLocaleDateString("en-US", { year: "numeric", month: "long" }))}`

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

export default async function WorkPost({ params }: Props) {
  const { slug } = await params
  const post = await getPost("work", slug)

  if (!post) notFound()

  const headings = extractHeadings(post.content)
  const mdxComponents = buildMdxComponents(post.frontmatter)
  const url = `https://johnmoorman.com/work/${slug}`
  const isoDate = new Date(post.frontmatter.date).toISOString()
  const ogImage = `https://johnmoorman.com/og?title=${encodeURIComponent(post.frontmatter.title)}&eyebrow=${encodeURIComponent("johnmoorman.com / work")}`

  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
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
        name: "Work",
        item: "https://johnmoorman.com/work",
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
        href="/work"
        className="font-mono text-xs text-text-muted transition-colors hover:text-accent"
      >
        &larr; Back to work
      </Link>

      <header className="mt-8">
        <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
          {post.frontmatter.title}
        </h1>
        <p className="mt-4 text-lg text-text-secondary">
          {post.frontmatter.description}
        </p>
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
    </>
  )
}
