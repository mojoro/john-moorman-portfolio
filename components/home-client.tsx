"use client"

import { m, useReducedMotion } from "framer-motion"
import Link from "next/link"
import { SectionReveal } from "@/components/section-reveal"
import { ContactForm } from "@/components/contact-form"
import { TagPill } from "@/components/tag-pill"

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

interface BlogPost {
  title: string
  date: string
  description: string
  tags: readonly string[]
  href: string
}

interface FeaturedWork {
  title: string
  summary: string
  stats: Array<{ value: string; label: string }>
  tags: readonly string[]
  href: string
}

interface FunWork {
  title: string
  summary: string
  tags: readonly string[]
  href: string
}

interface OngoingWork {
  title: string
  summary: string
  since: string
  href: string
}

export function HomeClient({
  blogPosts,
  featuredWork,
  ongoingWork,
  funWork,
}: {
  blogPosts: BlogPost[]
  featuredWork: FeaturedWork[]
  ongoingWork: OngoingWork[]
  funWork: FunWork[]
}) {
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
    <>
      {/* ── Hero ── */}
      <m.section
        className="flex min-h-screen flex-col justify-center py-24"
        variants={container}
        initial="hidden"
        animate="show"
      >
        <m.p variants={fadeUp} className="font-mono text-sm text-accent">
          Hi, my name is
        </m.p>
        <m.h1
          variants={fadeUp}
          className="mt-5 font-display text-4xl font-bold leading-tight tracking-tight sm:text-5xl"
        >
          John Moorman.
        </m.h1>
        <m.h2
          variants={fadeUp}
          className="font-display text-[clamp(1.5rem,4vw,3rem)] font-bold leading-tight text-text-secondary"
        >
          I write software that pays for itself.
        </m.h2>
        <m.div variants={fadeUp} className="mt-6 max-w-xl">
          <p className="text-text-secondary">
            Software engineer in Berlin. I built an automation suite that saved a
            company €74K/year, letting two part-time administrators do the work of four. Now I ship AI-native
            software for clients, picking up whatever stack the project needs
            and delivering on tight timelines.
          </p>
          <Link
            href="/about"
            className="mt-3 inline-block font-mono text-sm text-accent transition-colors hover:underline"
          >
            Full story &rarr;
          </Link>
        </m.div>
        <m.div variants={fadeUp} className="mt-8 flex flex-wrap gap-4">
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
        </m.div>
        <m.div
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
        </m.div>
      </m.section>

      {/* ── Work ── */}
      <section id="work" className="py-24">
        <SectionReveal>
          <SectionHeading number="01">Work</SectionHeading>
          <p className="mt-4 text-text-secondary">
            Selected projects, each one shipped to production with real users
            and measurable outcomes.
          </p>
          <Link
            href="/work"
            className="mt-3 inline-flex items-center gap-2 font-mono text-sm text-accent transition-colors hover:underline"
          >
            View all work &rarr;
          </Link>
        </SectionReveal>

        {/* Ongoing client work */}
        {ongoingWork.length > 0 && (
          <SectionReveal delay={0.1}>
            <div className="mt-10">
              <p className="font-mono text-xs uppercase tracking-widest text-text-muted">
                Currently
              </p>
              <div className="mt-3 grid gap-4 sm:grid-cols-2">
                {ongoingWork.map((project) => (
                  <MiniProjectCard
                    key={project.title}
                    title={project.title}
                    summary={project.summary}
                    href={project.href}
                    meta={project.since}
                  />
                ))}
              </div>
            </div>
          </SectionReveal>
        )}

        {/* Featured projects */}
        <div className="mt-12 space-y-6">
          {featuredWork.map((project, i) => (
            <SectionReveal key={project.title} delay={(i + 1) * 0.1}>
              <ProjectCard project={project} />
            </SectionReveal>
          ))}
        </div>

        {/* Fun projects */}
        {funWork.length > 0 && (
          <>
            <SectionReveal delay={0.1}>
              <div className="mt-16">
                <h3 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                  Open Source Projects
                </h3>
                <p className="mt-3 max-w-xl text-sm text-text-secondary">
                  Things I built because I wanted them to exist. No client, no
                  brief, every one of them shipped.
                </p>
              </div>
            </SectionReveal>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {funWork.map((project, i) => (
                <SectionReveal key={project.href} delay={(i + 1) * 0.1}>
                  <MiniProjectCard
                    title={project.title}
                    summary={project.summary}
                    tags={project.tags}
                    href={project.href}
                  />
                </SectionReveal>
              ))}
            </div>
          </>
        )}
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
          {blogPosts.map((post, i) => (
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
                    <TagPill key={tag}>{tag}</TagPill>
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
              className="inline-flex items-center gap-2 font-mono text-md text-accent transition-colors hover:underline"
            >
              Read all posts &rarr;
            </Link>
          </div>
        </SectionReveal>
      </section>

      {/* ── Schedule ── */}
      <section id="schedule" className="py-24">
        <SectionReveal>
          <SectionHeading number="03">Schedule</SectionHeading>
          <p className="mt-4 text-text-secondary">
            Want to scope a project, get a second opinion, or just say hello?
            Pick a time that works for you.
          </p>
        </SectionReveal>

        <SectionReveal delay={0.1}>
          <a
            href={process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL ?? "#contact"}
            target={process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL ? "_blank" : undefined}
            rel={process.env.NEXT_PUBLIC_GOOGLE_CALENDAR_URL ? "noopener noreferrer" : undefined}
            className="group mt-10 block rounded-lg border border-border bg-bg-surface p-6 shadow-card transition-colors hover:border-accent/40"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-mono text-xs text-accent">
                  Google Calendar
                </p>
                <p className="mt-2 font-medium text-text-primary transition-colors group-hover:text-accent">
                  Book a 30-minute chat
                </p>
                <p className="mt-1 text-sm text-text-secondary">
                  I keep a few slots open on weekday mornings and afternoons
                  (CET). Half an hour, no pitch.
                </p>
              </div>
              <span className="shrink-0 px-5 py-2.5 font-mono text-sm text-accent">
                View available times &rarr;
              </span>
            </div>
          </a>
        </SectionReveal>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-24">
        <SectionReveal>
          <SectionHeading number="04">Contact</SectionHeading>
          <p className="mt-6 max-w-xl text-text-secondary">
            I stay busy with client work and keep capacity open for the next
            good project. If you have something you think I&apos;d be a good fit
            for, tell me about it. My inbox is open.
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
          <p className="text-xs text-text-muted">
            Design inspired by{" "}
            <a
              href="https://v4.brittanychiang.com"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-accent"
            >
              Brittany Chiang&apos;s v4
            </a>
            .
          </p>
        </div>
      </footer>
    </>
  )
}

function ProjectCard({
  project,
}: {
  project: FeaturedWork
}) {
  const shouldReduceMotion = useReducedMotion()

  return (
    <m.a
      href={project.href}
      className="group relative block rounded-lg border border-border bg-bg-surface p-6 shadow-card transition-colors hover:border-accent/40"
      whileHover={shouldReduceMotion ? {} : { y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <span className="absolute top-4 right-4 text-2xl text-text-muted transition-all duration-300 group-hover:text-accent group-hover:-translate-y-0.5 group-hover:translate-x-0.5">
        ↗
      </span>
      <div>
        <p className="mb-2 font-mono text-xs text-accent">Featured</p>
        <h3 className="text-xl font-medium text-text-primary transition-colors group-hover:text-accent">
          {project.title}
        </h3>
        <p className="mt-2 text-sm text-text-secondary">{project.summary}</p>
      </div>

      {project.stats.length > 0 && (
        <div className="mt-3 flex flex-wrap items-baseline gap-x-5 gap-y-1.5 font-mono text-xs text-text-muted">
          {project.stats.slice(0, 3).map((stat) => (
            <span key={stat.label} className="flex items-baseline gap-1.5">
              <span className="font-semibold tabular-nums text-accent">
                {stat.value}
              </span>
              <span>{stat.label.toLowerCase()}</span>
            </span>
          ))}
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {project.tags.map((tag) => (
          <TagPill key={tag}>{tag}</TagPill>
        ))}
      </div>
    </m.a>
  )
}

function MiniProjectCard({
  title,
  summary,
  href,
  meta,
  tags,
}: {
  title: string
  summary: string
  href: string
  meta?: string
  tags?: readonly string[]
}) {
  return (
    <Link
      href={href}
      className="group flex h-full flex-col rounded-lg border border-border bg-bg-surface p-5 shadow-card transition-colors hover:border-accent/40"
    >
      <div className="flex items-baseline justify-between gap-3">
        <p className="font-medium text-text-primary transition-colors group-hover:text-accent">
          {title}
          <span className="ml-1.5 inline-block text-xl text-text-muted transition-all duration-300 group-hover:text-accent group-hover:translate-x-0.5">
            &rarr;
          </span>
        </p>
        {meta && (
          <span className="shrink-0 font-mono text-[10px] text-text-muted">
            {meta}
          </span>
        )}
      </div>
      <p className="mt-2 text-sm leading-relaxed text-text-secondary">
        {summary}
      </p>
      {tags && tags.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-2 pt-4">
          {tags.map((tag) => (
            <TagPill key={tag}>{tag}</TagPill>
          ))}
        </div>
      )}
    </Link>
  )
}

