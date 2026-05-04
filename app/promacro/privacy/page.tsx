import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Promacro Privacy Policy | John Moorman",
  description:
    "What data Promacro collects, how it is used, and how to delete it.",
  alternates: {
    canonical: "https://johnmoorman.com/promacro/privacy/",
  },
}

const EFFECTIVE_DATE = "4 May 2026"

const subprocessors: {
  service: string
  href: string
  purpose: string
  data: string
}[] = [
  {
    service: "Supabase",
    href: "https://supabase.com/privacy",
    purpose: "Database, authentication, password hashing",
    data: "Email, hashed password, profile data, meals, preferences",
  },
  {
    service: "Vercel",
    href: "https://vercel.com/legal/privacy-policy",
    purpose: "API hosting",
    data: "Authenticated API requests; standard server logs",
  },
  {
    service: "OpenRouter",
    href: "https://openrouter.ai/privacy",
    purpose: "Routes AI requests to Anthropic",
    data: "Natural-language text submitted for meal parsing or daily suggestions",
  },
  {
    service: "Anthropic (via OpenRouter)",
    href: "https://www.anthropic.com/legal/privacy",
    purpose: "Runs the Claude Haiku 4.5 model that identifies foods",
    data: "Same as OpenRouter",
  },
  {
    service: "Upstash",
    href: "https://upstash.com/trust/privacy.pdf",
    purpose: "Rate-limit cache",
    data: "Account ID and a counter, briefly",
  },
  {
    service: "Sentry",
    href: "https://sentry.io/privacy/",
    purpose: "Crash and error monitoring",
    data: "Crash reports (no meal content, no password)",
  },
  {
    service: "Apple",
    href: "https://www.apple.com/legal/privacy/en-ww/",
    purpose: "Sign in with Apple (only if you choose this option)",
    data: "Whatever Apple shares with us — typically email and optional display name",
  },
  {
    service: "USDA FoodData Central",
    href: "https://fdc.nal.usda.gov/",
    purpose: "Public food nutrition database",
    data: "Food names only — no account or profile data",
  },
  {
    service: "Open Food Facts",
    href: "https://world.openfoodfacts.org/terms-of-use",
    purpose: "Public food nutrition database",
    data: "Food names only — no account or profile data",
  },
]

