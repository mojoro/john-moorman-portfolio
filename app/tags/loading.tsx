export default function TagIndexLoading() {
  return (
    <section className="py-20">
      <div className="h-9 w-24 animate-pulse rounded bg-bg-elevated" />
      <div className="mt-4 h-5 w-80 animate-pulse rounded bg-bg-elevated" />

      <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border p-4 space-y-2"
          >
            <div className="h-5 w-28 animate-pulse rounded bg-bg-elevated" />
            <div className="h-3 w-20 animate-pulse rounded bg-bg-elevated" />
          </div>
        ))}
      </div>

      <div className="mt-14 flex flex-wrap gap-2">
        {Array.from({ length: 18 }, (_, i) => (
          <div
            key={i}
            className="h-5 w-20 animate-pulse rounded-full bg-bg-elevated"
          />
        ))}
      </div>
    </section>
  )
}
