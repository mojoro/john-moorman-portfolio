/**
 * Combined OffscreenCanvas worker for the PCB circuit background.
 *
 * Handles both circuit generation and continuous animation entirely off the
 * main thread. The main thread transfers the canvas once and only sends
 * lightweight resize/theme messages thereafter.
 *
 * The OffscreenCanvas is 2× viewport height. The circuit is generated for
 * one viewport tile and drawn twice per frame (tile 1 at y=0, tile 2 at y=h).
 * Seam stubs — short mirrored vertical traces at the top and bottom edges —
 * connect geometrically when the tile repeats, hiding the seam.
 *
 * Protocol (main → worker):
 *   { type: 'init',   canvas: OffscreenCanvas, w, h, dpr, reducedMotion, theme, accent, density }
 *   { type: 'resize', w, h, dpr, density }
 *   { type: 'theme',  theme, accent }
 */

export {}

// ── Types ──────────────────────────────────────────────────────────────────

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

interface DrawablePulse {
  pl: PulseData
  life: number
  hd: number
  td: number
}

type Theme = "dark" | "light"

// ── Module-level state ─────────────────────────────────────────────────────

let offscreen: OffscreenCanvas
let ctx: OffscreenCanvasRenderingContext2D

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

let pulseData: PulseData[] = []

let w = 0
let h = 0
let dpr = 1
let reducedMotion = false
let ready = false

// Color cache
let cachedR = 100
let cachedG = 255
let cachedB = 218
let traceColor = ""
let padColor = ""
let isLightMode = false

// Animation
let animTimer: ReturnType<typeof setInterval> | null = null

// ── Color helpers ──────────────────────────────────────────────────────────

function applyAccent(accent: string, theme: Theme) {
  isLightMode = theme === "light"
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
  const traceAlpha = isLightMode ? 0.11 : 0.06
  const padAlpha = isLightMode ? 0.13 : 0.07
  traceColor = `rgba(${cachedR},${cachedG},${cachedB},${traceAlpha})`
  padColor = `rgba(${cachedR},${cachedG},${cachedB},${padAlpha})`
}

// ── Generation ─────────────────────────────────────────────────────────────

const DX = [1, 0, -1, 0, 1, -1, -1, 1]
const DY = [0, 1, 0, -1, 1, 1, -1, -1]

