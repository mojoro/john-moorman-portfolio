"use client"

import dynamic from "next/dynamic"

const ChatPanel = dynamic(
  () => import("./chat-panel").then((mod) => mod.ChatPanel),
  { ssr: false }
)

export function ChatPanelLazy() {
  return <ChatPanel />
}
