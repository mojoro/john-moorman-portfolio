import type { Metadata } from "next"
import { Syne, DM_Sans, JetBrains_Mono } from "next/font/google"
import { ThemeProvider } from "@/components/theme-provider"
import { MotionProvider } from "@/components/motion-provider"
import { Sidebar } from "@/components/sidebar"
import { ChatPanelLazy } from "@/components/chat-panel-lazy"

import { Analytics } from "@vercel/analytics/react"
import Script from "next/script"
import { CircuitBgLazy } from "@/components/circuit-bg-lazy"
import { PrefetchRoutes } from "@/components/prefetch-routes"
import { getPosts } from "@/lib/content"
import { headers } from "next/headers"
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

const SITE_NAME = "John Moorman"
const SITE_URL = "https://johnmoorman.com"
const DEFAULT_TITLE = "John Moorman · Software Engineer in Berlin"
const DEFAULT_DESCRIPTION =
  "John Moorman is an independent fullstack engineer in Berlin building production software with Next.js, TypeScript, and an AI-native workflow. Selected work, writing, and contact."

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: DEFAULT_TITLE,
    template: "%s · John Moorman",
  },
  description: DEFAULT_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: "John Moorman", url: SITE_URL }],
  creator: "John Moorman",
  publisher: "John Moorman",
  category: "technology",
  keywords: [
    "John Moorman",
    "software engineer Berlin",
    "fullstack engineer",
    "Next.js developer",
    "TypeScript",
    "React",
    "AI-native development",
    "Anthropic API",
    "Claude Code",
    "freelance developer Berlin",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: [
      {
        url: "/og",
        width: 1200,
        height: 630,
        alt: "John Moorman, Software Engineer in Berlin",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    images: ["/og"],
    creator: "@John_Moorman",
    site: "@John_Moorman",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/icon.png", type: "image/png" },
    ],
  },
  verification: {
    // Add Google Search Console / Bing verification tokens here if/when claimed.
  },
}

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": `${SITE_URL}/#person`,
  name: "John Moorman",
  url: SITE_URL,
  image: `${SITE_URL}/images/spring-2025-professional-photo-resize.jpeg`,
  jobTitle: "Software Engineer",
  description: DEFAULT_DESCRIPTION,
  address: {
    "@type": "PostalAddress",
    addressLocality: "Berlin",
    addressCountry: "DE",
  },
  email: "john@johnmoorman.com",
  knowsAbout: [
    "Next.js",
    "TypeScript",
    "React",
    "Node.js",
    "Tailwind CSS",
    "Anthropic API",
    "AI-native development",
    "Web automation",
    "Postgres",
  ],
  knowsLanguage: ["en", "de"],
  alumniOf: {
    "@type": "CollegeOrUniversity",
    name: "Boston Conservatory at Berklee",
  },
  sameAs: [
    "https://github.com/mojoro",
    "https://linkedin.com/in/john-moorman",
    "https://twitter.com/John_Moorman",
  ],
}

const websiteJsonLd = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": `${SITE_URL}/#website`,
  url: SITE_URL,
  name: SITE_NAME,
  description: DEFAULT_DESCRIPTION,
  inLanguage: "en",
  publisher: { "@id": `${SITE_URL}/#person` },
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
  const headerList = await headers()
  const pathname = headerList.get("x-pathname") ?? ""
  const isAdmin = pathname.startsWith("/admin")

  let allRoutes: string[] = []
  if (!isAdmin) {
    const [blogPosts, workPosts] = await Promise.all([
      getPosts("blog"),
      getPosts("work"),
    ])
    allRoutes = [
      "/",
      "/about",
      "/work",
      "/blog",
      ...blogPosts.map((p) => `/blog/${p.slug}`),
      ...workPosts.map((p) => `/work/${p.slug}`),
    ]
  }

  return (
    <html
      lang="en"
      className={`${syne.variable} ${dmSans.variable} ${jetbrainsMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        {!isAdmin && (
          <>
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
            />
            <script
              type="application/ld+json"
              dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
            />
          </>
        )}
      </head>
      <body className="antialiased">
        <ThemeProvider>
          <MotionProvider>
            {isAdmin ? (
              <>{children}</>
            ) : (
              <>
                <Sidebar />
                <div className="relative pt-14 md:ml-60 md:pt-0 print:ml-0 print:pt-0">
                  <CircuitBgLazy navOffset />
                  <div className="relative mx-auto max-w-[900px] px-6 md:px-12">
                    {children}
                  </div>
                </div>
                <ChatPanelLazy />
                <PrefetchRoutes routes={allRoutes} />
              </>
            )}
            <Analytics />
            <Script
              defer
              src="https://umami-ek8u.vercel.app/script.js"
              data-website-id="b5ed7964-94ba-48bd-b087-01adfd7a68dc"
              strategy="afterInteractive"
            />
          </MotionProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
