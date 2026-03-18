import { getComments } from "@/lib/db"

export async function CommentList({ postSlug }: { postSlug: string }) {
  const comments = await getComments(postSlug)

  if (comments.length === 0) {
    return (
      <p className="text-sm text-text-muted">
        No comments yet. Be the first to share your thoughts.
      </p>
    )
  }

  return (
    <div className="space-y-6">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="rounded-lg border border-border bg-bg-surface p-4"
        >
          <div className="flex items-center gap-2">
            <span className="font-mono text-xs font-medium text-text-primary">
              {comment.author}
            </span>
            <span className="font-mono text-xs text-text-muted">
              {new Date(comment.created_at).toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>
          <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-text-secondary">
            {comment.body}
          </p>
        </div>
      ))}
    </div>
  )
}
