import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getWixClient, WIX_TOKEN_COOKIE, WIX_OAUTH_COOKIE } from '@/lib/wix'

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl
  const code = searchParams.get('code')
  const state = searchParams.get('state')

  const cookieStore = await cookies()
  const oauthCookie = cookieStore.get(WIX_OAUTH_COOKIE)

  if (!code || !state || !oauthCookie) {
    return NextResponse.redirect(new URL('/', req.url))
  }

  const oauthData = JSON.parse(oauthCookie.value)
  const client = getWixClient()

  try {
    const tokens = await client.auth.getMemberTokens(code, state, oauthData)

    cookieStore.set(WIX_TOKEN_COOKIE, JSON.stringify(tokens), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 14, // 14 days
      path: '/',
    })
  } catch {
    // Auth failed — send back to home without setting tokens
    cookieStore.delete(WIX_OAUTH_COOKIE)
    return NextResponse.redirect(new URL('/', req.url))
  }

  cookieStore.delete(WIX_OAUTH_COOKIE)
  return NextResponse.redirect(new URL('/account', req.url))
}
