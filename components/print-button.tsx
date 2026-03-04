"use client"

export function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="rounded border border-border px-4 py-2 font-mono text-xs text-text-muted transition-colors hover:border-accent hover:text-accent print:hidden"
    >
      Print / Save PDF
    </button>
  )
}
