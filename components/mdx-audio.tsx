"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type React from "react"

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

export function MdxAudio({
  title,
  src,
  ...audioProps
}: React.ComponentProps<"audio"> & { title?: string }) {
  const audioRef = useRef<HTMLAudioElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)
  const isDraggingRef = useRef(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)
    const onTimeUpdate = () => {
      if (!isDraggingRef.current) setCurrentTime(audio.currentTime)
    }
    const onLoadedMetadata = () => setDuration(audio.duration)

    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("timeupdate", onTimeUpdate)
    audio.addEventListener("loadedmetadata", onLoadedMetadata)

    return () => {
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("timeupdate", onTimeUpdate)
      audio.removeEventListener("loadedmetadata", onLoadedMetadata)
    }
  }, [])

  const toggle = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return
    isPlaying ? audio.pause() : audio.play()
  }, [isPlaying])

  const seekToClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      const audio = audioRef.current
      if (!track || !audio || !duration) return
      const rect = track.getBoundingClientRect()
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width))
      const time = ratio * duration
      audio.currentTime = time
      setCurrentTime(time)
    },
    [duration],
  )

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    isDraggingRef.current = true
    e.currentTarget.setPointerCapture(e.pointerId)
    seekToClientX(e.clientX)
  }

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDraggingRef.current) return
    seekToClientX(e.clientX)
  }

  const handlePointerUp = () => {
    isDraggingRef.current = false
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

  return (
    <figure className="my-8">
      <div className="rounded-lg border border-border bg-bg-surface px-5 py-4">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <audio ref={audioRef} src={src} preload="metadata" {...audioProps} />

        <div className="flex items-center gap-4">
          {/* Play / Pause */}
          <button
            type="button"
            onClick={toggle}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border border-accent/40 text-accent transition-all hover:border-accent/70 hover:bg-accent/10"
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <rect x="3.5" y="2.5" width="3" height="11" rx="0.75" />
                <rect x="9.5" y="2.5" width="3" height="11" rx="0.75" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M5 2.5L14 8L5 13.5Z" />
              </svg>
            )}
          </button>

          {/* Progress track — pointer events handle seeking */}
          <div
            ref={trackRef}
            role="slider"
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.floor(duration)}
            aria-valuenow={Math.floor(currentTime)}
            tabIndex={0}
            className="relative flex h-5 flex-1 cursor-pointer items-center select-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            {/* Track bar */}
            <div className="h-px w-full rounded-full bg-bg-elevated">
              <div
                className="h-full rounded-full bg-accent/50"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Thumb */}
            <div
              className="pointer-events-none absolute h-2.5 w-2.5 -translate-x-1/2 rounded-full bg-accent/80 shadow-[0_0_6px_rgba(100,255,218,0.35)]"
              style={{ left: `${progress}%` }}
            />
          </div>

          {/* Time */}
          <span className="flex-shrink-0 font-mono text-xs tabular-nums text-text-muted">
            {formatTime(currentTime)}
            {duration > 0 && <> / {formatTime(duration)}</>}
          </span>
        </div>
      </div>

      {title && (
        <figcaption className="mt-2 text-center text-xs italic text-text-muted">
          {title}
        </figcaption>
      )}
    </figure>
  )
}
