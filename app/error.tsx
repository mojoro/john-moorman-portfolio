"use client"

export default function Error({
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <section className="flex min-h-[60vh] flex-col items-start justify-center">
      <p className="font-mono text-sm text-red-400">Error</p>
      <h1 className="mt-2 font-display text-3xl font-bold">
        Something went wrong
      </h1>
      <p className="mt-4 text-text-secondary">
        An unexpected error occurred. Please try again.
      </p>
      <button
        onClick={reset}
        className="mt-8 font-mono text-sm text-accent underline decoration-accent/30 underline-offset-2 transition-colors hover:decoration-accent"
      >
        Try again
      </button>
    </section>
  )
}
