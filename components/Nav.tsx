import Logo from '@/components/Logo'
import NavProfile from '@/components/NavProfile'
import styles from './Nav.module.css'

const NAV_LINKS = [
  { label: 'Home', href: '/' },
  { label: 'About', href: '/#about' },
  { label: 'Plans', href: '/plans' },
  { label: 'Contact', href: '/#contact' },
]

interface NavProps {
  activePath?: string
  fixed?: boolean
  isLoggedIn?: boolean
  memberName?: string | null
  memberPhoto?: string | null
}

export default function Nav({
  activePath = '/',
  fixed = false,
  isLoggedIn = false,
  memberName = null,
  memberPhoto = null,
}: NavProps) {
  return (
    <nav className={`${styles.nav} ${fixed ? styles.fixed : styles.sticky}`}>
      <a href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
        <div className={styles.navBrand}>
          <Logo className={styles.navLogoImg} />
          <span className={styles.navLogo}>LEVEE BREAKERS</span>
        </div>
      </a>
      <div className={styles.navRight}>
        <ul className={styles.navLinks}>
          {NAV_LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className={`${styles.navLink} ${l.href === activePath ? styles.navLinkActive : ''}`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <NavProfile
          isLoggedIn={isLoggedIn}
          memberName={memberName}
          memberPhoto={memberPhoto}
        />
      </div>
    </nav>
  )
}
