"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { createContent } from "@/lib/admin/actions"
import { useToast } from "@/components/admin/toast"

export function NewPostForm() {
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<"blog" | "work">("blog")
  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()
  const { show } = useToast()

  const autoSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError("")

    const finalSlug = slug || autoSlug
    const result = await createContent({ type, slug: finalSlug, title })
    setSubmitting(false)

    if (result.success) {
      show("Post created")
      setOpen(false)
      setTitle("")
      setSlug("")
      router.push(`/admin/content/${type}/${finalSlug}`)
    } else {
      setError(result.error ?? "Failed to create post.")
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="rounded border border-accent px-4 py-2 font-mono text-sm text-accent transition-colors hover:bg-accent/10"
      >
        + New post
      </button>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-lg border border-border bg-bg-surface p-5 space-y-4"
    >
      <div className="flex items-center justify-between">
        <p className="font-display text-base font-semibold text-text-primary">
          New post
        </p>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="font-mono text-xs text-text-muted hover:text-text-primary"
        >
          Cancel
        </button>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => setType("blog")}
          className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
            type === "blog" ? "bg-accent/10 text-accent" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Blog
        </button>
        <button
          type="button"
          onClick={() => setType("work")}
          className={`rounded-md px-3 py-1.5 font-mono text-xs transition-colors ${
            type === "work" ? "bg-accent/10 text-accent" : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Work
        </button>
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-xs text-text-muted">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
          placeholder="My New Post"
          className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block font-mono text-xs text-text-muted">
          Slug (auto-generated from title if empty)
        </label>
        <input
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={autoSlug || "my-new-post"}
          className="w-full rounded-lg border border-border bg-bg px-4 py-2.5 font-mono text-sm text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={submitting || !title}
        className="rounded border border-accent px-6 py-2.5 font-mono text-sm text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
      >
        {submitting ? "Creating..." : "Create"}
      </button>
    </form>
  )
}
