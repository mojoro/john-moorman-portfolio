"use client"

import { useEffect, useState } from "react"
import type React from "react"
import ReactMarkdown from "react-markdown"
import rehypeRaw from "rehype-raw"
import remarkGfm from "remark-gfm"
import { MdxAudio } from "@/components/mdx-audio"
import type { OgData } from "@/lib/og"

// ── OG Link live preview ────────────────────────────────────────────────────

const ogCache = new Map<string, OgData | null>()

function OgLinkPreview({ url }: { url?: string }) {
  const [og, setOg] = useState<OgData | null>(
    url ? (ogCache.get(url) ?? null) : null,
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!url) return
    if (ogCache.has(url)) {
      setOg(ogCache.get(url)!)
      return
    }
    setLoading(true)
    fetch(`/api/og?url=${encodeURIComponent(url)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data: OgData | null) => {
        ogCache.set(url, data)
        setOg(data)
      })
      .catch(() => {
        ogCache.set(url, null)
        setOg(null)
      })
      .finally(() => setLoading(false))
  }, [url])

  if (!url) return null

  if (loading) {
    return (
      <div className="my-6 animate-pulse rounded-lg border border-border bg-bg-surface p-4">
        <div className="h-3 w-24 rounded bg-bg-elevated" />
        <div className="mt-2 h-4 w-48 rounded bg-bg-elevated" />
      </div>
    )
  }

  if (!og || !og.title) {
    return (
      <div className="og-link-card my-6 rounded-lg border border-border bg-bg-surface p-4">
        <a
          href={url}
          className="block truncate text-sm text-accent"
          target="_blank"
          rel="noopener noreferrer"
        >
          {url}
        </a>
      </div>
    )
  }

  const domain = new URL(url).hostname.replace(/^www\./, "")
  const isBanner =
    !!og.image &&
    og.imageWidth >= 600 &&
    og.imageHeight > 0 &&
    og.imageWidth / og.imageHeight >= 1.5

  const meta = (
    <div className="flex min-w-0 flex-col justify-center gap-1.5 p-4">
      <span className="font-mono text-xs text-text-muted">
        {og.siteName || domain}
      </span>
      <span className="line-clamp-2 font-display font-semibold text-text-primary">
        {og.title}
      </span>
      {og.description && (
        <span className="line-clamp-2 text-sm text-text-secondary">
          {og.description}
        </span>
      )}
    </div>
  )

  if (isBanner) {
    return (
      <div className="og-link-card my-6 overflow-hidden rounded-lg border border-border bg-bg-surface">
        <div
          className="w-full overflow-hidden"
          style={{ aspectRatio: `${og.imageWidth} / ${og.imageHeight}` }}
        >
          <img
            src={og.image}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        {meta}
      </div>
    )
  }

  if (og.image) {
    return (
      <div className="og-link-card my-6 flex flex-col overflow-hidden rounded-lg border border-border bg-bg-surface sm:flex-row">
        <div className="h-[120px] shrink-0 sm:h-auto sm:w-[160px]">
          <img
            src={og.image}
            alt=""
            className="h-full w-full object-cover"
          />
        </div>
        {meta}
      </div>
    )
  }

  return (
    <div className="og-link-card my-6 overflow-hidden rounded-lg border border-border bg-bg-surface">
      {meta}
    </div>
  )
}

/* Custom element components that aren't in ReactMarkdown's type map */
const customElements: Record<string, React.ElementType> = {
  oglink: OgLinkPreview,
}

// ── Editor ──────────────────────────────────────────────────────────────────

interface MdxEditorProps {
  content: string
  onChange: (content: string) => void
}

type Tab = "edit" | "preview"

/* rehype-raw uses an HTML parser which ignores self-closing syntax on
   non-void elements. <Audio .../> becomes an unclosed <audio> that
   swallows all following content. Pre-convert to explicit closing tags. */
function normalizeContent(raw: string) {
  return raw
    .replace(/<Audio\b([^>]*?)\/>/g, "<audio$1></audio>")
    .replace(/<OgLink\b([^>]*?)\/>/g, "<oglink$1></oglink>")
}

export function MdxEditor({ content, onChange }: MdxEditorProps) {
  const [activeTab, setActiveTab] = useState<Tab>("edit")

  const tabs: { key: Tab; label: string }[] = [
    { key: "edit", label: "Edit" },
    { key: "preview", label: "Preview" },
  ]

  return (
    <div className="flex flex-col xl:h-full">
      {/* Tab bar — hidden on wide screens where both panels are visible */}
      <div className="flex gap-4 border-b border-border pb-0 xl:hidden">
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

      {/* Side-by-side on xl+, tabbed below */}
      <div className="mt-4 grid grid-cols-1 gap-4 xl:mt-0 xl:flex-1 xl:min-h-0 xl:grid-cols-2 xl:grid-rows-[1fr]">
        {/* Editor */}
        <div className={`min-h-0 ${activeTab !== "edit" ? "hidden xl:block" : ""}`}>
          <textarea
            value={content}
            onChange={(e) => onChange(e.target.value)}
            spellCheck={false}
            className="min-h-[500px] w-full resize-y rounded-lg border border-border bg-bg-surface px-4 py-3 font-mono text-sm leading-relaxed text-text-primary placeholder:text-text-muted focus:border-accent focus:outline-none xl:h-full xl:resize-none"
            rows={20}
          />
        </div>

        {/* Preview */}
        <div className={`min-h-0 ${activeTab !== "preview" ? "hidden xl:block" : ""}`}>
          <div className="h-full overflow-y-auto rounded-lg border border-border bg-bg-surface">
            <div className="prose-custom max-w-none px-6 py-4">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeRaw]}
                components={{
                  ...customElements,
                  audio: MdxAudio as React.ElementType,
                  table: (props: React.ComponentProps<"table">) => (
                    <div className="overflow-x-auto">
                      <table {...props} />
                    </div>
                  ),
                }}
              >
                {normalizeContent(content)}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
