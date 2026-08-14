import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

const TITLE = "About John Moorman"
const DESCRIPTION =
  "From operatic vocal performance at Boston Conservatory at Berklee to fullstack engineering in Berlin. The story of how stage discipline became shipping discipline, plus what I'm currently building."

export const metadata: Metadata = {
  title: "About",
  description: DESCRIPTION,
  alternates: { canonical: "/about" },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    url: "/about",
    type: "profile",
    images: [
      {
        url: `/og/?title=${encodeURIComponent("About John")}&subtitle=${encodeURIComponent("Opera to engineering · Berlin")}`,
        width: 1200,
        height: 630,
        alt: "About John Moorman",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    creator: "@John_Moorman",
    site: "@John_Moorman",
  },
}

export default function AboutPage() {
  return (
    <section className="py-20">
      <Link
        href="/"
        className="font-mono text-xs text-text-muted transition-colors hover:text-accent"
      >
        &larr; Home
      </Link>

      <h1 className="mt-8 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        About
      </h1>

      {/* Photo + intro */}
      <div className="mt-12 flex flex-col gap-10 md:flex-row md:items-start md:gap-16">
        <div className="shrink-0">
          <Image
            src="/images/spring-2025-professional-photo-resize.jpeg"
            alt="John Moorman"
            width={260}
            height={320}
            className="rounded-lg object-cover"
            priority
          />
        </div>

        <div className="max-w-[520px] space-y-5 text-text-secondary leading-relaxed">
          <p className="text-lg font-medium text-text-primary">
            Originally from the States, now based in Berlin.
          </p>
          <p>
            I studied vocal performance at Boston Conservatory at Berklee,
            graduating in 2022 with a Bachelor of Music. Five years
            of operatic training: sight-reading scores, memorizing roles in
            three languages, performing under pressure in front of live
            audiences. It was rigorous, technical work that taught me how to
            learn fast and execute precisely.
          </p>
          <p>
            After graduating I moved to Berlin. What started as a gap year
            turned into a career change when I discovered that the same
            analytical thinking and creative problem-solving that drew me to
            music was exactly what engineering required.
          </p>
        </div>
      </div>

      {/* Rest of the story */}
      <div className="mt-12 max-w-[680px] space-y-5 text-text-secondary leading-relaxed">
        <p>
          In 2023 I was working at Berlin Opera Academy in an operational role
          when I noticed that every student went through the same lifecycle:
          application, payment, confirmation, follow-up. Clear triggers, clear
          rules, clear outputs. I taught myself Google Apps Script from scratch
          and built an automation suite that replaced two full-time
          administrative positions, saving the company €74,000 per year. That
          project proved to me that I could deliver real business impact as an
          engineer.
        </p>

        <p>
          Since then I&apos;ve built production systems for clients across
          Berlin: a real estate intelligence pipeline using n8n, Apify, and
          Gemini; a marketing site for a music tech startup built to
          pixel-perfect Figma specs in Vue; web infrastructure for a wellness
          retreat in PHP. Every engagement has come with a different stack. What
          carries across them is the part that isn&apos;t the stack: reading an
          unfamiliar codebase until I can argue about its design rather than
          just close tickets in it, and being the one who checks a claim before
          it ships.
        </p>

        <p>
          Two of those engagements have been running since May 2026.{" "}
          <Link
            href="/work/showdeck"
            className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
          >
            Showdeck
          </Link>{" "}
          is a production management platform for live performance, where I work
          fullstack.{" "}
          <Link
            href="/work/hotel-agentur"
            className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
          >
            Hotel Agentur
          </Link>{" "}
          is a hotel marketing agency, where I handle technical SEO, Python
          content pipelines, and performance across a multi-site hotel
          portfolio. Both are client-owned codebases, so the details stay with
          the clients.
        </p>

        <p>
          I work AI-natively, which in practice means most of my day goes to
          reviewing generated code rather than typing it. That is the part
          I&apos;ve had to get good at, and it isn&apos;t speed: reading a diff
          line by line, running an adversarial pass whose only instruction is to
          refute the change, proving a test fails against the broken code before
          trusting that it passes against the fix. A clean agent review is
          signal, not proof.
        </p>

        <p>
          Generated code is confidently wrong in specific, repeatable ways: the
          green test that asserts nothing, the review that passes for the right
          answer and the wrong reason, the claim that something was unavoidable
          when three counter-examples sit a grep away. I keep a written record
          of the ones I hit so the same failure doesn&apos;t get through twice.
          Claude Code and Cursor are core to how I develop, not shortcuts but
          force multipliers, and the guardrails are what make it safe to be
          fast.
        </p>

        <p>
          In spring 2026 I ran a &quot;10 projects in 10 weeks&quot; challenge to
          push my shipping pace and put the range on the record. All ten
          shipped, and most of them are written up here.
        </p>

        <p>
          Outside of engineering I still sing (though opera has been replaced by
          the occasional karaoke bar). I speak English natively and German at
          B2. These days I keep a steady load of client work and room alongside
          it for the next good project.
        </p>
      </div>

      {/* Projects I'm proud of */}
      <div className="mt-16 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">
          Projects I&apos;m proud of
        </h2>
        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          <Link
            href="/work/shortlist"
            className="group rounded-lg border border-border bg-bg-surface p-5 shadow-card transition-colors hover:border-accent/20 hover:bg-bg-elevated"
          >
            <p className="font-mono text-xs text-accent">Shortlist</p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              AI job search tool that scrapes listings from major ATS platforms,
              scores them against your profile, and tailors your resume on
              demand. 16k lines of TypeScript.
            </p>
            <p className="mt-3 flex flex-wrap gap-1.5">
              {["Next.js", "Prisma", "Neon", "Anthropic API", "Clerk"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent"
                  >
                    {tag}
                  </span>
                )
              )}
            </p>
          </Link>

          <Link
            href="/work/young-artist-community"
            className="group rounded-lg border border-border bg-bg-surface p-5 shadow-card transition-colors hover:border-accent/20 hover:bg-bg-elevated"
          >
            <p className="font-mono text-xs text-accent">
              Young Artist Community
            </p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Community-maintained directory and review platform for Young
              Artist Programs in classical music and opera. Free, built for the
              world I came from, with an AI scraping pipeline keeping listings
              current.
            </p>
            <p className="mt-3 flex flex-wrap gap-1.5">
              {["Next.js", "TypeScript", "Prisma", "Neon", "AI"].map(
                (tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-accent/10 px-2 py-0.5 font-mono text-[10px] text-accent"
                  >
                    {tag}
                  </span>
                )
              )}
            </p>
          </Link>
        </div>
      </div>

      {/* Skills snapshot */}
      <div className="mt-16 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">What I work with</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            {
              label: "Primary stack",
              items: "TypeScript, Next.js, React, Tailwind CSS",
            },
            {
              label: "Also comfortable with",
              items: "Vue.js, Node.js, Python, PHP, Bash",
            },
            {
              label: "AI & automation",
              items: "Anthropic API, n8n, Apify, Google Apps Script",
            },
            {
              label: "Infrastructure",
              items: "Docker, GitHub Actions, Vercel, PostgreSQL",
            },
          ].map(({ label, items }) => (
            <div key={label}>
              <p className="font-mono text-xs text-accent">{label}</p>
              <p className="mt-1 text-sm text-text-secondary">{items}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Contact */}
      <div className="mt-16 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">Get in touch</h2>
        <p className="mt-3 text-sm text-text-secondary">
          I keep capacity open for new work alongside my current clients. Berlin
          or remote. Tell me what you&apos;re building.
        </p>
        <div className="mt-4 flex flex-wrap gap-4 font-mono text-sm">
          <a
            href="mailto:john@johnmoorman.com"
            className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
          >
            john@johnmoorman.com
          </a>
          <a
            href="https://linkedin.com/in/john-moorman"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
          >
            LinkedIn
          </a>
          <a
            href="https://github.com/mojoro"
            target="_blank"
            rel="noopener noreferrer"
            className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
          >
            GitHub
          </a>
        </div>
      </div>
    </section>
  )
}
