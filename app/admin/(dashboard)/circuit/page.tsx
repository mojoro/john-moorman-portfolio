"use client"

import { useState, useCallback, useRef, useEffect } from "react"

function dispatch(detail: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent("circuit-config", { detail }))
}

// ── Slider ──────────────────────────────────────────────────────────────────

interface SliderProps {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
}

function Slider({ label, value, min, max, step, onChange, format }: SliderProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[12px] text-text-secondary">{label}</span>
        <span className="font-mono text-[12px] text-accent tabular-nums">
          {format ? format(value) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full accent-[--accent] h-1"
        style={{ touchAction: "none" }}
      />
    </div>
  )
}

// ── Section header (collapsible) ─────────────────────────────────────────────

function Section({
  label,
  collapsed,
  onToggle,
  badge,
  children,
}: {
  label: string
  collapsed: boolean
  onToggle: () => void
  badge?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <button
        onClick={onToggle}
        className="flex w-full items-center gap-2 text-left"
      >
        <svg
          width="8"
          height="8"
          viewBox="0 0 8 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          className={`text-text-muted transition-transform ${collapsed ? "" : "rotate-90"}`}
        >
          <polyline points="2,1 6,4 2,7" />
        </svg>
        <span className="font-mono text-[11px] uppercase tracking-widest text-text-muted">
          {label}
        </span>
        {badge && (
          <span className="rounded-sm bg-accent/15 px-1 py-px font-mono text-[9px] text-accent">
            {badge}
          </span>
        )}
      </button>
      {!collapsed && <div className="space-y-2 pl-3.5">{children}</div>}
    </div>
  )
}

// ── FPS picker ────────────────────────────────────────────────────────────────

const FPS_OPTIONS = [10, 20, 30, 45, 60]

function FpsPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[12px] text-text-secondary">Frame rate</span>
        <span className="font-mono text-[12px] text-accent">{value} fps</span>
      </div>
      <div className="flex gap-1.5">
        {FPS_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => onChange(f)}
            className={`flex-1 rounded border py-1 font-mono text-[11px] transition-colors ${
              value === f
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-text-muted hover:border-text-muted hover:text-text-secondary"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Duration picker ───────────────────────────────────────────────────────────

const DURATIONS: { label: string; value: number | null }[] = [
  { label: "1m",  value: 1 },
  { label: "5m",  value: 5 },
  { label: "10m", value: 10 },
  { label: "30m", value: 30 },
  { label: "∞",   value: null },
]

function DurationPicker({
  value,
  onChange,
}: {
  value: number | null
  onChange: (v: number | null) => void
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[12px] text-text-secondary">Run time</span>
        <span className="font-mono text-[12px] text-accent">
          {value === null ? "∞" : `${value}m`}
        </span>
      </div>
      <div className="flex gap-1.5">
        {DURATIONS.map(({ label, value: v }) => (
          <button
            key={label}
            onClick={() => onChange(v)}
            className={`flex-1 rounded border py-1 font-mono text-[11px] transition-colors ${
              value === v
                ? "border-accent bg-accent/10 text-accent"
                : "border-border text-text-muted hover:border-text-muted hover:text-text-secondary"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Draggable/resizable panel ─────────────────────────────────────────────────

const MIN_W = 260
const MIN_H = 160
const DEFAULT_W = 296
const DEFAULT_H = 620

export default function CircuitConfigPage() {
  // Panel geometry
  const [px, setPx] = useState(16)
  const [py, setPy] = useState(64)
  const [pw, setPw] = useState(DEFAULT_W)
  const [ph, setPh] = useState(DEFAULT_H)
  const [panelCollapsed, setPanelCollapsed] = useState(false)

  // Section collapse state
  const [sections, setSections] = useState({
    visual: true,
    pulses: true,
    pulsePhysics: false,
    generation: false,
    performance: true,
  })

  const toggleSection = useCallback((key: keyof typeof sections) => {
    setSections((s) => ({ ...s, [key]: !s[key] }))
  }, [])

  // Start right-anchored once window is available
  useEffect(() => {
    setPx(Math.max(8, window.innerWidth - DEFAULT_W - 8))
  }, [])

  // ── Drag ──
  const dragRef = useRef<{ mx: number; my: number; ox: number; oy: number } | null>(null)

  const onDragDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest("button")) return
    e.currentTarget.setPointerCapture(e.pointerId)
    dragRef.current = { mx: e.clientX, my: e.clientY, ox: px, oy: py }
  }
  const onDragMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragRef.current) return
    setPx(Math.max(0, dragRef.current.ox + (e.clientX - dragRef.current.mx)))
    setPy(Math.max(0, dragRef.current.oy + (e.clientY - dragRef.current.my)))
  }
  const onDragUp = () => { dragRef.current = null }

  // ── Resize ──
  const resizeRef = useRef<{ mx: number; my: number; ow: number; oh: number } | null>(null)

  const onResizeDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.stopPropagation()
    e.currentTarget.setPointerCapture(e.pointerId)
    resizeRef.current = { mx: e.clientX, my: e.clientY, ow: pw, oh: ph }
  }
  const onResizeMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!resizeRef.current) return
    setPw(Math.max(MIN_W, resizeRef.current.ow + (e.clientX - resizeRef.current.mx)))
    setPh(Math.max(MIN_H, resizeRef.current.oh + (e.clientY - resizeRef.current.my)))
  }
  const onResizeUp = () => { resizeRef.current = null }

  // ── Config values (existing) ──
  const [traceAlpha, setTraceAlpha] = useState(0.06)
  const [traceWidth, setTraceWidth] = useState(1.0)
  const [padAlpha, setPadAlpha] = useState(0.07)
  const [glowIntensity, setGlowIntensity] = useState(1.0)
  const [fadeStrength, setFadeStrength] = useState(0.65)
  const [maxPulses, setMaxPulses] = useState(24)
  const [pulseBrightness, setPulseBrightness] = useState(1.0)
  const [pulseSpeed, setPulseSpeed] = useState(1.0)
  const [fps, setFps] = useState(30)
  const [density, setDensity] = useState(1.0)
  const [duration, setDuration] = useState<number | null>(null)

  // ── Config values (new — glow rendering) ──
  const [glowRadius, setGlowRadius] = useState(1.0)
  const [glowSpeed, setGlowSpeed] = useState(1.0)

  // ── Config values (new — pulse physics) ──
  const [pulseTailMin, setPulseTailMin] = useState(0.04)
  const [pulseTailMax, setPulseTailMax] = useState(0.10)
  const [pulseHeadSize, setPulseHeadSize] = useState(8)
  const [pulseSegments, setPulseSegments] = useState(8)

  // ── Config values (new — generation) ──
  const [gridSize, setGridSize] = useState(10)
  const [straightness, setStraightness] = useState(0.93)
  const [maxSteps, setMaxSteps] = useState(80)
  const [maxPaths, setMaxPaths] = useState(2000)
  const [bundleSizeMin, setBundleSizeMin] = useState(3)
  const [bundleSizeMax, setBundleSizeMax] = useState(7)
  const [pathLenMin, setPathLenMin] = useState(40)
  const [pathLenMax, setPathLenMax] = useState(90)
  const [branchChance, setBranchChance] = useState(0.5)
  const [padChance, setPadChance] = useState(0.3)
  const [padSizeMin, setPadSizeMin] = useState(1.5)
  const [padSizeMax, setPadSizeMax] = useState(3.5)
  const [seamSpacing, setSeamSpacing] = useState(8)
  const [glowCount, setGlowCount] = useState(0) // 0 = auto

  const densityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const durationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingGen = useRef<Record<string, number> | null>(null)
  const genTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Immediate dispatch for rendering-time params
  const handle = useCallback((key: string, setter: (v: number) => void) => (v: number) => {
    setter(v)
    dispatch({ [key]: v })
  }, [])

  // Debounced dispatch for generation params (400ms)
  const handleGen = useCallback((key: string, setter: (v: number) => void) => (v: number) => {
    setter(v)
    pendingGen.current = { ...(pendingGen.current ?? {}), [key]: v }
    if (genTimer.current) clearTimeout(genTimer.current)
    genTimer.current = setTimeout(() => {
      if (pendingGen.current) {
        dispatch(pendingGen.current)
        pendingGen.current = null
      }
    }, 400)
  }, [])

  const onTraceAlpha = handle("traceAlpha", setTraceAlpha)
  const onTraceWidth = handle("traceWidth", setTraceWidth)
  const onPadAlpha = handle("padAlpha", setPadAlpha)
  const onGlowIntensity = handle("glowIntensity", setGlowIntensity)
  const onGlowRadius = handle("glowRadius", setGlowRadius)
  const onGlowSpeed = handle("glowSpeed", setGlowSpeed)
  const onFadeStrength = handle("fadeStrength", setFadeStrength)
  const onMaxPulses = handle("maxPulses", setMaxPulses)
  const onPulseBrightness = handle("pulseBrightness", setPulseBrightness)
  const onPulseSpeed = handle("pulseSpeed", setPulseSpeed)
  const onPulseTailMin = handle("pulseTailMin", setPulseTailMin)
  const onPulseTailMax = handle("pulseTailMax", setPulseTailMax)
  const onPulseHeadSize = handle("pulseHeadSize", setPulseHeadSize)
  const onPulseSegments = handle("pulseSegments", setPulseSegments)
  const onFps = useCallback((v: number) => { setFps(v); dispatch({ fps: v }) }, [])

  const onDensity = useCallback((v: number) => {
    setDensity(v)
    if (densityTimer.current) clearTimeout(densityTimer.current)
    densityTimer.current = setTimeout(() => dispatch({ density: v }), 400)
  }, [])

  const onDuration = useCallback((d: number | null) => {
    setDuration(d)
    if (durationTimer.current) clearTimeout(durationTimer.current)
    dispatch({ paused: false })
    if (d !== null) {
      durationTimer.current = setTimeout(() => dispatch({ paused: true }), d * 60 * 1000)
    }
  }, [])

  // Generation param handlers (debounced)
  const onGridSize = handleGen("gridSize", setGridSize)
  const onStraightness = handleGen("straightness", setStraightness)
  const onMaxSteps = handleGen("maxSteps", setMaxSteps)
  const onMaxPaths = handleGen("maxPaths", setMaxPaths)
  const onBundleSizeMin = handleGen("bundleSizeMin", setBundleSizeMin)
  const onBundleSizeMax = handleGen("bundleSizeMax", setBundleSizeMax)
  const onPathLenMin = handleGen("pathLenMin", setPathLenMin)
  const onPathLenMax = handleGen("pathLenMax", setPathLenMax)
  const onBranchChance = handleGen("branchChance", setBranchChance)
  const onPadChance = handleGen("padChance", setPadChance)
  const onPadSizeMin = handleGen("padSizeMin", setPadSizeMin)
  const onPadSizeMax = handleGen("padSizeMax", setPadSizeMax)
  const onSeamSpacing = handleGen("seamSpacing", setSeamSpacing)
  const onGlowCount = handleGen("glowCount", setGlowCount)

  const handleReset = () => {
    // Existing
    setTraceAlpha(0.06); setTraceWidth(1.0); setPadAlpha(0.07)
    setGlowIntensity(1.0); setFadeStrength(0.65); setMaxPulses(24)
    setPulseBrightness(1.0); setPulseSpeed(1.0); setFps(30); setDensity(1.0)
    setDuration(null)
    // New rendering
    setGlowRadius(1.0); setGlowSpeed(1.0)
    // New pulse physics
    setPulseTailMin(0.04); setPulseTailMax(0.10)
    setPulseHeadSize(8); setPulseSegments(8)
    // New generation
    setGridSize(10); setStraightness(0.93); setMaxSteps(80); setMaxPaths(2000)
    setBundleSizeMin(3); setBundleSizeMax(7); setPathLenMin(40); setPathLenMax(90)
    setBranchChance(0.5); setPadChance(0.3); setPadSizeMin(1.5); setPadSizeMax(3.5)
    setSeamSpacing(8); setGlowCount(0)
    // Clear timers
    if (durationTimer.current) clearTimeout(durationTimer.current)
    if (genTimer.current) clearTimeout(genTimer.current)
    pendingGen.current = null
    dispatch({ reset: true })
  }

  const pct = (v: number) => `${Math.round(v * 100)}%`
  const mult = (v: number) => `${v.toFixed(2)}×`
  const fixed2 = (v: number) => v.toFixed(2)
  const fixed3 = (v: number) => v.toFixed(3)
  const int = (v: number) => String(Math.round(v))

  return (
    <>
      {/* Transparent page — circuit shows through admin layout */}
      <div className="h-screen w-full" />

      {/* Floating panel */}
      <div
        style={{ position: "fixed", left: px, top: py, width: pw, zIndex: 50 }}
        className="rounded-lg border border-border bg-bg-surface/90 shadow-2xl backdrop-blur-sm overflow-hidden"
      >
        {/* Header / drag handle */}
        <div
          onPointerDown={onDragDown}
          onPointerMove={onDragMove}
          onPointerUp={onDragUp}
          style={{ touchAction: "none", cursor: dragRef.current ? "grabbing" : "grab" }}
          className="flex select-none items-center justify-between border-b border-border px-3 py-2"
        >
          <div className="flex items-center gap-2">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="currentColor" className="text-text-muted opacity-60">
              <rect x="0" y="1" width="2" height="2" rx="0.5"/><rect x="5" y="1" width="2" height="2" rx="0.5"/><rect x="10" y="1" width="2" height="2" rx="0.5"/>
              <rect x="0" y="5" width="2" height="2" rx="0.5"/><rect x="5" y="5" width="2" height="2" rx="0.5"/><rect x="10" y="5" width="2" height="2" rx="0.5"/>
              <rect x="0" y="9" width="2" height="2" rx="0.5"/><rect x="5" y="9" width="2" height="2" rx="0.5"/><rect x="10" y="9" width="2" height="2" rx="0.5"/>
            </svg>
            <span className="font-mono text-[13px] font-medium text-text-primary">Circuit Config</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className="rounded px-1.5 py-0.5 font-mono text-[11px] text-text-muted transition-colors hover:text-text-primary"
              title="Reset all to defaults"
            >
              reset
            </button>
            <button
              onClick={() => setPanelCollapsed(c => !c)}
              className="flex h-5 w-5 items-center justify-center rounded text-text-muted transition-colors hover:text-text-primary"
              title={panelCollapsed ? "Expand" : "Collapse"}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                {panelCollapsed
                  ? <><line x1="2" y1="3" x2="5" y2="7"/><line x1="5" y1="7" x2="8" y2="3"/></>
                  : <><line x1="2" y1="7" x2="5" y2="3"/><line x1="5" y1="3" x2="8" y2="7"/></>
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        {!panelCollapsed && (
          <div
            style={{ height: ph, overflowY: "auto" }}
            className="space-y-4 p-4"
          >
            {/* ── Visual ── */}
            <Section label="Visual" collapsed={!sections.visual} onToggle={() => toggleSection("visual")}>
              <Slider label="Trace opacity" value={traceAlpha} min={0} max={0.4} step={0.005} onChange={onTraceAlpha} format={pct} />
              <Slider label="Trace width" value={traceWidth} min={0.2} max={4} step={0.05} onChange={onTraceWidth} format={mult} />
              <Slider label="Pad opacity" value={padAlpha} min={0} max={0.4} step={0.005} onChange={onPadAlpha} format={pct} />
              <Slider label="Glow intensity" value={glowIntensity} min={0} max={3} step={0.05} onChange={onGlowIntensity} format={mult} />
              <Slider label="Glow radius" value={glowRadius} min={0.1} max={5} step={0.05} onChange={onGlowRadius} format={mult} />
              <Slider label="Glow speed" value={glowSpeed} min={0} max={5} step={0.05} onChange={onGlowSpeed} format={mult} />
              <Slider label="Vignette" value={fadeStrength} min={0} max={2} step={0.01} onChange={onFadeStrength} format={fixed2} />
            </Section>

            <div className="border-t border-border/50" />

            {/* ── Pulses ── */}
            <Section label="Pulses" collapsed={!sections.pulses} onToggle={() => toggleSection("pulses")}>
              <Slider label="Count" value={maxPulses} min={0} max={48} step={1} onChange={onMaxPulses} format={int} />
              <Slider label="Brightness" value={pulseBrightness} min={0} max={3} step={0.05} onChange={onPulseBrightness} format={mult} />
              <Slider label="Speed" value={pulseSpeed} min={0.05} max={6} step={0.05} onChange={onPulseSpeed} format={mult} />
            </Section>

            <div className="border-t border-border/50" />

            {/* ── Pulse Physics ── */}
            <Section label="Pulse Physics" collapsed={!sections.pulsePhysics} onToggle={() => toggleSection("pulsePhysics")}>
              <Slider label="Tail min" value={pulseTailMin} min={0.005} max={0.5} step={0.005} onChange={onPulseTailMin} format={fixed3} />
              <Slider label="Tail max" value={pulseTailMax} min={0.005} max={0.5} step={0.005} onChange={onPulseTailMax} format={fixed3} />
              <Slider label="Head size" value={pulseHeadSize} min={1} max={30} step={1} onChange={onPulseHeadSize} format={int} />
              <Slider label="Trail segments" value={pulseSegments} min={2} max={24} step={1} onChange={onPulseSegments} format={int} />
            </Section>

            <div className="border-t border-border/50" />

            {/* ── Generation ── */}
            <Section label="Generation" collapsed={!sections.generation} onToggle={() => toggleSection("generation")} badge="regen">
              <p className="font-mono text-[10px] text-text-muted">Changes trigger full regeneration (400ms debounce)</p>
              <Slider label="Grid size" value={gridSize} min={2} max={50} step={1} onChange={onGridSize} format={int} />
              <Slider label="Straightness" value={straightness} min={0} max={1} step={0.01} onChange={onStraightness} format={fixed2} />
              <Slider label="Growth steps" value={maxSteps} min={1} max={500} step={1} onChange={onMaxSteps} format={int} />
              <Slider label="Max paths" value={maxPaths} min={50} max={5000} step={50} onChange={onMaxPaths} format={int} />
              <Slider label="Bundle min" value={bundleSizeMin} min={1} max={20} step={1} onChange={onBundleSizeMin} format={int} />
              <Slider label="Bundle max" value={bundleSizeMax} min={1} max={20} step={1} onChange={onBundleSizeMax} format={int} />
              <Slider label="Path len min" value={pathLenMin} min={3} max={200} step={1} onChange={onPathLenMin} format={int} />
              <Slider label="Path len max" value={pathLenMax} min={3} max={200} step={1} onChange={onPathLenMax} format={int} />
              <Slider label="Branch chance" value={branchChance} min={0} max={1} step={0.01} onChange={onBranchChance} format={fixed2} />
              <Slider label="Pad chance" value={padChance} min={0} max={1} step={0.01} onChange={onPadChance} format={fixed2} />
              <Slider label="Pad size min" value={padSizeMin} min={0.5} max={10} step={0.1} onChange={onPadSizeMin} format={fixed2} />
              <Slider label="Pad size max" value={padSizeMax} min={0.5} max={10} step={0.1} onChange={onPadSizeMax} format={fixed2} />
              <Slider label="Seam spacing" value={seamSpacing} min={2} max={30} step={1} onChange={onSeamSpacing} format={int} />
              <Slider label="Glow count" value={glowCount} min={0} max={40} step={1} onChange={onGlowCount} format={(v) => v === 0 ? "auto" : String(v)} />
            </Section>

            <div className="border-t border-border/50" />

            {/* ── Performance ── */}
            <Section label="Performance" collapsed={!sections.performance} onToggle={() => toggleSection("performance")}>
              <FpsPicker value={fps} onChange={onFps} />
              <DurationPicker value={duration} onChange={onDuration} />
              <Slider label="Density" value={density} min={0.1} max={2.0} step={0.05} onChange={onDensity} format={fixed2} />
              <p className="font-mono text-[10px] text-text-muted">Density triggers regen after 400 ms</p>
            </Section>
          </div>
        )}

        {/* Resize handle — bottom-right corner */}
        {!panelCollapsed && (
          <div
            onPointerDown={onResizeDown}
            onPointerMove={onResizeMove}
            onPointerUp={onResizeUp}
            style={{ touchAction: "none", cursor: "nwse-resize" }}
            className="absolute bottom-0 right-0 flex h-5 w-5 items-end justify-end pb-1 pr-1"
          >
            <svg width="8" height="8" viewBox="0 0 8 8" fill="currentColor" className="text-text-muted opacity-50">
              <rect x="4" y="0" width="1.5" height="1.5" rx="0.5"/>
              <rect x="0" y="4" width="1.5" height="1.5" rx="0.5"/>
              <rect x="4" y="4" width="1.5" height="1.5" rx="0.5"/>
              <rect x="0" y="0" width="1.5" height="1.5" rx="0.5"/>
            </svg>
          </div>
        )}
      </div>
    </>
  )
}
