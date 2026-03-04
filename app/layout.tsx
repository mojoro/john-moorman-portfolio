import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "John Moorman — Software Engineer",
  description:
    "Software Engineer based in Berlin. AI-native development, Next.js, TypeScript.",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  )
}
