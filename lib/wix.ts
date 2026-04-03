import { createClient, OAuthStrategy } from '@wix/sdk'
import { members } from '@wix/members'
import { orders } from '@wix/pricing-plans'

export const WIX_TOKEN_COOKIE = 'wix-tokens'
export const WIX_OAUTH_COOKIE = 'wix-oauth'

export const REDIRECT_URI =
  `${process.env.NEXT_PUBLIC_BASE_URL ?? 'http://localhost:3000'}/auth/callback`

export type WixTokens = {
  accessToken: { value: string; expiresAt: number }
  refreshToken: { value: string }
}

export function getWixClient(tokens?: WixTokens | null) {
  return createClient({
    modules: { members, orders },
    auth: OAuthStrategy({
      clientId: process.env.NEXT_PUBLIC_WIX_CLIENT_ID!,
      tokens: tokens ?? null,
    }),
  })
}
