import type { Metadata } from 'next'
import Plans from '@/components/Plans'
import Footer from '@/components/Footer'
import Nav from '@/components/Nav'
import styles from './plans.module.css'
import { getAuthState } from '@/lib/auth'

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
  const auth = await getAuthState()
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
      <Plans />

      <Footer />
    </div>
  )
}
