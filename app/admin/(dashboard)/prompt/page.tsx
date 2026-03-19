"use client"

import { useState, useEffect, useRef } from "react"
import { SYSTEM_PROMPT } from "@/lib/chatbot-prompt"
import { savePrompt } from "@/lib/admin/actions"
import { useToast } from "@/components/admin/toast"

export default function PromptEditorPage() {
  const [content, setContent] = useState(SYSTEM_PROMPT)
  const [saving, setSaving] = useState(false)
  const initialRef = useRef(SYSTEM_PROMPT)
  const { show } = useToast()

  const isDirty = content !== initialRef.current

  const handleSave = async () => {
    setSaving(true)
    const result = await savePrompt(content)
    setSaving(false)

    if (result.success) {
      initialRef.current = content
      show("Prompt saved")
    } else {
      show(result.error ?? "Save failed", "error")
    }
  }

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        if (isDirty) handleSave()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  })

  return (
    <div>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">
            Chatbot Prompt
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            System prompt for the Ask John chatbot
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <span className="font-mono text-xs text-yellow-400">Unsaved changes</span>
          )}
          <button
            onClick={handleSave}
            disabled={saving || !isDirty}
            className="rounded border border-accent px-6 py-2 font-mono text-sm text-accent transition-colors hover:bg-accent/10 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="mt-4 rounded-lg border border-yellow-400/20 bg-yellow-400/5 p-3">
        <p className="text-sm text-yellow-400/80">
          Changes to this prompt affect how the chatbot represents you to visitors.
          Edit with care.
        </p>
      </div>

      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="mt-6 min-h-[500px] w-full resize-y rounded-lg border border-border bg-bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
      />
    </div>
  )
}
