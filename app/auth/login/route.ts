import { NextRequest, NextResponse } from 'next/server'
import { getWixClient, WIX_OAUTH_COOKIE } from '@/lib/wix'

export async function GET(req: NextRequest) {
  const returnToUrl = req.nextUrl.searchParams.get('returnToUrl') ?? req.nextUrl.origin

  const wixClient = getWixClient({ get: () => undefined })
  const callbackUrl = new URL('/auth/callback', req.url).toString()
  const oauthData = wixClient.auth.generateOAuthData(callbackUrl, returnToUrl)

  const { authUrl } = await wixClient.auth.getAuthUrl(oauthData, {
    responseMode: 'query',
  })

  const response = NextResponse.redirect(authUrl)
  response.cookies.set(WIX_OAUTH_COOKIE, JSON.stringify(oauthData), {
    httpOnly: true,
    maxAge: 60 * 30,
    path: '/',
  })

  return response
}
