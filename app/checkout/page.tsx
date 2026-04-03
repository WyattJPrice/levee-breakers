import { Suspense } from 'react'
import Nav from '@/components/Nav'
import Footer from '@/components/Footer'
import CheckoutContent from '@/components/CheckoutContent'
import { getAuthState } from '@/lib/auth'
import styles from './checkout.module.css'

export default async function CheckoutPage() {
  const auth = await getAuthState()
  return (
    <div className={styles.page}>
      <Nav activePath="/checkout" {...auth} />
      <main className={styles.main}>
        <h1 className={styles.heading}>Checkout</h1>
        <Suspense fallback={<div className={styles.loading}>Loading…</div>}>
          <CheckoutContent />
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
