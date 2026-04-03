import { createClient, OAuthStrategy } from '@wix/sdk'
import { members } from '@wix/members'
import { orders, plans } from '@wix/pricing-plans'
import { redirects } from '@wix/redirects'
import { PHASE_PRODUCTION_BUILD } from 'next/constants'

export const WIX_REFRESH_TOKEN_COOKIE = 'wix_refreshToken'
export const WIX_OAUTH_COOKIE = 'wix-oauth'

export type CookieGetter = { get(name: string): string | undefined }

const getRefreshToken = (cookieStore: CookieGetter) =>
  process.env.NEXT_PHASE !== PHASE_PRODUCTION_BUILD
    ? JSON.parse(cookieStore.get(WIX_REFRESH_TOKEN_COOKIE) || '{}')
    : {}

export function getWixClient(cookieStore: CookieGetter) {
  return createClient({
    modules: { members, orders, plans, redirects },
    auth: OAuthStrategy({
      clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID!,
      tokens: {
        refreshToken: getRefreshToken(cookieStore),
        accessToken: { value: '', expiresAt: 0 },
      },
    }),
  })
}

export type WixClient = ReturnType<typeof getWixClient>
