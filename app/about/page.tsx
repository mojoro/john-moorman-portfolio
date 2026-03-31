import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About | John Moorman",
  description:
    "From opera to engineering: how a background in performance became a career in software.",
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

      <h1 className="mt-8 font-display text-3xl font-bold tracking-tight sm:text-4xl">
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
            graduating in 2022 with a Bachelor of Music (GPA 3.84). Five years
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
          retreat in PHP. Every engagement has brought a new stack to learn, and
          I&apos;ve delivered in each one.
        </p>

        <p>
          I work AI-natively: Claude Code and Cursor are core to how I develop,
          not shortcuts but force multipliers. I&apos;m currently running a
          &quot;10 projects in 10 weeks&quot; challenge to push my shipping pace
          and build a public portfolio of work.
        </p>

        <p>
          Outside of engineering I still sing (though opera has been replaced by
          the occasional karaoke bar). I speak English natively and German at
          B2. I&apos;m open to the right mid-level fullstack or frontend role
          at a Berlin startup.
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
            className="group rounded-lg border border-white/[0.06] bg-bg-surface p-5 transition-colors hover:border-accent/20 hover:bg-bg-elevated"
          >
            <p className="font-mono text-xs text-accent">Shortlist</p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              AI job search tool that scrapes listings from major ATS platforms,
              scores them against your profile, and tailors your resume on
              demand. 16k lines of TypeScript, built in seven days.
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
            href="/work/drop-oss"
            className="group rounded-lg border border-white/[0.06] bg-bg-surface p-5 transition-colors hover:border-accent/20 hover:bg-bg-elevated"
          >
            <p className="font-mono text-xs text-accent">Drop</p>
            <p className="mt-2 text-sm leading-relaxed text-text-secondary">
              Open-source podcast generator. Paste a URL, get a scripted audio
              episode with voice cloning and multi-host dialogue. Next.js
              frontend, Python FastAPI sidecar, Docker Compose.
            </p>
            <p className="mt-3 flex flex-wrap gap-1.5">
              {["Next.js", "Python", "FastAPI", "Docker", "Ollama"].map(
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
          I&apos;m looking for mid-level fullstack or frontend roles at Berlin
          or remote companies. If that sounds like your team, I want
          to hear from you.
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