export default function PromacroPrivacyPage() {
  return (
    <section className="py-20">
      <Link
        href="/"
        className="font-mono text-xs text-text-muted transition-colors hover:text-accent"
      >
        &larr; Home
      </Link>

      <h1 className="mt-8 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Promacro Privacy Policy
      </h1>

      <p className="mt-3 font-mono text-xs text-text-muted">
        Effective: {EFFECTIVE_DATE}
      </p>

      <div className="mt-10 max-w-[680px] space-y-5 text-text-secondary leading-relaxed">
        <p>
          Promacro (&quot;the app&quot;) is a macro-tracking app built by John
          Moorman (&quot;we&quot;, &quot;us&quot;). This policy explains what
          data we collect, why, and how to delete it.
        </p>
        <p>
          If anything here is unclear, email{" "}
          <a
            href="mailto:john@johnmoorman.com"
            className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
          >
            john@johnmoorman.com
          </a>
          .
        </p>
      </div>

      <div className="mt-12 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">What we collect</h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          When you sign up and use the app, we collect:
        </p>
        <ul className="mt-4 space-y-3 text-text-secondary leading-relaxed">
          <li>
            <span className="font-medium text-text-primary">
              Account data
            </span>{" "}
            — your email address and a hashed password, or your Apple ID (if you
            sign in with Apple).
          </li>
          <li>
            <span className="font-medium text-text-primary">
              Profile data
            </span>{" "}
            — your sex, age, height, weight, and activity level. We use these to
            compute your daily calorie, protein, and fiber targets using the
            Mifflin-St Jeor equation. We do not share this data, sell it, or use
            it for advertising.
          </li>
          <li>
            <span className="font-medium text-text-primary">
              Display name
            </span>{" "}
            — if you sign in with Apple and grant us your name, we store it on
            your profile so the app can greet you. You can edit or clear it in
            Settings.
          </li>
          <li>
            <span className="font-medium text-text-primary">Meal data</span> —
            the foods you log, including: food name, brand (if any), quantity,
            unit, computed macronutrients, and the date and time you logged the
            meal. Photos are not collected.
          </li>
          <li>
            <span className="font-medium text-text-primary">
              AI parse text
            </span>{" "}
            — when you use the natural-language meal entry feature
            (&quot;I had two eggs and toast&quot;), the text you type is sent to
            our AI parsing service (see Third Parties) so it can identify the
            foods you mentioned. The AI is instructed not to retain or train on
            this text. We do not store the original text after parsing — only
            the structured food list it produces.
          </li>
          <li>
            <span className="font-medium text-text-primary">
              Preferences
            </span>{" "}
            — which nutrients you want to track, your ring assignments, your
            unit system (metric or imperial), and your theme choice (light,
            dark, or system). Stored on your profile.
          </li>
          <li>
            <span className="font-medium text-text-primary">
              Crash and error reports
            </span>{" "}
            — if the app crashes or hits an unexpected error, we collect a stack
            trace and a small amount of context (which screen, which action) to
            help us fix bugs. These reports do not include the contents of your
            meals or your password. They may include your account ID.
          </li>
        </ul>
      </div>

      <div className="mt-12 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">How we use it</h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          We use this data only to operate the app: authenticate you, compute
          your targets, save and display your meals, suggest meal options that
          close gaps in your day, and fix crashes. We do not sell your data,
          share it for advertising, or use it to train AI models.
        </p>
      </div>

      <div className="mt-12 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">
          Third parties (sub-processors)
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          The app cannot run without these services. Each one receives only the
          minimum data needed to do its job.
        </p>

        <div className="mt-6 -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0">
          <table className="w-full min-w-[560px] text-left text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="py-3 pr-4 font-mono text-xs font-medium text-text-muted">
                  Service
                </th>
                <th className="py-3 pr-4 font-mono text-xs font-medium text-text-muted">
                  What it does
                </th>
                <th className="py-3 font-mono text-xs font-medium text-text-muted">
                  What it sees
                </th>
              </tr>
            </thead>
            <tbody>
              {subprocessors.map((row) => (
                <tr
                  key={row.service}
                  className="border-b border-white/[0.04] align-top"
                >
                  <td className="py-3 pr-4">
                    <a
                      href={row.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
                    >
                      {row.service}
                    </a>
                  </td>
                  <td className="py-3 pr-4 text-text-secondary">
                    {row.purpose}
                  </td>
                  <td className="py-3 text-text-secondary">{row.data}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-6 text-text-secondary leading-relaxed">
          If you sign in with Apple, Apple will also receive standard sign-in
          information governed by their privacy policy.
        </p>
      </div>

      <div className="mt-12 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">
          How long we keep it
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          We keep your data while your account exists. When you delete your
          account (see below), we delete it.
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          Standard infrastructure backups at Supabase and Vercel may briefly
          retain copies according to their respective retention windows.
        </p>
      </div>

      <div className="mt-12 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">
          Deleting your account
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          You can delete your account and all associated data inside the app:{" "}
          <span className="font-medium text-text-primary">
            Settings &rarr; Delete account
          </span>
          . This action is permanent and cannot be undone.
        </p>
        <p className="mt-4 text-text-secondary leading-relaxed">
          If you cannot reach the in-app deletion flow for any reason, email{" "}
          <a
            href="mailto:john@johnmoorman.com"
            className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
          >
            john@johnmoorman.com
          </a>{" "}
          with the email address on your account and we will delete it
          manually.
        </p>
      </div>

      <div className="mt-12 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">Children</h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          Promacro is not intended for anyone under 18. We do not knowingly
          collect data from minors.
        </p>
      </div>

      <div className="mt-12 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">Your rights</h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          Depending on where you live, you may have the right to access,
          correct, or delete the personal data we hold about you, or to object
          to our processing of it. The in-app deletion flow above satisfies a
          deletion request. For anything else, email{" "}
          <a
            href="mailto:john@johnmoorman.com"
            className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
          >
            john@johnmoorman.com
          </a>
          .
        </p>
      </div>

      <div className="mt-12 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">
          Changes to this policy
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          If we change this policy in a way that affects how we handle your
          data, we will update the effective date at the top and notify you in
          the app on next launch.
        </p>
      </div>

      <div className="mt-12 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">Contact</h2>
        <div className="mt-4 space-y-2 text-text-secondary leading-relaxed">
          <p>
            <span className="font-mono text-xs text-text-muted">Email:</span>{" "}
            <a
              href="mailto:john@johnmoorman.com"
              className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
            >
              john@johnmoorman.com
            </a>
          </p>
          <p>
            <span className="font-mono text-xs text-text-muted">
              Developer:
            </span>{" "}
            John Moorman
          </p>
        </div>
      </div>
    </section>
  )
}
