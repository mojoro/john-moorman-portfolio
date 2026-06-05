"use client"

import { useTransition } from "react"
import { addTimesheetEntryAction } from "@/lib/admin/actions"
import { useToast } from "@/components/admin/toast"
import type { Client } from "@/lib/invoicing/types"

export function AddTimesheetEntryForm({ clients }: { clients: Client[] }) {
  const [isPending, startTransition] = useTransition()
  const { show } = useToast()

  return (
    <form
      className="grid gap-3 rounded-lg bg-bg-surface p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5),0_1px_0_rgba(10,25,47,0.04)] md:grid-cols-[140px_140px_160px_1fr_220px_auto]"
      action={(formData) => {
        startTransition(async () => {
          const result = await addTimesheetEntryAction(formData)
          show(result.success ? "Entry added." : result.error ?? "Failed to add entry.", result.success ? "success" : "error")
        })
      }}
    >
      <input name="workDate" type="date" required aria-label="Start date" className="rounded bg-bg px-3 py-2 font-mono text-sm text-text-primary" />
      <input name="workEndDate" type="date" aria-label="End date for range" title="Optional end date for a date range" className="rounded bg-bg px-3 py-2 font-mono text-sm text-text-primary" />
      <input
        name="hours"
        type="text"
        required
        placeholder="Hours or hh:mm:ss"
        aria-label="Hours, decimal or hh:mm:ss"
        className="rounded bg-bg px-3 py-2 font-mono text-sm text-text-primary"
      />
      <input name="task" required placeholder="Task" className="rounded bg-bg px-3 py-2 text-sm text-text-primary" />
      <select name="clientId" required className="rounded bg-bg px-3 py-2 text-sm text-text-primary">
        {clients.map((client) => (
          <option key={client.id} value={client.id}>
            {client.name}
          </option>
        ))}
      </select>
      <button disabled={isPending || clients.length === 0} className="rounded-md bg-accent px-4 py-2 font-mono text-xs font-semibold text-bg disabled:opacity-40">
        {isPending ? "Adding…" : "Add"}
      </button>
    </form>
  )
}
