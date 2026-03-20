"use client"

import { useEffect, useRef } from "react"

/**
 * PCB circuit board background.
 *
 * Generation runs in a Web Worker (zero main-thread blocking).
 * Rendering: batched canvas draws, cached colors, pre-computed pulse geometry.
 * Mobile: density reduced to 40% of desktop to keep things light on smaller devices.
 */
export function CircuitBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current!
    const ctx = canvas.getContext("2d")!
    if (!ctx) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const isMobile = window.innerWidth < 768
    const staticOnly = reducedMotion || isMobile // mobile canvas draw is too heavy to animate
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    const getDensity = () => (isMobile ? 0.4 : 1.0)

    // ── Render data (received from worker) ──

    let traceMeta = new Float32Array(0)
    let tracePts = new Float32Array(0)
    let traceCount = 0

    let padX = new Float32Array(0)
    let padY = new Float32Array(0)
    let padR = new Float32Array(0)
    let padCount = 0

    let glowX = new Float32Array(0)
    let glowY = new Float32Array(0)
    let glowR = new Float32Array(0)
    let glowPh = new Float32Array(0)
    let glowSp = new Float32Array(0)
    let glowCount = 0

    interface PulseData {
      pts: Float32Array
      segLens: Float32Array
      totalLen: number
      pr: number
      sp: number
      ln: number
      w: number
    }
    let pulseData: PulseData[] = []

    let w = 0, h = 0
    let ready = false

    // ── Cached color state ──

    let cachedR = 100, cachedG = 255, cachedB = 218
    let traceColor = ""
    let padColor = ""
    let isLightMode = false

    function updateColors() {
      isLightMode = document.documentElement.getAttribute("data-theme") === "light"
      const accent = getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#64ffda"
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

    // ── Worker ──

    const worker = new Worker(
      new URL("../workers/circuit-generate.ts", import.meta.url),
    )

    let genId = 0

    function requestGenerate() {
      w = canvas.clientWidth || window.innerWidth
      h = canvas.clientHeight || window.innerHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      genId++
      worker.postMessage({ w, h, reducedMotion, density: getDensity(), id: genId })
    }

    worker.onmessage = (e) => {
      const d = e.data
      if (d.id !== genId) return // stale result from a previous resize

      traceMeta = d.traceMeta; tracePts = d.tracePts; traceCount = d.traceCount
      padX = d.padX; padY = d.padY; padR = d.padR; padCount = d.padCount
      glowX = d.glowX; glowY = d.glowY; glowR = d.glowR
      glowPh = d.glowPh; glowSp = d.glowSp; glowCount = d.glowCount
      pulseData = d.pulses
      ready = true
      updateColors()
      if (staticOnly) draw(0)
    }

    // ── Draw ──

    function draw(time: number) {
      ctx.clearRect(0, 0, w, h)
      if (!ready) return

      // Traces
      ctx.strokeStyle = traceColor
      ctx.lineCap = "round"
      ctx.lineJoin = "round"

      for (let i = 0; i < traceCount; i++) {
        const startIdx = traceMeta[i * 3]
        const ptCount = traceMeta[i * 3 + 1]
        const tw = traceMeta[i * 3 + 2]
        ctx.lineWidth = tw
        ctx.beginPath()
        ctx.moveTo(tracePts[startIdx], tracePts[startIdx + 1])
        for (let j = 1; j < ptCount; j++) {
          ctx.lineTo(tracePts[startIdx + j * 2], tracePts[startIdx + j * 2 + 1])
        }
        ctx.stroke()
      }

      // Pads
      ctx.fillStyle = padColor
      for (let i = 0; i < padCount; i++) {
        ctx.beginPath()
        ctx.arc(padX[i], padY[i], padR[i], 0, 6.2832)
        ctx.fill()
      }

      // Glows
      const t = time * 0.001
      const r = cachedR, g = cachedG, b = cachedB
      const glowMult = isLightMode ? 1.0 : 0.8
      for (let i = 0; i < glowCount; i++) {
        const pulse = reducedMotion ? 0.6 : 0.4 + Math.sin(t * glowSp[i] + glowPh[i]) * 0.3
        const radius = glowR[i] * 5
        const gr = ctx.createRadialGradient(glowX[i], glowY[i], 0, glowX[i], glowY[i], radius)
        gr.addColorStop(0, `rgba(${r},${g},${b},${(0.2 * pulse * glowMult).toFixed(3)})`)
        gr.addColorStop(0.5, `rgba(${r},${g},${b},${(0.06 * pulse * glowMult).toFixed(3)})`)
        gr.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.fillStyle = gr
        ctx.beginPath()
        ctx.arc(glowX[i], glowY[i], radius, 0, 6.2832)
        ctx.fill()
        ctx.fillStyle = `rgba(${r},${g},${b},${(0.4 * pulse * glowMult).toFixed(3)})`
        ctx.beginPath()
        ctx.arc(glowX[i], glowY[i], glowR[i] * 0.5, 0, 6.2832)
        ctx.fill()
      }

      // Pulses
      if (!reducedMotion) {
        for (const pl of pulseData) {
          const life =
            pl.pr < pl.ln
              ? pl.pr / pl.ln
              : pl.pr > 1.0
              ? Math.max(0, 1 - (pl.pr - 1.0) / pl.ln)
              : 1.0

          pl.pr += pl.sp
          if (life <= 0) { pl.pr = 0; continue }

          const hd = Math.min(pl.pr, 1.0) * pl.totalLen
          const td = Math.max(0, (pl.pr - pl.ln) * pl.totalLen)
          if (hd - td < 1) continue

          function ptAt(d: number): [number, number] {
            let a = 0
            for (let i = 0; i < pl.segLens.length; i++) {
              if (a + pl.segLens[i] >= d) {
                const f = (d - a) / pl.segLens[i]
                const i2 = i * 2
                return [
                  pl.pts[i2] + (pl.pts[i2 + 2] - pl.pts[i2]) * f,
                  pl.pts[i2 + 1] + (pl.pts[i2 + 3] - pl.pts[i2 + 1]) * f,
                ]
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
            const [x1, y1] = ptAt(td + (hd - td) * f)
            const [x2, y2] = ptAt(td + (hd - td) * ((s + 1) / 8))
            ctx.beginPath()
            ctx.moveTo(x1, y1)
            ctx.lineTo(x2, y2)
            ctx.strokeStyle = `rgba(${r},${g},${b},${(f * f * 0.5 * pulseMult).toFixed(3)})`
            ctx.lineWidth = pl.w + 2
            ctx.stroke()
          }

          const [hx, hy] = ptAt(hd)
          const headAlpha = 0.5 * life
          const headGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 8)
          headGrad.addColorStop(0, `rgba(${r},${g},${b},${headAlpha})`)
          headGrad.addColorStop(0.3, `rgba(${r},${g},${b},${(headAlpha * 0.4).toFixed(3)})`)
          headGrad.addColorStop(1, `rgba(${r},${g},${b},0)`)
          ctx.fillStyle = headGrad
          ctx.beginPath()
          ctx.arc(hx, hy, 8, 0, 6.2832)
          ctx.fill()
        }
      }

      // Content readability vignette
      const isMobile = w < 768
      const fadeStrength = isLightMode ? (isMobile ? 0.55 : 0.35) : 0.65
      const fadeEdge = isLightMode ? (isMobile ? 0.45 : 0.25) : 0.6
      ctx.globalCompositeOperation = "destination-out"
      const bandFade = ctx.createLinearGradient(0, 0, w, 0)
      if (isLightMode && isMobile) {
        bandFade.addColorStop(0, `rgba(0,0,0,${fadeEdge})`)
        bandFade.addColorStop(0.5, `rgba(0,0,0,${fadeStrength})`)
        bandFade.addColorStop(1, `rgba(0,0,0,${fadeEdge})`)
      } else {
        bandFade.addColorStop(0, "rgba(0,0,0,0)")
        bandFade.addColorStop(0.1, "rgba(0,0,0,0)")
        bandFade.addColorStop(0.18, `rgba(0,0,0,${fadeEdge})`)
        bandFade.addColorStop(0.5, `rgba(0,0,0,${fadeStrength})`)
        bandFade.addColorStop(0.82, `rgba(0,0,0,${fadeEdge})`)
        bandFade.addColorStop(0.9, "rgba(0,0,0,0)")
        bandFade.addColorStop(1, "rgba(0,0,0,0)")
      }
      ctx.fillStyle = bandFade
      ctx.fillRect(0, 0, w, h)
      ctx.globalCompositeOperation = "source-over"
    }

    // ── Lifecycle ──

    requestGenerate()
    let rt: ReturnType<typeof setTimeout>
    const onResize = () => { clearTimeout(rt); rt = setTimeout(requestGenerate, 300) }
    window.addEventListener("resize", onResize)

    const obs = new MutationObserver(() => {
      updateColors()
      if (staticOnly && ready) draw(0)
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

    if (staticOnly) {
      return () => { worker.terminate(); window.removeEventListener("resize", onResize); obs.disconnect() }
    }

    let fid: number, lt = 0
    const loop = (t: number) => {
      if (t - lt >= 33) { draw(t); lt = t }
      fid = requestAnimationFrame(loop)
    }
    fid = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(fid)
      clearTimeout(rt)
      worker.terminate()
      window.removeEventListener("resize", onResize)
      obs.disconnect()
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
