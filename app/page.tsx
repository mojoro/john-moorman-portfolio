"use client"

import { motion, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { SectionReveal } from "@/components/section-reveal"
import { ContactForm } from "@/components/contact-form"

const PROJECTS = [
  {
    title: "BOA Automation Suite",
    summary:
      "Complete administrative automation for Berlin Opera Academy, replacing manual workflows across the entire student lifecycle.",
    stats: [
      { label: "Annual savings", value: "€74K" },
      { label: "Payment collection", value: "+18%" },
    ],
    tags: ["Google Apps Script", "PayPal API", "Gmail API"],
    href: "/work/boa-automation",
    featured: true,
  },
  {
    title: "Real Estate AI Pipeline",
    summary:
      "Automated property intelligence pipeline that scrapes, structures, and AI-analyzes listings for daily investment recommendations.",
    stats: [],
    tags: ["n8n", "Apify", "Gemini", "Airtable"],
    href: "/work/real-estate-pipeline",
    featured: true,
  },
  {
    title: "finalflow",
    summary:
      "Marketing site and education platform foundation for a music tech startup. Pixel-perfect Figma execution in the client's preferred stack.",
    stats: [],
    tags: ["Vue.js", "TypeScript", "Tailwind CSS", "Firebase"],
    href: "/work/finalflow",
    featured: false,
  },
  {
    title: "Serenity Retreat",
    summary:
      "Frontend rebuild, analytics integration, data pipeline migration, and custom PHP calendar sync plugin.",
    stats: [],
    tags: ["PHP", "JavaScript", "Analytics", "REST APIs"],
    href: "/work/serenity-retreat",
    featured: false,
  },
] as const

const CURRENT_PROJECTS: Array<{
  week: number
  title: string
  status: "shipped" | "in-progress" | "upcoming"
  href?: string
}> = [
  {
    week: 1,
    title: "Real Estate AI Pipeline",
    status: "shipped",
    href: "/work/real-estate-pipeline",
  },
  {
    week: 2,
    title: "Portfolio Site Rebuild",
    status: "shipped",
    href: "/work/portfolio-site",
  },
  {
    week: 3,
    title: "Shortlist",
    status: "shipped",
    href: "/work/shortlist",
  },
  {
    week: 4,
    title: "Coming soon",
    status: "upcoming",
  },
]

const BLOG_POSTS = [
  {
    title: "Drop: Paste a URL, Get a Podcast",
    date: "2026-03-14",
    description:
      "What we built at the AI Mini Hackathon Berlin: a two-voice podcast generator powered by Needle, Featherless, and ElevenLabs, shipped in 2.5 hours.",
    tags: ["Next.js", "ElevenLabs", "Hackathon"],
    href: "/blog/hackathon-drop",
  },
  {
    title: "From Scraper to Inbox: Building an AI-Powered Real Estate Sourcing Tool",
    date: "2026-02-28",
    description:
      "How I built an automated property intelligence pipeline using Apify, n8n, Airtable, and Gemini.",
    tags: ["n8n", "Apify", "Anthropic API"],
    href: "/blog/real-estate-ai-tool",
  },
] as const

function SectionHeading({
  number,
  children,
}: {
  number: string
  children: React.ReactNode
}) {
  return (
    <h2 className="flex items-center gap-3 font-display text-2xl font-semibold sm:text-3xl">
      <span className="font-mono text-base text-accent">{number}.</span>
      {children}
      <span className="ml-4 hidden h-px flex-1 bg-border sm:block" />
    </h2>
  )
}

export default function Home() {
  const shouldReduceMotion = useReducedMotion()

  const container = {
    hidden: {},
    show: {
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : 0.1,
      },
    },
  }

  const fadeUp = {
    hidden: shouldReduceMotion ? {} : { opacity: 0, y: 20 },
    show: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" as const },
    },
  }

  return (
    <main>
      {/* ── Hero ── */}
      <motion.section
        className="flex min-h-screen flex-col justify-center py-24"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <motion.p variants={fadeUp} className="font-mono text-sm text-accent">
          Hi, my name is
        </motion.p>
        <motion.h1
          variants={fadeUp}
          className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
        >
          John Moorman.
        </motion.h1>
        <motion.h2
          variants={fadeUp}
          className="font-display text-[clamp(1.5rem,4vw,3rem)] font-bold leading-tight text-text-secondary"
        >
          I write software that pays for itself.
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-xl text-text-secondary"
        >
          Software engineer in Berlin. I built an automation suite that saved a
          company €74K/year, letting two part-time administrators do the work of four. Now I ship AI-native
          software for clients, learning whatever stack the project needs and
          delivering on tight timelines.
        </motion.p>
        <motion.div variants={fadeUp} className="mt-8 flex flex-wrap gap-4">
          <a
            href="mailto:john@johnmoorman.com"
            className="inline-flex items-center gap-2 rounded border border-accent px-6 py-3 font-mono text-sm text-accent transition-colors hover:bg-accent/10"
          >
            Get in touch
          </a>
          <a
            href="#work"
            className="inline-flex items-center gap-2 px-6 py-3 font-mono text-sm text-text-secondary transition-colors hover:text-accent"
          >
            See my work &darr;
          </a>
        </motion.div>
        <motion.div variants={fadeUp} className="mt-4">
          <Link
            href="/about"
            className="font-mono text-sm text-accent transition-colors hover:underline"
          >
            Full story &rarr;
          </Link>
        </motion.div>
        <motion.div
          variants={fadeUp}
          className="mt-6 flex flex-wrap items-center gap-5 text-text-muted"
        >
          <a
            href="mailto:john@johnmoorman.com"
            className="font-mono text-[11px] transition-colors hover:text-accent sm:text-sm"
          >
            john@johnmoorman.com
          </a>
          <span className="text-border" aria-hidden="true">|</span>
          <a
            href="https://linkedin.com/in/john-moorman"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] transition-colors hover:text-accent sm:text-sm"
          >
            LinkedIn
          </a>
          <span className="text-border" aria-hidden="true">|</span>
          <a
            href="https://github.com/mojoro"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-[11px] transition-colors hover:text-accent sm:text-sm"
          >
            GitHub
          </a>
        </motion.div>
      </motion.section>

      {/* ── Work ── */}
      <section id="work" className="py-24">
        <SectionReveal>
          <SectionHeading number="01">Work</SectionHeading>
          <p className="mt-4 text-text-secondary">
            Selected projects, each one shipped to production with real users
            and measurable outcomes.
          </p>
        </SectionReveal>

        {/* 10-in-10 challenge callout */}
        <SectionReveal delay={0.1}>
          <div className="mt-10 rounded-lg border border-accent/20 bg-accent/5 p-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <span className="font-mono text-xs uppercase tracking-widest text-accent/70">
                  Challenge
                </span>
                <h3 className="mt-1 text-lg font-semibold text-text-primary">
                  10 Projects in 10 Weeks
                </h3>
              </div>
              <span className="font-mono text-sm text-accent/80">
                {CURRENT_PROJECTS.filter((p) => p.status === "shipped").length + CURRENT_PROJECTS.filter((p) => p.status === "in-progress").length} of 10 &middot;{" "}
                {CURRENT_PROJECTS.filter((p) => p.status === "shipped").length} shipped
              </span>
            </div>
            <div className="mt-3 flex gap-1">
              {Array.from({ length: 10 }, (_, i) => {
                const shipped = CURRENT_PROJECTS.filter((p) => p.status === "shipped").length
                const inProgress = CURRENT_PROJECTS.filter((p) => p.status === "in-progress").length
                return (
                  <div
                    key={i}
                    className={`h-1 flex-1 rounded-full ${
                      i < shipped
                        ? "bg-accent/70"
                        : i < shipped + inProgress
                        ? "bg-yellow-400/50"
                        : "bg-text-muted/20"
                    }`}
                  />
                )
              })}
            </div>
          </div>
        </SectionReveal>

        {/* Featured projects */}
        <div className="mt-8 space-y-6">
          {PROJECTS.map((project, i) => (
            <SectionReveal key={project.title} delay={(i + 1) * 0.1}>
              <ProjectCard project={project} />
            </SectionReveal>
          ))}
        </div>

        {/* Current building cards (shipped + in-progress only) */}
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {CURRENT_PROJECTS.filter((p) => p.status !== "upcoming").map((project, i) => (
            <SectionReveal key={project.week} delay={(i + PROJECTS.length + 1) * 0.1}>
              <CurrentProjectCard project={project} />
            </SectionReveal>
          ))}
        </div>

        <SectionReveal delay={0.4}>
          <div className="mt-10">
            <Link
              href="/work"
              className="inline-flex items-center gap-2 font-mono text-sm text-accent transition-colors hover:underline"
            >
              View all projects &rarr;
            </Link>
          </div>
        </SectionReveal>
      </section>

      {/* ── Blog ── */}
      <section id="blog" className="py-24">
        <SectionReveal>
          <SectionHeading number="02">Blog</SectionHeading>
          <p className="mt-4 text-text-secondary">
            Writing about what I build and how I build it.
          </p>
        </SectionReveal>

        <div className="mt-10 space-y-8">
          {BLOG_POSTS.map((post, i) => (
            <SectionReveal key={post.href} delay={i * 0.1}>
              <a href={post.href} className="group block">
                <p className="font-mono text-sm text-text-muted">
                  {new Date(post.date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
                <h3 className="mt-2 text-xl font-medium text-text-primary transition-colors group-hover:text-accent">
                  {post.title}
                </h3>
                <p className="mt-2 text-text-secondary">{post.description}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full bg-accent/10 px-3 py-1 font-mono text-xs text-accent"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </a>
            </SectionReveal>
          ))}
        </div>

        <SectionReveal delay={0.2}>
          <div className="mt-10">
            <Link
              href="/blog"
              className="inline-flex items-center gap-2 font-mono text-sm text-accent transition-colors hover:underline"
            >
              Read all posts &rarr;
            </Link>
          </div>
        </SectionReveal>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-24">
        <SectionReveal>
          <SectionHeading number="03">Contact</SectionHeading>
          <p className="mt-6 max-w-xl text-text-secondary">
            I&apos;m currently looking for mid-level fullstack or frontend roles
            at Berlin startups. Whether you have a specific role in mind or just
            want to connect, my inbox is open.
          </p>
        </SectionReveal>

        <SectionReveal delay={0.1}>
          <div className="mt-10 max-w-xl">
            <ContactForm />
          </div>
        </SectionReveal>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-border py-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="flex flex-wrap justify-center gap-6 font-mono text-sm text-text-muted">
            <a
              href="mailto:john@johnmoorman.com"
              className="transition-colors hover:text-accent"
            >
              john@johnmoorman.com
            </a>
            <a
              href="https://github.com/mojoro"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-accent"
            >
              GitHub
            </a>
            <a
              href="https://linkedin.com/in/john-moorman"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-accent"
            >
              LinkedIn
            </a>
          </div>
          <p className="text-xs text-text-muted">
            Built with Next.js, TypeScript &amp; Tailwind CSS.
          </p>
        </div>
      </footer>
    </main>
  )
}

