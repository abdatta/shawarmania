import { createContext, use, useEffect, useState, type ReactNode } from 'react'
import Lenis from 'lenis'
import { gsap, ScrollTrigger } from '../../lib/gsap'
import { prefersReducedMotion } from '../../hooks/useReducedMotion'

const LenisContext = createContext<Lenis | null>(null)
const ANCHOR_NAVIGATION_START = 'shawarmania:anchor-navigation-start'
const ANCHOR_NAVIGATION_END = 'shawarmania:anchor-navigation-end'
let anchorNavigationId = 0

/** The active Lenis instance, or null (reduced motion / not mounted yet). */
export function useLenis(): Lenis | null {
  return use(LenisContext)
}

/** Subscribe to programmatic in-page navigation without coupling callers to the Header. */
export function observeAnchorNavigation(onStart: () => void, onEnd: () => void) {
  window.addEventListener(ANCHOR_NAVIGATION_START, onStart)
  window.addEventListener(ANCHOR_NAVIGATION_END, onEnd)
  return () => {
    window.removeEventListener(ANCHOR_NAVIGATION_START, onStart)
    window.removeEventListener(ANCHOR_NAVIGATION_END, onEnd)
  }
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

const SCROLL_GAP = 24

/**
 * Scroll to the visible start of a section, leaving room for the fixed header.
 * Sections with large decorative padding can mark their intro with
 * `data-scroll-anchor` so the first meaningful content, rather than the empty
 * section edge, is aligned in the viewport.
 */
export function scrollToAnchor(lenis: Lenis | null, target: string) {
  const section = document.querySelector<HTMLElement>(target)
  if (!section) return

  const navigationId = ++anchorNavigationId
  window.dispatchEvent(new Event(ANCHOR_NAVIGATION_START))

  const destination = section.querySelector<HTMLElement>('[data-scroll-anchor]') ?? section
  const headerHeight = document.querySelector<HTMLElement>('header')?.offsetHeight ?? 0
  const offset = -(headerHeight + SCROLL_GAP)
  const pinSpacer = section.parentElement?.classList.contains('pin-spacer')
    ? section.parentElement
    : null

  // ScrollTrigger temporarily fixes and translates pinned sections. When
  // navigating back to one from below, its live bounding box no longer
  // represents its natural page position. The spacer remains stable, so use
  // it plus the intro's layout offset for a direction-independent target.
  const pinnedTarget = pinSpacer
    ? pinSpacer.getBoundingClientRect().top +
      window.scrollY +
      section.clientTop +
      destination.offsetTop +
      offset
    : null

  let fallback: number | undefined
  let listeningForScrollEnd = false
  const finish = () => {
    window.clearTimeout(fallback)
    if (listeningForScrollEnd) window.removeEventListener('scrollend', finish)
    window.setTimeout(() => {
      if (navigationId === anchorNavigationId) {
        window.dispatchEvent(new Event(ANCHOR_NAVIGATION_END))
      }
    }, 150)
  }

  // Lenis normally reports completion itself; this prevents an interrupted
  // programmatic scroll from leaving navigation UI locked indefinitely.
  fallback = window.setTimeout(finish, 4000)

  if (lenis) {
    lenis.scrollTo(pinnedTarget ?? destination, {
      offset: pinnedTarget == null ? offset : 0,
      onComplete: finish,
    })
    return
  }

  const behavior = prefersReducedMotion() ? 'auto' : 'smooth'
  window.scrollTo({
    top: pinnedTarget ?? destination.getBoundingClientRect().top + window.scrollY + offset,
    behavior,
  })

  if (behavior === 'auto') {
    finish()
    return
  }

  listeningForScrollEnd = true
  window.addEventListener('scrollend', finish, { once: true })
}
