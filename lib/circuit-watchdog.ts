/**
 * Frame-rate watchdog for the circuit background.
 *
 * The board is decoration. On a machine that can afford it that is fine; on a
 * machine that cannot, a full-canvas vignette repaint plus a radial gradient
 * per glow node every 33 ms is the difference between a smooth page and a
 * janky one. Rather than guess from navigator.hardwareConcurrency or
 * deviceMemory — proxies that are wrong in both directions — the renderer
 * measures its own draw() and backs off when the measurement says so.
 *
 * Shared by both rendering paths so the thresholds exist in exactly one place:
 *   - workers/circuit-worker.ts   (OffscreenCanvas, setInterval, off-thread)
 *   - components/circuit-bg.tsx   (Safari < 17 fallback, rAF, main thread)
 *
 * Two signals, either of which is enough:
 *   1. Mean cost of draw() itself.
 *   2. Mean gap between consecutive draws. setInterval does not skip frames
 *      the way rAF does, so a gap much longer than the interval means the
 *      callback physically could not be serviced on time — interval
 *      saturation is the clearest slow-device signal there is.
 *
 * Two stages, because "slow" is not binary: first cut the work, then, only if
 * that was not enough, give up entirely.
 */

/**
 * Samples in the rolling window. 64 draws ≈ 2.1 s at the default 33 ms
 * interval. Long enough that one expensive layout, a GC pause or a competing
 * page load cannot trip it; short enough that a genuinely slow device backs
 * off while the visitor is still reading the hero.
 */
const WINDOW = 64

/**
 * Draws ignored after init, resize, regeneration, a config override or a
 * return from a hidden tab. Generation is by far the most expensive thing
 * either renderer does, and the first draws after it also pay canvas warm-up
 * and first-gradient costs. Measuring those would condemn every device.
 */
const WARMUP_FRAMES = 10

/**
 * Stage 1 trips when the mean draw costs 60 % of the frame interval — about
 * 20 ms of the default 33 ms. Under that the loop still has room to service
 * pointer and resize messages between frames; over it the thread is doing
 * almost nothing but paint.
 */
const DEGRADE_FRACTION = 0.6

/**
 * Stage 2 trips at 85 % — about 28 ms of 33 ms. Reaching that *after* the
 * board has already been cut in half means the device cannot afford the
 * effect at any quality worth shipping.
 */
const DISABLE_FRACTION = 0.85

/**
 * A mean gap of 1.6× the interval (≈53 ms, under 19 fps) counts as saturation
 * regardless of what draw() itself measured — the work may be cheap and the
 * thread still oversubscribed.
 */
const SATURATION_FACTOR = 1.6

export type WatchdogStage = "ok" | "degraded" | "disabled"

/** What the caller must do about the sample it just reported. */
export type WatchdogAction = "degrade" | "disable" | null

export interface FrameWatchdog {
  /** Current stage. Never walks backwards without a fresh watchdog. */
  readonly stage: WatchdogStage
  /**
   * Report one completed draw. `startedAt` and `costMs` come from a
   * performance.now() pair around the draw call; `intervalMs` is the loop's
   * target frame interval (33 ms by default, or whatever /admin/circuit's fps
   * slider asked for).
   */
  sample(startedAt: number, costMs: number, intervalMs: number): WatchdogAction
  /** Drop the window and re-arm the warmup. */
  reset(): void
  /** Stop or resume accumulating — used while the page is backgrounded. */
  setSuspended(suspended: boolean): void
}

export function createFrameWatchdog(): FrameWatchdog {
  const cost = new Float64Array(WINDOW)
  const gap = new Float64Array(WINDOW)
  let costSum = 0
  let gapSum = 0
  let filled = 0
  let idx = 0
  let warmup = WARMUP_FRAMES
  let lastStart = 0
  let suspended = false
  let stage: WatchdogStage = "ok"

  function reset() {
    costSum = 0
    gapSum = 0
    filled = 0
    idx = 0
    warmup = WARMUP_FRAMES
    lastStart = 0
  }

  return {
    get stage() {
      return stage
    },

    reset,

    setSuspended(next: boolean) {
      if (next === suspended) return
      suspended = next
      // A throttled background tab is not a slow device, and the first gap
      // after returning spans the whole time the page was away. Either way the
      // window is worthless now, so start over.
      reset()
    },

    sample(startedAt: number, costMs: number, intervalMs: number): WatchdogAction {
      if (suspended || stage === "disabled") return null
      if (warmup > 0) {
        warmup--
        lastStart = startedAt
        return null
      }

      // The first sample of a window has nothing to measure against; treat it
      // as an on-time frame rather than as an infinite gap.
      const gapMs = lastStart === 0 ? intervalMs : startedAt - lastStart
      lastStart = startedAt

      if (filled === WINDOW) {
        costSum -= cost[idx]
        gapSum -= gap[idx]
      } else {
        filled++
      }
      cost[idx] = costMs
      gap[idx] = gapMs
      costSum += costMs
      gapSum += gapMs
      idx = (idx + 1) % WINDOW

      // A full window *is* the "sustained" test. Every reset empties it, so a
      // stage change always costs WINDOW consecutive honest frames — roughly
      // two seconds of the device failing to keep up.
      if (filled < WINDOW) return null

      const overBudget =
        costSum / WINDOW >= intervalMs * (stage === "ok" ? DEGRADE_FRACTION : DISABLE_FRACTION) ||
        gapSum / WINDOW >= intervalMs * SATURATION_FACTOR

      if (!overBudget) return null

      if (stage === "ok") {
        stage = "degraded"
        // The degraded renderer has to be judged on its own frames, not on the
        // ones that condemned the full-quality board.
        reset()
        return "degrade"
      }

      stage = "disabled"
      return "disable"
    },
  }
}
