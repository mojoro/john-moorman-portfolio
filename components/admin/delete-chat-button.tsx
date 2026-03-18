"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { deleteChatAction } from "@/lib/admin/actions"
import { useToast } from "@/components/admin/toast"

export function DeleteChatButton({ chatId }: { chatId: string }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const router = useRouter()
  const { show } = useToast()

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [])

  const handleDelete = useCallback(async () => {
    if (!confirming) {
      setConfirming(true)
      timerRef.current = setTimeout(() => setConfirming(false), 3000)
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)
    setDeleting(true)

    const result = await deleteChatAction(chatId)
    if (result.success) {
      show("Chat session deleted.", "success")
      router.push("/admin/chats")
    } else {
      show(result.error ?? "Failed to delete chat session.", "error")
      setDeleting(false)
      setConfirming(false)
    }
  }, [confirming, chatId, show, router])

  return (
    <button
      onClick={handleDelete}
      disabled={deleting}
      className={`shrink-0 font-mono text-xs transition-colors ${
        confirming
          ? "text-red-400"
          : "text-text-muted hover:text-red-400"
      } disabled:opacity-50`}
    >
      {deleting ? "Deleting..." : confirming ? "Confirm delete?" : "Delete session"}
    </button>
  )
}
