"use client"

import { createContext, use, useEffect, useRef, useState, useCallback } from "react"

type Theme = "dark" | "light"

interface ThemeContextValue {
  theme: Theme
  toggleTheme: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function useTheme() {
  const context = use(ThemeContext)
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return context
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>("dark")
  const mountedRef = useRef(false)

  useEffect(() => {
    const stored = localStorage.getItem("theme") as Theme | null
    if (stored) {
      setTheme(stored)
    } else if (window.matchMedia("(prefers-color-scheme: light)").matches) {
      setTheme("light")
    }
    mountedRef.current = true
  }, [])

  useEffect(() => {
    if (!mountedRef.current) return
    const root = document.documentElement
    if (theme === "light") {
      root.setAttribute("data-theme", "light")
    } else {
      root.removeAttribute("data-theme")
    }
    localStorage.setItem("theme", theme)
  }, [theme])

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"))
  }, [])

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}
