"use client"

import { useState } from "react"
import type React from "react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import { MdxAudio } from "@/components/mdx-audio"

interface MdxEditorProps {
  content: string
  onChange: (content: string) => void
}

type Tab = "edit" | "preview"

export function MdxEditor({ content, onChange }: MdxEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>("edit")

  const tabs: { key: Tab; label: string }[] = [
    { key: "edit", label: "Edit" },
    { key: "preview", label: "Preview" },
  ]

  return (
    <div className="flex flex-col">
      {/* Tab bar */}
      <div className="flex gap-4 border-b border-border pb-0">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={`pb-2 font-mono text-xs transition-colors ${
              activeTab === tab.key
                ? "border-b border-accent text-accent"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content area */}
      {activeTab === "edit" ? (
        <textarea
          value={content}
          onChange={(e) => onChange(e.target.value)}
          spellCheck={false}
          className="mt-4 min-h-[500px] w-full resize-y rounded-lg border border-border bg-bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none"
          rows={20}
        />
      ) : (
        <div className="prose-custom mt-4 max-w-none rounded-lg border border-border bg-bg-surface px-6 py-4">
          <ReactMarkdown
            rehypePlugins={[rehypeRaw]}
            components={{ audio: MdxAudio as React.ElementType, Audio: MdxAudio as React.ElementType }}
          >
            {content}
          </ReactMarkdown>
        </div>
      )}
    </div>
  )
}
