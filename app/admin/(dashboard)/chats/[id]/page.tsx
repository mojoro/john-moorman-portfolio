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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/chats"
            className="font-mono text-xs text-accent transition-colors hover:text-accent/80"
          >
            ← Back
          </Link>
          <h1 className="font-display text-2xl font-bold text-text-primary">
            Chat Session
          </h1>
        </div>
        <DeleteChatButton chatId={chat.id} />
      </div>

      {/* Metadata */}
      <div className="rounded-lg border border-border bg-bg-surface p-4">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
          <div>
            <dt className="font-mono text-xs text-text-muted">Session ID</dt>
            <dd className="mt-0.5 font-mono text-xs text-text-primary">
              {chat.id}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-xs text-text-muted">IP Hash</dt>
            <dd className="mt-0.5 font-mono text-xs text-text-primary">
              {chat.ip_hash}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-xs text-text-muted">Messages</dt>
            <dd className="mt-0.5 font-mono text-xs text-text-primary">
              {chat.message_count}
            </dd>
          </div>
          <div>
            <dt className="font-mono text-xs text-text-muted">Last Updated</dt>
            <dd className="mt-0.5 font-mono text-xs text-text-primary">
              {new Date(chat.updated_at).toLocaleString()}
            </dd>
          </div>
        </dl>
      </div>

      {/* Message thread */}
      <div className="space-y-3">
        {chat.messages.map((message, index) => (
          <div
            key={index}
            className={
              message.role === "user"
                ? "ml-8 rounded-lg bg-bg-elevated p-3"
                : "mr-8 rounded-lg border border-border bg-bg-surface p-3"
            }
          >
            <span className="mb-1 block font-mono text-xs text-text-muted">
              {message.role === "user" ? "User" : "Assistant"}
            </span>
            <p className="whitespace-pre-wrap text-sm text-text-secondary">
              {message.content}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
