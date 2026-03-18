import { notFound } from "next/navigation"
import Link from "next/link"
import { getChatSession } from "@/lib/db"
import { DeleteChatButton } from "@/components/admin/delete-chat-button"

export default async function ChatDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const chat = await getChatSession(id)

  if (!chat) notFound()

  const location = [chat.city, chat.country].filter(Boolean).join(", ")

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/chats"
            className="font-mono text-xs text-accent transition-colors hover:text-accent/80"
          >
            &larr; Back
          </Link>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Chat Session
          </h1>
        </div>
        <DeleteChatButton chatId={chat.id} />
      </div>

      {/* Metadata */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 font-mono text-xs text-text-muted">
        <span>{chat.message_count} messages</span>
        {location && (
          <>
            <span className="text-border">·</span>
            <span className="text-text-secondary">{location}</span>
          </>
        )}
        <span className="text-border">·</span>
        <span>
          {new Date(chat.updated_at).toLocaleString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
            hour: "numeric",
            minute: "2-digit",
          })}
        </span>
      </div>

      {/* Message thread */}
      <div className="space-y-4">
        {chat.messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === "user"
                ? "flex justify-end"
                : "flex justify-start"
            }
          >
            <div
              className={
                message.role === "user"
                  ? "max-w-[80%] rounded-2xl rounded-tr-sm border border-accent/20 bg-accent/5 px-4 py-3"
                  : "max-w-[80%] rounded-2xl rounded-tl-sm border border-border bg-bg-surface px-4 py-3"
              }
            >
              <span
                className={`mb-1.5 block font-mono text-[10px] uppercase tracking-wider ${
                  message.role === "user" ? "text-accent/60" : "text-text-muted"
                }`}
              >
                {message.role === "user" ? "Visitor" : "Ask John"}
              </span>
              <p
                className={`whitespace-pre-wrap text-sm leading-relaxed ${
                  message.role === "user" ? "text-text-primary" : "text-text-secondary"
                }`}
              >
                {message.content}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Collapsible metadata */}
      <details className="text-text-muted">
        <summary className="cursor-pointer font-mono text-xs hover:text-text-secondary">
          Technical details
        </summary>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-1 font-mono text-xs">
          <span>Session: {chat.id}</span>
          <span>IP hash: {chat.ip_hash}</span>
        </div>
      </details>
    </div>
  )
}
