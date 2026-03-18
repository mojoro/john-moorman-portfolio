import { NextRequest, NextResponse } from "next/server"
import { COOKIE_NAME } from "@/lib/admin/auth"

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const response = NextResponse.next()

  // Pass pathname to server components via header
  response.headers.set("x-pathname", pathname)

  // Protect admin routes (except login)
  if (pathname.startsWith("/admin") && pathname !== "/admin/login") {
    const session = request.cookies.get(COOKIE_NAME)
    if (!session) {
      return NextResponse.redirect(new URL("/admin/login", request.url))
    }
  }

  return response
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.png|images/).*)"],
}
