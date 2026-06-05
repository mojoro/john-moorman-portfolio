"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { deleteInvoiceAction } from "@/lib/admin/actions"
import { useToast } from "@/components/admin/toast"

export function DeleteInvoiceButton({ invoiceId }: { invoiceId: number }) {
  const [confirming, setConfirming] = useState(false)
  const [isPending, startTransition] = useTransition()
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const { show } = useToast()

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        if (!confirming) {
          setConfirming(true)
          timerRef.current = setTimeout(() => setConfirming(false), 3000)
          return
        }
        if (timerRef.current) clearTimeout(timerRef.current)
        startTransition(async () => {
          const result = await deleteInvoiceAction(invoiceId)
          show(result.success ? "Invoice deleted." : result.error ?? "Failed to delete invoice.", result.success ? "success" : "error")
        })
      }}
      className={`font-mono text-xs transition-colors disabled:opacity-40 ${confirming ? "text-red-400" : "text-text-muted hover:text-red-400"}`}
    >
      {isPending ? "Deleting…" : confirming ? "Confirm?" : "Delete"}
    </button>
  )
}