function generate(gw: number, gh: number, rm: boolean, density: number) {
  const gridSize = 10
  const cols = Math.ceil(gw / gridSize)
  const rows = Math.ceil(gh / gridSize)
  const grid = new Uint8Array(cols * rows)

  const at = (x: number, y: number) => y * cols + x
  const inBounds = (x: number, y: number) => x >= 0 && x < cols && y >= 0 && y < rows
  const canPlace = (x: number, y: number) => inBounds(x, y) && grid[at(x, y)] === 0

  function occupy(x: number, y: number) {
    if (inBounds(x, y)) grid[at(x, y)] = 1
  }

  // ── Path storage ──

  const MAX_PATHS = 2000
  const MAX_HISTORY = 100
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

  // ── Seaming stubs (seamless vertical tiling) ──
  //
  // Short deterministic vertical traces at evenly-spaced x positions.
  // Top stubs (y=0 → seamRows) and bottom stubs (y=rows-1 → rows-1-seamRows)
  // use identical x positions and widths. When the tile stacks, the bottom
  // stub of tile N and the top stub of tile N+1 meet at the seam and form a
  // continuous trace — no cross-fade or empty stripe needed.
  // All other generation branches out independently from the stub endpoints.

  const seamRows = Math.max(3, Math.ceil(rows * 0.05))
  const seamStep = 8  // one stub pair every 8 grid columns (~80 px)

  for (let sx = 4; sx < cols - 4; sx += seamStep) {
    const sw = 0.5 + ((sx * 3 + 7) % 15) / 30  // deterministic width 0.5..1.0

    // Top stub: (sx, 0) → (sx, seamRows), straight south
    if (pathCount < MAX_PATHS) {
      const pi = pathCount++
      for (let s = 0; s <= seamRows; s++) {
        phistX[pi * MAX_HISTORY + s] = sx
        phistY[pi * MAX_HISTORY + s] = s
        if (inBounds(sx, s)) grid[at(sx, s)] = 1
      }
      phistLen[pi] = seamRows + 1
      pwidth[pi] = sw
      palive[pi] = 0
      seedPath(sx, seamRows + 1, 1, 15 + (sx % 5) * 5, sw * 0.9)
    }

    // Bottom stub: (sx, rows) → (sx, rows-1-seamRows), straight north.
    // The first point at y=rows (one past the last valid grid row) ensures the
    // trace reaches the exact tile boundary h when drawn — Canvas2D clips it
    // to y=h, meeting tile 2's top stub at global y=h with no gap.
    if (pathCount < MAX_PATHS) {
      const pi = pathCount++
      phistX[pi * MAX_HISTORY] = sx
      phistY[pi * MAX_HISTORY] = rows  // tile boundary (rows*gridSize >= h)
      for (let s = 0; s <= seamRows; s++) {
        phistX[pi * MAX_HISTORY + 1 + s] = sx
        phistY[pi * MAX_HISTORY + 1 + s] = rows - 1 - s
        if (inBounds(sx, rows - 1 - s)) grid[at(sx, rows - 1 - s)] = 1
      }
      phistLen[pi] = seamRows + 2
      pwidth[pi] = sw
      palive[pi] = 0
      seedPath(sx, rows - 2 - seamRows, 3, 15 + (sx % 5) * 5, sw * 0.9)
    }
  }

  // ── Seeding ──

  // Left/right edge bundles (non-tiling edges — random seeding is fine here)
  for (let y = 3; y < rows - 10; y += 6 + Math.floor(Math.random() * 6)) seedBundle(0, y, 0, 0, 1)
  for (let y = 3; y < rows - 10; y += 6 + Math.floor(Math.random() * 6)) seedBundle(cols - 1, y, 2, 0, 1)
  for (let y = 2; y < rows - 2; y += 4 + Math.floor(Math.random() * 3)) {
    seedPath(0, y, 0, 30 + Math.floor(Math.random() * 40), 0.5 + Math.random() * 0.5)
    seedPath(cols - 1, y, 2, 30 + Math.floor(Math.random() * 40), 0.5 + Math.random() * 0.5)
  }

  // Interior seeds (density-scaled)
  const intBundles = Math.floor((cols * rows) / 800 * density) + 8
  for (let i = 0; i < intBundles; i++) {
    const x = 5 + Math.floor(Math.random() * (cols - 10))
    const y = 5 + Math.floor(Math.random() * (rows - 10))
    const dir = Math.floor(Math.random() * 4)
    const perpDx = dir === 1 || dir === 3 ? 1 : 0
    const perpDy = dir === 0 || dir === 2 ? 1 : 0
    seedBundle(x, y, dir, perpDx, perpDy)
  }

  const intSeeds = Math.floor((cols * rows) / 250 * density) + 15
  for (let i = 0; i < intSeeds; i++) {
    const x = 3 + Math.floor(Math.random() * (cols - 6))
    const y = 3 + Math.floor(Math.random() * (rows - 6))
    seedPath(x, y, Math.floor(Math.random() * 4), 30 + Math.floor(Math.random() * 40), 0.5 + Math.random() * 0.8)
  }

  // ── Round-robin growth ──

  const STRAIGHTNESS = 0.93
  const maxSteps = 80
  const shuffleArr = new Uint16Array(MAX_PATHS)

  for (let step = 0; step < maxSteps; step++) {
    const n = pathCount
    for (let i = 0; i < n; i++) shuffleArr[i] = i
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
        newDir = (newDir + (Math.random() < 0.5 ? 1 : 3)) % 4
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

  const tempTraces: { pts: number[]; w: number }[] = []
  const tempPads: { x: number; y: number; r: number }[] = []

  for (let pi = 0; pi < pathCount; pi++) {
    const len = phistLen[pi]
    if (len < 3) continue
    const base = pi * MAX_HISTORY

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
      tempPads.push({
        x: simplified[simplified.length - 2],
        y: simplified[simplified.length - 1],
        r: 1.5 + Math.random() * 2,
      })
      if (Math.random() < 0.3) {
        tempPads.push({ x: simplified[0], y: simplified[1], r: 1.5 + Math.random() * 1.5 })
      }
    }
  }

  // Pack traces
  const tc = tempTraces.length
  let totalPts = 0
  for (const t of tempTraces) totalPts += t.pts.length

  const tm = new Float32Array(tc * 3)
  const tp = new Float32Array(totalPts)
  let ptOffset = 0
  for (let i = 0; i < tc; i++) {
    const t = tempTraces[i]
    tm[i * 3] = ptOffset
    tm[i * 3 + 1] = t.pts.length / 2
    tm[i * 3 + 2] = t.w
    for (let j = 0; j < t.pts.length; j++) tp[ptOffset++] = t.pts[j]
  }

  // Pack pads
  const pc = tempPads.length
  const px2 = new Float32Array(pc)
  const py2 = new Float32Array(pc)
  const pr = new Float32Array(pc)
  for (let i = 0; i < pc; i++) {
    px2[i] = tempPads[i].x; py2[i] = tempPads[i].y; pr[i] = tempPads[i].r
  }

  // Pack glows
  const gc = Math.min(Math.floor(tc / 8), 20)
  const gx = new Float32Array(gc)
  const gy = new Float32Array(gc)
  const gr = new Float32Array(gc)
  const gph = new Float32Array(gc)
  const gsp = new Float32Array(gc)
  for (let i = 0; i < gc; i++) {
    const ti = Math.floor(Math.random() * tc)
    const startIdx = tm[ti * 3]
    const ptC = tm[ti * 3 + 1]
    const pi2 = Math.floor(Math.random() * ptC)
    gx[i] = tp[startIdx + pi2 * 2]
    gy[i] = tp[startIdx + pi2 * 2 + 1]
    gr[i] = 3 + Math.random() * 5
    gph[i] = Math.random() * Math.PI * 2
    gsp[i] = 0.2 + Math.random() * 0.5
  }

  // Pack pulses — one per unique trace so no two pulses share the same wire
  const pulses: PulseData[] = []
  if (!rm && tc > 0) {
    const numPulses = Math.min(Math.floor(tc / 4), 24)
    const usedTi = new Set<number>()
    for (let i = 0; i < numPulses; i++) {
      let ti = 0, ptC = 0, attempts = 0
      do {
        ti = Math.floor(Math.random() * tc)
        ptC = tm[ti * 3 + 1]
        attempts++
      } while ((ptC < 2 || usedTi.has(ti)) && attempts < 50)
      if (ptC < 2 || usedTi.has(ti)) continue
      usedTi.add(ti)
      const startIdx = tm[ti * 3]

      const pts = new Float32Array(ptC * 2)
      for (let j = 0; j < ptC * 2; j++) pts[j] = tp[startIdx + j]

      const segLens = new Float32Array(ptC - 1)
      let totalLen = 0
      for (let j = 0; j < ptC - 1; j++) {
        const ddx = pts[(j + 1) * 2] - pts[j * 2]
        const ddy = pts[(j + 1) * 2 + 1] - pts[j * 2 + 1]
        const slen = Math.sqrt(ddx * ddx + ddy * ddy)
        segLens[j] = slen
        totalLen += slen
      }

      if (totalLen < 10) continue

      const speedTier = Math.random()
      const sp =
        speedTier < 0.3
          ? 0.0008 + Math.random() * 0.0007
          : speedTier < 0.7
          ? 0.002 + Math.random() * 0.002
          : 0.005 + Math.random() * 0.004

      pulses.push({
        pts,
        segLens,
        totalLen,
        pr: Math.random() * (1.0 + sp * 200),
        sp,
        ln: 0.04 + Math.random() * 0.06,
        w: tm[ti * 3 + 2],
        ti,
      })
    }
  }

  // Write to module state
  traceMeta = tm; tracePts = tp; traceCount = tc
  padX = px2; padY = py2; padR = pr; padCount = pc
  glowX = gx; glowY = gy; glowR = gr; glowPh = gph; glowSp = gsp; glowCount = gc
  pulseData = pulses
  ready = true
}

