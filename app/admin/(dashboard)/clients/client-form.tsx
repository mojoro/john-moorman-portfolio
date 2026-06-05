"use client"

import { useTransition } from "react"
import { saveClientAction } from "@/lib/admin/actions"
import { useToast } from "@/components/admin/toast"
import type { Client } from "@/lib/invoicing/types"

export function ClientForm({ client }: { client?: Client }) {
  const [isPending, startTransition] = useTransition()
  const { show } = useToast()

  return (
    <form
      className="space-y-3 rounded-lg bg-bg-surface p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5),0_1px_0_rgba(10,25,47,0.04)]"
      action={(formData) => {
        startTransition(async () => {
          const result = await saveClientAction(formData)
          show(result.success ? "Client saved." : result.error ?? "Failed to save client.", result.success ? "success" : "error")
        })
      }}
    >
      {client ? <input type="hidden" name="id" value={client.id} /> : null}
      <div className="grid gap-3 md:grid-cols-[1fr_140px_140px]">
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-mono text-xs text-text-muted">Name</span>
          <input name="name" required defaultValue={client?.name} className="w-full rounded bg-bg px-3 py-2 text-text-primary" />
        </label>
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-mono text-xs text-text-muted">Prefix</span>
          <input name="invoicePrefix" required defaultValue={client?.invoice_prefix ?? "SPACIFIK"} className="w-full rounded bg-bg px-3 py-2 font-mono text-text-primary" />
        </label>
        <label className="space-y-1 text-sm text-text-secondary">
          <span className="font-mono text-xs text-text-muted">€/hour</span>
          <input name="hourlyRateEur" type="number" step="0.01" min="0.01" required defaultValue={client?.hourly_rate_eur ?? 40} className="w-full rounded bg-bg px-3 py-2 font-mono text-text-primary" />
        </label>
      </div>
      <label className="block space-y-1 text-sm text-text-secondary">
        <span className="font-mono text-xs text-text-muted">Bill to</span>
        <textarea name="billTo" required rows={4} defaultValue={client?.bill_to} className="w-full rounded bg-bg px-3 py-2 text-text-primary" />
      </label>
      <label className="block space-y-1 text-sm text-text-secondary">
        <span className="font-mono text-xs text-text-muted">USt-IdNr.</span>
        <input name="ustId" defaultValue={client?.ust_id ?? ""} className="w-full rounded bg-bg px-3 py-2 font-mono text-text-primary" />
      </label>
      <button disabled={isPending} className="rounded-md bg-accent px-4 py-2 font-mono text-xs font-semibold text-bg disabled:opacity-40">
        {isPending ? "Saving…" : client ? "Save client" : "Add client"}
      </button>
    </form>
  )
}
