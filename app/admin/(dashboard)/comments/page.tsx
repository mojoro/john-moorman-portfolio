import { getAllComments } from "@/lib/db"
import { CommentRow } from "@/components/admin/comment-row"

export default async function CommentsPage() {
  const comments = await getAllComments()

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-text-primary">
        Comments{" "}
        <span className="font-mono text-base font-normal text-text-muted">
          ({comments.length})
        </span>
      </h1>

      {comments.length === 0 ? (
        <p className="font-mono text-sm text-text-muted">No comments yet.</p>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <CommentRow key={comment.id} comment={comment} />
          ))}
        </div>
      )}
    </div>
  )
}