// ── Pulse helpers ───────────────────────────────────────────────────────────

function ptAt(pl: PulseData, d: number): [number, number] {
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

// Re-assign a pulse to a new random unoccupied trace so each cycle looks different.
function resamplePulse(pl: PulseData) {
  if (traceCount === 0) return
  const occupied = new Set(pulseData.filter(p => p !== pl && p.pr > 0).map(p => p.ti))
  let ti = 0, ptC = 0, attempts = 0
  do {
    ti = Math.floor(Math.random() * traceCount)
    ptC = traceMeta[ti * 3 + 1]
    attempts++
  } while ((ptC < 2 || occupied.has(ti)) && attempts < 20)
  if (ptC < 2) return

  const startIdx = traceMeta[ti * 3]
  const pts = new Float32Array(ptC * 2)
  for (let j = 0; j < ptC * 2; j++) pts[j] = tracePts[startIdx + j]

  const segLens = new Float32Array(ptC - 1)
  let totalLen = 0
  for (let j = 0; j < ptC - 1; j++) {
    const ddx = pts[(j + 1) * 2] - pts[j * 2]
    const ddy = pts[(j + 1) * 2 + 1] - pts[j * 2 + 1]
    const slen = Math.sqrt(ddx * ddx + ddy * ddy)
    segLens[j] = slen
    totalLen += slen
  }
  if (totalLen < 10) return

  const speedTier = Math.random()
  pl.sp =
    speedTier < 0.3
      ? 0.0008 + Math.random() * 0.0007
      : speedTier < 0.7
      ? 0.002 + Math.random() * 0.002
      : 0.005 + Math.random() * 0.004

  pl.pts = pts
  pl.segLens = segLens
  pl.totalLen = totalLen
  pl.w = traceMeta[ti * 3 + 2]
  pl.ln = 0.04 + Math.random() * 0.06
  pl.ti = ti
}

// Advance pulse positions once per frame and return drawable states.
// Separating update from draw allows drawScene to be called twice per frame
// (once per tile) without double-advancing the animation.
function computePulseStates(): DrawablePulse[] {
  if (reducedMotion) return []
  const result: DrawablePulse[] = []
  for (const pl of pulseData) {
    const life =
      pl.pr < pl.ln
        ? pl.pr / pl.ln
        : pl.pr > 1.0
        ? Math.max(0, 1 - (pl.pr - 1.0) / pl.ln)
        : 1.0
    pl.pr += pl.sp
    // Pulse completed its journey — reset to start a new pass on a fresh trace.
    // Must NOT reset inside `life <= 0` because pr=0 also gives life=0,
    // which would trap the pulse in an infinite reset loop.
    if (pl.pr >= 1.0 + pl.ln) {
      pl.pr = 0
      resamplePulse(pl)
      continue
    }
    if (life <= 0) continue  // still in the initial fade-in ramp (pr: 0 → ln)
    const hd = Math.min(pl.pr, 1.0) * pl.totalLen
    const td = Math.max(0, (pl.pr - pl.ln) * pl.totalLen)
    if (hd - td < 1) continue
    result.push({ pl, life, hd, td })
  }
  return result
}

// ── Draw ───────────────────────────────────────────────────────────────────

// Draws one viewport-sized tile at the current transform origin.
// Called twice per frame: once for the tile at y=0, once translated to y=h.
function drawScene(time: number, drawablePulses: DrawablePulse[]) {
  const t = time * 0.001
  const r = cachedR, g = cachedG, b = cachedB

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
  const glowMult = isLightMode ? 1.0 : 0.8
  for (let i = 0; i < glowCount; i++) {
    const pulse = reducedMotion ? 0.6 : 0.4 + Math.sin(t * glowSp[i] + glowPh[i]) * 0.3
    const radius = glowR[i] * 5
    const gradR = ctx.createRadialGradient(glowX[i], glowY[i], 0, glowX[i], glowY[i], radius)
    gradR.addColorStop(0, `rgba(${r},${g},${b},${(0.2 * pulse * glowMult).toFixed(3)})`)
    gradR.addColorStop(0.5, `rgba(${r},${g},${b},${(0.06 * pulse * glowMult).toFixed(3)})`)
    gradR.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.fillStyle = gradR
    ctx.beginPath()
    ctx.arc(glowX[i], glowY[i], radius, 0, 6.2832)
    ctx.fill()
    ctx.fillStyle = `rgba(${r},${g},${b},${(0.4 * pulse * glowMult).toFixed(3)})`
    ctx.beginPath()
    ctx.arc(glowX[i], glowY[i], glowR[i] * 0.5, 0, 6.2832)
    ctx.fill()
  }

  // Pulses (desktop only, pre-computed states — no position advancement here)
  for (const { pl, life, hd, td } of drawablePulses) {
    const pulseMult = (isLightMode ? 0.8 : 0.7) * life
    ctx.lineCap = "round"
    for (let s = 0; s < 8; s++) {
      const f = s / 8
      const [x1, y1] = ptAt(pl, td + (hd - td) * f)
      const [x2, y2] = ptAt(pl, td + (hd - td) * ((s + 1) / 8))
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = `rgba(${r},${g},${b},${(f * f * 0.5 * pulseMult).toFixed(3)})`
      ctx.lineWidth = pl.w + 2
      ctx.stroke()
    }
    const [hx, hy] = ptAt(pl, hd)
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

  // Content readability vignette (per-tile)
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

function draw(time: number) {
  ctx.clearRect(0, 0, w, h * 2)
  if (!ready) return

  const drawablePulses = computePulseStates()

  // Tile 1 at y=0
  drawScene(time, drawablePulses)

  // Tile 2 at y=h — same frame state, no double-advancing
  ctx.save()
  ctx.translate(0, h)
  drawScene(time, drawablePulses)
  ctx.restore()
}

// ── Animation loop ─────────────────────────────────────────────────────────

function startLoop() {
  if (animTimer !== null) clearInterval(animTimer)
  if (reducedMotion) {
    draw(performance.now())
    return
  }
  animTimer = setInterval(() => draw(performance.now()), 33)
}

function stopLoop() {
  if (animTimer !== null) {
    clearInterval(animTimer)
    animTimer = null
  }
}

// ── Message handling ───────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
;(self as any).onmessage = (
  e: MessageEvent<
    | { type: "init"; canvas: OffscreenCanvas; w: number; h: number; dpr: number; reducedMotion: boolean; theme: Theme; accent: string; density: number }
    | { type: "resize"; w: number; h: number; dpr: number; density: number }
    | { type: "theme"; theme: Theme; accent: string }
  >
) => {
  const msg = e.data

  if (msg.type === "init") {
    offscreen = msg.canvas
    ctx = offscreen.getContext("2d")!
    w = msg.w; h = msg.h; dpr = msg.dpr
    reducedMotion = msg.reducedMotion
    offscreen.width = w * dpr
    offscreen.height = h * 2 * dpr  // 2× viewport height for CSS animation
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    applyAccent(msg.accent, msg.theme)
    generate(w, h, reducedMotion, msg.density)
    startLoop()
    return
  }

  if (msg.type === "resize") {
    stopLoop()
    ready = false
    w = msg.w; h = msg.h; dpr = msg.dpr
    offscreen.width = w * dpr
    offscreen.height = h * 2 * dpr  // 2× viewport height for CSS animation
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    generate(w, h, reducedMotion, msg.density)
    startLoop()
    return
  }

  if (msg.type === "theme") {
    applyAccent(msg.accent, msg.theme)
    if (reducedMotion && ready) draw(performance.now())
    return
  }
}
