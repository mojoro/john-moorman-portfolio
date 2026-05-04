import Link from "next/link"
import type { Metadata } from "next"

export const metadata: Metadata = {
  title: "Delete your Promacro account | John Moorman",
  description:
    "How to request deletion of your Promacro account and all associated data.",
  alternates: {
    canonical: "https://johnmoorman.com/promacro/delete/",
  },
}

const EFFECTIVE_DATE = "4 May 2026"

export default function PromacroDeletePage() {
  return (
    <section className="py-20">
      <Link
        href="/"
        className="font-mono text-xs text-text-muted transition-colors hover:text-accent"
      >
        &larr; Home
      </Link>

      <h1 className="mt-8 font-display text-3xl font-bold tracking-tight sm:text-4xl">
        Delete your Promacro account
      </h1>

      <p className="mt-3 font-mono text-xs text-text-muted">
        Effective: {EFFECTIVE_DATE}
      </p>

      <div className="mt-10 max-w-[680px] space-y-5 text-text-secondary leading-relaxed">
        <p>
          Promacro is a macro-tracking app built by John Moorman. This page
          explains how to delete your account and what happens to your data
          when you do.
        </p>
      </div>

      <div className="mt-12 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">
          Delete from inside the app (recommended)
        </h2>
        <ol className="mt-4 space-y-3 text-text-secondary leading-relaxed list-decimal pl-6">
          <li>Open Promacro and sign in.</li>
          <li>
            Go to the{" "}
            <span className="font-medium text-text-primary">Settings</span> tab.
          </li>
          <li>
            Scroll to the{" "}
            <span className="font-medium text-text-primary">Danger zone</span>{" "}
            section.
          </li>
          <li>
            Tap{" "}
            <span className="font-medium text-text-primary">
              Delete account
            </span>
            .
          </li>
          <li>
            Type{" "}
            <span className="font-mono text-text-primary">DELETE</span> to
            confirm and tap{" "}
            <span className="font-medium text-text-primary">
              Delete my account
            </span>
            .
          </li>
        </ol>
        <p className="mt-4 text-text-secondary leading-relaxed">
          The deletion runs immediately and is permanent. There is no undo.
        </p>
      </div>

      <div className="mt-12 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">
          Delete by email (if you cannot reach the app)
        </h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          Email{" "}
          <a
            href="mailto:john@johnmoorman.com?subject=Promacro%20account%20deletion%20request"
            className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
          >
            john@johnmoorman.com
          </a>{" "}
          from the address associated with your account. Use the subject line{" "}
          <span className="font-mono text-text-primary">
            Promacro account deletion request
          </span>
          . We will delete the account within 7 days and reply to confirm.
        </p>
      </div>

      <div className="mt-12 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">
          What gets deleted
        </h2>
        <ul className="mt-4 space-y-3 text-text-secondary leading-relaxed">
          <li>
            <span className="font-medium text-text-primary">
              Account credentials
            </span>{" "}
            — your email address, hashed password, and any linked Apple sign-in
            identifier.
          </li>
          <li>
            <span className="font-medium text-text-primary">Profile data</span>{" "}
            — sex, age, height, weight, activity level, display name.
          </li>
          <li>
            <span className="font-medium text-text-primary">Meal history</span>{" "}
            — every meal entry you have logged, including foods, quantities,
            and computed macros.
          </li>
          <li>
            <span className="font-medium text-text-primary">Preferences</span>{" "}
            — tracked nutrients, ring assignments, units, theme.
          </li>
          <li>
            <span className="font-medium text-text-primary">
              Daily suggestions
            </span>{" "}
            — any cached AI suggestions tied to your account.
          </li>
        </ul>
      </div>

      <div className="mt-12 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">What is retained</h2>
        <ul className="mt-4 space-y-3 text-text-secondary leading-relaxed">
          <li>
            <span className="font-medium text-text-primary">
              Anonymized crash reports
            </span>{" "}
            — Sentry stack traces collected before deletion are kept for up to
            90 days for engineering diagnostics. They do not contain meals,
            passwords, biometrics, or your email — only an internal account ID
            that becomes orphaned once the account is deleted.
          </li>
          <li>
            <span className="font-medium text-text-primary">
              Infrastructure backups
            </span>{" "}
            — Supabase and Vercel keep automated backups of their respective
            databases and request logs. These age out per their retention
            policies (typically 7–30 days). After the backup window passes, no
            copy of your data remains.
          </li>
        </ul>
      </div>

      <div className="mt-12 max-w-[680px]">
        <h2 className="font-display text-xl font-semibold">Questions</h2>
        <p className="mt-4 text-text-secondary leading-relaxed">
          See the{" "}
          <Link
            href="/promacro/privacy/"
            className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
          >
            Promacro privacy policy
          </Link>{" "}
          for the full picture, or email{" "}
          <a
            href="mailto:john@johnmoorman.com"
            className="text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
          >
            john@johnmoorman.com
          </a>
          .
        </p>
      </div>
    </section>
  )
}
