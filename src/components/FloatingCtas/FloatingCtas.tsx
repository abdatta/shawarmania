import { useEffect, useState } from 'react'
import { brand } from '../../data'
import { ScrollTrigger } from '../../lib/gsap'
import { ContactAction } from '../ContactAction/ContactAction'
import { scrollToAnchor, useLenis } from '../SmoothScroll/SmoothScroll'
import styles from './FloatingCtas.module.css'

export function FloatingCtas() {
  const lenis = useLenis()
  const [showScrollTop, setShowScrollTop] = useState(false)
  const tel = brand.phoneDelivery.replace(/\s/g, '')

  useEffect(() => {
    const st = ScrollTrigger.create({
      start: 'top top',
      onUpdate: (self) => {
        setShowScrollTop(self.scroll() > Math.max(window.innerHeight * 1.25, 900))
      },
    })
    return () => st.kill()
  }, [])

  return (
    <div className={styles.wrap}>
      <button
        type="button"
        className={`${styles.fab} ${styles.toTop} ${showScrollTop ? styles.toTopVisible : ''}`}
        aria-label="Scroll to top"
        aria-hidden={!showScrollTop}
        tabIndex={showScrollTop ? 0 : -1}
        onClick={() => scrollToAnchor(lenis, '#top')}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" aria-hidden="true">
          <path
            d="m6 14 6-6 6 6"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      {brand.whatsappChannelUrl && (
        <ContactAction
          kind="whatsapp"
          className={`${styles.fab} ${styles.whatsapp}`}
          href={brand.whatsappChannelUrl}
          newTab
          ariaLabel="Join the Shawarmania WhatsApp channel"
        />
      )}
      <ContactAction
        kind="call"
        className={`${styles.fab} ${styles.call}`}
        href={`tel:${tel}`}
        ariaLabel={`Call for home delivery: ${brand.phoneDelivery}`}
      />
    </div>
  )
}
