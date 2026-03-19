export function StatCard({ label, value, detail }: { label: string; value: string | number; detail?: string }) {
  return (
    <div className="rounded-lg border border-border bg-bg-surface p-5">
      <p className="font-mono text-xs text-text-muted">{label}</p>
      <p className="mt-1 font-display text-2xl font-bold text-text-primary">{value}</p>
      {detail && <p className="mt-1 font-mono text-xs text-text-muted">{detail}</p>}
    </div>
  )
}
