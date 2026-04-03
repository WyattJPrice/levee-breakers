'use client'

import { useState, useEffect, useCallback } from 'react'
import Image from 'next/image'
import styles from './MeetTheCoach.module.css'

const PARAGRAPHS = [
    "Hey Y'all! I was born and raised in the rural farm community of Hathaway, Louisiana. Surrounded by rice fields for miles, it was always easy to lace up the shoes and go for a run!",
    "Running came natural, but not without first learning to balance work and school. From a \"Walk on\" status to the first McNeese cowboy to win the 5k/10k double in 2011 since 1991, I stepped up to the challenge of making huge leaps. One month prior to the double conference champion year, I also broke a 20+ year record at 10,000m.",
    "After college I decided to chase the ultimate goal of breaking a 4:00 mile on Louisiana soil. Running 3:59.95 in May of 2015 and catapulting my debut on the roads after leaving behind the track races. Moving from Texas to Wyoming and eventually finding my way back home to Louisiana.",
    "I now work full-time as a cardiac sonographer and continue to compete and remain competitive at the USA championship level over the last 8 years. The Blue-Collar running mentality is why I believe my continued success is thriving. Every mile should have a purpose when time is limited due to demands from life itself. Learning to balance family, life, work, social, and training takes diligence and understanding.",
    "As a two-time Olympic Marathon trials qualifier, multiple course record holder, and several top 15 USA championship finishes, I have certainly left my mark locally and nationally. More recently over the last few years, the joys of coaching have taken my prime spotlight. Whether you are trying to get to the starting line of a local 5k or bettering your time at the Boston Marathon; I've got the training program for you! Reach out and I will work with you to set realistic goals and help you smash that levee that is holding you back!",


]

const SLIDES = [
  { src: '/LousianaHalf.png', alt: '2023 Louisiana Half Marathon' },
  { src: '/Sub4.png', alt: 'Sub Four 2015' },
  { src: '/zydeco2026.jpg', alt: 'Zydeco Marathon 2026' },
  { src: '/Zydeco2024.jpg', alt: 'Zydeco Marathon 2024' },
]

export default function MeetTheCoach() {
  const [current, setCurrent] = useState(0)
  const [animating, setAnimating] = useState(false)

  const go = useCallback((index: number) => {
    if (animating) return
    setAnimating(true)
    setTimeout(() => {
      setCurrent(index)
      setAnimating(false)
    }, 300)
  }, [animating])

  const prev = () => go((current - 1 + SLIDES.length) % SLIDES.length)
  const next = useCallback(() => go((current + 1) % SLIDES.length), [current, go])

  // Auto-advance
  useEffect(() => {
    const id = setInterval(next, 8000)
    return () => clearInterval(id)
  }, [next])

  return (
    <section id="about" className={styles.section}>
      <div className={styles.inner}>

        {/* ── Left: text ── */}
        <div className={styles.textCol}>
          <h2 className={styles.heading}>Meet the Coach</h2>
          <div className={styles.paragraphs}>
            {PARAGRAPHS.map((p, i) => (
              <p key={i} className={styles.para}>{p}</p>
            ))}
          </div>
        </div>

        {/* ── Right: carousel ── */}
        <div className={styles.carouselCol}>
          <div className={styles.carousel}>
            <div className={`${styles.slide} ${animating ? styles.fadeOut : styles.fadeIn}`}>
              <Image
                src={SLIDES[current].src}
                alt={SLIDES[current].alt}
                fill
                className={styles.slideImg}
              />
              <div className={styles.slideOverlay} />
              <span className={styles.slideCaption}>{SLIDES[current].alt}</span>
            </div>

            {/* Arrows */}
            <button className={`${styles.arrow} ${styles.arrowLeft}`} onClick={prev} aria-label="Previous">
              ‹
            </button>
            <button className={`${styles.arrow} ${styles.arrowRight}`} onClick={next} aria-label="Next">
              ›
            </button>

            {/* Dots */}
            <div className={styles.dots}>
              {SLIDES.map((_, i) => (
                <button
                  key={i}
                  className={`${styles.dot} ${i === current ? styles.dotActive : ''}`}
                  onClick={() => go(i)}
                  aria-label={`Slide ${i + 1}`}
                />
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  )
}