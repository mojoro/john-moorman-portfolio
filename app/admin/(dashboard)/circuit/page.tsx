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
        <span className="font-mono text-[13px] text-text-secondary">{label}</span>
        <span className="font-mono text-[13px] text-accent tabular-nums">
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

// ── Section header ────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="font-mono text-[11px] uppercase tracking-widest text-text-muted">{label}</p>
      {children}
    </div>
  )
}

// ── FPS picker ────────────────────────────────────────────────────────────────

const FPS_OPTIONS = [10, 20, 30, 45, 60]

function FpsPicker({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-baseline justify-between">
        <span className="font-mono text-[13px] text-text-secondary">Frame rate</span>
        <span className="font-mono text-[13px] text-accent">{value} fps</span>
      </div>
      <div className="flex gap-1.5">
        {FPS_OPTIONS.map((f) => (
          <button
            key={f}
            onClick={() => onChange(f)}
            className={`flex-1 rounded border py-1 font-mono text-[12px] transition-colors ${
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
        <span className="font-mono text-[13px] text-text-secondary">Run time</span>
        <span className="font-mono text-[13px] text-accent">
          {value === null ? "∞" : `${value}m`}
        </span>
      </div>
      <div className="flex gap-1.5">
        {DURATIONS.map(({ label, value: v }) => (
          <button
            key={label}
            onClick={() => onChange(v)}
            className={`flex-1 rounded border py-1 font-mono text-[12px] transition-colors ${
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
const DEFAULT_H = 560

export default function CircuitConfigPage() {
  // Panel geometry
  const [px, setPx] = useState(16)
  const [py, setPy] = useState(64)
  const [pw, setPw] = useState(DEFAULT_W)
  const [ph, setPh] = useState(DEFAULT_H)
  const [collapsed, setCollapsed] = useState(false)

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

  // ── Config values ──
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
  const [duration, setDuration] = useState<number | null>(null) // null = ∞

  const densityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const durationTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handle = useCallback((key: string, setter: (v: number) => void) => (v: number) => {
    setter(v)
    dispatch({ [key]: v })
  }, [])

  const onTraceAlpha = handle("traceAlpha", setTraceAlpha)
  const onTraceWidth = handle("traceWidth", setTraceWidth)
  const onPadAlpha = handle("padAlpha", setPadAlpha)
  const onGlowIntensity = handle("glowIntensity", setGlowIntensity)
  const onFadeStrength = handle("fadeStrength", setFadeStrength)
  const onMaxPulses = handle("maxPulses", setMaxPulses)
  const onPulseBrightness = handle("pulseBrightness", setPulseBrightness)
  const onPulseSpeed = handle("pulseSpeed", setPulseSpeed)
  const onFps = useCallback((v: number) => { setFps(v); dispatch({ fps: v }) }, [])

  const onDensity = useCallback((v: number) => {
    setDensity(v)
    if (densityTimer.current) clearTimeout(densityTimer.current)
    densityTimer.current = setTimeout(() => dispatch({ density: v }), 400)
  }, [])

  const onDuration = useCallback((d: number | null) => {
    setDuration(d)
    if (durationTimer.current) clearTimeout(durationTimer.current)
    // Always unpause first (in case a prior timer had stopped the loop)
    dispatch({ paused: false })
    if (d !== null) {
      durationTimer.current = setTimeout(() => dispatch({ paused: true }), d * 60 * 1000)
    }
  }, [])

  const handleReset = () => {
    setTraceAlpha(0.06); setTraceWidth(1.0); setPadAlpha(0.07)
    setGlowIntensity(1.0); setFadeStrength(0.65); setMaxPulses(24)
    setPulseBrightness(1.0); setPulseSpeed(1.0); setFps(30); setDensity(1.0)
    setDuration(null)
    if (durationTimer.current) clearTimeout(durationTimer.current)
    dispatch({ reset: true })
  }

  const pct = (v: number) => `${Math.round(v * 100)}%`
  const mult = (v: number) => `${v.toFixed(2)}×`
  const fixed2 = (v: number) => v.toFixed(2)

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
              onClick={() => setCollapsed(c => !c)}
              className="flex h-5 w-5 items-center justify-center rounded text-text-muted transition-colors hover:text-text-primary"
              title={collapsed ? "Expand" : "Collapse"}
            >
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                {collapsed
                  ? <><line x1="2" y1="3" x2="5" y2="7"/><line x1="5" y1="7" x2="8" y2="3"/></>
                  : <><line x1="2" y1="7" x2="5" y2="3"/><line x1="5" y1="3" x2="8" y2="7"/></>
                }
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        {!collapsed && (
          <div
            style={{ height: ph, overflowY: "auto" }}
            className="space-y-5 p-4"
          >
            <Section label="Visual">
              <Slider label="Trace opacity" value={traceAlpha} min={0} max={0.4} step={0.005} onChange={onTraceAlpha} format={pct} />
              <Slider label="Trace width" value={traceWidth} min={0.2} max={4} step={0.05} onChange={onTraceWidth} format={mult} />
              <Slider label="Pad opacity" value={padAlpha} min={0} max={0.4} step={0.005} onChange={onPadAlpha} format={pct} />
              <Slider label="Glow intensity" value={glowIntensity} min={0} max={3} step={0.05} onChange={onGlowIntensity} format={mult} />
              <Slider label="Vignette" value={fadeStrength} min={0} max={1} step={0.01} onChange={onFadeStrength} format={fixed2} />
            </Section>

            <div className="border-t border-border/50" />

            <Section label="Pulses">
              <Slider label="Count" value={maxPulses} min={0} max={48} step={1} onChange={onMaxPulses} format={String} />
              <Slider label="Brightness" value={pulseBrightness} min={0} max={3} step={0.05} onChange={onPulseBrightness} format={mult} />
              <Slider label="Speed" value={pulseSpeed} min={0.05} max={6} step={0.05} onChange={onPulseSpeed} format={mult} />
            </Section>

            <div className="border-t border-border/50" />

            <Section label="Performance">
              <FpsPicker value={fps} onChange={onFps} />
              <DurationPicker value={duration} onChange={onDuration} />
              <Slider label="Density" value={density} min={0.1} max={2.0} step={0.05} onChange={onDensity} format={fixed2} />
              <p className="font-mono text-[11px] text-text-muted">Density triggers regen after 400 ms</p>
            </Section>
          </div>
        )}

        {/* Resize handle — bottom-right corner */}
        {!collapsed && (
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
