import Link from "next/link"
import { PrintButton } from "@/components/print-button"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Resume | John Moorman",
  description:
    "John Moorman | Software Engineer based in Berlin. Next.js, TypeScript, AI-native development.",
}

const EXPERIENCE = [
  {
    role: "Freelance Software Engineer",
    company: "Self-employed",
    period: "2025 – Present",
    location: "Berlin, Germany",
    highlights: [
      "Full-stack development across multiple client engagements with end-to-end ownership",
      "Built an AI-powered real estate data pipeline using n8n, Apify, and Gemini: automated daily investment recommendations for a Berlin-based client",
      "Rebuilt frontend, implemented analytics, and migrated data pipelines for Serenity Retreat; built custom PHP calendar sync plugin",
      "Built finalflow's marketing site as a pixel-perfect SPA: Vue, TypeScript, Tailwind, Firebase Authentication",
      "CI/CD pipelines via GitHub Actions + Docker, reducing deployment times 30% across projects",
      "1,000+ monthly active users across deployed applications",
    ],
  },
  {
    role: "Software Engineer",
    company: "Berlin Opera Academy",
    period: "2023 – 2025",
    location: "Berlin, Germany",
    highlights: [
      "Identified that the administrative function consumed 4 full salaries for entirely rule-based work. Built an automation suite to replace it",
      "Automated the complete student lifecycle: offer letters, payment tracking, PayPal reconciliation, confirmation/reminder/cancellation emails",
      "Enabled two part-time administrators to do the work of four, approximately €74,000 in annual overhead savings",
      "Payment reconciliation system with automated follow-ups achieved an 18% increase in payment collection rate",
      "Built the production website from scratch: 95/100 Lighthouse score, top-3 organic rankings on key terms, 8% organic traffic growth",
    ],
  },
]

const SKILLS = [
  { label: "Primary", value: "TypeScript, JavaScript (ES6+), Next.js 15, React 19, Tailwind CSS" },
  { label: "Also proficient", value: "Vue.js, Nuxt, Node.js, Python, PHP, Bash" },
  { label: "Backend & DB", value: "REST APIs, Firebase, MongoDB, PostgreSQL, Neon" },
  { label: "DevOps", value: "Docker, CI/CD (GitHub Actions), Vercel, Linux/UNIX" },
  { label: "AI & Automation", value: "Anthropic API, Claude Code, Cursor, n8n, Apify, Google Apps Script" },
]

const EDUCATION = [
  {
    institution: "Boston Conservatory at Berklee",
    degree: "Bachelor of Music, Voice Performance",
    period: "2017 – 2022",
    detail: "GPA 3.84",
  },
]

export default function ResumePage() {
  return (
    <div className="py-20 print:pt-4">
      <Link
        href="/"
        className="font-mono text-xs text-text-muted transition-colors hover:text-accent print:hidden"
      >
        &larr; Home
      </Link>

      {/* Print button */}
      <div className="mt-4 flex items-center justify-between print:hidden">
        <h1 className="font-display text-2xl font-bold">Resume</h1>
        <PrintButton />
      </div>

      {/* Resume content */}
      <div className="mt-10 max-w-[720px] space-y-12 print:mt-0">

        {/* Header */}
        <header>
          <h2 className="font-display text-3xl font-bold tracking-tight print:text-2xl">
            John Moorman
          </h2>
          <p className="mt-1 text-lg text-text-secondary">Software Engineer</p>
          <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 font-mono text-sm text-text-muted">
            <span>Berlin, Germany</span>
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
              github.com/mojoro
            </a>
            <a
              href="https://linkedin.com/in/john-moorman"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-accent"
            >
              linkedin.com/in/john-moorman
            </a>
          </div>
        </header>

        {/* Experience */}
        <section>
          <h3 className="border-b border-border pb-2 font-display text-sm font-semibold uppercase tracking-widest text-accent">
            Experience
          </h3>
          <div className="mt-6 space-y-10">
            {EXPERIENCE.map((job) => (
              <div key={job.company}>
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                  <p className="font-medium text-text-primary">
                    {job.role}{" "}
                    <span className="text-accent">· {job.company}</span>
                  </p>
                  <span className="font-mono text-sm text-text-muted">
                    {job.period}
                  </span>
                </div>
                <p className="mt-0.5 font-mono text-xs text-text-muted">
                  {job.location}
                </p>
                <ul className="mt-3 space-y-1.5">
                  {job.highlights.map((item) => (
                    <li key={item} className="flex gap-2 text-sm text-text-secondary">
                      <span className="mt-0 shrink-0 text-accent">&#9656;</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Skills */}
        <section>
          <h3 className="border-b border-border pb-2 font-display text-sm font-semibold uppercase tracking-widest text-accent">
            Skills
          </h3>
          <div className="mt-6 space-y-3">
            {SKILLS.map(({ label, value }) => (
              <div key={label} className="flex gap-4 text-sm">
                <span className="w-36 shrink-0 font-mono text-text-muted">
                  {label}
                </span>
                <span className="text-text-secondary">{value}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Education */}
        <section>
          <h3 className="border-b border-border pb-2 font-display text-sm font-semibold uppercase tracking-widest text-accent">
            Education
          </h3>
          <div className="mt-6 space-y-4">
            {EDUCATION.map((ed) => (
              <div key={ed.institution}>
                <div className="flex flex-col justify-between gap-1 sm:flex-row sm:items-baseline">
                  <p className="font-medium text-text-primary">{ed.institution}</p>
                  <span className="font-mono text-sm text-text-muted">{ed.period}</span>
                </div>
                <p className="mt-0.5 text-sm text-text-secondary">
                  {ed.degree} · {ed.detail}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Languages */}
        <section>
          <h3 className="border-b border-border pb-2 font-display text-sm font-semibold uppercase tracking-widest text-accent">
            Languages
          </h3>
          <div className="mt-6 flex gap-8 text-sm">
            <div>
              <p className="font-medium text-text-primary">English</p>
              <p className="text-text-muted">C2 (Native)</p>
            </div>
            <div>
              <p className="font-medium text-text-primary">German</p>
              <p className="text-text-muted">B2</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
