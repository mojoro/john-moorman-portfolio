"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { motion, AnimatePresence, useReducedMotion } from "framer-motion"

interface ImageLightboxProps {
  src: string
  alt: string
  isOpen: boolean
  onClose: () => void
}

export function ImageLightbox({ src, alt, isOpen, onClose }: ImageLightboxProps) {
  const shouldReduceMotion = useReducedMotion()
  const [scale, setScale] = useState(1)
  const [translate, setTranslate] = useState({ x: 0, y: 0 })
  const imgRef = useRef<HTMLImageElement>(null)
  const stateRef = useRef({ scale: 1, translate: { x: 0, y: 0 } })
  const dragRef = useRef({ active: false, startX: 0, startY: 0 })
  const pinchRef = useRef({ active: false, initialDistance: 0, initialScale: 1 })
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())

  const updateScale = useCallback((s: number) => {
    stateRef.current.scale = s
    setScale(s)
  }, [])

  const updateTranslate = useCallback((t: { x: number; y: number }) => {
    stateRef.current.translate = t
    setTranslate(t)
  }, [])

  const resetTransform = useCallback(() => {
    updateScale(1)
    updateTranslate({ x: 0, y: 0 })
  }, [updateScale, updateTranslate])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", handler)
    document.body.style.overflow = "hidden"
    return () => {
      document.removeEventListener("keydown", handler)
      document.body.style.overflow = ""
      resetTransform()
    }
  }, [isOpen, onClose, resetTransform])

  // Wheel zoom (non-passive to allow preventDefault)
  useEffect(() => {
    const img = imgRef.current
    if (!img || !isOpen) return
    const handler = (e: WheelEvent) => {
      e.preventDefault()
      const prev = stateRef.current.scale
      const factor = e.deltaY > 0 ? 0.9 : 1.1
      const next = prev * factor
      if (next < 1.05) {
        updateScale(1)
        updateTranslate({ x: 0, y: 0 })
      } else {
        updateScale(Math.min(next, 5))
      }
    }
    img.addEventListener("wheel", handler, { passive: false })
    return () => img.removeEventListener("wheel", handler)
  }, [isOpen, updateScale, updateTranslate])

  // Pointer events handle both drag-to-pan and pinch-to-zoom
  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    (e.target as HTMLElement).setPointerCapture(e.pointerId)
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pointersRef.current.size === 1 && stateRef.current.scale > 1) {
      const t = stateRef.current.translate
      dragRef.current = { active: true, startX: e.clientX - t.x, startY: e.clientY - t.y }
    } else if (pointersRef.current.size === 2) {
      dragRef.current.active = false
      const pts = [...pointersRef.current.values()]
      pinchRef.current = {
        active: true,
        initialDistance: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
        initialScale: stateRef.current.scale,
      }
    }
  }, [])

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    pointersRef.current.set(e.pointerId, { x: e.clientX, y: e.clientY })

    if (pinchRef.current.active && pointersRef.current.size === 2) {
      const pts = [...pointersRef.current.values()]
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y)
      const next = pinchRef.current.initialScale * (dist / pinchRef.current.initialDistance)
      if (next < 1.05) {
        updateScale(1)
        updateTranslate({ x: 0, y: 0 })
      } else {
        updateScale(Math.min(next, 5))
      }
    } else if (dragRef.current.active) {
      updateTranslate({
        x: e.clientX - dragRef.current.startX,
        y: e.clientY - dragRef.current.startY,
      })
    }
  }, [updateScale, updateTranslate])

  const handlePointerUp = useCallback((e: React.PointerEvent) => {
    pointersRef.current.delete(e.pointerId)
    if (pointersRef.current.size < 2) pinchRef.current.active = false
    if (pointersRef.current.size === 0) dragRef.current.active = false
  }, [])

  const handleDoubleClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    if (stateRef.current.scale > 1) {
      resetTransform()
    } else {
      updateScale(2)
    }
  }, [resetTransform, updateScale])

  const handleBackdropClick = useCallback(() => {
    if (stateRef.current.scale > 1) {
      resetTransform()
    } else {
      onClose()
    }
  }, [onClose, resetTransform])

  const zoomIn = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    updateScale(Math.min(stateRef.current.scale * 1.3, 5))
  }, [updateScale])

  const zoomOut = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    const next = stateRef.current.scale / 1.3
    if (next < 1.05) {
      resetTransform()
    } else {
      updateScale(next)
    }
  }, [updateScale, resetTransform])

  const isZoomed = scale > 1

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[100] flex items-center justify-center p-4"
          initial={shouldReduceMotion ? { opacity: 1 } : { opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={shouldReduceMotion ? { opacity: 0 } : { opacity: 0 }}
          transition={{ duration: 0.2 }}
          onClick={handleBackdropClick}
          role="dialog"
          aria-modal="true"
          aria-label={alt || "Enlarged image"}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 dark:bg-black/90" />

          {/* Controls */}
          <div className="absolute right-4 top-4 z-10 flex gap-2">
            {isZoomed && (
              <button
                onClick={(e) => { e.stopPropagation(); resetTransform() }}
                className="flex h-10 items-center justify-center rounded-full bg-white/10 px-3 font-mono text-xs text-white transition-colors hover:bg-white/20"
                aria-label="Reset zoom"
              >
                {Math.round(scale * 100)}%
              </button>
            )}
            <button
              onClick={zoomOut}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Zoom out"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              onClick={zoomIn}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Zoom in"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onClose() }}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label="Close image"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
          </div>

          {/* Entrance animation wrapper */}
          <motion.div
            initial={shouldReduceMotion ? {} : { scale: 0.9 }}
            animate={{ scale: 1 }}
            exit={shouldReduceMotion ? {} : { scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
            className="relative"
          >
            <img
              ref={imgRef}
              src={src}
              alt={alt}
              className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain select-none touch-none"
              style={{
                transform: `translate(${translate.x}px, ${translate.y}px) scale(${scale})`,
                cursor: isZoomed ? "grab" : "zoom-in",
                transition: dragRef.current.active ? "none" : "transform 0.2s ease-out",
              }}
              onDoubleClick={handleDoubleClick}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              draggable={false}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
