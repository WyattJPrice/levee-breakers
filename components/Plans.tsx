'use client'

import styles from './Plans.module.css'

const PHILOSOPHY = [
  "The Levee is an ultimate barrier that holds status quo. An obstruction with opposing force. From rural to suburbia you can find one serving its purpose.",
  "Being a Levee Breaker is symbolic — it has a purpose. The meaning is simple, but the task can be daunting. Change is not always taken lightly or easy, but it is worth it.",
  "Whether you are stuck in a rut, need guidance, or want to take your fitness to the next level, there is no magic button. Breaking barriers takes time and persistence. The time you dedicate to running will not be wasted.",
]

const PLANS = [
  {
    key: 'monthly',
    tag: 'Monthly Levee Breaker',
    price: '$120',
    per: '/ month',
    description: 'Monthly Commitment',
    features: [
      'Daily training schedule with unlimited changes',
      'Personalized and specific workouts tailored for you',
      'Unlimited communication',
      'Use of Final Surge platform',
      'Race day strategy and gear recommendation',
    ],
    cta: 'Select',
    href: '/checkout?plan=monthly',
    accent: true,
  },
  {
    key: 'consultation',
    tag: '1 hour consultation',
    price: '$60',
    per: 'One Time',
    description: '1-on-1 conversation to explore and help your running needs. Valid for one week',
    features: [
      'In-Depth discussion on lifestyle and running',
      'Breakdown of specific workouts and benefits',
      'Race day strategies and weather advice',
      'Gear Recommendations',
    ],
    cta: 'Select',
    href: '/checkout?plan=consultation',
    accent: true,
  },
]

export default function Plans({ activePlanKeys = [] }: { activePlanKeys?: string[] }) {
  return (
    <section id="plans" className={styles.section}>
      <div className={styles.inner}>

        {/* ── Philosophy block ── */}
        <div className={styles.philosophyBlock}>
          <h2 className={styles.heading}>
            Run the<br />
            <span className={styles.accent}>Levee</span>
          </h2>
          <div className={styles.philosophyText}>
            {PHILOSOPHY.map((p, i) => (
              <p key={i} className={styles.para}>{p}</p>
            ))}
            <span className={styles.tag}>Ready to break through?</span>
          </div>
        </div>

        {/* ── Plan cards ── */}
        <div className={styles.cards}>
          {PLANS.map((plan) => {
            const isActive = activePlanKeys.includes(plan.key)
            return (
              <div
                key={plan.tag}
                className={`${styles.card} ${plan.accent ? styles.cardAccent : ''}`}
              >
                <span className={styles.planTag}>{plan.tag}</span>
                <div className={styles.priceRow}>
                  <span className={styles.price}>{plan.price}</span>
                  <span className={styles.per}>{plan.per}</span>
                </div>
                <p className={styles.planDesc}>{plan.description}</p>
                <ul className={styles.features}>
                  {plan.features.map((f) => (
                    <li key={f} className={styles.feature}>
                      <span className={styles.featureCheck}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                {isActive ? (
                  <span className={styles.btnDisabled}>Current Plan</span>
                ) : (
                  <a
                    href={plan.href}
                    className={plan.accent ? styles.btnPrimary : styles.btnGhost}
                  >
                    {plan.cta}
                  </a>
                )}
              </div>
            )
          })}
        </div>



      </div>
    </section>
  )
}
