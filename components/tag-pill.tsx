export function TagPill({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-border px-2.5 py-0.5 font-mono text-[11px] text-text-muted transition-colors hover:border-accent/30 hover:bg-accent/10 hover:text-accent">
      {children}
    </span>
  )
}
