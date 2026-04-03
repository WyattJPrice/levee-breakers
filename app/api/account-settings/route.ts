import { NextRequest, NextResponse } from 'next/server'
import { getWixClient } from '@/lib/wix'

export async function GET(req: NextRequest) {
  const wixClient = getWixClient({ get: (name) => req.cookies.get(name)?.value })
  const fallback = new URL('/account', req.url).toString()

  if (!wixClient.auth.loggedIn()) {
    console.error('[account-settings] not logged in')
    return NextResponse.redirect(fallback)
  }

  try {
    await wixClient.members.getCurrentMember({ fieldsets: [] })
    const { accessToken } = wixClient.auth.getTokens()
    console.log('[account-settings] got access token, length:', accessToken.value?.length)

    const res = await fetch('https://www.wixapis.com/redirects/v1/redirect-session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: accessToken.value,
      },
      body: JSON.stringify({
        membersAccount: { section: 'ACCOUNT_INFO' },
        callbacks: { postFlowUrl: fallback },
      }),
    })

    const text = await res.text()
    console.log('[account-settings] wix response status:', res.status, 'body:', text)

    if (!res.ok) {
      return NextResponse.redirect(fallback)
    }

    const data = JSON.parse(text)
    return NextResponse.redirect(data.redirectSession?.fullUrl ?? fallback)
  } catch (err) {
    console.error('[account-settings] error:', err)
    return NextResponse.redirect(fallback)
  }
}
