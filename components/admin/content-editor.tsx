"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { FrontmatterForm } from "@/components/admin/frontmatter-form"
import { MdxEditor } from "@/components/admin/mdx-editor"
import { useToast } from "@/components/admin/toast"
import { saveContent } from "@/lib/admin/actions"

interface ContentEditorProps {
  slug: string
  type: "blog" | "work"
  initialFrontmatter: Record<string, unknown>
  initialContent: string
}

export function ContentEditor({
  slug,
  type,
  initialFrontmatter,
  initialContent,
}: ContentEditorProps) {
  const [frontmatter, setFrontmatter] =
    useState<Record<string, unknown>>(initialFrontmatter)
  const [content, setContent] = useState(initialContent)
  const [dirty, setDirty] = useState(false)
  const [saving, setSaving] = useState(false)
  const toast = useToast()

  // Track dirtiness by comparing against initial values
  const initialFmRef = useRef(JSON.stringify(initialFrontmatter))
  const initialContentRef = useRef(initialContent)

  useEffect(() => {
    const fmChanged = JSON.stringify(frontmatter) !== initialFmRef.current
    const contentChanged = content !== initialContentRef.current
    setDirty(fmChanged || contentChanged)
  }, [frontmatter, content])

  const handleSave = useCallback(async () => {
    if (saving) return
    setSaving(true)

    try {
      const result = await saveContent({
        type,
        slug,
        frontmatter,
        content,
      })

      if (result.success) {
        toast.show("Content saved.")
        initialFmRef.current = JSON.stringify(frontmatter)
        initialContentRef.current = content
        setDirty(false)
      } else {
        toast.show(result.error ?? "Save failed.", "error")
      }
    } catch {
      toast.show("An unexpected error occurred.", "error")
    } finally {
      setSaving(false)
    }
  }, [saving, type, slug, frontmatter, content, toast])

  // Cmd/Ctrl+S shortcut
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        handleSave()
      }
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [handleSave])

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link
          href="/admin/content"
          className="font-mono text-xs text-text-muted transition-colors hover:text-accent"
        >
          &larr; Back
        </Link>
        <a
          href={`/${type}/${slug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-xs text-text-muted transition-colors hover:text-accent"
        >
          View &rarr;
        </a>
      </div>

      {/* Title + save */}
      <div className="mt-3 mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-2xl font-semibold text-text-primary">
            {(frontmatter.title as string) || slug}
          </h1>
          {dirty && (
            <span className="rounded-full bg-orange-400/10 px-2.5 py-0.5 font-mono text-xs text-orange-400">
              Unsaved changes
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving || !dirty}
          className="rounded border border-accent px-6 py-2.5 font-mono text-sm text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save"}
        </button>
      </div>

      {/* Two-column layout */}
      <div className="grid gap-8 lg:grid-cols-[340px_1fr] xl:h-[calc(100vh-13rem)]">
        {/* Frontmatter */}
        <div className="rounded-lg border border-border bg-bg-surface/50 p-5 xl:overflow-y-auto">
          <h2 className="mb-4 font-mono text-xs font-medium text-text-muted">
            Frontmatter
          </h2>
          <FrontmatterForm
            frontmatter={frontmatter}
            type={type}
            onChange={setFrontmatter}
          />
        </div>

        {/* MDX Editor */}
        <div className="xl:min-h-0">
          <MdxEditor content={content} onChange={setContent} />
        </div>
      </div>
    </div>
  )
}
