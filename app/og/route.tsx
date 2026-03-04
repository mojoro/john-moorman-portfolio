import { ImageResponse } from "next/og"

export const runtime = "edge"

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0a192f",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "80px",
        }}
      >
        <div
          style={{
            color: "#64ffda",
            fontFamily: "monospace",
            fontSize: 18,
          }}
        >
          johnmoorman.com
        </div>
        <div
          style={{
            color: "#ccd6f6",
            fontSize: 72,
            fontWeight: 800,
            marginTop: 16,
          }}
        >
          John Moorman
        </div>
        <div
          style={{
            color: "#8892b0",
            fontSize: 28,
            marginTop: 12,
          }}
        >
          Software Engineer · Berlin
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  )
}
