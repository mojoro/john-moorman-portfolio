import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(request: Request) {
  const url = new URL(request.url)
  const origin = url.origin
  const title = url.searchParams.get("title")
  const eyebrow = url.searchParams.get("eyebrow") ?? "johnmoorman.com"
  const subtitle =
    url.searchParams.get("subtitle") ?? "Software Engineer · Berlin"

  const photo = await fetch(`${origin}/images/og-about-img.jpeg`).then((r) =>
    r.arrayBuffer()
  )

  const heading = title ?? "John Moorman"

  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a192f",
          width: "100%",
          height: "100%",
          display: "flex",
        }}
      >
        {/* Left half — text */}
        <div
          style={{
            width: "60%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: 80,
            paddingRight: 40,
          }}
        >
          <div
            style={{ color: "#64ffda", fontFamily: "monospace", fontSize: 32 }}
          >
            {eyebrow}
          </div>
          <div
            style={{
              color: "#ccd6f6",
              fontSize: title ? 60 : 74,
              fontWeight: 800,
              marginTop: 16,
              lineHeight: 1.1,
              display: "flex",
              flexWrap: "wrap",
            }}
          >
            {heading}
          </div>
          <div style={{ color: "#8892b0", fontSize: 32, marginTop: 16 }}>
            {subtitle}
          </div>
        </div>

        {/* Right side — headshot centered */}
        <div
          style={{
            width: "40%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo as unknown as string}
            width={340}
            height={340}
            alt=""
            style={{ borderRadius: 999, objectFit: "cover" }}
          />
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
