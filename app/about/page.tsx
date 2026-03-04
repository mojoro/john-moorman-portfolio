import Image from "next/image"
import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "About | John Moorman",
  description:
    "From opera to engineering — how a background in performance became a career in software.",
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
            I came to software through an unusual door.
          </p>
          <p>
            I spent five years training as an operatic performer at Boston
            Conservatory at Berklee — sight-reading scores, memorising roles in
            three languages, performing under pressure in front of live
            audiences. It was rigorous, technical work that most people
            don&apos;t associate with engineering. But the skills transferred
            more directly than I expected.
          </p>
          <p>
            When I started building automation tools at Berlin Opera Academy in
            2023, I approached the work the same way I&apos;d approached a new
            role: understand the system completely before touching it, then
            execute with precision.
          </p>
        </div>
      </div>

      {/* Rest of the story */}
      <div className="mt-12 max-w-[680px] space-y-5 text-text-secondary leading-relaxed">
        <p>
          I taught myself Google Apps Script from scratch, mapped the full
          student lifecycle workflow, and built a suite of tools that replaced
          two full-time administrative positions. The €74,000 in annual savings
          was a side effect of doing the job properly.
        </p>

        <p>
          That project convinced me that engineering was where I wanted to spend
          my career. Not because I stopped caring about craft — but because
          software is where I found the same combination of analytical rigour
          and creative problem-solving that drew me to music in the first place.
        </p>

        <p>
          Since then I&apos;ve built production systems for clients across
          Berlin: a real estate intelligence pipeline using n8n, Apify, and the
          Anthropic API; a full-stack SPA for a fintech startup built to
          pixel-perfect Figma specs; web infrastructure for a wellness retreat.
          I work AI-natively — Claude Code and Cursor are core to how I
          develop, not shortcuts but force multipliers.
        </p>

        <p>
          I&apos;m currently based in Berlin, open to the right mid-level
          fullstack role, and actively building in public.
        </p>
      </div>

      {/* Skills snapshot */}
      <div className="mt-16 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">What I work with</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {[
            {
              label: "Primary stack",
              items: "TypeScript, Next.js 15, React 19, Tailwind CSS",
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
