"use client"

import { useEffect, useRef } from "react"

/**
 * PCB circuit board background using round-robin multi-path growth.
 * Paths grow simultaneously on a grid, one step at a time, with high
 * straightness bias. Produces orderly, dense PCB-like patterns reliably.
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

    interface Pad { x: number; y: number; r: number }
    interface Glow { x: number; y: number; r: number; ph: number; sp: number }
    interface Pulse { path: { x: number; y: number }[]; pr: number; sp: number; ln: number; w: number }
    interface DrawnTrace { pts: { x: number; y: number }[]; w: number }

    let drawnTraces: DrawnTrace[] = []
    let pads: Pad[] = []
    let glows: Glow[] = []
    let pulses: Pulse[] = []
    let w = 0, h = 0

    function getAccent(): string {
      return getComputedStyle(document.documentElement).getPropertyValue("--accent").trim() || "#64ffda"
    }
    function hexToRgb(hex: string): [number, number, number] {
      if (!hex.startsWith("#")) return [100, 255, 218]
      const s = hex.slice(1)
      if (s.length === 3) return [parseInt(s[0]+s[0],16), parseInt(s[1]+s[1],16), parseInt(s[2]+s[2],16)]
      return [parseInt(s.slice(0,2),16), parseInt(s.slice(2,4),16), parseInt(s.slice(4,6),16)]
    }

    // 8 directions: R, D, L, U, DR, DL, UL, UR
    const DX = [1, 0, -1, 0, 1, -1, -1, 1]
    const DY = [0, 1, 0, -1, 1, 1, -1, -1]

    function generate() {
      drawnTraces = []; pads = []; glows = []; pulses = []

      const gridSize = 10 // Balance between density and performance
      const cols = Math.ceil(w / gridSize)
      const rows = Math.ceil(h / gridSize)
      const grid = new Uint8Array(cols * rows) // 0=free, 1=occupied

      const at = (x: number, y: number) => y * cols + x
      const inBounds = (x: number, y: number) => x >= 0 && x < cols && y >= 0 && y < rows
      const isFree = (x: number, y: number) => inBounds(x, y) && grid[at(x, y)] === 0

      function occupy(x: number, y: number) {
        if (inBounds(x, y)) grid[at(x, y)] = 1
      }

      // Check if cell is free (tight packing, no neighbor check)
      function canPlace(x: number, y: number): boolean {
        return isFree(x, y)
      }

      // Active growing paths
      interface GrowingPath {
        x: number
        y: number
        dir: number // 0-7
        history: { x: number; y: number }[]
        maxLen: number
        alive: boolean
        width: number
        isBundle: boolean
        blockedCount: number // consecutive blocks — die after 2 to prevent zig-zag
      }

      const paths: GrowingPath[] = []

      // Seed paths from edges and random interior points
      function seedPath(x: number, y: number, dir: number, maxLen: number, width: number, isBundle = false) {
        if (!canPlace(x, y)) return
        occupy(x, y)
        paths.push({ x, y, dir, history: [{ x, y }], maxLen, alive: true, width, isBundle, blockedCount: 0 })
      }

      // Seed parallel bundles from edges — groups of 2-4 traces with 2-cell spacing
      function seedBundle(startX: number, startY: number, dir: number, perpDx: number, perpDy: number) {
        const bundleSize = 2 + Math.floor(Math.random() * 3) // 2-4 traces
        const pathLen = 25 + Math.floor(Math.random() * 40)
        const w = 0.6 + Math.random() * 0.5
        for (let i = 0; i < bundleSize; i++) {
          const offset = i * 2
          seedPath(startX + perpDx * offset, startY + perpDy * offset, dir, pathLen, w)
        }
      }

      // Top edge bundles going down
      for (let x = 3; x < cols - 10; x += 6 + Math.floor(Math.random() * 6)) {
        seedBundle(x, 0, 1, 1, 0)
      }
      // Bottom edge bundles going up
      for (let x = 3; x < cols - 10; x += 6 + Math.floor(Math.random() * 6)) {
        seedBundle(x, rows - 1, 3, 1, 0)
      }
      // Left edge bundles going right
      for (let y = 3; y < rows - 10; y += 6 + Math.floor(Math.random() * 6)) {
        seedBundle(0, y, 0, 0, 1)
      }
      // Right edge bundles going left
      for (let y = 3; y < rows - 10; y += 6 + Math.floor(Math.random() * 6)) {
        seedBundle(cols - 1, y, 2, 0, 1)
      }

      // Single edge traces filling gaps
      for (let x = 2; x < cols - 2; x += 4 + Math.floor(Math.random() * 3)) {
        seedPath(x, 0, 1, 20 + Math.floor(Math.random() * 30), 0.5 + Math.random() * 0.5)
        seedPath(x, rows - 1, 3, 20 + Math.floor(Math.random() * 30), 0.5 + Math.random() * 0.5)
      }
      for (let y = 2; y < rows - 2; y += 4 + Math.floor(Math.random() * 3)) {
        seedPath(0, y, 0, 20 + Math.floor(Math.random() * 30), 0.5 + Math.random() * 0.5)
        seedPath(cols - 1, y, 2, 20 + Math.floor(Math.random() * 30), 0.5 + Math.random() * 0.5)
      }

      // Interior seed bundles
      const interiorBundles = Math.floor((cols * rows) / 800) + 8
      for (let i = 0; i < interiorBundles; i++) {
        const x = 5 + Math.floor(Math.random() * (cols - 10))
        const y = 5 + Math.floor(Math.random() * (rows - 10))
        const dir = Math.floor(Math.random() * 4)
        const perpDx = dir === 1 || dir === 3 ? 1 : 0
        const perpDy = dir === 0 || dir === 2 ? 1 : 0
        seedBundle(x, y, dir, perpDx, perpDy)
      }

      // Interior single seeds
      const interiorSeeds = Math.floor((cols * rows) / 250) + 15
      for (let i = 0; i < interiorSeeds; i++) {
        const x = 3 + Math.floor(Math.random() * (cols - 6))
        const y = 3 + Math.floor(Math.random() * (rows - 6))
        const dir = Math.floor(Math.random() * 4) // Cardinal only
        seedPath(x, y, dir, 15 + Math.floor(Math.random() * 35), 0.5 + Math.random() * 0.8)
      }

      // Round-robin growth: grow all paths one step at a time
      const STRAIGHTNESS = 0.90 // High straightness but enough turns for PCB look
      const maxSteps = 80

      for (let step = 0; step < maxSteps; step++) {
        // Shuffle path order each step for even distribution
        const indices = Array.from({ length: paths.length }, (_, i) => i)
        for (let i = indices.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [indices[i], indices[j]] = [indices[j], indices[i]]
        }

        let anyAlive = false

        for (const pi of indices) {
          const p = paths[pi]
          if (!p.alive) continue
          if (p.history.length >= p.maxLen) { p.alive = false; continue }

          anyAlive = true

          // Decide direction: straight, 90-degree turn, or short 45-degree chamfer
          let newDir = p.dir
          if (Math.random() > STRAIGHTNESS) {
            if (p.dir < 4) {
              // Cardinal: 60% chance 90-degree, 40% chance 45-degree chamfer
              if (Math.random() < 0.6) {
                newDir = (p.dir + (Math.random() < 0.5 ? 1 : 3)) % 4
              } else {
                newDir = (p.dir + (Math.random() < 0.5 ? 1 : 7)) % 8
              }
            } else {
              // Diagonal: snap back to cardinal
              const cardinals = [[0, 1], [1, 2], [2, 3], [3, 0]]
              const opts = cardinals[p.dir - 4]
              newDir = opts[Math.floor(Math.random() * 2)]
            }
          }

          const nx = p.x + DX[newDir]
          const ny = p.y + DY[newDir]

          if (canPlace(nx, ny)) {
            occupy(nx, ny)
            p.x = nx
            p.y = ny
            p.dir = newDir
            p.history.push({ x: nx, y: ny })
            p.blockedCount = 0
          } else {
            p.blockedCount++
            // Allow one turn attempt, but die on second consecutive block (prevents zig-zag)
            if (p.blockedCount >= 2) {
              p.alive = false
              // Branch at dead end
              if (p.history.length > 4 && Math.random() < 0.5) {
                const perpDir = (p.dir + (Math.random() < 0.5 ? 1 : 3)) % 4
                seedPath(p.x + DX[perpDir], p.y + DY[perpDir], perpDir, 8 + Math.floor(Math.random() * 15), p.width * 0.8)
              }
            } else {
              // First block: try one 90-degree turn
              const tryDir = (p.dir + (Math.random() < 0.5 ? 1 : 3)) % 4
              const tx = p.x + DX[tryDir]
              const ty = p.y + DY[tryDir]
              if (canPlace(tx, ty)) {
                occupy(tx, ty)
                p.x = tx
                p.y = ty
                p.dir = tryDir
                p.history.push({ x: tx, y: ty })
              } else {
                p.alive = false
              }
            }
          }
        }

        if (!anyAlive) break
      }

      // Convert path histories to drawable traces (simplify: collapse consecutive same-direction into line segments)
      for (const p of paths) {
        if (p.history.length < 3) continue

        const simplified: { x: number; y: number }[] = [p.history[0]]

        for (let i = 1; i < p.history.length - 1; i++) {
          const prev = p.history[i - 1]
          const curr = p.history[i]
          const next = p.history[i + 1]
          const dx1 = curr.x - prev.x, dy1 = curr.y - prev.y
          const dx2 = next.x - curr.x, dy2 = next.y - curr.y
          // Only keep point if direction changes
          if (dx1 !== dx2 || dy1 !== dy2) {
            simplified.push(curr)
          }
        }
        simplified.push(p.history[p.history.length - 1])

        drawnTraces.push({
          pts: simplified.map(pt => ({ x: pt.x * gridSize, y: pt.y * gridSize })),
          w: p.width
        })

        // Terminal pad
        const last = p.history[p.history.length - 1]
        pads.push({ x: last.x * gridSize, y: last.y * gridSize, r: 1.5 + Math.random() * 2 })

        // Start pad (sometimes)
        if (Math.random() < 0.3) {
          const first = p.history[0]
          pads.push({ x: first.x * gridSize, y: first.y * gridSize, r: 1.5 + Math.random() * 1.5 })
        }
      }

      // Glows at random trace endpoints
      const glowCount = Math.min(Math.floor(drawnTraces.length / 8), 20)
      for (let i = 0; i < glowCount; i++) {
        const tr = drawnTraces[Math.floor(Math.random() * drawnTraces.length)]
        const p = tr.pts[Math.floor(Math.random() * tr.pts.length)]
        glows.push({ x: p.x, y: p.y, r: 3 + Math.random() * 5, ph: Math.random() * Math.PI * 2, sp: 0.2 + Math.random() * 0.5 })
      }

      // Animated pulses
      if (!reducedMotion && drawnTraces.length > 0) {
        const pc = Math.min(Math.floor(drawnTraces.length / 8), 8)
        for (let i = 0; i < pc; i++) {
          const tr = drawnTraces[Math.floor(Math.random() * drawnTraces.length)]
          pulses.push({ path: tr.pts, pr: Math.random(), sp: 0.0005 + Math.random() * 0.001, ln: 0.04 + Math.random() * 0.04, w: tr.w })
        }
      }
    }

    function resize() {
      w = canvas.clientWidth; h = canvas.clientHeight
      canvas.width = w * dpr; canvas.height = h * dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      generate()
    }

    function draw(time: number) {
      const accent = getAccent()
      const [r, g, b] = hexToRgb(accent)
      ctx.clearRect(0, 0, w, h)

      // Traces
      for (const tr of drawnTraces) {
        ctx.beginPath()
        ctx.moveTo(tr.pts[0].x, tr.pts[0].y)
        for (let i = 1; i < tr.pts.length; i++) ctx.lineTo(tr.pts[i].x, tr.pts[i].y)
        ctx.strokeStyle = `rgba(${r},${g},${b},0.13)`
        ctx.lineWidth = tr.w
        ctx.lineCap = "round"
        ctx.lineJoin = "round"
        ctx.stroke()
      }

      // Pads
      for (const p of pads) {
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},0.14)`
        ctx.fill()
      }

      // Glows
      const t = time * 0.001
      for (const gl of glows) {
        const pulse = reducedMotion ? 0.6 : 0.4 + Math.sin(t * gl.sp + gl.ph) * 0.3
        const gr = ctx.createRadialGradient(gl.x, gl.y, 0, gl.x, gl.y, gl.r * 5)
        gr.addColorStop(0, `rgba(${r},${g},${b},${0.2 * pulse})`)
        gr.addColorStop(0.5, `rgba(${r},${g},${b},${0.06 * pulse})`)
        gr.addColorStop(1, `rgba(${r},${g},${b},0)`)
        ctx.beginPath()
        ctx.arc(gl.x, gl.y, gl.r * 5, 0, Math.PI * 2)
        ctx.fillStyle = gr
        ctx.fill()
        ctx.beginPath()
        ctx.arc(gl.x, gl.y, gl.r * 0.5, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${r},${g},${b},${0.4 * pulse})`
        ctx.fill()
      }

      // Pulses
      if (!reducedMotion) {
        for (const pl of pulses) {
          if (pl.path.length < 2) continue
          let tl = 0; const sl: number[] = []
          for (let i = 1; i < pl.path.length; i++) {
            const dx = pl.path[i].x - pl.path[i-1].x, dy = pl.path[i].y - pl.path[i-1].y
            sl.push(Math.sqrt(dx*dx+dy*dy)); tl += sl[sl.length-1]
          }
          if (tl < 1) continue
          const hd = pl.pr * tl, td = Math.max(0, hd - pl.ln * tl)
          function pt(d: number) {
            let a = 0
            for (let i = 0; i < sl.length; i++) {
              if (a + sl[i] >= d) { const f = (d-a)/sl[i]; return { x: pl.path[i].x+(pl.path[i+1].x-pl.path[i].x)*f, y: pl.path[i].y+(pl.path[i+1].y-pl.path[i].y)*f } }
              a += sl[i]
            }
            return pl.path[pl.path.length-1]
          }
          for (let s = 0; s < 10; s++) {
            const f = s/10, p1 = pt(td+(hd-td)*f), p2 = pt(td+(hd-td)*((s+1)/10))
            ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.lineTo(p2.x, p2.y)
            ctx.strokeStyle = `rgba(${r},${g},${b},${f*f*0.5})`; ctx.lineWidth = pl.w+2; ctx.lineCap = "round"; ctx.stroke()
          }
          const head = pt(hd)
          ctx.save()
          ctx.shadowColor = `rgba(${r},${g},${b},0.7)`; ctx.shadowBlur = 10
          ctx.beginPath(); ctx.arc(head.x, head.y, 2.5, 0, Math.PI*2)
          ctx.fillStyle = `rgba(${r},${g},${b},0.8)`; ctx.fill()
          ctx.restore()
          pl.pr += pl.sp
          if (pl.pr > 1.15) { pl.pr = -pl.ln }
        }
      }
    }

    resize()
    let rt: ReturnType<typeof setTimeout>
    const onR = () => { clearTimeout(rt); rt = setTimeout(resize, 300) }
    window.addEventListener("resize", onR)
    const obs = new MutationObserver(() => { if (reducedMotion) draw(0) })
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] })
    if (reducedMotion) { draw(0); return () => { window.removeEventListener("resize", onR); obs.disconnect() } }
    let fid: number, lt = 0
    const loop = (t: number) => { if (t-lt >= 33) { draw(t); lt = t }; fid = requestAnimationFrame(loop) }
    fid = requestAnimationFrame(loop)
    return () => { cancelAnimationFrame(fid); window.removeEventListener("resize", onR); obs.disconnect() }
  }, [])

  return <canvas ref={canvasRef} aria-hidden="true" className="pointer-events-none absolute inset-0 h-full w-full print:hidden" />
}
