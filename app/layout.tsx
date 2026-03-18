import type { Metadata } from "next"
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { Sidebar } from "@/components/sidebar"
import { ChatPanelLazy } from "@/components/chat-panel-lazy"
import { CursorGlow } from "@/components/cursor-glow"
import { Analytics } from "@vercel/analytics/react"
import { PrefetchRoutes } from "@/components/prefetch-routes"
import { getPosts } from "@/lib/content"
import "./globals.css"

const syne = Syne({
  subsets: ["latin"],
  weight: ["600", "700", "800"],
  variable: "--font-syne",
  display: "swap",
})

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500"],
  variable: "--font-dm-sans",
  display: "swap",
})

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-jetbrains-mono",
  display: "swap",
})

export const metadata: Metadata = {
  title: "John Moorman | Software Engineer",
  description:
    "Software Engineer based in Berlin. AI-native development, Next.js, TypeScript.",
  metadataBase: new URL("https://johnmoorman.com"),
  openGraph: {
    title: "John Moorman | Software Engineer",
    description:
      "Software Engineer based in Berlin. AI-native development, Next.js, TypeScript.",
    url: "https://johnmoorman.com",
    siteName: "John Moorman",
    images: [{ url: "/og", width: 1200, height: 630 }],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "John Moorman | Software Engineer",
    description:
      "Software Engineer based in Berlin. AI-native development, Next.js, TypeScript.",
    images: ["/og"],
  },
}

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "John Moorman",
  url: "https://johnmoorman.com",
  jobTitle: "Software Engineer",
  address: { "@type": "PostalAddress", addressLocality: "Berlin", addressCountry: "DE" },
  email: "john@johnmoorman.com",
  sameAs: [
    "https://github.com/mojoro",
    "https://linkedin.com/in/john-moorman",
  ],
}

// Inline script to prevent flash of wrong theme on initial load.
// Runs synchronously before paint. Checks localStorage, then system preference.
const themeScript = `
  (function() {
    var theme = localStorage.getItem('theme');
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else if (!theme && window.matchMedia('(prefers-color-scheme: light)').matches) {
      document.documentElement.setAttribute('data-theme', 'light');
    }
  })();
`

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  const [blogPosts, workPosts] = await Promise.all([
    getPosts("blog"),
    getPosts("work"),
  ])

  const allRoutes = [
    "/",
    "/about",
    "/work",
    "/blog",
    "/resume",
    ...blogPosts.map((p) => `/blog/${p.slug}`),
    ...workPosts.map((p) => `/work/${p.slug}`),
  ]
  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <CursorGlow />
          <Sidebar />
          <div className="pt-14 md:ml-60 md:pt-0 print:ml-0 print:pt-0">
            <div className="mx-auto max-w-[900px] px-6 md:px-12">
              {children}
            </div>
          </div>
          <ChatPanelLazy />
          <PrefetchRoutes routes={allRoutes} />
          <Analytics />
        </ThemeProvider>
      </body>
    </html>
  )
}
