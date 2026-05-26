import { cookies } from 'next/headers'
import styles from './page.module.css'
import DirectAthleteSubmissionForm from '@/components/DirectAthleteSubmissionForm'
import Nav from '@/components/Nav'
import type { Metadata } from 'next'
import { getAuthState } from '@/lib/auth'
import { getSupabaseAdmin, type AthleteProfile } from '@/lib/supabase'

export const metadata: Metadata = {
  robots: 'noindex',
  alternates: {
    canonical: 'https://leveebreakers.com/yourstory',
  },
}

export default async function YourStory() {
  const [auth, cookieStore] = await Promise.all([getAuthState(), cookies()])
  const submissionId = cookieStore.get('lb_submission_id')?.value ?? null

  let existingProfile: AthleteProfile | null = null
  if (submissionId) {
    const supabase = getSupabaseAdmin()
    const { data } = await supabase
      .from('athlete_profiles')
      .select('*')
      .eq('id', submissionId)
      .single()
    existingProfile = data ?? null
  }

  return (
    <div className={styles.page}>
      <Nav fixed activePath="/yourstory" {...auth} />
      <div className={styles.inner}>
        <div className={styles.header}>
          <p className={styles.eyebrow}>Levee Breakers</p>
          <h1 className={styles.heading}>Share Your Story</h1>
          <p className={styles.sub}>
            Fill out the form below and it will be reviewed for the site.
          </p>
        </div>
        <DirectAthleteSubmissionForm existingProfile={existingProfile} />
      </div>
    </div>
  )
}