function ProjectCard({
  project,
}: {
  project: (typeof PROJECTS)[number]
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <motion.a
      href={project.href}
      className="group relative block rounded-lg border border-border bg-bg-surface p-6 transition-colors hover:border-accent/40"
      whileHover={shouldReduceMotion ? {} : { y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <span className="absolute top-4 right-4 text-text-muted text-sm transition-all duration-300 group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
        ↗
      </span>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1">
          {project.featured && (
            <p className="mb-2 font-mono text-xs text-accent">Featured</p>
          )}
          <h3 className="text-xl font-medium text-text-primary transition-colors group-hover:text-accent">
            {project.title}
          </h3>
          <p className="mt-2 text-sm text-text-secondary">{project.summary}</p>
        </div>

        {project.stats.length > 0 && (
          <div className="flex gap-6 sm:text-right">
            {project.stats.map((stat) => (
              <div key={stat.label}>
                <p className="font-display text-2xl font-bold text-accent">
                  {stat.value}
                </p>
                <p className="font-mono text-xs text-text-muted">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-text-muted transition-colors hover:border-accent/30 hover:bg-accent/10 hover:text-accent"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.a>
  )
}

function CurrentProjectCard({
  project,
}: {
  project: (typeof CURRENT_PROJECTS)[number]
}) {
  const shouldReduceMotion = useReducedMotion()

  const badgeClass =
    project.status === "shipped"
      ? "bg-accent/10 text-accent"
      : project.status === "in-progress"
      ? "bg-yellow-400/10 text-yellow-400"
      : "bg-text-muted/10 text-text-muted"

  const badgeLabel =
    project.status === "shipped"
      ? "Shipped"
      : project.status === "in-progress"
      ? "In Progress"
      : "Upcoming"

  const borderClass =
    project.status === "shipped"
      ? "border-border bg-bg-surface"
      : project.status === "in-progress"
      ? "border-yellow-400/20 bg-bg-surface"
      : "border-dashed border-border/60 bg-transparent"

  const inner = (
    <>
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs text-text-muted">
          Week {project.week}
        </span>
        <span className={`rounded-full px-2 py-0.5 font-mono text-[10px] ${badgeClass}`}>
          {badgeLabel}
        </span>
      </div>
      <p className={`mt-2 text-sm font-medium ${project.href ? "text-text-primary" : "italic text-text-muted"}`}>
        {project.title}
      </p>
    </>
  )

  if (project.href) {
    return (
      <motion.a
        href={project.href}
        className={`group block rounded-lg border p-4 transition-colors hover:border-accent/40 ${borderClass}`}
        whileHover={shouldReduceMotion ? {} : { y: -4 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
      >
        {inner}
      </motion.a>
    )
  }

  return (
    <div className={`rounded-lg border p-4 ${borderClass}`}>
      {inner}
    </div>
  )
}
