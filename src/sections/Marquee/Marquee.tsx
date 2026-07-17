import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { useLenis } from '../../components/SmoothScroll/SmoothScroll'
import styles from './Marquee.module.css'

const PHRASES = ['Spicy', 'Cheesy', 'Lebanese', 'Desi Twist', 'Rolled Fresh Daily', 'Eat Healthy, Stay Happy']

function Run() {
  return (
    <span className={styles.run} aria-hidden="true">
      {PHRASES.map((p, i) => (
        <span key={i} className={styles.phrase}>
          {p} <span className={styles.dot}>●</span>{' '}
        </span>
      ))}
    </span>
  )
}

export function Marquee() {
  const scope = useRef<HTMLDivElement>(null)
  const lenis = useLenis()

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const track = scope.current!.querySelector(`.${styles.track}`)!
        const loop = gsap.to(track, {
          xPercent: -50,
          duration: 22,
          ease: 'none',
          repeat: -1,
        })
        // scroll velocity nudges the loop speed
        const off = lenis?.on('scroll', (l: { velocity: number }) => {
          const boost = 1 + Math.min(Math.abs(l.velocity) / 18, 2.5)
          gsap.to(loop, { timeScale: boost, duration: 0.3, overwrite: true })
        })
        return () => {
          off?.()
        }
      })
      return () => mm.revert()
    },
    { scope, dependencies: [lenis] },
  )

  return (
    <div ref={scope} className={styles.clip} role="presentation">
      <p className={styles.srOnly}>
        Spicy, cheesy, Lebanese shawarma with a desi twist — Eat Healthy, Stay Happy.
      </p>
      <div className={styles.marquee}>
        <div className={styles.track}>
          <Run />
          <Run />
        </div>
      </div>
    </div>
  )
}
