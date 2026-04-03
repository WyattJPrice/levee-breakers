import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getWixClient, WIX_TOKEN_COOKIE, WixTokens } from '@/lib/wix'

export async function POST(req: NextRequest) {
  const { planId } = await req.json()

  if (!planId) {
    return NextResponse.json({ error: 'missing_plan_id' }, { status: 400 })
  }

  const cookieStore = await cookies()
  const tokensCookie = cookieStore.get(WIX_TOKEN_COOKIE)

  if (!tokensCookie) {
    return NextResponse.json({ error: 'not_authenticated' }, { status: 401 })
  }

  try {
    const tokens = JSON.parse(tokensCookie.value) as WixTokens
    const client = getWixClient(tokens)

    const order = await client.orders.createOnlineOrder({
      planId,
      startDate: new Date(),
    })

    return NextResponse.json({ checkoutUrl: order.checkoutUrl })
  } catch (err) {
    console.error('Wix checkout error:', err)
    return NextResponse.json({ error: 'checkout_failed' }, { status: 500 })
  }
}
