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
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnded = () => setIsPlaying(false)
    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
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

  const seek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = Number(e.target.value)
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
              <svg width="11" height="13" viewBox="0 0 11 13" fill="currentColor" aria-hidden="true">
                <rect x="0" y="0" width="3.5" height="13" rx="1" />
                <rect x="7.5" y="0" width="3.5" height="13" rx="1" />
              </svg>
            ) : (
              <svg width="11" height="13" viewBox="0 0 11 13" fill="currentColor" aria-hidden="true">
                <path d="M0 0L11 6.5L0 13Z" />
              </svg>
            )}
          </button>

          {/* Progress track */}
          <div className="relative flex h-5 flex-1 items-center">
            <div className="h-px w-full overflow-hidden rounded-full bg-bg-elevated">
              <div
                className="h-full rounded-full bg-accent/50"
                style={{ width: `${progress}%` }}
              />
            </div>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.1}
              value={currentTime}
              onChange={seek}
              aria-label="Seek"
              className="absolute inset-0 h-full w-full cursor-pointer opacity-0"
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
