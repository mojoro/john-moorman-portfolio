"use client"

import { useEffect, useRef } from "react"

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    // No cursor on touch devices — skip entirely
    if (window.matchMedia("(pointer: coarse)").matches) return
    // Respect reduced-motion preference
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const div = ref.current
    if (!div) return

    const onMove = ({ clientX: x, clientY: y }: MouseEvent) => {
      div.style.setProperty("--x", `${x}px`)
      div.style.setProperty("--y", `${y}px`)
      div.style.opacity = "1"
    }

    window.addEventListener("mousemove", onMove, { passive: true })
    return () => window.removeEventListener("mousemove", onMove)
  }, [])

  return (
    <div
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-30 opacity-0 transition-opacity duration-500 print:hidden"
      style={{
        background:
          "radial-gradient(600px circle at var(--x, -9999px) var(--y, -9999px), var(--cursor-glow), transparent 80%)",
      }}
    />
  )
}
