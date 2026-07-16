import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { imageCatalog } from '../../assets/img'
import styles from './Craving.module.css'

const CARDS = [
  { word: 'Pan-fried.', img: 'shawarma-plate', alt: 'Grilled shawarma plate with salad and dips', tilt: -4, pos: 'center 72%' },
  { word: 'Stuffed.', img: 'burger-cheese-pull', alt: 'Cheese-loaded smashed burger in foil', tilt: 3, pos: 'center 30%' },
  { word: 'Loaded.', img: 'burger-loaded', alt: 'Fully loaded double smashed burger held up', tilt: -2, pos: 'center 45%' },
] as const

export function Craving() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>(`.${styles.card}`).forEach((card, i) => {
          gsap.from(card, {
            y: 110,
            rotation: i % 2 ? 8 : -8,
            autoAlpha: 0,
            duration: 0.8,
            ease: 'back.out(1.4)',
            scrollTrigger: { trigger: card, start: 'top 88%' },
          })
          gsap.to(card, {
            y: i % 2 ? -34 : -14,
            ease: 'none',
            scrollTrigger: { trigger: scope.current, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
          })
        })
        gsap.from(`.${styles.lead}`, {
          y: 40,
          autoAlpha: 0,
          duration: 0.7,
          scrollTrigger: { trigger: `.${styles.lead}`, start: 'top 90%' },
        })
      })
      return () => mm.revert()
    },
    { scope },
  )

  return (
    <section ref={scope} className={styles.craving} aria-label="What we make">
      <p className={styles.lead}>
        Rolled fresh off the spit, <em>every single day</em> — no shortcuts, no yesterday&rsquo;s
        chicken.
      </p>
      <div className={styles.cards}>
        {CARDS.map((c) => (
          <figure key={c.word} className={styles.card} style={{ '--tilt': `${c.tilt}deg` } as React.CSSProperties}>
            <img
              src={imageCatalog[c.img]}
              alt={c.alt}
              loading="lazy"
              width={720}
              height={845}
              style={{ objectPosition: c.pos }}
            />
            <figcaption className={styles.word}>{c.word}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}
