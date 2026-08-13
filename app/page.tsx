import { getPosts } from "@/lib/content"
import { HomeClient } from "@/components/home-client"
import type { Metadata } from "next"

const HOME_TITLE = "John Moorman · Software Engineer in Berlin"
const HOME_DESCRIPTION =
  "Freelance fullstack engineer in Berlin. Production work in Next.js, TypeScript, and AI-native tooling. €74K/year saved at Berlin Opera Academy with a custom automation suite. Featured case studies, writing, and contact."

export const metadata: Metadata = {
  title: { absolute: HOME_TITLE },
  description: HOME_DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: "/",
    type: "website",
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "John Moorman, Software Engineer in Berlin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    images: ["/og"],
    creator: "@John_Moorman",
    site: "@John_Moorman",
  },
}

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

  const featuredWork = workPosts.flatMap((p) =>
    p.frontmatter.featured
      ? [
          {
            title: p.frontmatter.title,
            summary: p.frontmatter.description,
            stats: p.frontmatter.stats ?? [],
            tags: p.frontmatter.tags ?? [],
            href: `/work/${p.slug}`,
          },
        ]
      : []
  )

  const ongoingWork = workPosts.flatMap((p) =>
    p.frontmatter.ongoing
      ? [
          {
            title: p.frontmatter.title,
            summary: p.frontmatter.description,
            since: p.frontmatter.ongoingSince ?? "Ongoing",
            href: `/work/${p.slug}`,
          },
        ]
      : []
  )

  // Featured projects already get a full card above, so skip them here.
  const funWork = workPosts.flatMap((p) =>
    p.frontmatter.fun && !p.frontmatter.featured
      ? [
          {
            title: p.frontmatter.title,
            summary: p.frontmatter.description,
            href: `/work/${p.slug}`,
          },
        ]
      : []
  )

  return (
    <HomeClient
      blogPosts={recentBlog}
      featuredWork={featuredWork}
      ongoingWork={ongoingWork}
      funWork={funWork}
    />
  )
}
