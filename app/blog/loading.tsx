export default function BlogLoading() {
  return (
    <section className="py-20">
      <div className="h-9 w-24 animate-pulse rounded bg-bg-surface" />
      <div className="mt-4 h-5 w-80 animate-pulse rounded bg-bg-surface" />

      <div className="mt-12 space-y-10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-3 w-32 animate-pulse rounded bg-bg-surface" />
            <div className="h-6 w-96 animate-pulse rounded bg-bg-surface" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded bg-bg-surface" />
          </div>
        ))}
      </div>
    </section>
  )
}
