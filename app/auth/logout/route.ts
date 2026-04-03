import { NextRequest, NextResponse } from 'next/server'
import { getWixClient, WIX_REFRESH_TOKEN_COOKIE } from '@/lib/wix'

export async function GET(req: NextRequest) {
  const wixClient = getWixClient({ get: (name) => req.cookies.get(name)?.value })
  const { logoutUrl } = await wixClient.auth.logout(req.nextUrl.origin)

  const response = NextResponse.redirect(logoutUrl)
  response.cookies.delete(WIX_REFRESH_TOKEN_COOKIE)
  return response
}
