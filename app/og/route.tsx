import { ImageResponse } from "next/og"

export const runtime = "edge"

export async function GET(request: Request) {
  const origin = new URL(request.url).origin
  const photo = await fetch(`${origin}/images/og-about-img.jpeg`).then((r) =>
    r.arrayBuffer()
  )

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
            width: "50%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            paddingLeft: 80,
          }}
        >
          <div
            style={{ color: "#64ffda", fontFamily: "monospace", fontSize: 18 }}
          >
            johnmoorman.com
          </div>
          <div
            style={{
              color: "#ccd6f6",
              fontSize: 72,
              fontWeight: 800,
              marginTop: 16,
              lineHeight: 1.1,
            }}
          >
            John Moorman
          </div>
          <div style={{ color: "#8892b0", fontSize: 28, marginTop: 12 }}>
            Software Engineer · Berlin
          </div>
        </div>

        {/* Right half — headshot centered */}
        <div
          style={{
            width: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photo as unknown as string}
            width={390}
            height={390}
            alt=""
            style={{ borderRadius: 999, objectFit: "cover" }}
          />
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
