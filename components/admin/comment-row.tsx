"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { deleteCommentAction } from "@/lib/admin/actions"
import { useToast } from "@/components/admin/toast"
import type { Comment } from "@/lib/db"

export function CommentRow({ comment }: { comment: Comment }) {
  const [confirming, setConfirming] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
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

    const result = await deleteCommentAction(comment.id)
    if (result.success) {
      show("Comment deleted.", "success")
    } else {
      show(result.error ?? "Failed to delete comment.", "error")
      setDeleting(false)
      setConfirming(false)
    }
  }, [confirming, comment.id, show])

  return (
    <div className="rounded-lg border border-border bg-bg-surface p-4">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <Link
              href={`/blog/${comment.post_slug}`}
              className="font-mono text-xs text-accent transition-colors hover:text-accent/80"
            >
              {comment.post_slug}
            </Link>
            <span className="font-mono text-xs text-text-secondary">
              {comment.author}
            </span>
            <span className="font-mono text-xs text-text-muted">
              {new Date(comment.created_at).toLocaleDateString()}
            </span>
          </div>
          <p className="mt-2 text-sm text-text-secondary">
            {comment.body.length > 100
              ? comment.body.slice(0, 100) + "..."
              : comment.body}
          </p>
        </div>

        <button
          onClick={handleDelete}
          disabled={deleting}
          className={`shrink-0 font-mono text-xs transition-colors ${
            confirming
              ? "text-red-400"
              : "text-text-muted hover:text-red-400"
          } disabled:opacity-50`}
        >
          {deleting ? "Deleting..." : confirming ? "Confirm?" : "Delete"}
        </button>
      </div>
    </div>
  )
}
