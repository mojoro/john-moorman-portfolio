"use client"

import { useEffect, useRef, useState } from "react"

/**
 * PCB circuit board background.
 *
 * Primary path (modern browsers): OffscreenCanvas transferred to
 * circuit-worker.ts — generation + rendering + animation loop entirely
 * off the main thread.
 *
 * Fallback path (Safari < 17, older iOS): circuit-generate.ts handles
 * generation in a worker and posts typed arrays back; rendering runs on
 * the main thread via requestAnimationFrame.
 *
 * Scroll effect: canvas is 2× viewport height with two identical tiles.
 * A CSS scroll-driven animation (globals.css .circuit-bg-anim) slides it
 * from translateY(0) to translateY(-50%) — compositor-driven, zero JS lag.
 *
 * StrictMode note: React StrictMode (dev) runs effects twice — mount,
 * cleanup, mount. transferControlToOffscreen is a one-shot operation and
 * throws on the second attempt. We catch that, increment `generation`,
 * which re-keys the canvas element (fresh DOM node) and re-runs the effect
 * cleanly. Production is unaffected (effect runs once, no throw).
 */
export function CircuitBg({ navOffset }: { navOffset?: boolean } = {}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [generation, setGeneration] = useState(0)

  useEffect(() => {
    const canvas = canvasRef.current!
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const getTheme = () =>
      (document.documentElement.getAttribute("data-theme") ?? "dark") as "dark" | "light"
    const getAccent = () =>
      getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#64ffda"
    const getDensity = () => (window.innerWidth < 768 ? 0.6 : 1.0)
    // Sidebar is w-60 = 240px. Subtract it explicitly rather than relying on
    // getBoundingClientRect (which may return 0 before first paint).
    const getCanvasW = () =>
      navOffset && window.innerWidth >= 768
        ? window.innerWidth - 240
        : window.innerWidth

    const cw = getCanvasW()
    const ch = window.innerHeight

    // ── Primary path: OffscreenCanvas ──────────────────────────────────────

    if (typeof canvas.transferControlToOffscreen === "function") {
      let offscreen: OffscreenCanvas
      try {
        offscreen = canvas.transferControlToOffscreen()
      } catch {
        // React StrictMode double-invoke: canvas was already transferred in the
        // first run's effect, then that worker was cleaned up. Force a fresh
        // canvas DOM element by bumping the generation key.
        setGeneration(g => g + 1)
        return
      }
      const worker = new Worker(new URL("../workers/circuit-worker.ts", import.meta.url))
      worker.onerror = (e) => console.error("[circuit-worker]", e)

      worker.postMessage(
        { type: "init", canvas: offscreen!, w: cw, h: ch, dpr, reducedMotion, theme: getTheme(), accent: getAccent(), density: getDensity() },
        [offscreen!],
      )

      let lastW = cw
      let rt: ReturnType<typeof setTimeout>
      const onResize = () => {
        clearTimeout(rt)
        rt = setTimeout(() => {
          const newW = getCanvasW()
          if (newW === lastW) return  // height-only change (mobile toolbar) — skip
          lastW = newW
          worker.postMessage({
            type: "resize",
            w: newW,
            h: window.innerHeight,
            dpr: Math.min(window.devicePixelRatio || 1, 2),
            density: getDensity(),
          })
        }, 300)
      }
      window.addEventListener("resize", onResize)

      const obs = new MutationObserver(() => {
        worker.postMessage({ type: "theme", theme: getTheme(), accent: getAccent() })
      })
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

      const onConfig = (e: Event) => {
        worker.postMessage({ type: "config", ...(e as CustomEvent).detail })
      }
      window.addEventListener("circuit-config", onConfig)

      // ── Cursor responsiveness ────────────────────────────────────────────
      let lastPointerSend = 0
      const translateX = (clientX: number) =>
        navOffset && window.innerWidth >= 768 ? clientX - 240 : clientX

      const onMouseMove = (e: MouseEvent) => {
        const now = performance.now()
        if (now - lastPointerSend < 33) return // ~30fps throttle
        lastPointerSend = now
        worker.postMessage({ type: "pointer", x: translateX(e.clientX), y: e.clientY, pressed: false })
      }
      const onClick = (e: MouseEvent) => {
        worker.postMessage({ type: "pointer", x: translateX(e.clientX), y: e.clientY, pressed: true })
      }
      window.addEventListener("mousemove", onMouseMove)
      window.addEventListener("click", onClick)

      return () => {
        clearTimeout(rt)
        window.removeEventListener("resize", onResize)
        window.removeEventListener("circuit-config", onConfig)
        window.removeEventListener("mousemove", onMouseMove)
        window.removeEventListener("click", onClick)
        obs.disconnect()
        worker.terminate()
      }
    }

    // ── Fallback path: generation worker + main-thread rendering ───────────

    const ctx = canvas.getContext("2d")!
    if (!ctx) return

    interface PulseData {
      pts: Float32Array
      segLens: Float32Array
      totalLen: number
      pr: number
      sp: number
      ln: number
      w: number
      ti: number
    }

    let traceMeta = new Float32Array(0)
    let tracePts = new Float32Array(0)
    let traceCount = 0
    let padX = new Float32Array(0), padY = new Float32Array(0), padR = new Float32Array(0), padCount = 0
    let glowX = new Float32Array(0), glowY = new Float32Array(0), glowR = new Float32Array(0)
    let glowPh = new Float32Array(0), glowSp = new Float32Array(0), glowCount = 0
    let pulseData: PulseData[] = []
    let w = 0, h = 0, ready = false, lastW = 0

    let cachedR = 100, cachedG = 255, cachedB = 218
    let traceColor = "", padColor = "", isLightMode = false

    function updateColors() {
      isLightMode = getTheme() === "light"
      const accent = getAccent()
      const s = accent.startsWith("#") ? accent.slice(1) : ""
      if (s.length >= 6) {
        cachedR = parseInt(s.slice(0, 2), 16)
        cachedG = parseInt(s.slice(2, 4), 16)
        cachedB = parseInt(s.slice(4, 6), 16)
      } else if (s.length === 3) {
        cachedR = parseInt(s[0] + s[0], 16)
        cachedG = parseInt(s[1] + s[1], 16)
        cachedB = parseInt(s[2] + s[2], 16)
      }
      traceColor = `rgba(${cachedR},${cachedG},${cachedB},${isLightMode ? 0.11 : 0.06})`
      padColor = `rgba(${cachedR},${cachedG},${cachedB},${isLightMode ? 0.13 : 0.07})`
    }

    const genWorker = new Worker(new URL("../workers/circuit-generate.ts", import.meta.url))
    let genId = 0

    function requestGenerate(forceRegen = false) {
      const newW = getCanvasW()
      if (!forceRegen && newW === lastW && ready) return  // height-only change — skip
      lastW = newW
      w = newW
      h = window.innerHeight
      canvas.width = w * dpr; canvas.height = h * 2 * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      genId++
      genWorker.postMessage({
        w,
        h,
        reducedMotion,
        density: getDensity(),
        id: genId,
      })
    }

    genWorker.onmessage = (e) => {
      const d = e.data
      if (d.id !== genId) return
      traceMeta = d.traceMeta; tracePts = d.tracePts; traceCount = d.traceCount
      padX = d.padX; padY = d.padY; padR = d.padR; padCount = d.padCount
      glowX = d.glowX; glowY = d.glowY; glowR = d.glowR
      glowPh = d.glowPh; glowSp = d.glowSp; glowCount = d.glowCount
      pulseData = d.pulses
      ready = true
      updateColors()
      if (reducedMotion) draw(0)
    }

    function draw(time: number) {
      ctx.clearRect(0, 0, w, h * 2)
      if (!ready) return

      // Draw tile 1 (one viewport-height tile at y=0)
      ctx.strokeStyle = traceColor
      ctx.lineCap = "round"; ctx.lineJoin = "round"
      for (let i = 0; i < traceCount; i++) {
        const startIdx = traceMeta[i * 3], ptCount = traceMeta[i * 3 + 1], tw = traceMeta[i * 3 + 2]
        ctx.lineWidth = tw
        ctx.beginPath()
        ctx.moveTo(tracePts[startIdx], tracePts[startIdx + 1])
        for (let j = 1; j < ptCount; j++) ctx.lineTo(tracePts[startIdx + j * 2], tracePts[startIdx + j * 2 + 1])
        ctx.stroke()
      }

      ctx.fillStyle = padColor
      for (let i = 0; i < padCount; i++) { ctx.beginPath(); ctx.arc(padX[i], padY[i], padR[i], 0, 6.2832); ctx.fill() }

      const t = time * 0.001, r = cachedR, g = cachedG, b = cachedB
      const glowMult = isLightMode ? 1.0 : 0.8
      for (let i = 0; i < glowCount; i++) {
        const pulse = reducedMotion ? 0.6 : 0.4 + Math.sin(t * glowSp[i] + glowPh[i]) * 0.3
        const radius = glowR[i] * 5
        const gr = ctx.createRadialGradient(glowX[i], glowY[i], 0, glowX[i], glowY[i], radius)
        gr.addColorStop(0, `rgba(${r},${g},${b},${(0.2 * pulse * glowMult).toFixed(3)})`)
        gr.addColorStop(0.5, `rgba(${r},${g},${b},${(0.06 * pulse * glowMult).toFixed(3)})`)
        gr.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = gr; ctx.beginPath(); ctx.arc(glowX[i], glowY[i], radius, 0, 6.2832); ctx.fill()
        ctx.fillStyle = `rgba(${r},${g},${b},${(0.4 * pulse * glowMult).toFixed(3)})`
        ctx.beginPath(); ctx.arc(glowX[i], glowY[i], glowR[i] * 0.5, 0, 6.2832); ctx.fill()
      }

      if (!reducedMotion) {
        for (const pl of pulseData) {
          const life = pl.pr < pl.ln ? pl.pr / pl.ln : pl.pr > 1.0 ? Math.max(0, 1 - (pl.pr - 1.0) / pl.ln) : 1.0
          pl.pr += pl.sp
          if (pl.pr >= 1.0 + pl.ln) {
            // Pulse completed — pick a new unoccupied trace for the next pass
            const occupied = new Set(pulseData.filter(p => p !== pl && p.pr > 0).map(p => p.ti))
            let ti = 0, ptC = 0, att = 0
            do { ti = Math.floor(Math.random() * traceCount); ptC = traceMeta[ti * 3 + 1]; att++ }
            while ((ptC < 2 || occupied.has(ti)) && att < 20)
            if (ptC >= 2 && !occupied.has(ti)) {
              const si = traceMeta[ti * 3]
              const pts = new Float32Array(ptC * 2)
              for (let j = 0; j < ptC * 2; j++) pts[j] = tracePts[si + j]
              const segLens = new Float32Array(ptC - 1)
              let tl = 0
              for (let j = 0; j < ptC - 1; j++) {
                const dx = pts[(j + 1) * 2] - pts[j * 2], dy = pts[(j + 1) * 2 + 1] - pts[j * 2 + 1]
                segLens[j] = Math.sqrt(dx * dx + dy * dy); tl += segLens[j]
              }
              if (tl >= 10) {
                pl.pts = pts; pl.segLens = segLens; pl.totalLen = tl; pl.w = traceMeta[ti * 3 + 2]
                pl.ln = 0.04 + Math.random() * 0.06; pl.ti = ti
                const st = Math.random()
                pl.sp = st < 0.3 ? 0.0008 + Math.random() * 0.0007 : st < 0.7 ? 0.002 + Math.random() * 0.002 : 0.005 + Math.random() * 0.004
              }
            }
            pl.pr = 0; continue
          }
          if (life <= 0) continue
          const hd = Math.min(pl.pr, 1.0) * pl.totalLen
          const td = Math.max(0, (pl.pr - pl.ln) * pl.totalLen)
          if (hd - td < 1) continue

          function ptAt(d: number): [number, number] {
            let a = 0
            for (let i = 0; i < pl.segLens.length; i++) {
              if (a + pl.segLens[i] >= d) {
                const f = (d - a) / pl.segLens[i], i2 = i * 2
                return [pl.pts[i2] + (pl.pts[i2 + 2] - pl.pts[i2]) * f, pl.pts[i2 + 1] + (pl.pts[i2 + 3] - pl.pts[i2 + 1]) * f]
              }
              a += pl.segLens[i]
            }
            const last = pl.segLens.length * 2
            return [pl.pts[last], pl.pts[last + 1]]
          }

          const pulseMult = (isLightMode ? 0.8 : 0.7) * life
          ctx.lineCap = "round"
          for (let s = 0; s < 8; s++) {
            const f = s / 8
            const [x1, y1] = ptAt(td + (hd - td) * f), [x2, y2] = ptAt(td + (hd - td) * ((s + 1) / 8))
            ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2)
            ctx.strokeStyle = `rgba(${r},${g},${b},${(f * f * 0.5 * pulseMult).toFixed(3)})`
            ctx.lineWidth = pl.w + 2; ctx.stroke()
          }
          const [hx, hy] = ptAt(hd)
          const headAlpha = 0.5 * life
          const hg = ctx.createRadialGradient(hx, hy, 0, hx, hy, 8)
          hg.addColorStop(0, `rgba(${r},${g},${b},${headAlpha})`)
          hg.addColorStop(0.3, `rgba(${r},${g},${b},${(headAlpha * 0.4).toFixed(3)})`)
          hg.addColorStop(1, `rgba(${r},${g},${b},0)`)
          ctx.fillStyle = hg; ctx.beginPath(); ctx.arc(hx, hy, 8, 0, 6.2832); ctx.fill()
        }
      }

      // Tile 2: copy tile 1 before applying vignette so both tiles get identical content
      ctx.drawImage(canvas, 0, 0, w * dpr, h * dpr, 0, h, w, h)

      // Horizontal vignette applied once across the full canvas so the seam
      // boundary gets the same treatment as every other row.
      const isMobile = w < 768
      const fadeStrength = isLightMode ? (isMobile ? 0.55 : 0.35) : 0.65
      const fadeEdge = isLightMode ? (isMobile ? 0.45 : 0.25) : 0.6
      ctx.globalCompositeOperation = "destination-out"
      const bandFade = ctx.createLinearGradient(0, 0, w, 0)
      if (isLightMode && isMobile) {
        bandFade.addColorStop(0, `rgba(0,0,0,${fadeEdge})`); bandFade.addColorStop(0.5, `rgba(0,0,0,${fadeStrength})`); bandFade.addColorStop(1, `rgba(0,0,0,${fadeEdge})`)
      } else {
        bandFade.addColorStop(0, "rgba(0,0,0,0)"); bandFade.addColorStop(0.1, "rgba(0,0,0,0)")
        bandFade.addColorStop(0.18, `rgba(0,0,0,${fadeEdge})`); bandFade.addColorStop(0.5, `rgba(0,0,0,${fadeStrength})`)
        bandFade.addColorStop(0.82, `rgba(0,0,0,${fadeEdge})`); bandFade.addColorStop(0.9, "rgba(0,0,0,0)"); bandFade.addColorStop(1, "rgba(0,0,0,0)")
      }
      ctx.fillStyle = bandFade; ctx.fillRect(0, 0, w, h * 2)
      ctx.globalCompositeOperation = "source-over"
    }

    requestGenerate(true)

    let rt: ReturnType<typeof setTimeout>
    const onResize = () => { clearTimeout(rt); rt = setTimeout(() => requestGenerate(), 300) }
    window.addEventListener("resize", onResize)

    const obs = new MutationObserver(() => { updateColors(); if (reducedMotion && ready) draw(0) })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

    // Fallback config handler — subset of worker capabilities
    const onConfig2 = (e: Event) => {
      const d = (e as CustomEvent<Record<string, unknown>>).detail
      if (d.reset) { updateColors(); requestGenerate(true); return }
      if (typeof d.traceAlpha === "number") traceColor = `rgba(${cachedR},${cachedG},${cachedB},${d.traceAlpha})`
      if (typeof d.padAlpha === "number") padColor = `rgba(${cachedR},${cachedG},${cachedB},${d.padAlpha})`
      if (typeof d.density === "number") requestGenerate(true)
      if (reducedMotion && ready) draw(0)
    }
    window.addEventListener("circuit-config", onConfig2)

    if (reducedMotion) {
      return () => {
        genWorker.terminate()
        window.removeEventListener("resize", onResize)
        window.removeEventListener("circuit-config", onConfig2)
        obs.disconnect()
      }
    }

    let fid: number, lt = 0
    const loop = (t: number) => { if (t - lt >= 33) { draw(t); lt = t }; fid = requestAnimationFrame(loop) }
    fid = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(fid)
      clearTimeout(rt)
      genWorker.terminate()
      window.removeEventListener("resize", onResize)
      window.removeEventListener("circuit-config", onConfig2)
      obs.disconnect()
    }
  }, [generation]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      key={generation}
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 right-0 top-0 -z-10 h-[200svh] circuit-bg-anim print:hidden${navOffset ? " md:left-60" : ""}`}
    />
  )
}
