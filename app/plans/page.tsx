import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import Plans from '@/components/Plans'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import styles from './plans.module.css'
import { getAuthState } from '@/lib/auth'
import { getWixClient } from '@/lib/wix'

export const metadata: Metadata = {
  title: 'Coaching Plans | Levee Breakers',
  description:
    'Personalized running coaching from two-time Olympic Marathon Trials qualifier Jarrett LeBlanc. Plans for every level — from first 5K to Boston Marathon.',
  openGraph: {
    title: 'Coaching Plans | Levee Breakers',
    description:
      'Personalized running coaching from two-time Olympic Marathon Trials qualifier Jarrett LeBlanc.',
    url: 'https://leveebreakers.com/plans',
    siteName: 'Levee Breakers',
    type: 'website',
  },
}

export default async function PlansPage() {
  const [auth, cookieStore] = await Promise.all([getAuthState(), cookies()])
  const wixClient = getWixClient({ get: (name) => cookieStore.get(name)?.value })

  const activePlanKeys: string[] = []
  if (wixClient.auth.loggedIn()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { orders: memberOrders } = await wixClient.orders.memberListOrders()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const activeOrders = ((memberOrders ?? []) as any[]).filter((o) => o.status === 'ACTIVE')
      const monthlyId = process.env.NEXT_PUBLIC_WIX_PLAN_MONTHLY
      const consultationId = process.env.NEXT_PUBLIC_WIX_PLAN_CONSULTATION
      for (const order of activeOrders) {
        if (monthlyId && order.planId === monthlyId) activePlanKeys.push('monthly')
        if (consultationId && order.planId === consultationId) activePlanKeys.push('consultation')
      }
    } catch {
      // non-fatal
    }
  }

  return (
    <div className={styles.page}>

      <Nav activePath="/plans" {...auth} />

      {/* ── Page header ── */}
      <header className={styles.header}>
        <h1 className={styles.headerTitle}>
          Choose the Plan for You
        </h1>
        <p className={styles.headerSub}>
          I offer coaching, consulting and support from beginners to Olympic development
        </p>
      </header>

      {/* ── Plans section (shared component, no top border on this page) ── */}
      <Plans activePlanKeys={activePlanKeys} />

      <Footer />
    </div>
  )
}
