export default function TagArchiveLoading() {
  return (
    <section className="py-20">
      <div className="h-4 w-20 animate-pulse rounded bg-bg-elevated" />
      <div className="mt-8 h-9 w-56 animate-pulse rounded bg-bg-elevated" />
      <div className="mt-4 h-5 w-64 animate-pulse rounded bg-bg-elevated" />

      <div className="mt-14 space-y-10">
        {[1, 2, 3].map((i) => (
          <div key={i} className="space-y-3">
            <div className="h-3 w-32 animate-pulse rounded bg-bg-elevated" />
            <div className="h-6 w-80 animate-pulse rounded bg-bg-elevated" />
            <div className="h-4 w-full max-w-xl animate-pulse rounded bg-bg-elevated" />
            <div className="flex gap-2">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="h-5 w-16 animate-pulse rounded-full bg-bg-elevated"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
