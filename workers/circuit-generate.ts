/**
 * Web Worker for PCB circuit board generation (fallback path).
 *
 * Used when OffscreenCanvas / transferControlToOffscreen is unavailable
 * (Safari < 17, older iOS). Generates circuit data off the main thread
 * and posts typed arrays back; rendering happens on the main thread.
 *
 * Receives: { w, h, reducedMotion, density, id }
 * Returns:  { id, traceCount, traceMeta, tracePts, padCount, padX, padY, padR,
 *             glowCount, glowX, glowY, glowR, glowPh, glowSp, pulses }
 */

export {}

const DX = [1, 0, -1, 0, 1, -1, -1, 1]
const DY = [0, 1, 0, -1, 1, 1, -1, -1]

interface PulseResult {
  pts: Float32Array
  segLens: Float32Array
  totalLen: number
  pr: number
  sp: number
  ln: number
  w: number
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const worker = self as any

worker.onmessage = (e: MessageEvent<{ w: number; h: number; reducedMotion: boolean; density: number; id: number }>) => {
  const { w, h, reducedMotion, density, id } = e.data

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

  // Seam stubs — deterministic vertical traces at top/bottom edges so the
  // tile connects seamlessly when drawn twice (tiled at y=0 and y=h).
  const seamRows = Math.max(3, Math.ceil(rows * 0.05))
  const seamStep = 8

  for (let sx = 4; sx < cols - 4; sx += seamStep) {
    const sw = 0.5 + ((sx * 3 + 7) % 15) / 30

    if (pathCount < MAX_PATHS) {
      const pi = pathCount++
      for (let s = 0; s <= seamRows; s++) {
        phistX[pi * MAX_HISTORY + s] = sx
        phistY[pi * MAX_HISTORY + s] = s
        if (inBounds(sx, s)) grid[at(sx, s)] = 1
      }
      phistLen[pi] = seamRows + 1; pwidth[pi] = sw; palive[pi] = 0
      seedPath(sx, seamRows + 1, 1, 15 + (sx % 5) * 5, sw * 0.9)
    }

    if (pathCount < MAX_PATHS) {
      const pi = pathCount++
      phistX[pi * MAX_HISTORY] = sx
      phistY[pi * MAX_HISTORY] = rows  // tile boundary point — clipped to y=h when drawn
      for (let s = 0; s <= seamRows; s++) {
        phistX[pi * MAX_HISTORY + 1 + s] = sx
        phistY[pi * MAX_HISTORY + 1 + s] = rows - 1 - s
        if (inBounds(sx, rows - 1 - s)) grid[at(sx, rows - 1 - s)] = 1
      }
      phistLen[pi] = seamRows + 2; pwidth[pi] = sw; palive[pi] = 0
      seedPath(sx, rows - 2 - seamRows, 3, 15 + (sx % 5) * 5, sw * 0.9)
    }
  }

  // Left/right edge bundles (non-tiling edges — random seeding is fine here)
  for (let y = 3; y < rows - 10; y += 6 + Math.floor(Math.random() * 6)) seedBundle(0, y, 0, 0, 1)
  for (let y = 3; y < rows - 10; y += 6 + Math.floor(Math.random() * 6)) seedBundle(cols - 1, y, 2, 0, 1)
  for (let y = 2; y < rows - 2; y += 4 + Math.floor(Math.random() * 3)) {
    seedPath(0, y, 0, 30 + Math.floor(Math.random() * 40), 0.5 + Math.random() * 0.5)
    seedPath(cols - 1, y, 2, 30 + Math.floor(Math.random() * 40), 0.5 + Math.random() * 0.5)
  }

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
      tempPads.push({ x: simplified[simplified.length - 2], y: simplified[simplified.length - 1], r: 1.5 + Math.random() * 2 })
      if (Math.random() < 0.3) {
        tempPads.push({ x: simplified[0], y: simplified[1], r: 1.5 + Math.random() * 1.5 })
      }
    }
  }

  const traceCount = tempTraces.length
  let totalPts = 0
  for (const t of tempTraces) totalPts += t.pts.length

  const traceMeta = new Float32Array(traceCount * 3)
  const tracePts = new Float32Array(totalPts)
  let ptOffset = 0
  for (let i = 0; i < traceCount; i++) {
    const t = tempTraces[i]
    traceMeta[i * 3] = ptOffset
    traceMeta[i * 3 + 1] = t.pts.length / 2
    traceMeta[i * 3 + 2] = t.w
    for (let j = 0; j < t.pts.length; j++) tracePts[ptOffset++] = t.pts[j]
  }

  const padCount = tempPads.length
  const padX = new Float32Array(padCount)
  const padY = new Float32Array(padCount)
  const padR = new Float32Array(padCount)
  for (let i = 0; i < padCount; i++) {
    padX[i] = tempPads[i].x; padY[i] = tempPads[i].y; padR[i] = tempPads[i].r
  }

  const glowCount = Math.min(Math.floor(traceCount / 8), 20)
  const glowX = new Float32Array(glowCount)
  const glowY = new Float32Array(glowCount)
  const glowR = new Float32Array(glowCount)
  const glowPh = new Float32Array(glowCount)
  const glowSp = new Float32Array(glowCount)
  for (let i = 0; i < glowCount; i++) {
    const ti = Math.floor(Math.random() * traceCount)
    const startIdx = traceMeta[ti * 3]
    const ptC = traceMeta[ti * 3 + 1]
    const pi2 = Math.floor(Math.random() * ptC)
    glowX[i] = tracePts[startIdx + pi2 * 2]
    glowY[i] = tracePts[startIdx + pi2 * 2 + 1]
    glowR[i] = 3 + Math.random() * 5
    glowPh[i] = Math.random() * Math.PI * 2
    glowSp[i] = 0.2 + Math.random() * 0.5
  }

  const pulses: PulseResult[] = []
  if (!reducedMotion && traceCount > 0) {
    const pc = Math.min(Math.floor(traceCount / 4), 24)
    for (let i = 0; i < pc; i++) {
      const ti = Math.floor(Math.random() * traceCount)
      const startIdx = traceMeta[ti * 3]
      const ptC = traceMeta[ti * 3 + 1]
      if (ptC < 2) continue

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

      if (totalLen < 10) continue

      const speedTier = Math.random()
      const sp =
        speedTier < 0.3
          ? 0.0008 + Math.random() * 0.0007
          : speedTier < 0.7
          ? 0.002 + Math.random() * 0.002
          : 0.005 + Math.random() * 0.004

      pulses.push({
        pts, segLens, totalLen,
        pr: Math.random() * (1.0 + sp * 200),
        sp,
        ln: 0.04 + Math.random() * 0.06,
        w: traceMeta[ti * 3 + 2],
      })
    }
  }

  const msg = {
    id, traceCount, traceMeta, tracePts,
    padCount, padX, padY, padR,
    glowCount, glowX, glowY, glowR, glowPh, glowSp,
    pulses,
  }

  const transfer = [
    traceMeta.buffer, tracePts.buffer,
    padX.buffer, padY.buffer, padR.buffer,
    glowX.buffer, glowY.buffer, glowR.buffer, glowPh.buffer, glowSp.buffer,
  ]

  worker.postMessage(msg, transfer)
}
