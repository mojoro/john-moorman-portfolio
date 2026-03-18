"use client"

import { useRef, useState } from "react"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { addComment } from "@/lib/actions/comments"

declare global {
  interface Window {
    turnstile?: { reset: () => void }
  }
}

type Status = "idle" | "submitting" | "success" | "error"

export function CommentForm({
  postSlug,
  turnstileSiteKey,
}: {
  postSlug: string
  turnstileSiteKey: string
}) {
  const formRef = useRef<HTMLFormElement>(null)
  const router = useRouter()
  const [status, setStatus] = useState<Status>("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (status === "submitting") return

    setStatus("submitting")
    setErrorMessage("")

    const formData = new FormData(formRef.current!)
    const result = await addComment(postSlug, formData)

    if (result.success) {
      setStatus("success")
      formRef.current?.reset()
      window.turnstile?.reset()
      router.refresh()
      setTimeout(() => setStatus("idle"), 3000)
    } else {
      setStatus("error")
      setErrorMessage(result.error ?? "Something went wrong.")
    }
  }

  return (
    <>
      <Script
        src="https://challenges.cloudflare.com/turnstile/v0/api.js"
        strategy="lazyOnload"
      />
      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label
            htmlFor="comment-author"
            className="mb-1.5 block font-mono text-xs text-text-muted"
          >
            Name (optional)
          </label>
          <input
            id="comment-author"
            name="author"
            type="text"
            placeholder="Anonymous"
            maxLength={50}
            className="w-full rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        <div>
          <label
            htmlFor="comment-body"
            className="mb-1.5 block font-mono text-xs text-text-muted"
          >
            Comment
          </label>
          <textarea
            id="comment-body"
            name="body"
            required
            rows={4}
            maxLength={1000}
            placeholder="Leave a comment..."
            className="w-full resize-none rounded-lg border border-border bg-bg-surface px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          />
        </div>

        <div
          className="cf-turnstile"
          data-sitekey={turnstileSiteKey}
          data-theme="auto"
        />

        {status === "error" && (
          <p className="text-sm text-red-400">{errorMessage}</p>
        )}

        {status === "success" && (
          <p className="text-sm text-accent">Comment posted.</p>
        )}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="rounded border border-accent px-6 py-2.5 font-mono text-sm text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
        >
          {status === "submitting" ? "Posting..." : "Post comment"}
        </button>
      </form>
    </>
  )
}
