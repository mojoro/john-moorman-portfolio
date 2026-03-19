"use client"

import { useEffect, useRef } from "react"

/**
 * PCB circuit board background — optimized.
 *
 * Generation: round-robin multi-path growth on occupancy grid.
 * Rendering: batched canvas draws, cached colors, pre-computed pulse geometry.
 */
export function CircuitBg() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext("2d")
    if (!ctx) return

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    const dpr = Math.min(window.devicePixelRatio || 1, 2)

    // ── Pre-computed data (set once per generate, reused every frame) ──

    // Flat arrays instead of object arrays for traces
    // Each trace: startIdx into pts array, length, width
    let traceMeta: Float32Array = new Float32Array(0) // [startIdx, ptCount, width] per trace
    let tracePts: Float32Array = new Float32Array(0)  // [x, y] flat pairs
    let traceCount = 0

    let padX: Float32Array = new Float32Array(0)
    let padY: Float32Array = new Float32Array(0)
    let padR: Float32Array = new Float32Array(0)
    let padCount = 0

    let glowX: Float32Array = new Float32Array(0)
    let glowY: Float32Array = new Float32Array(0)
    let glowR: Float32Array = new Float32Array(0)
    let glowPh: Float32Array = new Float32Array(0)
    let glowSp: Float32Array = new Float32Array(0)
    let glowCount = 0

    // Pulses with pre-computed segment lengths
    interface PulseData {
      pts: Float32Array   // [x,y] pairs
      segLens: Float32Array
      totalLen: number
      pr: number
      sp: number
      ln: number
      w: number
    }
    let pulseData: PulseData[] = []

    let w = 0, h = 0

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
      // Light mode needs much higher opacity to be visible on light backgrounds
      const traceAlpha = isLightMode ? 0.18 : 0.13
      const padAlpha = isLightMode ? 0.22 : 0.14
      traceColor = `rgba(${cachedR},${cachedG},${cachedB},${traceAlpha})`
      padColor = `rgba(${cachedR},${cachedG},${cachedB},${padAlpha})`
    }

    // Direction vectors
    const DX = [1, 0, -1, 0, 1, -1, -1, 1]
    const DY = [0, 1, 0, -1, 1, 1, -1, -1]

    function generate() {
      const gridSize = 10
      const cols = Math.ceil(w / gridSize)
      const rows = Math.ceil(h / gridSize)
      const grid = new Uint8Array(cols * rows)

      const at = (x: number, y: number) => y * cols + x
      const inBounds = (x: number, y: number) => x >= 0 && x < cols && y >= 0 && y < rows
      const canPlace = (x: number, y: number) => inBounds(x, y) && grid[at(x, y)] === 0

      function occupy(x: number, y: number) {
        if (inBounds(x, y)) grid[at(x, y)] = 1
      }

      // Path storage — use flat arrays to reduce GC pressure
      const MAX_PATHS = 2000
      const MAX_HISTORY = 100
      // Per-path state
      const px = new Int16Array(MAX_PATHS)
      const py = new Int16Array(MAX_PATHS)
      const pdir = new Uint8Array(MAX_PATHS)
      const phistX = new Int16Array(MAX_PATHS * MAX_HISTORY)
      const phistY = new Int16Array(MAX_PATHS * MAX_HISTORY)
      const phistLen = new Uint16Array(MAX_PATHS)
      const pmaxLen = new Uint16Array(MAX_PATHS)
      const palive = new Uint8Array(MAX_PATHS)
      const pwidth = new Float32Array(MAX_PATHS)
      const pblocked = new Uint8Array(MAX_PATHS)
      let pathCount = 0

      function seedPath(x: number, y: number, dir: number, maxLen: number, width: number) {
        if (pathCount >= MAX_PATHS || !canPlace(x, y)) return
        occupy(x, y)
        const i = pathCount++
        px[i] = x; py[i] = y; pdir[i] = dir
        phistX[i * MAX_HISTORY] = x; phistY[i * MAX_HISTORY] = y
        phistLen[i] = 1; pmaxLen[i] = Math.min(maxLen, MAX_HISTORY)
        palive[i] = 1; pwidth[i] = width; pblocked[i] = 0
      }

      function seedBundle(startX: number, startY: number, dir: number, perpDx: number, perpDy: number) {
        const bundleSize = 3 + Math.floor(Math.random() * 5)
        const pathLen = 40 + Math.floor(Math.random() * 50)
        const bw = 0.6 + Math.random() * 0.5
        for (let i = 0; i < bundleSize; i++) {
          seedPath(startX + perpDx * i, startY + perpDy * i, dir, pathLen, bw)
        }
      }

      // Seed from edges
      for (let x = 3; x < cols - 10; x += 6 + Math.floor(Math.random() * 6)) seedBundle(x, 0, 1, 1, 0)
      for (let x = 3; x < cols - 10; x += 6 + Math.floor(Math.random() * 6)) seedBundle(x, rows - 1, 3, 1, 0)
      for (let y = 3; y < rows - 10; y += 6 + Math.floor(Math.random() * 6)) seedBundle(0, y, 0, 0, 1)
      for (let y = 3; y < rows - 10; y += 6 + Math.floor(Math.random() * 6)) seedBundle(cols - 1, y, 2, 0, 1)

      // Single edge fills
      for (let x = 2; x < cols - 2; x += 4 + Math.floor(Math.random() * 3)) {
        seedPath(x, 0, 1, 30 + Math.floor(Math.random() * 40), 0.5 + Math.random() * 0.5)
        seedPath(x, rows - 1, 3, 30 + Math.floor(Math.random() * 40), 0.5 + Math.random() * 0.5)
      }
      for (let y = 2; y < rows - 2; y += 4 + Math.floor(Math.random() * 3)) {
        seedPath(0, y, 0, 30 + Math.floor(Math.random() * 40), 0.5 + Math.random() * 0.5)
        seedPath(cols - 1, y, 2, 30 + Math.floor(Math.random() * 40), 0.5 + Math.random() * 0.5)
      }

      // Interior bundles
      const intBundles = Math.floor((cols * rows) / 800) + 8
      for (let i = 0; i < intBundles; i++) {
        const x = 5 + Math.floor(Math.random() * (cols - 10))
        const y = 5 + Math.floor(Math.random() * (rows - 10))
        const dir = Math.floor(Math.random() * 4)
        const perpDx = dir === 1 || dir === 3 ? 1 : 0
        const perpDy = dir === 0 || dir === 2 ? 1 : 0
        seedBundle(x, y, dir, perpDx, perpDy)
      }

      // Interior singles
      const intSeeds = Math.floor((cols * rows) / 250) + 15
      for (let i = 0; i < intSeeds; i++) {
        const x = 3 + Math.floor(Math.random() * (cols - 6))
        const y = 3 + Math.floor(Math.random() * (rows - 6))
        seedPath(x, y, Math.floor(Math.random() * 4), 30 + Math.floor(Math.random() * 40), 0.5 + Math.random() * 0.8)
      }

      // ── Round-robin growth ──
      const STRAIGHTNESS = 0.93
      const maxSteps = 80

      // Reusable shuffle array
      const shuffleArr = new Uint16Array(MAX_PATHS)

      for (let step = 0; step < maxSteps; step++) {
        const n = pathCount
        for (let i = 0; i < n; i++) shuffleArr[i] = i
        // Fisher-Yates in-place
        for (let i = n - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1))
          const tmp = shuffleArr[i]; shuffleArr[i] = shuffleArr[j]; shuffleArr[j] = tmp
        }

        let anyAlive = false

        for (let si = 0; si < n; si++) {
          const pi = shuffleArr[si]
          if (!palive[pi]) continue
          if (phistLen[pi] >= pmaxLen[pi]) { palive[pi] = 0; continue }

          anyAlive = true

          let newDir = pdir[pi]
          if (Math.random() > STRAIGHTNESS) {
            if (newDir < 4) {
              if (Math.random() < 0.6) {
                newDir = (newDir + (Math.random() < 0.5 ? 1 : 3)) % 4
              } else {
                newDir = (newDir + (Math.random() < 0.5 ? 1 : 7)) % 8
              }
            } else {
              const cardinals = [[0, 1], [1, 2], [2, 3], [3, 0]]
              const opts = cardinals[newDir - 4]
              newDir = opts[Math.floor(Math.random() * 2)]
            }
          }

          const nx = px[pi] + DX[newDir]
          const ny = py[pi] + DY[newDir]

          if (canPlace(nx, ny)) {
            occupy(nx, ny)
            px[pi] = nx; py[pi] = ny; pdir[pi] = newDir
            const hi = pi * MAX_HISTORY + phistLen[pi]
            phistX[hi] = nx; phistY[hi] = ny
            phistLen[pi]++
            pblocked[pi] = 0
          } else {
            pblocked[pi]++
            if (pblocked[pi] >= 2) {
              palive[pi] = 0
              if (phistLen[pi] > 4 && Math.random() < 0.5) {
                const perpDir = (pdir[pi] + (Math.random() < 0.5 ? 1 : 3)) % 4
                seedPath(px[pi] + DX[perpDir], py[pi] + DY[perpDir], perpDir, 8 + Math.floor(Math.random() * 15), pwidth[pi] * 0.8)
              }
            } else {
              const tryDir = (pdir[pi] + (Math.random() < 0.5 ? 1 : 3)) % 4
              const tx = px[pi] + DX[tryDir], ty = py[pi] + DY[tryDir]
              if (canPlace(tx, ty)) {
                occupy(tx, ty)
                px[pi] = tx; py[pi] = ty; pdir[pi] = tryDir
                const hi = pi * MAX_HISTORY + phistLen[pi]
                phistX[hi] = tx; phistY[hi] = ty
                phistLen[pi]++
              } else {
                palive[pi] = 0
              }
            }
          }
        }

        if (!anyAlive) break
      }

      // ── Convert to render data ──
      // Collect all simplified traces
      const tempTraces: { pts: number[]; w: number }[] = [] // pts as flat [x,y,x,y,...]
      const tempPads: { x: number; y: number; r: number }[] = []

      for (let pi = 0; pi < pathCount; pi++) {
        const len = phistLen[pi]
        if (len < 3) continue
        const base = pi * MAX_HISTORY

        // Simplify: keep only direction-change points
        const simplified: number[] = [phistX[base] * gridSize, phistY[base] * gridSize]

        for (let i = 1; i < len - 1; i++) {
          const dx1 = phistX[base + i] - phistX[base + i - 1]
          const dy1 = phistY[base + i] - phistY[base + i - 1]
          const dx2 = phistX[base + i + 1] - phistX[base + i]
          const dy2 = phistY[base + i + 1] - phistY[base + i]
          if (dx1 !== dx2 || dy1 !== dy2) {
            simplified.push(phistX[base + i] * gridSize, phistY[base + i] * gridSize)
          }
        }
        simplified.push(phistX[base + len - 1] * gridSize, phistY[base + len - 1] * gridSize)

        if (simplified.length >= 4) {
          tempTraces.push({ pts: simplified, w: pwidth[pi] })

          // Terminal pad
          tempPads.push({ x: simplified[simplified.length - 2], y: simplified[simplified.length - 1], r: 1.5 + Math.random() * 2 })
          if (Math.random() < 0.3) {
            tempPads.push({ x: simplified[0], y: simplified[1], r: 1.5 + Math.random() * 1.5 })
          }
        }
      }

      // Pack into typed arrays
      traceCount = tempTraces.length
      let totalPts = 0
      for (const t of tempTraces) totalPts += t.pts.length

      traceMeta = new Float32Array(traceCount * 3)
      tracePts = new Float32Array(totalPts)
      let ptOffset = 0
      for (let i = 0; i < traceCount; i++) {
        const t = tempTraces[i]
        traceMeta[i * 3] = ptOffset
        traceMeta[i * 3 + 1] = t.pts.length / 2
        traceMeta[i * 3 + 2] = t.w
        for (let j = 0; j < t.pts.length; j++) tracePts[ptOffset++] = t.pts[j]
      }

      padCount = tempPads.length
      padX = new Float32Array(padCount)
      padY = new Float32Array(padCount)
      padR = new Float32Array(padCount)
      for (let i = 0; i < padCount; i++) {
        padX[i] = tempPads[i].x; padY[i] = tempPads[i].y; padR[i] = tempPads[i].r
      }

      // Glows
      glowCount = Math.min(Math.floor(traceCount / 8), 20)
      glowX = new Float32Array(glowCount)
      glowY = new Float32Array(glowCount)
      glowR = new Float32Array(glowCount)
      glowPh = new Float32Array(glowCount)
      glowSp = new Float32Array(glowCount)
      for (let i = 0; i < glowCount; i++) {
        const ti = Math.floor(Math.random() * traceCount)
        const startIdx = traceMeta[ti * 3]
        const ptCount = traceMeta[ti * 3 + 1]
        const pi = Math.floor(Math.random() * ptCount)
        glowX[i] = tracePts[startIdx + pi * 2]
        glowY[i] = tracePts[startIdx + pi * 2 + 1]
        glowR[i] = 3 + Math.random() * 5
        glowPh[i] = Math.random() * Math.PI * 2
        glowSp[i] = 0.2 + Math.random() * 0.5
      }

      // Pulses — pre-compute segment lengths and total length
      pulseData = []
      if (!reducedMotion && traceCount > 0) {
        const pc = Math.min(Math.floor(traceCount / 8), 8)
        for (let i = 0; i < pc; i++) {
          const ti = Math.floor(Math.random() * traceCount)
          const startIdx = traceMeta[ti * 3]
          const ptCount = traceMeta[ti * 3 + 1]
          if (ptCount < 2) continue

          const pts = new Float32Array(ptCount * 2)
          for (let j = 0; j < ptCount * 2; j++) pts[j] = tracePts[startIdx + j]

          const segLens = new Float32Array(ptCount - 1)
          let totalLen = 0
          for (let j = 0; j < ptCount - 1; j++) {
            const dx = pts[(j + 1) * 2] - pts[j * 2]
            const dy = pts[(j + 1) * 2 + 1] - pts[j * 2 + 1]
            const len = Math.sqrt(dx * dx + dy * dy)
            segLens[j] = len
            totalLen += len
          }

          if (totalLen < 10) continue

          pulseData.push({
            pts, segLens, totalLen,
            pr: 0, // Start at beginning — no teleporting
            sp: 0.0005 + Math.random() * 0.001,
            ln: 0.04 + Math.random() * 0.04,
            w: traceMeta[ti * 3 + 2],
          })
        }
      }

      updateColors()
    }

    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      generate()
    }

    function draw(time: number) {
      ctx.clearRect(0, 0, w, h)

      // ── Traces (batched by similar width for fewer state changes) ──
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

      // ── Pads (single fillStyle, batched) ──
      ctx.fillStyle = padColor
      for (let i = 0; i < padCount; i++) {
        ctx.beginPath()
        ctx.arc(padX[i], padY[i], padR[i], 0, 6.2832) // 2*PI
        ctx.fill()
      }

      // ── Glows ──
      const t = time * 0.001
      const r = cachedR, g = cachedG, b = cachedB
      const glowMult = isLightMode ? 1.8 : 1.0 // Boost glow visibility in light mode
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

      // ── Pulses (pre-computed segment lengths, no teleporting) ──
      if (!reducedMotion) {
        for (const pl of pulseData) {
          // Skip if pulse hasn't entered the trace yet
          if (pl.pr < 0) { pl.pr += pl.sp; continue }

          const hd = pl.pr * pl.totalLen
          const td = Math.max(0, hd - pl.ln * pl.totalLen)

          // Interpolate point at distance along pre-computed segments
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
            const last = (pl.segLens.length) * 2
            return [pl.pts[last], pl.pts[last + 1]]
          }

          // Draw gradient tail
          const pulseMult = isLightMode ? 1.6 : 1.0
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

          // Head glow
          const [hx, hy] = ptAt(hd)
          const headAlpha = isLightMode ? 1.0 : 0.8
          const headGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, 8)
          headGrad.addColorStop(0, `rgba(${r},${g},${b},${headAlpha})`)
          headGrad.addColorStop(0.3, `rgba(${r},${g},${b},${headAlpha * 0.4})`)
          headGrad.addColorStop(1, `rgba(${r},${g},${b},0)`)
          ctx.fillStyle = headGrad
          ctx.beginPath()
          ctx.arc(hx, hy, 8, 0, 6.2832)
          ctx.fill()

          // Advance pulse
          pl.pr += pl.sp
          if (pl.pr > 1.05) { pl.pr = -pl.ln * 0.5 } // Brief invisible gap before restart
        }
      }
    }

    // ── Lifecycle ──

    resize()
    let rt: ReturnType<typeof setTimeout>
    const onR = () => { clearTimeout(rt); rt = setTimeout(resize, 300) }
    window.addEventListener("resize", onR)

    // Update colors on theme change
    const obs = new MutationObserver(() => {
      updateColors()
      if (reducedMotion) draw(0)
    })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })

    if (reducedMotion) {
      draw(0)
      return () => { window.removeEventListener("resize", onR); obs.disconnect() }
    }

    let fid: number, lt = 0
    const loop = (t: number) => {
      if (t - lt >= 33) { draw(t); lt = t }
      fid = requestAnimationFrame(loop)
    }
    fid = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(fid); window.removeEventListener("resize", onR); obs.disconnect() }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full print:hidden" />
}
