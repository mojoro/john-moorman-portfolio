"use client"

import Link from "next/link"

interface ChatPreviewProps {
  chat: {
    id: string
    message_count: number
    updated_at: string
    city: string | null
    country: string | null
    first_message: string | null
  }
}

export function ChatPreview({ chat }: ChatPreviewProps) {
  const location = [chat.city, chat.country].filter(Boolean).join(", ")
  const preview = chat.first_message
    ? chat.first_message.length > 120
      ? chat.first_message.slice(0, 120) + "..."
      : chat.first_message
    : "No messages"

  return (
    <Link
      href={`/admin/chats/${chat.id}`}
      className="group block rounded-lg border border-border bg-bg-surface p-4 transition-colors hover:border-accent/40"
    >
      <p className="text-sm text-text-primary line-clamp-2 transition-colors group-hover:text-accent">
        {preview}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
        <span className="font-mono text-xs text-text-muted">
          {chat.message_count} msg{chat.message_count !== 1 ? "s" : ""}
        </span>
        {location && (
          <>
            <span className="text-border">·</span>
            <span className="font-mono text-xs text-text-secondary">
              {location}
            </span>
          </>
        )}
        <span className="text-border">·</span>
        <span className="font-mono text-xs text-text-muted">
          {new Date(chat.updated_at).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>
    </Link>
  )
}
