"use client"

import { useState, useCallback, useRef } from "react"

// Dispatch a circuit-config CustomEvent on window.
// The circuit-bg component listens for this and forwards it to the worker.
function dispatch(detail: Record<string, unknown>) {
  window.dispatchEvent(new CustomEvent("circuit-config", { detail }))
}

interface SliderProps {
  label: string
  sub?: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
  format?: (v: number) => string
}

function Slider({ label, sub, value, min, max, step, onChange, format }: SliderProps) {
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <div>
          <span className="text-sm font-medium text-text-primary">{label}</span>
          {sub && <span className="ml-2 font-mono text-xs text-text-muted">{sub}</span>}
        </div>
        <span className="font-mono text-xs text-accent tabular-nums">
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
        className="w-full accent-[--accent]"
      />
    </div>
  )
}

const FPS_OPTIONS = [10, 20, 30, 45, 60]

export default function CircuitConfigPage() {
  const [traceAlpha, setTraceAlpha] = useState(0.06)
  const [padAlpha, setPadAlpha] = useState(0.07)
  const [fadeStrength, setFadeStrength] = useState(0.65)
  const [maxPulses, setMaxPulses] = useState(24)
  const [fps, setFps] = useState(30)
  const [density, setDensity] = useState(1.0)

  // Debounce density changes — triggers a full regen
  const densityTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onDensityChange = useCallback((v: number) => {
    setDensity(v)
    if (densityTimer.current) clearTimeout(densityTimer.current)
    densityTimer.current = setTimeout(() => dispatch({ density: v }), 400)
  }, [])

  const onTraceAlpha = useCallback((v: number) => {
    setTraceAlpha(v)
    dispatch({ traceAlpha: v })
  }, [])

  const onPadAlpha = useCallback((v: number) => {
    setPadAlpha(v)
    dispatch({ padAlpha: v })
  }, [])

  const onFadeStrength = useCallback((v: number) => {
    setFadeStrength(v)
    dispatch({ fadeStrength: v })
  }, [])

  const onMaxPulses = useCallback((v: number) => {
    setMaxPulses(v)
    dispatch({ maxPulses: v })
  }, [])

  const onFps = useCallback((v: number) => {
    setFps(v)
    dispatch({ fps: v })
  }, [])

  const handleReset = () => {
    setTraceAlpha(0.06)
    setPadAlpha(0.07)
    setFadeStrength(0.65)
    setMaxPulses(24)
    setFps(30)
    setDensity(1.0)
    dispatch({ reset: true })
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-xl font-semibold text-text-primary">
            Circuit Config
          </h1>
          <p className="mt-1 text-sm text-text-secondary">
            Live tuning — session only, resets on reload
          </p>
        </div>
        <button
          onClick={handleReset}
          className="font-mono text-xs text-text-muted transition-colors hover:text-text-primary"
        >
          Reset all
        </button>
      </div>

      {/* Visual */}
      <div className="rounded-lg border border-border bg-bg-surface p-5 space-y-5">
        <p className="font-mono text-xs uppercase tracking-wider text-text-muted">Visual</p>
        <Slider
          label="Trace opacity"
          sub="--trace-alpha"
          value={traceAlpha}
          min={0}
          max={0.4}
          step={0.005}
          onChange={onTraceAlpha}
          format={(v) => v.toFixed(3)}
        />
        <Slider
          label="Pad opacity"
          sub="--pad-alpha"
          value={padAlpha}
          min={0}
          max={0.4}
          step={0.005}
          onChange={onPadAlpha}
          format={(v) => v.toFixed(3)}
        />
        <Slider
          label="Vignette strength"
          sub="center fade"
          value={fadeStrength}
          min={0}
          max={1}
          step={0.01}
          onChange={onFadeStrength}
          format={(v) => v.toFixed(2)}
        />
      </div>

      {/* Animation */}
      <div className="rounded-lg border border-border bg-bg-surface p-5 space-y-5">
        <p className="font-mono text-xs uppercase tracking-wider text-text-muted">Animation</p>
        <Slider
          label="Max pulses"
          value={maxPulses}
          min={0}
          max={48}
          step={1}
          onChange={onMaxPulses}
        />
        <div className="space-y-2">
          <div className="flex items-baseline justify-between">
            <span className="text-sm font-medium text-text-primary">Frame rate</span>
            <span className="font-mono text-xs text-accent">{fps} fps</span>
          </div>
          <div className="flex gap-2">
            {FPS_OPTIONS.map((f) => (
              <button
                key={f}
                onClick={() => onFps(f)}
                className={`flex-1 rounded border px-2 py-1.5 font-mono text-xs transition-colors ${
                  fps === f
                    ? "border-accent bg-accent/10 text-accent"
                    : "border-border text-text-secondary hover:text-text-primary"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generation */}
      <div className="rounded-lg border border-border bg-bg-surface p-5 space-y-5">
        <p className="font-mono text-xs uppercase tracking-wider text-text-muted">Generation</p>
        <Slider
          label="Density"
          sub="triggers regen"
          value={density}
          min={0.1}
          max={2.0}
          step={0.05}
          onChange={onDensityChange}
          format={(v) => v.toFixed(2)}
        />
        <p className="font-mono text-xs text-text-muted">
          Density change regenerates the circuit after 400 ms.
        </p>
      </div>
    </div>
  )
}
