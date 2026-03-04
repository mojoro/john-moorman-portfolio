export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-bg text-text-primary">
      <h1 className="font-display text-5xl font-bold">John Moorman</h1>
      <p className="font-body text-lg text-text-secondary">
        Software Engineer &middot; Berlin
      </p>
      <code className="font-mono text-sm text-accent">
        Building things that work.
      </code>
    </main>
  )
}
