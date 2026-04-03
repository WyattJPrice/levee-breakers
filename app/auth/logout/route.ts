import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { WIX_TOKEN_COOKIE } from '@/lib/wix'

export async function GET() {
  const cookieStore = await cookies()
  cookieStore.delete(WIX_TOKEN_COOKIE)
  return NextResponse.redirect(new URL('/', process.env.NEXT_PUBLIC_BASE_URL ?? 'https://levee.wyattprice.dev'))
}
