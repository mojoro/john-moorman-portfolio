"use client"

import { useEffect, useRef, useState } from "react"

import { createFrameWatchdog } from "@/lib/circuit-watchdog"

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
 * The box is measured in lvh and the parallax is off below 768px, because a
 * phone's toolbar resizes the layout viewport mid-scroll and would otherwise
 * drag the board with it.
 *
 * Frame-rate watchdog: both paths time their own draw() and back off when a
 * device cannot keep up — first by thinning the board, then by shutting it
 * down. See lib/circuit-watchdog.ts for the thresholds. Stage changes are
 * announced on window as a `circuit-watchdog` CustomEvent.
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
    // The etched board (traces, pads) draws in ink; the live signal keeps the
    // accent. They match in dark mode and diverge in light.
    const getInk = () =>
      getComputedStyle(document.documentElement).getPropertyValue("--circuit-ink").trim() || getAccent()
    const getDensity = () => (window.innerWidth < 768 ? 0.6 : 1.0)
    // Sidebar is w-60 = 240px. Subtract it explicitly rather than relying on
    // getBoundingClientRect (which may return 0 before first paint).
    const getCanvasW = () =>
      navOffset && window.innerWidth >= 768
        ? window.innerWidth - 240
        : window.innerWidth
    // The element is sized in lvh, which does not change when a mobile browser
    // slides its toolbar in or out. Measuring the element rather than reading
    // window.innerHeight keeps the tiles aligned with their CSS box and keeps
    // every scroll calculation below from lurching as the toolbar moves.
    const getViewportH = () =>
      Math.round(canvas.clientHeight / 2) || window.innerHeight
    // Phones get no parallax at all: the toolbar resizes the layout viewport,
    // which shifts scroll progress out from under the animation. Mirrors the
    // media query in globals.css.
    const parallaxEnabled = () => window.innerWidth >= 768

    const cw = getCanvasW()
    const ch = getViewportH()

    // ── Scroll-driven parallax ──────────────────────────────────────────
    // Firefox (and some older browsers) don't support animation-timeline:
    // scroll() reliably, so CSS parallax doesn't kick in. We drive translateY
    // from JS when that's the case. The math mirrors the CSS keyframe so the
    // pointer-offset calc in getScrollOffsetY stays consistent across paths.
    const supportsScrollTimeline =
      typeof CSS !== "undefined" &&
      typeof CSS.supports === "function" &&
      CSS.supports("animation-timeline: scroll()")

    const updateScrollTravel = () => {
      const vh = getViewportH()
      const scrollable = document.documentElement.scrollHeight - vh
      if (scrollable <= 0 || !parallaxEnabled()) {
        canvas.style.setProperty("--circuit-max-translate", "0%")
        if (!supportsScrollTimeline) canvas.style.transform = "translateY(0)"
        return
      }
      const ratio = Math.min(scrollable / vh, 1)
      canvas.style.setProperty("--circuit-max-translate", `${(-ratio * 50).toFixed(2)}%`)
    }

    let scrollRaf = 0
    const applyScrollFallback = () => {
      const vh = getViewportH()
      const scrollable = document.documentElement.scrollHeight - vh
      if (scrollable <= 0 || !parallaxEnabled()) { canvas.style.transform = "translateY(0)"; return }
      const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
      const progress = Math.min(Math.max(scrollTop / scrollable, 0), 1)
      const ratio = Math.min(scrollable / vh, 1)
      canvas.style.transform = `translateY(${(-ratio * 50 * progress).toFixed(3)}%)`
    }
    const onScrollFallback = () => {
      if (scrollRaf) return
      scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; applyScrollFallback() })
    }

    updateScrollTravel()
    if (!supportsScrollTimeline) {
      applyScrollFallback()
      window.addEventListener("scroll", onScrollFallback, { passive: true })
    }

    const bodyResizeObs = new ResizeObserver(() => {
      updateScrollTravel()
      if (!supportsScrollTimeline) applyScrollFallback()
    })
    bodyResizeObs.observe(document.body)

    const detachScroll = () => {
      if (scrollRaf) { cancelAnimationFrame(scrollRaf); scrollRaf = 0 }
      if (!supportsScrollTimeline) window.removeEventListener("scroll", onScrollFallback)
      bodyResizeObs.disconnect()
    }

    // ── Watchdog plumbing (shared by both paths) ───────────────────────────

    const FADE_MS = 500
    let fadeTimer: ReturnType<typeof setTimeout> | undefined

    const announce = (stage: "degraded" | "disabled") =>
      window.dispatchEvent(new CustomEvent("circuit-watchdog", { detail: { stage } }))

    // A background that blinks out mid-scroll reads as a bug. Fading it leaves
    // a page that simply has no board, which is a look the design survives.
    const fadeOutCanvas = (onFaded: () => void) => {
      canvas.style.transition = `opacity ${FADE_MS}ms ease-out`
      canvas.style.opacity = "0"
      fadeTimer = setTimeout(onFaded, FADE_MS + 50)
    }

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
        { type: "init", canvas: offscreen!, w: cw, h: ch, dpr, reducedMotion, theme: getTheme(), accent: getAccent(), ink: getInk(), density: getDensity() },
        [offscreen!],
      )

      // The worker has no document to read visibility from, and a throttled
      // background tab must not be mistaken for a slow device.
      let boardDisabled = false
      const onVisibility = () => worker.postMessage({ type: "visibility", hidden: document.hidden })
      document.addEventListener("visibilitychange", onVisibility)
      onVisibility()

      worker.onmessage = (e: MessageEvent<{ type: "watchdog"; stage: "degraded" | "disabled" }>) => {
        if (e.data.type !== "watchdog") return
        announce(e.data.stage)
        if (e.data.stage !== "disabled" || boardDisabled) return
        // The worker has already stopped its loop and left the last frame up.
        boardDisabled = true
        fadeOutCanvas(() => worker.terminate())
      }

      let lastW = cw
      let lastH = ch
      let rt: ReturnType<typeof setTimeout>
      const onResize = () => {
        clearTimeout(rt)
        rt = setTimeout(() => {
          const newW = getCanvasW()
          // lvh is toolbar-immune, so a height change here is a real one
          // (rotation, desktop resize) rather than sliding browser chrome.
          const newH = getViewportH()
          if (newW === lastW && newH === lastH) return
          lastW = newW
          lastH = newH
          worker.postMessage({
            type: "resize",
            w: newW,
            h: newH,
            dpr: Math.min(window.devicePixelRatio || 1, 2),
            density: getDensity(),
          })
        }, 300)
      }
      window.addEventListener("resize", onResize)

      const obs = new MutationObserver(() => {
        worker.postMessage({ type: "theme", theme: getTheme(), accent: getAccent(), ink: getInk() })
      })
      obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

      const onConfig = (e: Event) => {
        worker.postMessage({ type: "config", ...(e as CustomEvent).detail })
      }
      window.addEventListener("circuit-config", onConfig)

      // ── Cursor responsiveness ────────────────────────────────────────────
      const getScrollOffsetY = () => {
        const vh = getViewportH()
        const scrollable = document.documentElement.scrollHeight - vh
        if (scrollable <= 0 || !parallaxEnabled()) return 0
        const scrollTop = document.documentElement.scrollTop || document.body.scrollTop
        const progress = Math.min(scrollTop / scrollable, 1)
        const maxTravelPx = Math.min(scrollable, vh)
        return progress * maxTravelPx
      }

      let lastPointerSend = 0
      const translateX = (clientX: number) =>
        navOffset && window.innerWidth >= 768 ? clientX - 240 : clientX

      const onMouseMove = (e: MouseEvent) => {
        if (boardDisabled) return
        const now = performance.now()
        if (now - lastPointerSend < 33) return // ~30fps throttle
        lastPointerSend = now
        worker.postMessage({ type: "pointer", x: translateX(e.clientX), y: e.clientY + getScrollOffsetY(), pressed: false })
      }
      const onClick = (e: MouseEvent) => {
        if (boardDisabled) return
        worker.postMessage({ type: "pointer", x: translateX(e.clientX), y: e.clientY + getScrollOffsetY(), pressed: true })
      }
      window.addEventListener("mousemove", onMouseMove)
      window.addEventListener("click", onClick)

      return () => {
        clearTimeout(rt)
        clearTimeout(fadeTimer)
        window.removeEventListener("resize", onResize)
        window.removeEventListener("circuit-config", onConfig)
        window.removeEventListener("mousemove", onMouseMove)
        window.removeEventListener("click", onClick)
        document.removeEventListener("visibilitychange", onVisibility)
        detachScroll()
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
    let w = 0, h = 0, ready = false, lastW = 0, lastH = 0

    // This path paints on the main thread, so a device that cannot keep up
    // costs the whole page rather than one worker. Same thresholds as the
    // worker path; the loop below is gated to the same 33ms frame interval.
    const FRAME_INTERVAL = 33
    let watchdog = createFrameWatchdog()
    let watchdogDensity = 1.0
    // Mirrors maxPulses in the worker. The generator hands back one pulse per
    // four traces up to 24; the watchdog trims that list on the way in.
    let pulseLimit = 24
    let fallbackDisabled = false

    let cachedR = 100, cachedG = 255, cachedB = 218
    let inkR = 100, inkG = 255, inkB = 218
    let traceColor = "", padColor = "", isLightMode = false
    let fadeOverride: number | null = null

    function parseHex(color: string, fallback: [number, number, number]): [number, number, number] {
      const s = color.startsWith("#") ? color.slice(1) : ""
      if (s.length >= 6) {
        return [parseInt(s.slice(0, 2), 16), parseInt(s.slice(2, 4), 16), parseInt(s.slice(4, 6), 16)]
      }
      if (s.length === 3) {
        return [parseInt(s[0] + s[0], 16), parseInt(s[1] + s[1], 16), parseInt(s[2] + s[2], 16)]
      }
      return fallback
    }

    function updateColors() {
      isLightMode = getTheme() === "light"
      ;[cachedR, cachedG, cachedB] = parseHex(getAccent(), [cachedR, cachedG, cachedB])
      ;[inkR, inkG, inkB] = parseHex(getInk(), [cachedR, cachedG, cachedB])
      traceColor = `rgba(${inkR},${inkG},${inkB},${isLightMode ? 0.065 : 0.06})`
      padColor = `rgba(${inkR},${inkG},${inkB},${isLightMode ? 0.085 : 0.07})`
    }

    const genWorker = new Worker(new URL("../workers/circuit-generate.ts", import.meta.url))
    let genId = 0

    function requestGenerate(forceRegen = false) {
      const newW = getCanvasW()
      const newH = getViewportH()
      if (!forceRegen && newW === lastW && newH === lastH && ready) return
      lastW = newW
      lastH = newH
      w = newW
      h = newH
      canvas.width = w * dpr; canvas.height = h * 2 * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      genId++
      // A regeneration invalidates every sample taken against the old board.
      watchdog.reset()
      genWorker.postMessage({
        w,
        h,
        reducedMotion,
        density: getDensity() * watchdogDensity,
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
      pulseData = (d.pulses as PulseData[]).slice(0, pulseLimit)
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
      const glowMult = isLightMode ? 0.14 : 0.8
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
            const occupied = new Set<number>()
            for (const p of pulseData) if (p !== pl && p.pr > 0) occupied.add(p.ti)
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

          const pulseMult = (isLightMode ? 0.48 : 0.7) * life
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

      // Horizontal vignette — same extended-range logic as the worker path.
      const isMobile = w < 768
      const raw = fadeOverride ?? (isLightMode ? 1.6 : isMobile ? 1.25 : 0.78)
      const peak = Math.min(raw, 1)
      const spread = Math.max(0, raw - 1)
      ctx.globalCompositeOperation = "destination-out"
      const bandFade = ctx.createLinearGradient(0, 0, w, 0)
      if (isMobile) {
        const baseEdge = isLightMode ? 0.54 : 0.52
        const edgeA = Math.min(baseEdge + spread * (peak - baseEdge), 1)
        bandFade.addColorStop(0, `rgba(0,0,0,${edgeA.toFixed(3)})`); bandFade.addColorStop(0.5, `rgba(0,0,0,${peak})`); bandFade.addColorStop(1, `rgba(0,0,0,${edgeA.toFixed(3)})`)
      } else {
        const baseEdge = isLightMode ? 0.30 : 0.72
        const edgeA = Math.min(baseEdge + spread * (peak - baseEdge), 1)
        const a = 0.10 * (1 - spread), b = Math.max(a, 0.18 * (1 - spread)), c = Math.max(b, 0.50 * (1 - spread))
        bandFade.addColorStop(0, "rgba(0,0,0,0)"); bandFade.addColorStop(a, "rgba(0,0,0,0)")
        bandFade.addColorStop(b, `rgba(0,0,0,${edgeA.toFixed(3)})`); bandFade.addColorStop(c, `rgba(0,0,0,${peak})`)
        bandFade.addColorStop(0.5, `rgba(0,0,0,${peak})`)
        bandFade.addColorStop(1 - c, `rgba(0,0,0,${peak})`); bandFade.addColorStop(1 - b, `rgba(0,0,0,${edgeA.toFixed(3)})`)
        bandFade.addColorStop(1 - a, "rgba(0,0,0,0)"); bandFade.addColorStop(1, "rgba(0,0,0,0)")
      }
      ctx.fillStyle = bandFade; ctx.fillRect(0, 0, w, h * 2)
      ctx.globalCompositeOperation = "source-over"
    }

    requestGenerate(true)

    let rt: ReturnType<typeof setTimeout>
    const onResize = () => {
      if (fallbackDisabled) return
      clearTimeout(rt); rt = setTimeout(() => requestGenerate(), 300)
    }
    window.addEventListener("resize", onResize)

    const obs = new MutationObserver(() => { updateColors(); if (reducedMotion && ready) draw(0) })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

    // Fallback config handler — subset of worker capabilities
    const onConfig2 = (e: Event) => {
      const d = (e as CustomEvent<Record<string, unknown>>).detail
      if (fallbackDisabled) return
      // Deliberate override: drop the samples taken under the old settings.
      watchdog.reset()
      if (d.reset) {
        // Reset means reset, watchdog decisions included.
        watchdog = createFrameWatchdog()
        watchdogDensity = 1.0
        pulseLimit = 24
        updateColors(); fadeOverride = null; requestGenerate(true); return
      }
      if (typeof d.traceAlpha === "number") traceColor = `rgba(${inkR},${inkG},${inkB},${d.traceAlpha})`
      if (typeof d.padAlpha === "number") padColor = `rgba(${inkR},${inkG},${inkB},${d.padAlpha})`
      if (typeof d.fadeStrength === "number") fadeOverride = d.fadeStrength
      if (typeof d.density === "number") { watchdogDensity = 1.0; requestGenerate(true) }
      if (reducedMotion && ready) draw(0)
    }
    window.addEventListener("circuit-config", onConfig2)

    // rAF stops while the tab is hidden, but the first frame back would still
    // read as one enormous gap. Suspending drops that sample with the rest.
    // Seeded immediately, because a page restored into a background tab starts
    // hidden and never fires the event.
    const onVisibility = () => watchdog.setSuspended(document.hidden)
    document.addEventListener("visibilitychange", onVisibility)
    onVisibility()

    if (reducedMotion) {
      // One static frame and no loop, so there is nothing to watch.
      return () => {
        genWorker.terminate()
        window.removeEventListener("resize", onResize)
        window.removeEventListener("circuit-config", onConfig2)
        document.removeEventListener("visibilitychange", onVisibility)
        detachScroll()
        obs.disconnect()
      }
    }

    // Stage 1: same cut as the worker — halve the density, drop 24 pulses to
    // 8. The pulse cap is the larger half of the saving; each pulse costs
    // eight strokes and a radial gradient per tile per frame. requestGenerate
    // re-arms the watchdog so the cheaper board is judged on its own frames.
    const degradeFallback = () => {
      watchdogDensity = 0.5
      pulseLimit = 8
      pulseData = pulseData.slice(0, pulseLimit)
      requestGenerate(true)
      announce("degraded")
    }

    // Stage 2: half a board is still too expensive. Stop rendering, fade the
    // last frame out, and let the generation worker go.
    const disableFallback = () => {
      fallbackDisabled = true
      announce("disabled")
      fadeOutCanvas(() => {
        genWorker.terminate()
        ctx.clearRect(0, 0, w, h * 2)
      })
    }

    let fid: number, lt = 0
    const loop = (t: number) => {
      if (t - lt >= FRAME_INTERVAL) {
        const started = performance.now()
        draw(t)
        lt = t
        const action = watchdog.sample(started, performance.now() - started, FRAME_INTERVAL)
        if (action === "degrade") degradeFallback()
        else if (action === "disable") { disableFallback(); return }
      }
      fid = requestAnimationFrame(loop)
    }
    fid = requestAnimationFrame(loop)

    return () => {
      cancelAnimationFrame(fid)
      clearTimeout(rt)
      clearTimeout(fadeTimer)
      genWorker.terminate()
      window.removeEventListener("resize", onResize)
      window.removeEventListener("circuit-config", onConfig2)
      document.removeEventListener("visibilitychange", onVisibility)
      detachScroll()
      obs.disconnect()
    }
  }, [generation]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <canvas
      key={generation}
      ref={canvasRef}
      aria-hidden="true"
      className={`pointer-events-none fixed left-0 right-0 top-0 -z-10 h-[200lvh] circuit-bg-anim print:hidden${navOffset ? " md:left-60" : ""}`}
    />
  )
}
