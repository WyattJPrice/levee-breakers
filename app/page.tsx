import Image from 'next/image'
import styles from './page.module.css'
import Nav from '@/components/Nav'
import MeetTheCoach from '@/components/MeetTheCoach'
import Plans from '@/components/Plans'
import LeveeBreakers from '@/components/LeveeBreakers'
import Footer from '@/components/Footer'
import { getAuthState } from '@/lib/auth'

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
  const auth = await getAuthState()
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
        <LeveeBreakers /> 
        <Plans />

        <Footer />
      </div>
    </>
  )
}
