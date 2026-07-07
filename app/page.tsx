import Image from 'next/image'
import styles from './page.module.css'
import Nav from '@/components/Nav'
import MeetTheCoach from '@/components/MeetTheCoach'
import Plans from '@/components/Plans'
import LeveeBreakers from '@/components/LeveeBreakers'
import Footer from '@/components/Footer'
import { getAuthState } from '@/lib/auth'
import { getWixClient } from '@/lib/wix'
import { Query } from 'node-appwrite'
import { getAppwrite, rowToProfile, rowToStat, DATABASE_ID, TABLE_PROFILES, TABLE_STATS, type AthleteProfile, type CoachStat } from '@/lib/appwrite'
import { cookies } from 'next/headers'

const FALLBACK_STATS = [
  { val: '1:49.3', label: '800m (2015)' },
  { val: '3:43.3', label: '1500m (2015)' },
  { val: '3:59.95', label: '1 Mile (2015)' },
  { val: '14:06', label: '5k (2020)' },
  { val: '28:58', label: '10k (2020)' },
  { val: '47:57', label: '10 Miles (2020)' },
  { val: '1:04:18', label: 'Half Marathon (2018)' },
  { val: '2:13:48', label: 'Marathon (2020)' },
]

export default async function Home() {
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

  const { tablesDB } = getAppwrite()

  const [cmsProfiles, statsRows] = await Promise.all([
    tablesDB
      .listRows({
        databaseId: DATABASE_ID,
        tableId: TABLE_PROFILES,
        queries: [Query.equal('status', 'approved'), Query.orderAsc('created_at'), Query.limit(100)],
      })
      .then((r) => r.rows.map(rowToProfile))
      .catch(() => [] as AthleteProfile[]),
    tablesDB
      .listRows({
        databaseId: DATABASE_ID,
        tableId: TABLE_STATS,
        queries: [Query.orderAsc('sort_order'), Query.limit(100)],
      })
      .then((r) => r.rows.map(rowToStat))
      .catch(() => [] as CoachStat[]),
  ])

  const STATS = statsRows.length > 0
    ? statsRows.map((s) => ({ val: s.value, label: s.label }))
    : FALLBACK_STATS

  return (
    <>
      <div className={styles.bgWrap}>
        <Image
          src="/levee.jpg"
          alt="Running the Levee"
          fill
          priority
          quality={85}
          className={styles.bgImg}
        />
        <div className={styles.bgOverlay} />
      </div>

      {/* ── Page shell ── */}
      <div className={styles.page}>

        <Nav fixed activePath="/" {...auth} />

        {/* ── Hero ── */}
        <main className={styles.hero}>

          <h1 className={styles.heroTitle}>
            Jarrett<br />
            <span className={styles.accentWord}>Leblanc</span>
          </h1>

          <p className={styles.heroSub}>
            Proven coaching and custom training for all ages and abilities. 1 mile to marathon
          </p>

          <div className={styles.heroCta}>
            <a href="/plans" className={styles.btnPrimary}>Join Today</a>
            <a href="#about" className={styles.btnGhost}>About Me ↴</a>
          </div>
        </main>

        <div className={styles.statsBar}>
          {STATS.map((s) => (
            <div key={s.label} className={styles.stat}>
              <div className={styles.statVal}>{s.val}</div>
              <div className={styles.statLabel}>{s.label}</div>
            </div>
          ))}
        </div>

        <MeetTheCoach />
        <LeveeBreakers cmsProfiles={cmsProfiles} />
        <Plans activePlanKeys={activePlanKeys} />
        <Footer />
      </div>
    </>
  )
}
