import Link from "next/link"

export default function NotFound() {
  return (
    <section className="flex min-h-[60vh] flex-col items-start justify-center">
      <p className="font-mono text-sm text-accent">404</p>
      <h1 className="mt-2 font-display text-3xl font-bold">Page not found</h1>
      <p className="mt-4 text-text-secondary">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <Link
        href="/"
        className="mt-8 font-mono text-sm text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
      >
        &larr; Back home
      </Link>
    </section>
  )
}
