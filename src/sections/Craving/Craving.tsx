import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { imageCatalog } from '../../assets/img'
import styles from './Craving.module.css'

const CARDS = [
  { word: 'Pan-fried.', img: 'shawarma-plate', alt: 'Grilled shawarma plate with salad and dips', tilt: -4, wobbleA: 3, wobbleB: -2, wobbleC: 0.65, settle: -0.25, pos: 'center 72%' },
  { word: 'Stuffed.', img: 'burger-cheese-pull', alt: 'Cheese-loaded smashed burger in foil', tilt: 3, wobbleA: -3, wobbleB: 2, wobbleC: -0.65, settle: 0.25, pos: 'center 30%' },
  { word: 'Loaded.', img: 'burger-loaded', alt: 'Fully loaded double smashed burger held up', tilt: -2, wobbleA: 3, wobbleB: -2, wobbleC: 0.65, settle: -0.25, pos: 'center 45%' },
] as const

export function Craving() {
  const scope = useRef<HTMLElement>(null)
  const touchStarts = useRef(new Map<number, { x: number; y: number; at: number }>())

  const handlePointerDown = (event: React.PointerEvent<HTMLElement>) => {
    if (event.pointerType !== 'touch' || !event.isPrimary) return
    touchStarts.current.set(event.pointerId, { x: event.clientX, y: event.clientY, at: performance.now() })
  }

  const handlePointerUp = (event: React.PointerEvent<HTMLElement>) => {
    const start = touchStarts.current.get(event.pointerId)
    touchStarts.current.delete(event.pointerId)
    if (!start || event.pointerType !== 'touch') return

    const distance = Math.hypot(event.clientX - start.x, event.clientY - start.y)
    if (distance > 12 || performance.now() - start.at > 450) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const surface = event.currentTarget.firstElementChild as HTMLElement | null
    if (!surface) return
    surface.classList.remove(styles.tapped)
    void surface.offsetWidth
    surface.classList.add(styles.tapped)
  }

  const handlePointerCancel = (event: React.PointerEvent<HTMLElement>) => {
    touchStarts.current.delete(event.pointerId)
  }

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
        })
        gsap.from(`.${styles.lead}`, {
          y: 40,
          autoAlpha: 0,
          duration: 0.7,
          scrollTrigger: { trigger: `.${styles.lead}`, start: 'top 90%' },
        })
      })

      mm.add('(min-width: 761px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.utils.toArray<HTMLElement>(`.${styles.card}`).forEach((card, i) => {
          gsap.to(card, {
            y: i % 2 ? -34 : -14,
            ease: 'none',
            scrollTrigger: { trigger: scope.current, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
          })
        })
      })

      mm.add('(max-width: 760px) and (prefers-reduced-motion: no-preference)', () => {
        gsap.to(`.${styles.card}`, {
          y: -14,
          ease: 'none',
          scrollTrigger: { trigger: scope.current, start: 'top bottom', end: 'bottom top', scrub: 0.8 },
        })
      })
      return () => mm.revert()
    },
    { scope },
  )

  return (
    <section ref={scope} className={styles.craving} aria-label="What we make">
      <p className={styles.lead}>
        Rolled fresh off the grill, <em>every single day</em> — no shortcuts, no yesterday&rsquo;s
        chicken.
      </p>
      <div className={styles.cards}>
        {CARDS.map((c) => (
          <figure
            key={c.word}
            className={styles.card}
            onPointerDown={handlePointerDown}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerCancel}
          >
            <div
              className={styles.cardSurface}
              onAnimationEnd={(event) => {
                if (event.currentTarget.classList.contains(styles.tapped)) {
                  event.currentTarget.classList.remove(styles.tapped)
                }
              }}
              style={
                {
                  '--tilt': `${c.tilt}deg`,
                  '--wobble-a': `${c.wobbleA}deg`,
                  '--wobble-b': `${c.wobbleB}deg`,
                  '--wobble-c': `${c.wobbleC}deg`,
                  '--settle': `${c.settle}deg`,
                } as React.CSSProperties
              }
            >
              <img
                src={imageCatalog[c.img]}
                alt={c.alt}
                loading="lazy"
                width={720}
                height={845}
                style={{ objectPosition: c.pos }}
              />
              <figcaption className={styles.word}>{c.word}</figcaption>
            </div>
          </figure>
        ))}
      </div>
    </section>
  )
}
