"use client"

import { useEffect, useRef } from "react"

export function CursorGlow() {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia("(pointer: coarse)").matches) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return

    const div = ref.current
    if (!div) return

    const onMove = ({ clientX: x, clientY: y }: MouseEvent) => {
      div.style.setProperty("--x", `${x}px`)
      div.style.setProperty("--y", `${y}px`)
      div.style.opacity = "1"
    }

    const isDark = () =>
      document.documentElement.getAttribute("data-theme") !== "light"

    let attached = false
    const attach = () => {
      if (attached) return
      attached = true
      window.addEventListener("mousemove", onMove, { passive: true })
    }
    const detach = () => {
      if (!attached) return
      attached = false
      window.removeEventListener("mousemove", onMove)
      div.style.opacity = "0"
    }

    if (isDark()) attach()

    const observer = new MutationObserver(() => {
      if (isDark()) attach()
      else detach()
    })
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-theme"],
    })

    return () => {
      window.removeEventListener("mousemove", onMove)
      observer.disconnect()
      div.style.opacity = "0"
    }
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
