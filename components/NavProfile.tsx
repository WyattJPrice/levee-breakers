'use client'

import { useState, useRef, useEffect } from 'react'
import styles from './NavProfile.module.css'

interface NavProfileProps {
  isLoggedIn: boolean
  memberName?: string | null
  memberPhoto?: string | null
}

export default function NavProfile({ isLoggedIn, memberName, memberPhoto }: NavProfileProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  function navigateToLogin() {
    const url = new URL('/auth/login', window.location.origin)
    url.searchParams.set('returnToUrl', window.location.href)
    window.location.href = url.toString()
  }

  return (
    <div className={styles.wrapper} ref={ref}>
      <button
        className={styles.trigger}
        onClick={() => setOpen((v) => !v)}
        aria-label="Account menu"
      >
        {memberPhoto ? (
          <img src={memberPhoto} alt={memberName ?? 'Profile'} className={styles.photo} />
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="8" r="4" />
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
          </svg>
        )}
      </button>

      {open && (
        <div className={styles.dropdown}>
          {isLoggedIn ? (
            <>
              {memberName && (
                <div className={styles.memberName}>{memberName}</div>
              )}
              <a href="/account" className={styles.item} onClick={() => setOpen(false)}>
                Manage Account
              </a>
              <a href="/auth/logout" className={styles.item}>
                Sign Out
              </a>
            </>
          ) : (
            <>
              <a href="/auth/login" className={styles.item} onClick={(e) => { e.preventDefault(); navigateToLogin() }}>
                Sign In
              </a>
              <a href="/auth/login" className={styles.item} onClick={(e) => { e.preventDefault(); navigateToLogin() }}>
                Create Account
              </a>
            </>
          )}
        </div>
      )}
    </div>
  )
}
