import Image from 'next/image'
import styles from './page.module.css'
import Nav from '@/components/Nav'
import MeetTheCoach from '@/components/MeetTheCoach'
import Plans from '@/components/Plans'
import LeveeBreakers from '@/components/LeveeBreakers'
import Footer from '@/components/Footer'
import { getAuthState } from '@/lib/auth'
import { getWixClient } from '@/lib/wix'
import { getSupabaseAdmin, type AthleteProfile } from '@/lib/supabase'
import { cookies } from 'next/headers'

const STATS = [
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
  let memberId: string | null = null
  if (wixClient.auth.loggedIn()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const [{ orders: memberOrders }, { member }] = await Promise.all([
        wixClient.orders.memberListOrders(),
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        wixClient.members.getCurrentMember({ fieldsets: ['FULL'] as any }),
      ])
      memberId = member?._id ?? null
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

  const isMonthlyMember = activePlanKeys.includes('monthly')

  const supabase = getSupabaseAdmin()

  const [cmsProfiles, hasSubmitted] = await Promise.all([
    Promise.resolve(
      supabase
        .from('athlete_profiles')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: true })
    ).then(({ data }) => (data ?? []) as AthleteProfile[]).catch(() => [] as AthleteProfile[]),
    isMonthlyMember && memberId
      ? Promise.resolve(
          supabase
            .from('athlete_profiles')
            .select('id', { count: 'exact', head: true })
            .eq('member_id', memberId)
        ).then(({ count }) => (count ?? 0) > 0).catch(() => false)
      : Promise.resolve(false),
  ])

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
        <LeveeBreakers cmsProfiles={cmsProfiles} isMonthlyMember={isMonthlyMember} hasSubmitted={hasSubmitted} />
        <Plans activePlanKeys={activePlanKeys} />
        <Footer />
      </div>
    </>
  )
}
