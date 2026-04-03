import styles from './page.module.css'
import DirectAthleteSubmissionForm from '@/components/DirectAthleteSubmissionForm'
import Nav from '@/components/Nav'
import type { Metadata } from 'next'
import { getAuthState } from '@/lib/auth'

export const metadata: Metadata = {
  robots: 'noindex',
  alternates: {
    canonical: 'https://leveebreakers.com/LeveeBreakers',
  },
}

export default async function LeveeBreakersSubmit() {
  const auth = await getAuthState()

  return (
    <div className={styles.page}>
      <Nav fixed activePath="/LeveeBreakers" {...auth} />
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Levee Breakers</p>
          <h1 className={styles.heading}>Share Your Story</h1>
          <p className={styles.sub}>
            Fill out the form below and it will be reviewed for the site.
          </p>
        </div>
        <DirectAthleteSubmissionForm />
      </div>
    </div>
  )
}
