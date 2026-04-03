import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import { getWixClient } from '@/lib/wix'
import { getAuthState } from '@/lib/auth'
import styles from './account.module.css'

const COACH_EMAIL = 'runner430mile@aol.com'

export default async function AccountPage() {
  const cookieStore = await cookies()
  const wixClient = getWixClient({ get: (name) => cookieStore.get(name)?.value })

  if (!wixClient.auth.loggedIn()) {
    redirect('/auth/login')
  }

  let member: any = null
  try {
    const result = await wixClient.members.getCurrentMember({ fieldsets: ['FULL'] })
    member = result.member
  } catch {
    redirect('/auth/login')
  }

  let activeOrders: any[] = []
  try {
    const { orders: memberOrders } = await wixClient.orders.memberListOrders()
    activeOrders = (memberOrders ?? []).filter((o: any) => o.status === 'ACTIVE')
  } catch {
    // non-fatal — account page still renders without plan info
  }

  const auth = await getAuthState()
  const displayName = member?.profile?.nickname ?? member?.loginEmail ?? 'Athlete'
  const photo = member?.profile?.photo?.url ?? null
  const email = member?.loginEmail ?? null
  const joinedDate = member?.createdDate
    ? new Date(member.createdDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
    : null

  return (
    <div className={styles.page}>
      <Nav activePath="/account" {...auth} />

      <main className={styles.main}>
        <header className={styles.header}>
          <div className={styles.avatar}>
            {photo ? (
              <img src={photo} alt={displayName} className={styles.avatarImg} />
            ) : (
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="8" r="4" />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
              </svg>
            )}
          </div>
          <div>
            <h1 className={styles.name}>{displayName}</h1>
            {email && <p className={styles.email}>{email}</p>}
            {joinedDate && <p className={styles.joined}>Member since {joinedDate}</p>}
          </div>
        </header>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Active Plan</h2>
          {activeOrders.length > 0 ? activeOrders.map((order: any) => (
            <div key={order._id} className={styles.planCard}>
              <div>
                <p className={styles.noPlan} style={{ color: 'var(--text-primary)' }}>{order.planName}</p>
                {order.endDate && (
                  <p className={styles.noPlan} style={{ fontSize: '0.62rem', marginTop: '0.25rem' }}>
                    Renews {new Date(order.endDate).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
                  </p>
                )}
              </div>
              <a
                href={`mailto:${COACH_EMAIL}?subject=Subscription%20Request&body=Hi%20Jarrett%2C%20I%20would%20like%20to%20make%20a%20change%20to%20my%20${encodeURIComponent(order.planName ?? 'plan')}%20subscription.`}
                className={styles.signOut}
                style={{ fontSize: '0.65rem' }}
              >
                Cancel / Update Payment
              </a>
            </div>
          )) : (
            <div className={styles.planCard}>
              <p className={styles.noPlan}>No active plan</p>
              <a href="/plans" className={styles.btn}>Browse Plans</a>
            </div>
          )}
        </section>

        <section className={styles.section}>
          <h2 className={styles.sectionTitle}>Account</h2>
          <div className={styles.actions}>
            <a href="/auth/logout" className={styles.signOut}>Sign Out</a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
