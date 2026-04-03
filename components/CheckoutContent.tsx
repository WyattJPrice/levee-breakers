'use client'

import { useState } from 'react'
import { useSearchParams } from 'next/navigation'
import styles from '@/app/checkout/checkout.module.css'

const PLANS: Record<string, {
  name: string
  price: string
  per: string
  description: string
  features: string[]
  planId: string
}> = {
  monthly: {
    name: 'Monthly Levee Breaker',
    price: '$120',
    per: '/ month',
    description: 'Monthly commitment. Cancel anytime.',
    features: [
      'Daily training schedule with unlimited changes',
      'Personalized and specific workouts tailored for you',
      'Unlimited communication',
      'Use of Final Surge platform',
      'Race day strategy and gear recommendation',
    ],
    planId: process.env.NEXT_PUBLIC_WIX_PLAN_MONTHLY ?? '',
  },
  consultation: {
    name: '1 Hour Consultation',
    price: '$60',
    per: 'one time',
    description: '1-on-1 conversation to explore and help your running needs.',
    features: [
      'In-depth discussion on lifestyle and running',
      'Breakdown of specific workouts and benefits',
      'Race day strategies and weather advice',
      'Gear recommendations',
    ],
    planId: process.env.NEXT_PUBLIC_WIX_PLAN_CONSULTATION ?? '',
  },
}

export default function CheckoutContent() {
  const params = useSearchParams()
  const planKey = params.get('plan') ?? 'monthly'
  const plan = PLANS[planKey] ?? PLANS['monthly']

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ planId: plan.planId }),
      })

      const data = await res.json()

      if (res.status === 401) {
        window.location.href = '/auth/login'
        return
      }

      if (!res.ok || !data.checkoutUrl) {
        setError('Something went wrong. Please try again.')
        return
      }

      window.location.href = data.checkoutUrl
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={styles.layout}>
      {/* ── Order summary ── */}
      <div className={styles.summary}>
        <p className={styles.label}>Your Plan</p>
        <h2 className={styles.planName}>{plan.name}</h2>
        <div className={styles.priceRow}>
          <span className={styles.price}>{plan.price}</span>
          <span className={styles.per}>{plan.per}</span>
        </div>
        <p className={styles.planDesc}>{plan.description}</p>
        <ul className={styles.features}>
          {plan.features.map((f) => (
            <li key={f} className={styles.feature}>
              <span className={styles.check}>✓</span>
              {f}
            </li>
          ))}
        </ul>
      </div>

      {/* ── Payment CTA ── */}
      <div className={styles.paymentCard}>
        <p className={styles.label}>Payment</p>
        <p className={styles.hostedNote}>
          You&apos;ll be taken to a secure Wix checkout page to complete your purchase.
          PayPal and major credit cards accepted.
        </p>
        {error && <p className={styles.error}>{error}</p>}
        <button
          className={styles.btnPrimary}
          onClick={handleCheckout}
          disabled={loading}
        >
          {loading ? 'Redirecting…' : `Proceed to Payment · ${plan.price}`}
        </button>
      </div>
    </div>
  )
}
