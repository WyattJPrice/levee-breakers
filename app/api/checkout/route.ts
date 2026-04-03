import { NextRequest, NextResponse } from 'next/server'
import { getWixClient } from '@/lib/wix'

export async function GET(req: NextRequest) {
  const planId = req.nextUrl.searchParams.get('planId')
  if (!planId) return NextResponse.redirect(new URL('/plans', req.url))

  const wixClient = getWixClient({ get: (name) => req.cookies.get(name)?.value })

  try {
    const { redirectSession } = await wixClient.redirects.createRedirectSession({
      paidPlansCheckout: { planId },
      callbacks: {
        postFlowUrl: new URL('/account', req.url).toString(),
        planListUrl: new URL('/plans', req.url).toString(),
      },
    })
    return NextResponse.redirect(redirectSession?.fullUrl ?? new URL('/plans', req.url).toString())
  } catch (err) {
    console.error('Checkout error:', err)
    return NextResponse.redirect(new URL('/plans', req.url))
  }
}
