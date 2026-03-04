"use client"

import { motion, useReducedMotion } from "framer-motion"
import { SectionReveal } from "@/components/section-reveal"

const SKILLS = [
  {
    category: "Primary",
    items: ["TypeScript", "JavaScript (ES6+)", "Next.js 15", "React 19", "Tailwind CSS"],
  },
  {
    category: "Also Proficient",
    items: ["Vue.js", "Nuxt", "Node.js", "Python", "PHP", "Bash"],
  },
  {
    category: "Backend & DB",
    items: ["REST APIs", "Firebase", "MongoDB", "PostgreSQL"],
  },
  {
    category: "DevOps",
    items: ["Docker", "CI/CD (GitHub Actions)", "Vercel", "Linux/UNIX"],
  },
  {
    category: "AI & Automation",
    items: [
      "Anthropic API",
      "Claude Code",
      "Cursor",
      "n8n",
      "Apify",
      "Google Apps Script",
    ],
  },
] as const

const PROJECTS = [
  {
    title: "BOA Automation Suite",
    summary:
      "Complete administrative automation for Berlin Opera Academy — replaced manual workflows across the entire student lifecycle.",
    stats: [
      { label: "Annual savings", value: "€74K" },
      { label: "Payment collection", value: "+20%" },
    ],
    tags: ["Google Apps Script", "PayPal API", "Gmail API"],
    href: "/work/boa-automation",
    featured: true,
  },
  {
    title: "Real Estate AI Pipeline",
    summary:
      "Automated property intelligence pipeline — scrapes, structures, and AI-analyzes listings for daily investment recommendations.",
    stats: [{ label: "Daily automated reports", value: "1" }],
    tags: ["n8n", "Apify", "Anthropic API", "Airtable"],
    href: "/work/real-estate-pipeline",
    featured: true,
  },
  {
    title: "finalflow",
    summary:
      "Full marketing site SPA built to pixel-perfect Figma specs. Waitlist signup, account creation, Firebase auth.",
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

const EXPERIENCE = [
  {
    role: "Freelance Software Engineer",
    company: "Self-employed",
    period: "2025 — Present",
    location: "Berlin",
    highlights: [
      "Full-stack development across multiple client engagements with end-to-end ownership",
      "Built an AI-powered real estate data pipeline using n8n, Apify, and the Anthropic API",
      "CI/CD pipelines via GitHub Actions + Docker — reduced deployment times 30%",
      "1,000+ monthly active users across deployed applications",
    ],
  },
  {
    role: "Software Engineer",
    company: "Berlin Opera Academy",
    period: "2023 — 2025",
    location: "Berlin",
    highlights: [
      "Identified and automated the entire administrative function — student lifecycle, payments, communications",
      "Built complete automation suite from scratch: offer letters, payment tracking, PayPal reconciliation, automated emails",
      "Reduced admin team from 4 staff to 2 part-time — €74K annual savings",
      "Built production website: 95/100 Lighthouse score, top-3 organic rankings, 8% organic traffic growth",
    ],
  },
] as const

const BLOG_POSTS = [
  {
    title: "From Scraper to Inbox: Building an AI-Powered Real Estate Sourcing Tool",
    date: "2026-02-28",
    description:
      "How I built an automated property intelligence pipeline using Apify, n8n, Airtable, and the Anthropic API.",
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
          className="mt-5 font-display text-4xl font-extrabold leading-tight sm:text-5xl"
        >
          John Moorman.
        </motion.h1>
        <motion.h2
          variants={fadeUp}
          className="font-display text-[clamp(1.5rem,4vw,3rem)] font-bold leading-tight text-text-secondary"
        >
          I build things that work — and automate the rest.
        </motion.h2>
        <motion.p
          variants={fadeUp}
          className="mt-6 max-w-xl text-text-secondary"
        >
          Software engineer in Berlin. I saved a company €74K/year by automating
          their entire admin function, and I build AI-native tools that ship to
          production. Currently freelancing and looking for the right team.
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
        <motion.div
          variants={fadeUp}
          className="mt-6 flex flex-wrap items-center gap-5 text-text-muted"
        >
          <a
            href="mailto:john@johnmoorman.com"
            className="font-mono text-sm transition-colors hover:text-accent"
          >
            john@johnmoorman.com
          </a>
          <span className="text-border" aria-hidden="true">|</span>
          <a
            href="https://linkedin.com/in/john-moorman"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm transition-colors hover:text-accent"
          >
            LinkedIn
          </a>
          <span className="text-border" aria-hidden="true">|</span>
          <a
            href="https://github.com/mojoro"
            target="_blank"
            rel="noopener noreferrer"
            className="font-mono text-sm transition-colors hover:text-accent"
          >
            GitHub
          </a>
        </motion.div>
      </motion.section>

      {/* ── About ── */}
      <section id="about" className="py-24">
        <SectionReveal>
          <SectionHeading number="01">About</SectionHeading>
        </SectionReveal>

        <SectionReveal delay={0.1}>
          <div className="mt-8 max-w-2xl space-y-4 text-text-secondary">
            <p>
              I came to software through an unusual door — five years training as
              an operatic performer at Boston Conservatory at Berklee. When I
              started building automation tools at Berlin Opera Academy in 2023, I
              approached the work the same way I&apos;d approached a new role:
              understand the system completely, then execute with precision.
            </p>
            <p>
              I taught myself Google Apps Script from scratch, mapped the full
              student lifecycle workflow, and built tools that replaced two
              full-time administrative positions. That project convinced me
              engineering was where I wanted to build my career.
            </p>
            <p>
              Today I work AI-natively — Claude Code and Cursor are core to how I
              develop. I care about business impact, not just technical elegance.
            </p>
          </div>
        </SectionReveal>

        <SectionReveal delay={0.2}>
          <div className="mt-12">
            <h3 className="mb-6 font-mono text-sm text-accent">
              Technologies I work with
            </h3>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {SKILLS.map((group) => (
                <div key={group.category}>
                  <h4 className="mb-3 text-sm font-medium text-text-primary">
                    {group.category}
                  </h4>
                  <ul className="space-y-1.5">
                    {group.items.map((skill) => (
                      <li
                        key={skill}
                        className="flex items-center gap-2 font-mono text-sm text-text-secondary"
                      >
                        <span className="text-accent">&#9656;</span>
                        {skill}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </SectionReveal>
      </section>

      {/* ── Work ── */}
      <section id="work" className="py-24">
        <SectionReveal>
          <SectionHeading number="02">Work</SectionHeading>
          <p className="mt-4 text-text-secondary">
            Selected projects — each one shipped to production with real users
            and measurable outcomes.
          </p>
        </SectionReveal>

        <div className="mt-10 space-y-6">
          {PROJECTS.map((project, i) => (
            <SectionReveal key={project.title} delay={i * 0.1}>
              <ProjectCard project={project} />
            </SectionReveal>
          ))}
        </div>

        <SectionReveal delay={0.4}>
          <div className="mt-10">
            <a
              href="/work"
              className="inline-flex items-center gap-2 font-mono text-sm text-accent transition-colors hover:underline"
            >
              View all projects &rarr;
            </a>
          </div>
        </SectionReveal>
      </section>

      {/* ── Experience ── */}
      <section id="experience" className="py-24">
        <SectionReveal>
          <SectionHeading number="03">Experience</SectionHeading>
        </SectionReveal>

        <div className="mt-10 space-y-12">
          {EXPERIENCE.map((job, i) => (
            <SectionReveal key={job.company} delay={i * 0.1}>
              <div>
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                  <h3 className="text-lg font-medium text-text-primary">
                    {job.role}{" "}
                    <span className="text-accent">@ {job.company}</span>
                  </h3>
                  <span className="font-mono text-sm text-text-muted">
                    {job.period}
                  </span>
                </div>
                <p className="mt-1 font-mono text-xs text-text-muted">
                  {job.location}
                </p>
                <ul className="mt-4 space-y-2">
                  {job.highlights.map((item) => (
                    <li
                      key={item}
                      className="flex gap-2 text-sm text-text-secondary"
                    >
                      <span className="mt-0.5 shrink-0 text-accent">
                        &#9656;
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </SectionReveal>
          ))}
        </div>
      </section>

      {/* ── Blog ── */}
      <section id="blog" className="py-24">
        <SectionReveal>
          <SectionHeading number="04">Blog</SectionHeading>
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
            <a
              href="/blog"
              className="inline-flex items-center gap-2 font-mono text-sm text-accent transition-colors hover:underline"
            >
              Read all posts &rarr;
            </a>
          </div>
        </SectionReveal>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-24">
        <SectionReveal>
          <SectionHeading number="05">Contact</SectionHeading>
          <p className="mt-6 max-w-xl text-text-secondary">
            I&apos;m currently looking for mid-level fullstack or frontend roles
            at Berlin startups. Whether you have a specific role in mind or just
            want to connect, my inbox is open.
          </p>
          <a
            href="mailto:john@johnmoorman.com"
            className="mt-8 inline-flex items-center gap-2 rounded border border-accent px-8 py-4 font-mono text-sm text-accent transition-colors hover:bg-accent/10"
          >
            Say hello
          </a>
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
      className="group block rounded-lg border border-border bg-bg-surface p-6 transition-colors hover:border-accent/40"
      whileHover={shouldReduceMotion ? {} : { y: -4 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
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
            className="rounded-full bg-accent/10 px-3 py-1 font-mono text-xs text-accent"
          >
            {tag}
          </span>
        ))}
      </div>
    </motion.a>
  )
}
