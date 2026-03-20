"use client"

import { useEffect, useRef } from "react"

/**
 * PCB circuit board background — OffscreenCanvas edition.
 *
 * The canvas is transferred to a dedicated worker on mount. All generation
 * and rendering happen off the main thread. This component only relays
 * config at startup and lightweight resize/theme messages thereafter.
 */
export function CircuitBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    if (!canvas.transferControlToOffscreen) return // graceful degradation

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const getTheme = () =>
      (document.documentElement.getAttribute("data-theme") ?? "dark") as "dark" | "light"
    const getAccent = () =>
      getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#64ffda"
    const getDensity = () => (window.innerWidth < 768 ? 0.4 : 1.0)

    const offscreen = canvas.transferControlToOffscreen()
    const worker = new Worker(new URL("../workers/circuit-worker.ts", import.meta.url))

    worker.postMessage(
      {
        type: "init",
        canvas: offscreen,
        w: canvas.clientWidth,
        h: canvas.clientHeight,
        dpr,
        reducedMotion,
        theme: getTheme(),
        accent: getAccent(),
        density: getDensity(),
      },
      [offscreen],
    )

    // Resize — debounced 300 ms
    let rt: ReturnType<typeof setTimeout>
    const onResize = () => {
      clearTimeout(rt)
      rt = setTimeout(() => {
        worker.postMessage({
          type: "resize",
          w: canvas.clientWidth,
          h: canvas.clientHeight,
          dpr: Math.min(window.devicePixelRatio || 1, 2),
          density: getDensity(),
        })
      }, 300)
    }
    window.addEventListener("resize", onResize)

    // Theme changes
    const obs = new MutationObserver(() => {
      worker.postMessage({ type: "theme", theme: getTheme(), accent: getAccent() })
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

    return () => {
      clearTimeout(rt)
      window.removeEventListener("resize", onResize)
      obs.disconnect()
      worker.terminate()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 h-full w-full print:hidden"
    />
  )
}
