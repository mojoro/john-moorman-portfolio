export interface OgData {
  title: string
  description: string
  image: string
  imageWidth: number
  imageHeight: number
  siteName: string
}

function getMetaContent(html: string, property: string): string {
  const match =
    html.match(
      new RegExp(
        `<meta[^>]*(?:property|name)=["']${property}["'][^>]*content=["']([^"']*)["']`,
        "i",
      ),
    ) ??
    html.match(
      new RegExp(
        `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name)=["']${property}["']`,
        "i",
      ),
    )
  return match?.[1] ?? ""
}

function resolveUrl(src: string, base: string): string {
  if (!src) return ""
  if (src.startsWith("//")) return `https:${src}`
  if (src.startsWith("http")) return src
  try {
    return new URL(src, base).href
  } catch {
    return ""
  }
}

export async function fetchOgData(url: string): Promise<OgData | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 5000)

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; OGBot/1.0; +https://johnmoorman.com)",
      },
      signal: controller.signal,
      next: { revalidate: 86400 },
    })
    clearTimeout(timeout)

    if (!res.ok) return null

    const html = await res.text()

    const titleTag =
      html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1]?.trim() ?? ""
    const title =
      getMetaContent(html, "og:title") ||
      getMetaContent(html, "twitter:title") ||
      titleTag
    const description =
      getMetaContent(html, "og:description") ||
      getMetaContent(html, "twitter:description") ||
      getMetaContent(html, "description")
    const rawImage =
      getMetaContent(html, "og:image") || getMetaContent(html, "twitter:image")
    const image = resolveUrl(rawImage, url)
    const imageWidth = parseInt(
      getMetaContent(html, "og:image:width") ||
        getMetaContent(html, "twitter:image:width") ||
        "0",
      10,
    )
    const imageHeight = parseInt(
      getMetaContent(html, "og:image:height") ||
        getMetaContent(html, "twitter:image:height") ||
        "0",
      10,
    )
    const siteName =
      getMetaContent(html, "og:site_name") ||
      new URL(url).hostname.replace(/^www\./, "")

    return { title, description, image, imageWidth, imageHeight, siteName }
  } catch {
    return null
  }
}
