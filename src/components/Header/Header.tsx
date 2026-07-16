import { useEffect, useRef, useState } from 'react'
import { ScrollTrigger } from '../../lib/gsap'
import { useLenis, scrollToAnchor } from '../SmoothScroll/SmoothScroll'
import { brand } from '../../data'
import logo from '../../assets/brand/logo.png'
import styles from './Header.module.css'

const LINKS = [
  { href: '#menu', label: 'Menu' },
  { href: '#story', label: 'Story' },
  { href: '#outlets', label: 'Outlets' },
  { href: '#franchise', label: 'Franchise' },
  { href: '#contact', label: 'Contact' },
]

export function Header() {
  const lenis = useLenis()
  const [hidden, setHidden] = useState(false)
  const [open, setOpen] = useState(false)
  const headerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 'top top',
      onUpdate: (self) => {
        setHidden(self.direction === 1 && self.scroll() > window.innerHeight * 0.8)
      },
    })
    return () => st.kill()
  }, [])

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    setOpen(false)
    scrollToAnchor(lenis, href, -72)
  }

  return (
    <header
      ref={headerRef}
      className={`${styles.header} ${hidden && !open ? styles.hidden : ''}`}
    >
      <a className={styles.brand} href="#top" onClick={go('#top')} aria-label="Shawarmania home">
        <img src={logo} alt="" width={226} height={162} />
        <span className={styles.brandName}>Shawarmania</span>
      </a>

      <nav className={`${styles.nav} ${open ? styles.navOpen : ''}`} aria-label="Site sections">
        {LINKS.map((l) => (
          <a key={l.href} href={l.href} onClick={go(l.href)}>
            {l.label}
          </a>
        ))}
        <a className={styles.orderMobile} href={brand.social.instagram} target="_blank" rel="noreferrer">
          Instagram ↗
        </a>
      </nav>

      <div className={styles.actions}>
        <a className={styles.order} href="#outlets" onClick={go('#outlets')}>
          Order Now
        </a>
        <button
          type="button"
          className={styles.burger}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
          onClick={() => setOpen(!open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>
    </header>
  )
}
