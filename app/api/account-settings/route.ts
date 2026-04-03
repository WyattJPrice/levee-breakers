import { NextRequest, NextResponse } from 'next/server'
import { getWixClient } from '@/lib/wix'

export async function GET(req: NextRequest) {
  const wixClient = getWixClient({ get: (name) => req.cookies.get(name)?.value })

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { redirectSession } = await (wixClient.redirects.createRedirectSession as any)({
      membersAccount: { section: 'ACCOUNT_INFO' },
      callbacks: {
        postFlowUrl: new URL('/account', req.url).toString(),
      },
    })
    return NextResponse.redirect(redirectSession?.fullUrl ?? new URL('/account', req.url).toString())
  } catch (err) {
    console.error('Account settings redirect error:', err)
    return NextResponse.redirect(new URL('/account', req.url))
  }
}
