"use client"

import dynamic from "next/dynamic"

const CircuitBg = dynamic(
  () => import("./circuit-bg").then((mod) => mod.CircuitBg),
  { ssr: false },
)

export function CircuitBgLazy() {
  return <CircuitBg />
}
