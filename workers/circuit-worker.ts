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
 *   { type: 'config', reset?, density?, traceAlpha?, padAlpha?, fadeStrength?, maxPulses?, fps? }
 *   { type: 'pointer', x, y, pressed }
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
let clickPulses: PulseData[] = []

// ── Admin config overrides (session-only, set via circuit-config CustomEvent) ──
let currentDensity = 1.0
let maxPulses = 24
let traceAlphaOverride: number | null = null
let padAlphaOverride: number | null = null
let fadeStrengthOverride: number | null = null
let fpsOverride: number | null = null
let glowIntensityMult = 1.0
let pulseBrightnessMult = 1.0
let pulseSpeedMult = 1.0
let traceWidthMult = 1.0

// Generation math overrides (trigger regen)
let gridSizeOverride: number | null = null
let straightnessOverride: number | null = null
let maxStepsOverride: number | null = null
let maxPathsOverride: number | null = null
let bundleSizeMinOverride: number | null = null
let bundleSizeMaxOverride: number | null = null
let pathLenMinOverride: number | null = null
let pathLenMaxOverride: number | null = null
let branchChanceOverride: number | null = null
let padChanceOverride: number | null = null
let padSizeMinOverride: number | null = null
let padSizeMaxOverride: number | null = null
let seamSpacingOverride: number | null = null
let glowCountOverride: number | null = null

// Glow rendering overrides
let glowRadiusMult = 1.0
let glowSpeedMult = 1.0

// Pulse physics overrides
let pulseTailMinOverride: number | null = null
let pulseTailMaxOverride: number | null = null
let pulseHeadSizeOverride: number | null = null
let pulseSegmentsOverride: number | null = null

let w = 0
let h = 0
let dpr = 1
let reducedMotion = false
let ready = false

// Mouse state
let mouseX = -1
let mouseY = -1
let mouseActive = false

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
  const traceAlpha = traceAlphaOverride ?? (isLightMode ? 0.11 : 0.06)
  const padAlpha = padAlphaOverride ?? (isLightMode ? 0.13 : 0.07)
  traceColor = `rgba(${cachedR},${cachedG},${cachedB},${traceAlpha})`
  padColor = `rgba(${cachedR},${cachedG},${cachedB},${padAlpha})`
}

// ── Generation ─────────────────────────────────────────────────────────────

const DX = [1, 0, -1, 0, 1, -1, -1, 1]
const DY = [0, 1, 0, -1, 1, 1, -1, -1]

