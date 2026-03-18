"use client"

import { useState, useEffect, useCallback } from "react"
import { savePalette } from "@/lib/admin/actions"
import { useToast } from "@/components/admin/toast"

const TOKEN_LABELS: Record<string, string> = {
  bg: "Background",
  "bg-surface": "Surface",
  "bg-elevated": "Elevated",
  accent: "Accent",
  "text-primary": "Text Primary",
  "text-secondary": "Text Secondary",
  "text-muted": "Text Muted",
}

const EDITABLE_TOKENS = Object.keys(TOKEN_LABELS)

function getComputedTokens(): Record<string, string> {
  const style = getComputedStyle(document.documentElement)
  const tokens: Record<string, string> = {}
  for (const key of EDITABLE_TOKENS) {
    const raw = style.getPropertyValue(`--${key}`).trim()
    tokens[key] = raw
  }
  return tokens
}

function rgbToHex(color: string): string {
  // If already hex, return as-is
  if (color.startsWith("#")) return color.length === 4 ? expandShortHex(color) : color
  // Handle rgb/rgba
  const match = color.match(/\d+/g)
  if (!match || match.length < 3) return color
  const [r, g, b] = match.map(Number)
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`
}

function expandShortHex(hex: string): string {
  return `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`
}

function resolveToHex(value: string): string {
  // Try parsing with a temp element to resolve any CSS color to hex
  if (typeof document === "undefined") return value
  const el = document.createElement("div")
  el.style.color = value
  document.body.appendChild(el)
  const computed = getComputedStyle(el).color
  document.body.removeChild(el)
  return rgbToHex(computed)
}

interface PaletteMode {
  label: string
  tokens: Record<string, string>
}

export default function PalettePage() {
  const [dark, setDark] = useState<Record<string, string>>({})
  const [light, setLight] = useState<Record<string, string>>({})
  const [initialDark, setInitialDark] = useState<Record<string, string>>({})
  const [initialLight, setInitialLight] = useState<Record<string, string>>({})
  const [activeMode, setActiveMode] = useState<"dark" | "light">("dark")
  const [saving, setSaving] = useState(false)
  const { show } = useToast()

  // Read current computed tokens on mount
  useEffect(() => {
    // Read dark mode tokens (default)
    document.documentElement.removeAttribute("data-theme")
    // Small delay to let styles recompute
    requestAnimationFrame(() => {
      const darkTokens: Record<string, string> = {}
      for (const key of EDITABLE_TOKENS) {
        darkTokens[key] = resolveToHex(
          getComputedStyle(document.documentElement).getPropertyValue(`--${key}`).trim()
        )
      }
      setDark(darkTokens)
      setInitialDark(darkTokens)

      // Read light mode tokens
      document.documentElement.setAttribute("data-theme", "light")
      requestAnimationFrame(() => {
        const lightTokens: Record<string, string> = {}
        for (const key of EDITABLE_TOKENS) {
          lightTokens[key] = resolveToHex(
            getComputedStyle(document.documentElement).getPropertyValue(`--${key}`).trim()
          )
        }
        setLight(lightTokens)
        setInitialLight(lightTokens)

        // Restore to dark
        document.documentElement.removeAttribute("data-theme")
      })
    })
  }, [])

  // Live preview: apply current palette to CSS vars
  useEffect(() => {
    const tokens = activeMode === "dark" ? dark : light
    if (activeMode === "light") {
      document.documentElement.setAttribute("data-theme", "light")
    } else {
      document.documentElement.removeAttribute("data-theme")
    }
    for (const [key, value] of Object.entries(tokens)) {
      document.documentElement.style.setProperty(`--${key}`, value)
    }
    return () => {
      // Clean up inline styles on unmount
      for (const key of EDITABLE_TOKENS) {
        document.documentElement.style.removeProperty(`--${key}`)
      }
      document.documentElement.removeAttribute("data-theme")
    }
  }, [dark, light, activeMode])

  const currentTokens = activeMode === "dark" ? dark : light
  const setCurrentTokens = activeMode === "dark" ? setDark : setLight

  const isDirty =
    JSON.stringify(dark) !== JSON.stringify(initialDark) ||
    JSON.stringify(light) !== JSON.stringify(initialLight)

  const handleChange = (key: string, value: string) => {
    setCurrentTokens((prev) => ({ ...prev, [key]: value }))
  }

  const handleReset = () => {
    setDark(initialDark)
    setLight(initialLight)
  }

  const handleSave = async () => {
    setSaving(true)
    const result = await savePalette({ dark, light })
    setSaving(false)

    if (result.success) {
      setInitialDark(dark)
      setInitialLight(light)
      show("Palette saved")
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">
            Color Palette
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Edit design tokens with live preview
          </p>
        </div>
        <div className="flex items-center gap-3">
          {isDirty && (
            <>
              <button
                onClick={handleReset}
                className="font-mono text-xs text-text-muted transition-colors hover:text-text-primary"
              >
                Reset
              </button>
              <span className="font-mono text-xs text-yellow-400">Unsaved</span>
            </>
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

      {/* Mode toggle */}
      <div className="flex gap-1 rounded-lg border border-border bg-bg-surface p-1">
        <button
          onClick={() => setActiveMode("dark")}
          className={`flex-1 rounded-md px-4 py-2 font-mono text-xs transition-colors ${
            activeMode === "dark"
              ? "bg-accent/10 text-accent"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Dark Mode
        </button>
        <button
          onClick={() => setActiveMode("light")}
          className={`flex-1 rounded-md px-4 py-2 font-mono text-xs transition-colors ${
            activeMode === "light"
              ? "bg-accent/10 text-accent"
              : "text-text-secondary hover:text-text-primary"
          }`}
        >
          Light Mode
        </button>
      </div>

      {/* Token editors */}
      <div className="grid gap-4 sm:grid-cols-2">
        {EDITABLE_TOKENS.map((key) => (
          <div
            key={key}
            className="flex items-center gap-4 rounded-lg border border-border bg-bg-surface p-4"
          >
            <label htmlFor={`color-${key}`} className="relative cursor-pointer">
              <div
                className="h-10 w-10 rounded-lg border border-border"
                style={{ backgroundColor: currentTokens[key] || "#000" }}
              />
              <input
                id={`color-${key}`}
                type="color"
                value={currentTokens[key] || "#000000"}
                onChange={(e) => handleChange(key, e.target.value)}
                className="absolute inset-0 cursor-pointer opacity-0"
              />
            </label>
            <div className="flex-1">
              <p className="text-sm font-medium text-text-primary">
                {TOKEN_LABELS[key]}
              </p>
              <p className="font-mono text-xs text-text-muted">
                --{key}
              </p>
            </div>
            <input
              type="text"
              value={currentTokens[key] || ""}
              onChange={(e) => handleChange(key, e.target.value)}
              className="w-24 rounded border border-border bg-bg px-2 py-1 font-mono text-xs text-text-primary focus:border-accent focus:outline-none"
            />
          </div>
        ))}
      </div>

      {/* Live preview */}
      <div className="rounded-lg border border-border p-6">
        <p className="mb-4 font-mono text-xs text-text-muted uppercase tracking-wider">
          Preview
        </p>
        <div className="space-y-4">
          <h2 className="font-display text-2xl font-bold text-text-primary">
            Hello, World.
          </h2>
          <p className="text-text-secondary">
            This is body text in the secondary color. It should be comfortable to read
            against the background.
          </p>
          <p className="font-mono text-sm text-text-muted">
            Monospace muted text for labels and metadata.
          </p>
          <div className="flex gap-3">
            <button className="rounded border border-accent px-4 py-2 font-mono text-sm text-accent transition-colors hover:bg-accent/10">
              Accent Button
            </button>
            <div className="rounded-lg border border-border bg-bg-surface px-4 py-2 text-sm text-text-primary">
              Surface Card
            </div>
            <div className="rounded-lg bg-bg-elevated px-4 py-2 text-sm text-text-primary">
              Elevated
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
