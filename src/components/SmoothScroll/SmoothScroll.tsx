import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import { prefersReducedMotion } from '../../hooks/useReducedMotion'

const LenisContext = createContext<Lenis | null>(null)

/** The active Lenis instance, or null (reduced motion / not mounted yet). */
export function useLenis(): Lenis | null {
  return use(LenisContext)
}

/**
 * Site-wide smooth scroll. Lenis is driven from gsap.ticker — the single RAF
 * loop — and kept in sync with ScrollTrigger. Under prefers-reduced-motion we
 * never instantiate Lenis: native scrolling, ScrollTriggers still fire.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  const [lenis, setLenis] = useState<Lenis | null>(null)

  useEffect(() => {
    // Late image layout shifts ScrollTrigger positions — refresh once everything loaded.
    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh, { once: true })
    return () => window.removeEventListener('load', refresh)
  }, [])

  useEffect(() => {
    if (prefersReducedMotion()) return

    const instance = new Lenis({ autoRaf: false, lerp: 0.11, anchors: false })
    instance.on('scroll', ScrollTrigger.update)

    const raf = (time: number) => instance.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    setLenis(instance)
    if (import.meta.env.DEV) {
      // Dev-only handle for manual/automated QA (e.g. scripted scroll checks).
      ;(window as Window & { __lenis?: Lenis }).__lenis = instance
    }
    return () => {
      gsap.ticker.remove(raf)
      instance.destroy()
      setLenis(null)
    }
  }, [])

  return <LenisContext value={lenis}>{children}</LenisContext>
}

/** Scroll to an in-page anchor, Lenis-smoothed when active, with header offset. */
export function scrollToAnchor(lenis: Lenis | null, target: string, offset = 0) {
  if (lenis) {
    lenis.scrollTo(target, { offset })
    return
  }
  document.querySelector(target)?.scrollIntoView({
    behavior: prefersReducedMotion() ? 'auto' : 'smooth',
  })
}
