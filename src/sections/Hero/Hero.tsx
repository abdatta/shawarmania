import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { useLenis, scrollToAnchor } from '../../components/SmoothScroll/SmoothScroll'
import { brand, stats } from '../../data'
import { imageCatalog } from '../../assets/img'
import logo from '../../assets/brand/logo.png'
import styles from './Hero.module.css'

export function Hero() {
  const scope = useRef<HTMLElement>(null)
  const lenis = useLenis()

  const googleRating = stats.counters.find((c) => c.id === 'google-rating')
  const zomatoRatings = stats.counters.find((c) => c.id === 'zomato-ratings')

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const tl = gsap.timeline({ defaults: { ease: 'back.out(1.6)' }, delay: 0.15 })
        tl.from(`.${styles.kicker}`, { y: 24, autoAlpha: 0, duration: 0.5, ease: 'power3.out' })
          .from(
            [`.${styles.lineA}`, `.${styles.lineB}`, `.${styles.lineC}`],
            { y: 90, autoAlpha: 0, duration: 0.7, stagger: 0.12 },
            '<0.05',
          )
          .from(`.${styles.sub}`, { y: 30, autoAlpha: 0, duration: 0.55, ease: 'power3.out' }, '<0.25')
          .from(
            `.${styles.badge}`,
            { scale: 0, rotation: 14, autoAlpha: 0, duration: 0.55, ease: 'back.out(2.4)' },
            '<0.1',
          )
          .from(`.${styles.ctas} > *`, { y: 24, autoAlpha: 0, stagger: 0.08, duration: 0.45 }, '<0.1')
          .from(
            `.${styles.heroLogo}`,
            { scale: 0.5, y: -30, autoAlpha: 0, duration: 0.7, ease: 'back.out(2)' },
            0.25,
          )
          .from(
            `.${styles.photoCard}`,
            { x: 70, rotation: 8, autoAlpha: 0, duration: 0.9, ease: 'power3.out' },
            0.4,
          )

        // Light parallax as the hero scrolls away — punchy, no pinning.
        gsap.to(`.${styles.photoCard}`, {
          y: -60,
          rotation: -1,
          ease: 'none',
          scrollTrigger: { trigger: scope.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
        })
        gsap.to(`.${styles.copy}`, {
          y: 50,
          ease: 'none',
          scrollTrigger: { trigger: scope.current, start: 'top top', end: 'bottom top', scrub: 0.6 },
        })
      })
      return () => mm.revert()
    },
    { scope },
  )

  const go = (href: string) => (e: React.MouseEvent) => {
    e.preventDefault()
    scrollToAnchor(lenis, href, -72)
  }

  return (
    <section id="top" ref={scope} className={styles.hero}>
      <div className={styles.glow} aria-hidden="true" />

      <div className={styles.inner}>
        <div className={styles.copy}>
          <p className={styles.kicker}>
            {brand.city}, {brand.region} · since {brand.foundedYear ?? '—'}
          </p>
          <h1 className={styles.title}>
            <span className={styles.lineA}>Kalyani&rsquo;s</span>
            <span className={styles.lineB}>Premium</span>
            <span className={styles.lineC}>Shawarma</span>
          </h1>
          <p className={styles.sub}>{brand.heroSub}</p>

          <div className={styles.ctas}>
            <a className={styles.ctaPrimary} href="#outlets" onClick={go('#outlets')}>
              Order Now
            </a>
            <a className={styles.ctaGhost} href="#franchise" onClick={go('#franchise')}>
              Own a Franchise
            </a>
          </div>
        </div>

        <div className={styles.photoWrap}>
          <img
            className={styles.heroLogo}
            src={logo}
            alt=""
            width={226}
            height={162}
            aria-hidden="true"
          />
          <figure className={styles.photoCard}>
            <img
              src={imageCatalog['storefront-neon']}
              alt="Shawarmania's glowing neon storefront sign at night in Kalyani"
              width={720}
              height={403}
            />
            <figcaption>The real deal — Central Park, Kalyani</figcaption>
          </figure>

          {googleRating && zomatoRatings && (
            <p className={styles.badge}>
              <strong>
                {googleRating.value.toFixed(1)}
                {googleRating.suffix}
              </strong>{' '}
              Google ·{' '}
              <strong>
                {zomatoRatings.value.toLocaleString('en-IN')}
                {zomatoRatings.suffix}
              </strong>{' '}
              Zomato ratings
            </p>
          )}
        </div>
      </div>
    </section>
  )
}
