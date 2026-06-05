"use client"

import { useRef, useTransition } from "react"
import { importTimesheetCsvAction } from "@/lib/admin/actions"
import { useToast } from "@/components/admin/toast"
import type { Client } from "@/lib/invoicing/types"

export function ImportTimesheetCsvForm({ clients }: { clients: Client[] }) {
  const [isPending, startTransition] = useTransition()
  const formRef = useRef<HTMLFormElement>(null)
  const { show } = useToast()

  return (
    <form
      ref={formRef}
      className="space-y-4 rounded-lg bg-bg-surface p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5),0_1px_0_rgba(10,25,47,0.04)]"
      action={(formData) => {
        startTransition(async () => {
          const result = await importTimesheetCsvAction(formData)
          if (!result.success) {
            show(result.error ?? "Failed to import CSV.", "error")
            return
          }
          const skippedText = result.skippedCount ? ` Skipped ${result.skippedCount} already-invoiced rows.` : ""
          show(`Imported ${result.importedCount ?? 0} timesheet entries.${skippedText}`, "success")
          formRef.current?.reset()
        })
      }}
    >
      <div>
        <h2 className="font-display text-lg font-semibold text-text-primary">Import CSV</h2>
        <p className="mt-1 text-sm text-text-secondary">
          Upload or paste a CSV with headers for date, optional end date, hours, and task. Hours can be decimal or hh:mm:ss. Accepted date formats: YYYY-MM-DD, DD.MM.YYYY, or MM/DD/YYYY.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-[220px_1fr_auto]">
        <select name="clientId" required className="rounded bg-bg px-3 py-2 text-sm text-text-primary">
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
        <input
          name="csvFile"
          type="file"
          accept=".csv,text/csv"
          className="rounded bg-bg px-3 py-2 font-mono text-sm text-text-primary file:mr-3 file:rounded-md file:border-0 file:bg-bg-elevated file:px-3 file:py-1 file:font-mono file:text-xs file:text-text-primary"
        />
        <button disabled={isPending || clients.length === 0} className="rounded-md bg-accent px-4 py-2 font-mono text-xs font-semibold text-bg disabled:opacity-40">
          {isPending ? "Importing…" : "Import"}
        </button>
      </div>

      <textarea
        name="csvText"
        rows={5}
        placeholder={"date,hours,task\n2026-05-13,1.5,Email follow-up"}
        className="w-full rounded bg-bg px-3 py-2 font-mono text-sm text-text-primary placeholder:text-text-muted"
      />

      <p className="font-mono text-xs text-text-muted">
        The selected admin client is used for billing. CSV Client is treated as project/context only. Invoiced? TRUE rows are skipped.
      </p>
    </form>
  )
}
