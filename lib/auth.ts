import { cookies } from 'next/headers'
import { getWixClient, WIX_TOKEN_COOKIE, WixTokens } from './wix'

export type AuthState = {
  isLoggedIn: boolean
  memberName: string | null
  memberPhoto: string | null
}

export async function getAuthState(): Promise<AuthState> {
  const cookieStore = await cookies()
  const tokensCookie = cookieStore.get(WIX_TOKEN_COOKIE)

  if (!tokensCookie) {
    return { isLoggedIn: false, memberName: null, memberPhoto: null }
  }

  try {
    const tokens = JSON.parse(tokensCookie.value) as WixTokens
    const client = getWixClient(tokens)
    const { member } = await client.members.getCurrentMember({ fieldsets: ['FULL'] })
    return {
      isLoggedIn: true,
      memberName: member?.profile?.nickname ?? member?.loginEmail ?? null,
      memberPhoto: member?.profile?.photo?.url ?? null,
    }
  } catch {
    return { isLoggedIn: false, memberName: null, memberPhoto: null }
  }
}
