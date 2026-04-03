import { NextRequest, NextResponse } from 'next/server'
import { WIX_REFRESH_TOKEN_COOKIE } from '@/lib/wix'

export function middleware(request: NextRequest) {
  const refreshToken = request.cookies.get(WIX_REFRESH_TOKEN_COOKIE)
  const isLoggedIn = !!refreshToken?.value && refreshToken.value !== '{}'

  if (!isLoggedIn && request.nextUrl.pathname.startsWith('/account')) {
    const loginUrl = new URL('/auth/login', request.url)
    loginUrl.searchParams.set('returnToUrl', request.url)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/account/:path*'],
}
