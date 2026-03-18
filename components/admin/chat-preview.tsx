"use client"

import Link from "next/link"

interface ChatPreviewProps {
  chat: {
    id: string
    ip_hash: string
    message_count: number
    updated_at: string
  }
}

export function ChatPreview({ chat }: ChatPreviewProps) {
  return (
    <Link
      href={`/admin/chats/${chat.id}`}
      className="block rounded-lg border border-border bg-bg-surface p-4 transition-colors hover:border-accent/40"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-medium text-text-primary">
          {chat.id.slice(0, 8)}...
        </span>
        <span className="font-mono text-xs text-text-muted">
          {new Date(chat.updated_at).toLocaleDateString()}
        </span>
      </div>
      <div className="mt-2 flex items-center gap-3">
        <span className="font-mono text-xs text-text-secondary">
          {chat.message_count} message{chat.message_count !== 1 ? "s" : ""}
        </span>
        <span className="font-mono text-xs text-text-muted">
          IP: {chat.ip_hash.slice(0, 8)}...
        </span>
      </div>
    </Link>
  )
}
