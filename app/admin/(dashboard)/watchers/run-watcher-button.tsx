"use client"

import { useTransition } from "react"
import { useToast } from "@/components/admin/toast"
import { runWatcherAction } from "@/lib/admin/actions"

/**
 * Manual trigger for testing. Goes through the server action rather than the
 * cron route so it reuses the admin session and never needs CRON_SECRET.
 */
export function RunWatcherButton({ watcherId }: { watcherId: string }) {
  const [isPending, startTransition] = useTransition()
  const { show } = useToast()

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        startTransition(async () => {
          const result = await runWatcherAction(watcherId)
          if (!result.success) {
            show(result.error ?? "Watcher run failed.", "error")
          } else if (result.warning) {
            show(result.warning, "error")
          } else {
            show("Watcher run finished.", "success")
          }
        })
      }}
      className="shrink-0 rounded-md border border-border px-3 py-1.5 font-mono text-xs text-text-secondary transition-colors hover:border-accent/40 hover:text-accent disabled:opacity-40"
    >
      {isPending ? "Running…" : "Run now"}
    </button>
  )
}
