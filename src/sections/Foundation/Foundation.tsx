/**
 * Temporary token-proof page for the scaffold-and-deploy QA gate.
 * Retired in the hero-experience change once real sections exist.
 */
import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { useReducedMotion } from '../../hooks/useReducedMotion'
import styles from './Foundation.module.css'

const SWATCHES = [
  ['--bg', 'Canvas'],
  ['--bg-raised', 'Raised'],
  ['--cream', 'Cream'],
  ['--cream-dim', 'Cream dim'],
  ['--flame-gold', 'Flame gold'],
  ['--flame-orange', 'Flame orange'],
  ['--flame-red', 'Flame red'],
  ['--maroon', 'Maroon'],
] as const

export function Foundation() {
  const scope = useRef<HTMLDivElement>(null)
  const reduced = useReducedMotion()

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        // Scrub demo: proves Lenis ↔ ScrollTrigger sync before real sections exist.
        gsap.fromTo(
          `.${styles.scrubBar}`,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: {
              trigger: `.${styles.scrubDemo}`,
              start: 'top 80%',
              end: 'bottom 40%',
              scrub: 0.6,
            },
          },
        )
        gsap.utils.toArray<HTMLElement>(`.${styles.reveal}`).forEach((el) => {
          gsap.from(el, {
            y: 48,
            autoAlpha: 0,
            duration: 0.9,
            scrollTrigger: { trigger: el, start: 'top 85%' },
          })
        })
      })
      return () => mm.revert()
    },
    { scope },
  )

  return (
    <div ref={scope} className={styles.page}>
      <header className={styles.masthead}>
        <p className={styles.kicker}>Foundation check · change 1 of 9</p>
        <h1 className={styles.wordmark}>Shawarmania</h1>
        <p className={styles.bengali}>শাওয়ারমানী</p>
        <p className={styles.lead}>
          Kalyani&rsquo;s premium shawarma — spicy, cheesy, Lebanese, with a desi twist.
        </p>
        <p className={styles.motionBadge}>
          reduced motion: <strong>{reduced ? 'on (native scroll)' : 'off (Lenis active)'}</strong>
        </p>
      </header>

      <section className={`${styles.block} ${styles.reveal}`}>
        <h2 className={styles.blockTitle}>Palette</h2>
        <ul className={styles.swatches}>
          {SWATCHES.map(([token, label]) => (
            <li key={token} className={styles.swatch}>
              <span className={styles.chip} style={{ background: `var(${token})` }} />
              <span className={styles.swatchLabel}>{label}</span>
              <code className={styles.swatchToken}>{token}</code>
            </li>
          ))}
        </ul>
        <div className={styles.gradientBar} aria-label="flame gradient" />
      </section>

      <section className={`${styles.block} ${styles.reveal}`}>
        <h2 className={styles.blockTitle}>Type ramp</h2>
        <p className={styles.rampHero}>Loaded.</p>
        <p className={styles.rampDisplay}>Pan-fried. Stuffed.</p>
        <p className={styles.rampH2}>Fresh every single day</p>
        <p className={styles.rampLead}>
          Lead — Made with passion, served with love. Fresh ingredients, bold flavors,
          unforgettable taste.
        </p>
        <p>
          Body — Since 2025, Shawarmania has been rolling Lebanese-style shawarma with a Bengali
          soul in Kalyani and Kanchrapara. <span className={styles.bengaliInline}>শাওয়ারমানী</span>
        </p>
      </section>

      <section className={`${styles.block} ${styles.reveal}`}>
        <h2 className={styles.blockTitle}>Controls</h2>
        <div className={styles.ctaRow}>
          <a className={styles.ctaPrimary} href="#scrub">
            Order Now
          </a>
          <a className={styles.ctaGhost} href="#scrub">
            Franchise Enquiry
          </a>
        </div>
      </section>

      <section id="scrub" className={`${styles.block} ${styles.scrubDemo}`}>
        <h2 className={styles.blockTitle}>Scroll sync check</h2>
        <p>
          The bar below fills as you scroll through this section — scrubbed by ScrollTrigger while
          Lenis smooths the scroll. It should track your scroll with a slight glide and no jumps.
        </p>
        <div className={styles.scrubTrack}>
          <div className={styles.scrubBar} />
        </div>
      </section>

      <footer className={styles.footer}>
        <p>Foundation page — retired when the hero ships. Scroll back up to re-check the glide.</p>
      </footer>
    </div>
  )
}
