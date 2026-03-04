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

      <section id="blog" className="min-h-screen py-24">
        <h2 className="font-display text-3xl font-semibold">
          <span className="mr-2 font-mono text-lg text-accent">03.</span>
          Blog
        </h2>
        <p className="mt-6 text-text-secondary">Blog section placeholder.</p>
      </section>

      <section id="contact" className="py-24">
        <h2 className="font-display text-3xl font-semibold">
          <span className="mr-2 font-mono text-lg text-accent">04.</span>
          Contact
        </h2>
        <p className="mt-6 text-text-secondary">
          Contact section placeholder.
        </p>
      </section>
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
