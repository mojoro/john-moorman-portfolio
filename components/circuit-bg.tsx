"use client"

import { useEffect, useRef } from "react"

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
 */
export function CircuitBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    const getTheme = () =>
      (document.documentElement.getAttribute("data-theme") ?? "dark") as "dark" | "light"
    const getAccent = () =>
      getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#64ffda"
    const getDensity = () => (window.innerWidth < 768 ? 0.6 : 1.0)

    // Canvas is fixed-position, viewport-sized — avoids GPU buffer overruns on mobile.
    // Circuit is generated for the full page height; scroll offset is applied in the worker.
    const cw = window.innerWidth
    const ch = window.innerHeight

    // ── Primary path: OffscreenCanvas ──────────────────────────────────────

    if (typeof canvas.transferControlToOffscreen === "function") {
      const offscreen = canvas.transferControlToOffscreen()
      const worker = new Worker(new URL("../workers/circuit-worker.ts", import.meta.url))
      worker.onerror = (e) => console.error("[circuit-worker]", e)

      worker.postMessage(
        { type: "init", canvas: offscreen, w: cw, h: ch, pageH: document.body.scrollHeight, dpr, reducedMotion, theme: getTheme(), accent: getAccent(), density: getDensity() },
        [offscreen],
      )

      if (window.scrollY > 0) {
        worker.postMessage({ type: "scroll", scrollY: window.scrollY })
      }
      const onScroll = () => worker.postMessage({ type: "scroll", scrollY: window.scrollY })
      window.addEventListener("scroll", onScroll, { passive: true })

      let rt: ReturnType<typeof setTimeout>
      const onResize = () => {
        clearTimeout(rt)
        rt = setTimeout(() => {
          worker.postMessage({
            type: "resize",
            w: window.innerWidth,
            h: window.innerHeight,
            pageH: document.body.scrollHeight,
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

      return () => {
        clearTimeout(rt)
        window.removeEventListener("scroll", onScroll)
        window.removeEventListener("resize", onResize)
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
    }

    let traceMeta = new Float32Array(0)
    let tracePts = new Float32Array(0)
    let traceCount = 0
    let padX = new Float32Array(0), padY = new Float32Array(0), padR = new Float32Array(0), padCount = 0
    let glowX = new Float32Array(0), glowY = new Float32Array(0), glowR = new Float32Array(0)
    let glowPh = new Float32Array(0), glowSp = new Float32Array(0), glowCount = 0
    let pulseData: PulseData[] = []
    let w = 0, h = 0, ready = false

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

    function requestGenerate() {
      w = window.innerWidth
      h = window.innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      genId++
      genWorker.postMessage({
        w,
        h: document.body.scrollHeight,
        reducedMotion: reducedMotion || w < 768,
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

    let currentScrollY = window.scrollY

    function draw(time: number) {
      ctx.clearRect(0, 0, w, h)
      if (!ready) return

      ctx.save()
      ctx.translate(0, -currentScrollY)

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

      if (!reducedMotion && w >= 768) {
        for (const pl of pulseData) {
          const life = pl.pr < pl.ln ? pl.pr / pl.ln : pl.pr > 1.0 ? Math.max(0, 1 - (pl.pr - 1.0) / pl.ln) : 1.0
          pl.pr += pl.sp
          if (life <= 0) { pl.pr = 0; continue }
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

      ctx.restore()

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
      ctx.fillStyle = bandFade; ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = "source-over"
    }

    requestGenerate()
    const onScroll2 = () => { currentScrollY = window.scrollY }
    window.addEventListener("scroll", onScroll2, { passive: true })

    let rt: ReturnType<typeof setTimeout>
    const onResize = () => { clearTimeout(rt); rt = setTimeout(requestGenerate, 300) }
    window.addEventListener("resize", onResize)

    const obs = new MutationObserver(() => { updateColors(); if (reducedMotion && ready) draw(0) })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

    if (reducedMotion) {
      return () => {
        genWorker.terminate()
        window.removeEventListener("scroll", onScroll2)
        window.removeEventListener("resize", onResize)
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
      window.removeEventListener("scroll", onScroll2)
      window.removeEventListener("resize", onResize)
      obs.disconnect()
    }
  }, [])

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 -z-10 print:hidden"
    />
  )
}
