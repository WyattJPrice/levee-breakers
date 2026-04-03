import { cookies } from 'next/headers'
import { getWixClient } from './wix'

export type AuthState = {
  isLoggedIn: boolean
  memberName: string | null
  memberPhoto: string | null
}

export async function getAuthState(): Promise<AuthState> {
  const cookieStore = await cookies()
  const wixClient = getWixClient({ get: (name) => cookieStore.get(name)?.value })

  const isLoggedIn = wixClient.auth.loggedIn()
  if (!isLoggedIn) return { isLoggedIn: false, memberName: null, memberPhoto: null }

  try {
    const { member } = await wixClient.members.getCurrentMember({ fieldsets: ['FULL'] })
    return {
      isLoggedIn: true,
      memberName: member?.profile?.nickname ?? member?.loginEmail ?? null,
      memberPhoto: member?.profile?.photo?.url ?? null,
    }
  } catch {
    return { isLoggedIn: true, memberName: null, memberPhoto: null }
  }
}
