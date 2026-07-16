import { useEffect, useRef, useState } from 'react'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import { prefersReducedMotion } from '../../hooks/useReducedMotion'
import logo from '../../assets/brand/logo.png'
import styles from './Loader.module.css'

/** Brief brand loader over font/asset settling. Hard-capped — can never trap. */
export function Loader() {
  const [gone, setGone] = useState(() => prefersReducedMotion())
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (gone) return
    const el = ref.current!
    const logoEl = el.querySelector('img')!
    gsap.fromTo(
      logoEl,
      { scale: 0.6, autoAlpha: 0 },
      { scale: 1, autoAlpha: 1, duration: 0.5, ease: 'back.out(2)' },
    )

    let done = false
    const finish = () => {
      if (done) return
      done = true
      gsap.to(el, {
        autoAlpha: 0,
        duration: 0.45,
        ease: 'power2.inOut',
        onComplete: () => {
          setGone(true)
          ScrollTrigger.refresh()
        },
      })
    }
    void document.fonts.ready.then(() => setTimeout(finish, 250))
    const cap = setTimeout(finish, 2500)
    return () => clearTimeout(cap)
  }, [gone])

  if (gone) return null
  return (
    <div ref={ref} className={styles.loader} aria-hidden="true">
      <img src={logo} alt="" width={226} height={162} />
    </div>
  )
}
