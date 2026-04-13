import { NextRequest, NextResponse } from "next/server"
import { fetchOgData } from "@/lib/og"

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 })
  }

  try {
    new URL(url)
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  const data = await fetchOgData(url)
  if (!data) {
    return NextResponse.json({ error: "Failed to fetch OG data" }, { status: 502 })
  }

  return NextResponse.json(data, {
    headers: { "Cache-Control": "private, max-age=3600" },
  })
}
