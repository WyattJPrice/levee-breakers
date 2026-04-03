import styles from './page.module.css'
import DirectAthleteSubmissionForm from '@/components/DirectAthleteSubmissionForm'
import Nav from '@/components/Nav'
import { getAuthState } from '@/lib/auth'

export const metadata = { robots: 'noindex' }

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
            Fill out the form below and Jarrett will review your profile for the site.
          </p>
        </div>
        <DirectAthleteSubmissionForm />
      </div>
    </div>
  )
}
