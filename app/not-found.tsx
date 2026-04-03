import styles from './not-found.module.css'
import Nav from '@/components/Nav'
import { getAuthState } from '@/lib/auth'

export default async function NotFound() {
  const auth = await getAuthState()

  return (
    <div className={styles.page}>
      <Nav fixed activePath="" {...auth} />
      <div className={styles.content}>
        <p className={styles.eyebrow}>Page not found</p>
        <h1 className={styles.code}>404</h1>
        <a href="/" className={styles.link}>← Back to home</a>
      </div>
    </div>
  )
}