function generate(gw: number, gh: number, rm: boolean, density: number) {
  const gridSize = gridSizeOverride ?? 10
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

  const MAX_PATHS = maxPathsOverride ?? 2000
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
    const bMin = bundleSizeMinOverride ?? 3
    const bMax = bundleSizeMaxOverride ?? 7
    const bundleSize = bMin + Math.floor(Math.random() * (bMax - bMin + 1))
    const plMin = pathLenMinOverride ?? 40
    const plMax = pathLenMaxOverride ?? 90
    const pathLen = plMin + Math.floor(Math.random() * (plMax - plMin))
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
  const seamStep = seamSpacingOverride ?? 8  // one stub pair every N grid columns

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
    const eplMin = pathLenMinOverride ?? 30
    const eplMax = pathLenMaxOverride ?? 70
    seedPath(0, y, 0, eplMin + Math.floor(Math.random() * (eplMax - eplMin)), 0.5 + Math.random() * 0.5)
    seedPath(cols - 1, y, 2, eplMin + Math.floor(Math.random() * (eplMax - eplMin)), 0.5 + Math.random() * 0.5)
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
    const iplMin = pathLenMinOverride ?? 30
    const iplMax = pathLenMaxOverride ?? 70
    seedPath(x, y, Math.floor(Math.random() * 4), iplMin + Math.floor(Math.random() * (iplMax - iplMin)), 0.5 + Math.random() * 0.8)
  }

  // ── Round-robin growth ──

  const STRAIGHTNESS = straightnessOverride ?? 0.93
  const maxSteps = maxStepsOverride ?? 80
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
          if (phistLen[pi] > 4 && Math.random() < (branchChanceOverride ?? 0.5)) {
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
      const psMin = padSizeMinOverride ?? 1.5
      const psMax = padSizeMaxOverride ?? 3.5
      tempPads.push({
        x: simplified[simplified.length - 2],
        y: simplified[simplified.length - 1],
        r: psMin + Math.random() * (psMax - psMin),
      })
      if (Math.random() < (padChanceOverride ?? 0.3)) {
        tempPads.push({ x: simplified[0], y: simplified[1], r: psMin + Math.random() * (psMax - psMin) * 0.75 })
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
  const gc = glowCountOverride ?? Math.min(Math.floor(tc / 8), 20)
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

      const ptlMin = pulseTailMinOverride ?? 0.04
      const ptlMax = pulseTailMaxOverride ?? 0.10
      pulses.push({
        pts,
        segLens,
        totalLen,
        pr: Math.random() * (1.0 + sp * 200),
        sp,
        ln: ptlMin + Math.random() * (ptlMax - ptlMin),
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
  const rptlMin = pulseTailMinOverride ?? 0.04
  const rptlMax = pulseTailMaxOverride ?? 0.10
  pl.ln = rptlMin + Math.random() * (rptlMax - rptlMin)
  pl.ti = ti
}

// ── Cursor interaction helpers ────────────────────────────────────────────

function findNearestTrace(x: number, y: number): { traceIdx: number; distAlongPath: number; dist: number } | null {
  let bestDist = Infinity
  let bestTraceIdx = -1
  let bestJ = 0
  let bestPtCount = 0

  for (let i = 0; i < traceCount; i++) {
    const startIdx = traceMeta[i * 3]
    const ptCount = traceMeta[i * 3 + 1]
    for (let j = 0; j < ptCount; j++) {
      const dx = tracePts[startIdx + j * 2] - x
      const dy = tracePts[startIdx + j * 2 + 1] - y
      const d2 = dx * dx + dy * dy
      if (d2 < bestDist) {
        bestDist = d2
        bestTraceIdx = i
        bestJ = j
        bestPtCount = ptCount
      }
    }
  }

  const dist = Math.sqrt(bestDist)
  if (dist > 300 || bestTraceIdx < 0) return null
  const distAlongPath = bestPtCount > 1 ? bestJ / (bestPtCount - 1) : 0
  return { traceIdx: bestTraceIdx, distAlongPath, dist }
}

function spawnClickPulse(x: number, y: number) {
  const nearest = findNearestTrace(x, y)
  if (!nearest || nearest.dist >= 200) return

  const ti = nearest.traceIdx
  const startIdx = traceMeta[ti * 3]
  const ptCount = traceMeta[ti * 3 + 1]
  if (ptCount < 2) return

  const pts = new Float32Array(ptCount * 2)
  for (let j = 0; j < ptCount * 2; j++) pts[j] = tracePts[startIdx + j]

  const segLens = new Float32Array(ptCount - 1)
  let totalLen = 0
  for (let j = 0; j < ptCount - 1; j++) {
    const ddx = pts[(j + 1) * 2] - pts[j * 2]
    const ddy = pts[(j + 1) * 2 + 1] - pts[j * 2 + 1]
    const slen = Math.sqrt(ddx * ddx + ddy * ddy)
    segLens[j] = slen
    totalLen += slen
  }
  if (totalLen < 10) return

  // Randomize speed — some fast, some slow, some crawl
  const speedTier = Math.random()
  const sp = speedTier < 0.3
    ? 0.001 + Math.random() * 0.002
    : speedTier < 0.7
    ? 0.003 + Math.random() * 0.004
    : 0.008 + Math.random() * 0.006

  // Clamp start position so the pulse always has at least 30% of the
  // path left to travel — avoids spawning at the destination.
  const pr = Math.min(nearest.distAlongPath, 0.7)

  clickPulses.push({
    pts,
    segLens,
    totalLen,
    pr,
    sp,
    ln: 0.08,
    w: traceMeta[ti * 3 + 2],
    ti,
  })
}

// Advance pulse positions once per frame and return drawable states.
// Separating update from draw allows drawScene to be called twice per frame
// (once per tile) without double-advancing the animation.
function computePulseStates(): DrawablePulse[] {
  if (reducedMotion) return []
  const result: DrawablePulse[] = []

  // Regular pulses (capped by maxPulses, resample on completion)
  const limit = Math.min(maxPulses, pulseData.length)
  for (let _i = 0; _i < limit; _i++) {
    const pl = pulseData[_i]
    const life =
      pl.pr < pl.ln
        ? pl.pr / pl.ln
        : pl.pr > 1.0
        ? Math.max(0, 1 - (pl.pr - 1.0) / pl.ln)
        : 1.0
    pl.pr += pl.sp * pulseSpeedMult
    if (pl.pr >= 1.0 + pl.ln) {
      pl.pr = 0
      resamplePulse(pl)
      continue
    }
    if (life <= 0) continue
    const hd = Math.min(pl.pr, 1.0) * pl.totalLen
    const td = Math.max(0, (pl.pr - pl.ln) * pl.totalLen)
    if (hd - td < 1) continue
    result.push({ pl, life, hd, td })
  }

  // Click-spawned pulses (no cap, removed on completion)
  for (let i = clickPulses.length - 1; i >= 0; i--) {
    const pl = clickPulses[i]
    const life =
      pl.pr < pl.ln
        ? pl.pr / pl.ln
        : pl.pr > 1.0
        ? Math.max(0, 1 - (pl.pr - 1.0) / pl.ln)
        : 1.0
    pl.pr += pl.sp * pulseSpeedMult
    if (pl.pr >= 1.0 + pl.ln) {
      clickPulses.splice(i, 1)
      continue
    }
    if (life <= 0) continue
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
    ctx.lineWidth = tw * traceWidthMult
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
    const pulse = reducedMotion ? 0.6 : 0.4 + Math.sin(t * glowSp[i] * glowSpeedMult + glowPh[i]) * 0.3
    const radius = glowR[i] * 5 * glowRadiusMult
    const gradR = ctx.createRadialGradient(glowX[i], glowY[i], 0, glowX[i], glowY[i], radius)
    gradR.addColorStop(0, `rgba(${r},${g},${b},${(0.2 * pulse * glowMult * glowIntensityMult).toFixed(3)})`)
    gradR.addColorStop(0.5, `rgba(${r},${g},${b},${(0.06 * pulse * glowMult * glowIntensityMult).toFixed(3)})`)
    gradR.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.fillStyle = gradR
    ctx.beginPath()
    ctx.arc(glowX[i], glowY[i], radius, 0, 6.2832)
    ctx.fill()
    ctx.fillStyle = `rgba(${r},${g},${b},${(0.4 * pulse * glowMult * glowIntensityMult).toFixed(3)})`
    ctx.beginPath()
    ctx.arc(glowX[i], glowY[i], glowR[i] * 0.5, 0, 6.2832)
    ctx.fill()
  }

  // Pulses (desktop only, pre-computed states — no position advancement here)
  for (const { pl, life, hd, td } of drawablePulses) {
    const pulseMult = (isLightMode ? 0.8 : 0.7) * life * pulseBrightnessMult
    const segs = pulseSegmentsOverride ?? 8
    ctx.lineCap = "round"
    for (let s = 0; s < segs; s++) {
      const f = s / segs
      const [x1, y1] = ptAt(pl, td + (hd - td) * f)
      const [x2, y2] = ptAt(pl, td + (hd - td) * ((s + 1) / segs))
      ctx.beginPath()
      ctx.moveTo(x1, y1)
      ctx.lineTo(x2, y2)
      ctx.strokeStyle = `rgba(${r},${g},${b},${(f * f * 0.5 * pulseMult).toFixed(3)})`
      ctx.lineWidth = pl.w + 2
      ctx.stroke()
    }
    const [hx, hy] = ptAt(pl, hd)
    const headAlpha = 0.5 * life
    const headR = pulseHeadSizeOverride ?? 8
    const headGrad = ctx.createRadialGradient(hx, hy, 0, hx, hy, headR)
    headGrad.addColorStop(0, `rgba(${r},${g},${b},${headAlpha})`)
    headGrad.addColorStop(0.3, `rgba(${r},${g},${b},${(headAlpha * 0.4).toFixed(3)})`)
    headGrad.addColorStop(1, `rgba(${r},${g},${b},0)`)
    ctx.fillStyle = headGrad
    ctx.beginPath()
    ctx.arc(hx, hy, headR, 0, 6.2832)
    ctx.fill()
  }

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

  // ── Trace proximity highlight (segment-level, both tiles) ──────────
  if (mouseActive && mouseX >= 0) {
    const highlightRadius = 200
    const hrSq = highlightRadius * highlightRadius
    const maxAlpha = isLightMode ? 0.44 : 0.33
    const tileMouseY = ((mouseY % h) + h) % h
    ctx.lineCap = "round"
    ctx.lineJoin = "round"

    for (let tile = 0; tile < 2; tile++) {
      const yOff = tile * h
      for (let i = 0; i < traceCount; i++) {
        const startIdx = traceMeta[i * 3]
        const ptCount = traceMeta[i * 3 + 1]
        ctx.lineWidth = traceMeta[i * 3 + 2] * traceWidthMult

        for (let j = 0; j < ptCount - 1; j++) {
          const px1 = tracePts[startIdx + j * 2]
          const py1 = tracePts[startIdx + j * 2 + 1]
          const px2 = tracePts[startIdx + (j + 1) * 2]
          const py2 = tracePts[startIdx + (j + 1) * 2 + 1]

          // Use midpoint of segment for distance calc
          const mx = (px1 + px2) * 0.5
          const my = (py1 + py2) * 0.5
          const dx = mx - mouseX
          const dy = my - tileMouseY
          const distSq = dx * dx + dy * dy

          if (distSq >= hrSq) continue

          // Smooth falloff: 1.0 at center, 0.0 at edge (quadratic)
          const dist = Math.sqrt(distSq)
          const t = 1 - dist / highlightRadius
          const alpha = maxAlpha * t * t

          ctx.strokeStyle = `rgba(${cachedR},${cachedG},${cachedB},${alpha.toFixed(3)})`
          ctx.beginPath()
          ctx.moveTo(px1, py1 + yOff)
          ctx.lineTo(px2, py2 + yOff)
          ctx.stroke()
        }
      }
    }
  }

  // Content readability vignette — applied once across the full canvas so the
  // seam boundary between tiles gets the same treatment as any other row.
  // Range 0–1: controls peak knockout alpha at center.
  // Range 1–2: the fully-opaque zone expands outward toward the edges until
  //            the entire canvas is knocked out at 2.0.
  const isMobile = w < 768
  const raw = fadeStrengthOverride ?? (isLightMode ? (isMobile ? 1.16 : 1.16) : 0.78)
  const peak = Math.min(raw, 1)
  const spread = Math.max(0, raw - 1)

  ctx.globalCompositeOperation = "destination-out"
  const bandFade = ctx.createLinearGradient(0, 0, w, 0)

  if (isLightMode && isMobile) {
    const baseEdge = 0.54
    const edgeA = Math.min(baseEdge + spread * (peak - baseEdge), 1)
    bandFade.addColorStop(0, `rgba(0,0,0,${edgeA.toFixed(3)})`)
    bandFade.addColorStop(0.5, `rgba(0,0,0,${peak})`)
    bandFade.addColorStop(1, `rgba(0,0,0,${edgeA.toFixed(3)})`)
  } else {
    const baseEdge = isLightMode ? 0.30 : 0.72
    const edgeA = Math.min(baseEdge + spread * (peak - baseEdge), 1)
    // Transparent margin, transition zone, and peak zone compress toward
    // the edges as spread grows from 0 to 1.
    const a = 0.10 * (1 - spread)
    const b = Math.max(a, 0.18 * (1 - spread))
    const c = Math.max(b, 0.50 * (1 - spread))
    bandFade.addColorStop(0, "rgba(0,0,0,0)")
    bandFade.addColorStop(a, "rgba(0,0,0,0)")
    bandFade.addColorStop(b, `rgba(0,0,0,${edgeA.toFixed(3)})`)
    bandFade.addColorStop(c, `rgba(0,0,0,${peak})`)
    bandFade.addColorStop(0.5, `rgba(0,0,0,${peak})`)
    bandFade.addColorStop(1 - c, `rgba(0,0,0,${peak})`)
    bandFade.addColorStop(1 - b, `rgba(0,0,0,${edgeA.toFixed(3)})`)
    bandFade.addColorStop(1 - a, "rgba(0,0,0,0)")
    bandFade.addColorStop(1, "rgba(0,0,0,0)")
  }

  ctx.fillStyle = bandFade
  ctx.fillRect(0, 0, w, h * 2)
  ctx.globalCompositeOperation = "source-over"
}

// ── Animation loop ─────────────────────────────────────────────────────────

function startLoop() {
  if (animTimer !== null) clearInterval(animTimer)
  if (reducedMotion) {
    draw(performance.now())
    return
  }
  animTimer = setInterval(() => draw(performance.now()), fpsOverride != null ? Math.round(1000 / fpsOverride) : 33)
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
    | { type: "config"; reset?: boolean; paused?: boolean; density?: number; traceAlpha?: number; padAlpha?: number; fadeStrength?: number; maxPulses?: number; fps?: number; glowIntensity?: number; pulseBrightness?: number; pulseSpeed?: number; traceWidth?: number; glowRadius?: number; glowSpeed?: number; pulseTailMin?: number; pulseTailMax?: number; pulseHeadSize?: number; pulseSegments?: number; gridSize?: number; straightness?: number; maxSteps?: number; maxPaths?: number; bundleSizeMin?: number; bundleSizeMax?: number; pathLenMin?: number; pathLenMax?: number; branchChance?: number; padChance?: number; padSizeMin?: number; padSizeMax?: number; seamSpacing?: number; glowCount?: number }
    | { type: "pointer"; x: number; y: number; pressed: boolean }
  >
) => {
  const msg = e.data

  if (msg.type === "pointer") {
    mouseX = msg.x
    mouseY = msg.y
    if (msg.pressed) spawnClickPulse(msg.x, ((msg.y % h) + h) % h)
    mouseActive = true
    return
  }

  if (msg.type === "init") {
    offscreen = msg.canvas
    ctx = offscreen.getContext("2d")!
    w = msg.w; h = msg.h; dpr = msg.dpr
    reducedMotion = msg.reducedMotion
    offscreen.width = w * dpr
    offscreen.height = h * 2 * dpr  // 2× viewport height for CSS animation
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
    applyAccent(msg.accent, msg.theme)
    currentDensity = msg.density
    generate(w, h, reducedMotion, currentDensity)
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
    currentDensity = msg.density
    generate(w, h, reducedMotion, currentDensity)
    startLoop()
    return
  }

  if (msg.type === "theme") {
    applyAccent(msg.accent, msg.theme)
    if (reducedMotion && ready) draw(performance.now())
    return
  }

  if (msg.type === "config") {
    if (msg.reset) {
      traceAlphaOverride = null
      padAlphaOverride = null
      fadeStrengthOverride = null
      fpsOverride = null
      maxPulses = 24
      glowIntensityMult = 1.0
      pulseBrightnessMult = 1.0
      pulseSpeedMult = 1.0
      traceWidthMult = 1.0
      glowRadiusMult = 1.0
      glowSpeedMult = 1.0
      gridSizeOverride = null
      straightnessOverride = null
      maxStepsOverride = null
      maxPathsOverride = null
      bundleSizeMinOverride = null
      bundleSizeMaxOverride = null
      pathLenMinOverride = null
      pathLenMaxOverride = null
      branchChanceOverride = null
      padChanceOverride = null
      padSizeMinOverride = null
      padSizeMaxOverride = null
      seamSpacingOverride = null
      glowCountOverride = null
      pulseTailMinOverride = null
      pulseTailMaxOverride = null
      pulseHeadSizeOverride = null
      pulseSegmentsOverride = null
      currentDensity = w < 768 ? 0.6 : 1.0
      const defaultTraceAlpha = isLightMode ? 0.11 : 0.06
      const defaultPadAlpha = isLightMode ? 0.13 : 0.07
      traceColor = `rgba(${cachedR},${cachedG},${cachedB},${defaultTraceAlpha})`
      padColor = `rgba(${cachedR},${cachedG},${cachedB},${defaultPadAlpha})`
      stopLoop(); ready = false
      generate(w, h, reducedMotion, currentDensity)
      startLoop()
      return
    }
    let needsRegen = false
    if (msg.density !== undefined && msg.density !== currentDensity) {
      currentDensity = msg.density; needsRegen = true
    }
    if (msg.traceAlpha !== undefined) {
      traceAlphaOverride = msg.traceAlpha
      traceColor = `rgba(${cachedR},${cachedG},${cachedB},${traceAlphaOverride})`
    }
    if (msg.padAlpha !== undefined) {
      padAlphaOverride = msg.padAlpha
      padColor = `rgba(${cachedR},${cachedG},${cachedB},${padAlphaOverride})`
    }
    if (msg.fadeStrength !== undefined) fadeStrengthOverride = msg.fadeStrength
    if (msg.maxPulses !== undefined) maxPulses = msg.maxPulses
    if (msg.paused !== undefined) { if (msg.paused) stopLoop(); else startLoop() }
    if (msg.fps !== undefined) { fpsOverride = msg.fps; startLoop() }
    if (msg.glowIntensity !== undefined) glowIntensityMult = msg.glowIntensity
    if (msg.pulseBrightness !== undefined) pulseBrightnessMult = msg.pulseBrightness
    if (msg.pulseSpeed !== undefined) pulseSpeedMult = msg.pulseSpeed
    if (msg.traceWidth !== undefined) traceWidthMult = msg.traceWidth
    // Rendering-time overrides (immediate, no regen)
    if (msg.glowRadius !== undefined) glowRadiusMult = msg.glowRadius
    if (msg.glowSpeed !== undefined) glowSpeedMult = msg.glowSpeed
    if (msg.pulseTailMin !== undefined) pulseTailMinOverride = msg.pulseTailMin
    if (msg.pulseTailMax !== undefined) pulseTailMaxOverride = msg.pulseTailMax
    if (msg.pulseHeadSize !== undefined) pulseHeadSizeOverride = msg.pulseHeadSize
    if (msg.pulseSegments !== undefined) pulseSegmentsOverride = msg.pulseSegments
    // Generation overrides (trigger regen)
    if (msg.gridSize !== undefined) { gridSizeOverride = msg.gridSize; needsRegen = true }
    if (msg.straightness !== undefined) { straightnessOverride = msg.straightness; needsRegen = true }
    if (msg.maxSteps !== undefined) { maxStepsOverride = msg.maxSteps; needsRegen = true }
    if (msg.maxPaths !== undefined) { maxPathsOverride = msg.maxPaths; needsRegen = true }
    if (msg.bundleSizeMin !== undefined) { bundleSizeMinOverride = msg.bundleSizeMin; needsRegen = true }
    if (msg.bundleSizeMax !== undefined) { bundleSizeMaxOverride = msg.bundleSizeMax; needsRegen = true }
    if (msg.pathLenMin !== undefined) { pathLenMinOverride = msg.pathLenMin; needsRegen = true }
    if (msg.pathLenMax !== undefined) { pathLenMaxOverride = msg.pathLenMax; needsRegen = true }
    if (msg.branchChance !== undefined) { branchChanceOverride = msg.branchChance; needsRegen = true }
    if (msg.padChance !== undefined) { padChanceOverride = msg.padChance; needsRegen = true }
    if (msg.padSizeMin !== undefined) { padSizeMinOverride = msg.padSizeMin; needsRegen = true }
    if (msg.padSizeMax !== undefined) { padSizeMaxOverride = msg.padSizeMax; needsRegen = true }
    if (msg.seamSpacing !== undefined) { seamSpacingOverride = msg.seamSpacing; needsRegen = true }
    if (msg.glowCount !== undefined) { glowCountOverride = msg.glowCount === 0 ? null : msg.glowCount; needsRegen = true }
    if (needsRegen) { stopLoop(); ready = false; generate(w, h, reducedMotion, currentDensity); startLoop() }
    else if (reducedMotion && ready) draw(performance.now())
    return
  }
}
