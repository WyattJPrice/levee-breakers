import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getWixClient, WIX_OAUTH_COOKIE, REDIRECT_URI } from '@/lib/wix'

export async function GET() {
  const client = getWixClient()

  // Generate OAuth state (PKCE + state param) and store temporarily
  const oauthData = client.auth.generateOAuthData(REDIRECT_URI, '/')
  const { authUrl } = await client.auth.getAuthUrl(oauthData)

  const cookieStore = await cookies()
  cookieStore.set(WIX_OAUTH_COOKIE, JSON.stringify(oauthData), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 10, // 10 minutes
    path: '/',
  })

  return NextResponse.redirect(authUrl)
}
