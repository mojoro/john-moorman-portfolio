import { getAllChats } from "@/lib/db"
import { ChatPreview } from "@/components/admin/chat-preview"

export default async function ChatsPage() {
  const chats = await getAllChats()

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-text-primary">
        Chat Sessions{" "}
        <span className="font-mono text-base font-normal text-text-muted">
          ({chats.length})
        </span>
      </h1>

      {chats.length === 0 ? (
        <p className="font-mono text-sm text-text-muted">No chat sessions yet.</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {chats.map((chat) => (
            <ChatPreview key={chat.id} chat={chat} />
          ))}
        </div>
      )}
    </div>
  )
}
