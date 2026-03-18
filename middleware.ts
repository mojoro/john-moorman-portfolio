import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/admin/auth"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = request.cookies.get(COOKIE_NAME)
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/admin/:path*"],
}
