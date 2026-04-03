import { NextRequest, NextResponse } from 'next/server'
import { getWixClient, WIX_OAUTH_COOKIE, WIX_REFRESH_TOKEN_COOKIE } from '@/lib/wix'
import type { OauthData } from '@wix/sdk'

export async function GET(req: NextRequest) {
  const oauthCookie = req.cookies.get(WIX_OAUTH_COOKIE)
  const oauthData: OauthData = JSON.parse(oauthCookie?.value ?? '{}')
  const returnTo = oauthData.originalUri ?? req.nextUrl.origin

  if (req.nextUrl.search.includes('error=')) {
    return NextResponse.redirect(returnTo)
  }

  const wixClient = getWixClient({ get: () => undefined })
  const { state, code } = wixClient.auth.parseFromUrl(req.url, 'query')

  try {
    const memberTokens = await wixClient.auth.getMemberTokens(code, state, oauthData)

    const response = NextResponse.redirect(returnTo)
    response.cookies.delete(WIX_OAUTH_COOKIE)
    response.cookies.set({
      name: WIX_REFRESH_TOKEN_COOKIE,
      value: JSON.stringify(memberTokens.refreshToken),
      maxAge: 60 * 60 * 24 * 14,
      path: '/',
    })
    return response
  } catch {
    const response = NextResponse.redirect(returnTo)
    response.cookies.delete(WIX_OAUTH_COOKIE)
    return response
  }
}
