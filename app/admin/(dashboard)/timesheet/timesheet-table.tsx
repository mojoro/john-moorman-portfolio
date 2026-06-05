"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { generateInvoiceAction } from "@/lib/admin/actions"
import { useToast } from "@/components/admin/toast"
import type { Client, TimesheetEntry } from "@/lib/invoicing/types"

type Props = {
  entries: TimesheetEntry[]
  clients: Client[]
}

export function TimesheetTable({ entries, clients }: Props) {
  const [selectedIds, setSelectedIds] = useState<Set<number>>(() => new Set())
  const [clientFilter, setClientFilter] = useState("all")
  const [showInvoiced, setShowInvoiced] = useState(false)
  const [isPending, startTransition] = useTransition()
  const { show } = useToast()
  const router = useRouter()

  const visibleEntries = useMemo(() => {
    return entries.filter((entry) => {
      if (!showInvoiced && entry.invoice_id !== null) return false
      if (clientFilter !== "all" && entry.client_id !== Number(clientFilter)) return false
      return true
    })
  }, [clientFilter, entries, showInvoiced])

  useEffect(() => {
    const visibleIds = new Set(visibleEntries.map((entry) => entry.id))
    setSelectedIds((current) => {
      const next = new Set([...current].filter((id) => visibleIds.has(id)))
      return next.size === current.size ? current : next
    })
  }, [visibleEntries])

  const selectableVisibleEntries = useMemo(() => {
    return visibleEntries.filter((entry) => entry.invoice_id === null)
  }, [visibleEntries])

  const selectedCount = selectedIds.size
  const selectedEntries = useMemo(() => {
    return visibleEntries.filter((entry) => selectedIds.has(entry.id))
  }, [selectedIds, visibleEntries])
  const selectedClientCount = new Set(selectedEntries.map((entry) => entry.client_id)).size
  const hasMixedClientSelection = selectedClientCount > 1
  const selectableCount = selectableVisibleEntries.length
  const allVisibleSelected = selectableCount > 0 && selectableVisibleEntries.every((entry) => selectedIds.has(entry.id))

  const selectAllVisible = () => {
    setSelectedIds(new Set(selectableVisibleEntries.map((entry) => entry.id)))
  }

  const clearSelection = () => {
    setSelectedIds(new Set())
  }

  const toggleAllVisible = () => {
    if (allVisibleSelected) clearSelection()
    else selectAllVisible()
  }

  const toggle = (entry: TimesheetEntry) => {
    if (entry.invoice_id !== null) return
    setSelectedIds((current) => {
      const next = new Set(current)
      if (next.has(entry.id)) next.delete(entry.id)
      else next.add(entry.id)
      return next
    })
  }

  const generate = () => {
    const formData = new FormData()
    for (const id of selectedIds) formData.append("entryId", String(id))

    startTransition(async () => {
      const result = await generateInvoiceAction(formData)
      if (!result.success) {
        show(result.error ?? "Failed to generate invoice.", "error")
        return
      }
      show("Invoice generated.", "success")
      setSelectedIds(new Set())
      if (result.redirectTo) router.push(result.redirectTo)
      else router.refresh()
    })
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-bg-surface p-4 shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5),0_1px_0_rgba(10,25,47,0.04)]">
        <div className="flex flex-wrap items-center gap-3">
          <label className="font-mono text-xs text-text-muted">
            Client{" "}
            <select
              value={clientFilter}
              onChange={(event) => setClientFilter(event.target.value)}
              className="ml-2 rounded bg-bg px-2 py-1 text-text-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5),0_1px_0_rgba(10,25,47,0.04)]"
            >
              <option value="all">All</option>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.name}
                </option>
              ))}
            </select>
          </label>

          <label className="flex items-center gap-2 font-mono text-xs text-text-muted">
            <input
              type="checkbox"
              checked={showInvoiced}
              onChange={(event) => setShowInvoiced(event.target.checked)}
            />
            Show invoiced
          </label>

          <button
            type="button"
            onClick={selectAllVisible}
            disabled={selectableCount === 0 || allVisibleSelected}
            className="rounded bg-bg px-3 py-1 font-mono text-xs text-text-primary shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5),0_1px_0_rgba(10,25,47,0.04)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            Select visible ({selectableCount})
          </button>

          <button
            type="button"
            onClick={clearSelection}
            disabled={selectedCount === 0}
            className="rounded bg-bg px-3 py-1 font-mono text-xs text-text-muted shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5),0_1px_0_rgba(10,25,47,0.04)] transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
          >
            Clear
          </button>
        </div>

        <button
          type="button"
          onClick={generate}
          disabled={selectedCount === 0 || hasMixedClientSelection || isPending}
          className="rounded-md bg-accent px-4 py-2 font-mono text-xs font-semibold text-bg transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? "Generating…" : `Generate invoice (${selectedCount})`}
        </button>
      </div>

      {hasMixedClientSelection ? (
        <p className="font-mono text-xs text-text-muted">
          Invoices can only use one client at a time. Filter to one client, then select visible entries.
        </p>
      ) : null}

      <div className="overflow-hidden rounded-lg bg-bg-surface shadow-[inset_0_0_0_1px_rgba(255,255,255,0.5),0_1px_0_rgba(10,25,47,0.04)]">
        <table className="w-full text-left text-sm">
          <thead className="bg-bg-elevated/40 font-mono text-xs text-text-muted">
            <tr>
              <th className="w-10 px-4 py-3">
                <input
                  type="checkbox"
                  aria-label={allVisibleSelected ? "Clear visible selection" : "Select all visible uninvoiced entries"}
                  checked={allVisibleSelected}
                  disabled={selectableCount === 0}
                  onChange={toggleAllVisible}
                />
              </th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3 text-right">Hours</th>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Invoice</th>
            </tr>
          </thead>
          <tbody>
            {visibleEntries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center font-mono text-xs text-text-muted">
                  No entries match this view.
                </td>
              </tr>
            ) : (
              visibleEntries.map((entry, index) => {
                const previous = visibleEntries[index - 1]
                const startsDay = !previous || previous.work_date !== entry.work_date
                const dateLabel = entry.work_end_date && entry.work_end_date !== entry.work_date ? `${entry.work_date} - ${entry.work_end_date}` : entry.work_date
                return (
                  <tr
                    key={entry.id}
                    className={`${startsDay ? "shadow-[inset_0_1px_0_rgba(255,255,255,0.5)]" : ""} transition-colors hover:bg-bg-elevated/25`}
                  >
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(entry.id)}
                        disabled={entry.invoice_id !== null}
                        onChange={() => toggle(entry)}
                      />
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-text-secondary">{dateLabel}</td>
                    <td className="px-4 py-3 text-right font-mono text-xs text-text-primary">{entry.hours.toFixed(2)}</td>
                    <td className="px-4 py-3 text-text-secondary">{entry.task}</td>
                    <td className="px-4 py-3 text-text-secondary">{entry.client_name}</td>
                    <td className="px-4 py-3 font-mono text-xs">
                      {entry.invoice_id && entry.invoice_no ? (
                        <Link href={`/admin/invoices#invoice-${entry.invoice_id}`} className="text-accent hover:text-accent/80">
                          {entry.invoice_no}
                        </Link>
                      ) : (
                        <span className="text-text-muted">—</span>
                      )}
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
