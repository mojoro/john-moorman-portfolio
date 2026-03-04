export default function WorkLoading() {
  return (
    <section className="py-20">
      <div className="h-9 w-24 animate-pulse rounded bg-bg-surface" />
      <div className="mt-4 h-5 w-80 animate-pulse rounded bg-bg-surface" />

      <div className="mt-12 space-y-8">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="rounded-lg border border-border p-6 space-y-3"
          >
            <div className="h-6 w-64 animate-pulse rounded bg-bg-surface" />
            <div className="h-4 w-full max-w-lg animate-pulse rounded bg-bg-surface" />
            <div className="flex gap-2">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="h-5 w-16 animate-pulse rounded-full bg-bg-surface"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
