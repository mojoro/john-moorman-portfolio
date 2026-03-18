import { getPosts } from "@/lib/content"
import { getCommentCount, getChatCount, getRecentComments, getRecentChats } from "@/lib/db"
import { StatCard } from "@/components/admin/stat-card"
import Link from "next/link"

export default async function AdminDashboardPage() {
  const [blogPosts, workProjects, commentCount, chatCount, recentComments, recentChats] =
    await Promise.all([
      getPosts("blog"),
      getPosts("work"),
      getCommentCount(),
      getChatCount(),
      getRecentComments(5),
      getRecentChats(5),
    ])

  return (
    <div className="space-y-8">
      <h1 className="font-display text-2xl font-bold text-text-primary">Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Blog Posts" value={blogPosts.length} />
        <StatCard label="Work Projects" value={workProjects.length} />
        <StatCard label="Comments" value={commentCount} />
        <StatCard label="Chat Sessions" value={chatCount} />
      </div>

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Comments */}
        <div className="rounded-lg border border-border bg-bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Recent Comments
            </h2>
            <Link
              href="/admin/comments"
              className="font-mono text-xs text-accent transition-colors hover:text-accent/80"
            >
              View all →
            </Link>
          </div>

          {recentComments.length === 0 ? (
            <p className="font-mono text-xs text-text-muted">No comments yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentComments.map((comment) => (
                <li key={comment.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-text-primary">
                      {comment.author}
                    </span>
                    <span className="font-mono text-xs text-text-muted">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 text-sm text-text-secondary">
                    {comment.body.length > 80
                      ? comment.body.slice(0, 80) + "..."
                      : comment.body}
                  </p>
                  <span className="mt-1 inline-block font-mono text-xs text-text-muted">
                    on {comment.post_slug}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Recent Chats */}
        <div className="rounded-lg border border-border bg-bg-surface p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-display text-lg font-semibold text-text-primary">
              Recent Chats
            </h2>
            <Link
              href="/admin/chats"
              className="font-mono text-xs text-accent transition-colors hover:text-accent/80"
            >
              View all →
            </Link>
          </div>

          {recentChats.length === 0 ? (
            <p className="font-mono text-xs text-text-muted">No chat sessions yet.</p>
          ) : (
            <ul className="space-y-3">
              {recentChats.map((chat) => (
                <li key={chat.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-medium text-text-primary">
                      {chat.id.slice(0, 8)}...
                    </span>
                    <span className="font-mono text-xs text-text-muted">
                      {new Date(chat.updated_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="mt-1 font-mono text-xs text-text-secondary">
                    {chat.message_count} message{chat.message_count !== 1 ? "s" : ""}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
