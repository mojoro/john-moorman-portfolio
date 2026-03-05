"use client"

import { createContext, useContext, useState, useCallback } from "react"
import { ImageLightbox } from "./image-lightbox"

interface LightboxContextValue {
  open: (src: string, alt: string) => void
}

const LightboxContext = createContext<LightboxContextValue>({
  open: () => {},
})

export function useLightbox() {
  return useContext(LightboxContext)
}

export function LightboxProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState({ isOpen: false, src: "", alt: "" })

  const open = useCallback((src: string, alt: string) => {
    setState({ isOpen: true, src, alt })
  }, [])

  return (
    <LightboxContext.Provider value={{ open }}>
      {children}
      <ImageLightbox
        src={state.src}
        alt={state.alt}
        isOpen={state.isOpen}
        onClose={() => setState({ isOpen: false, src: "", alt: "" })}
      />
    </LightboxContext.Provider>
  )
}
