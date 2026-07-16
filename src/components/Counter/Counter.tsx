import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'

type Props = {
  value: number
  decimals: number
  prefix?: string | null
  suffix?: string | null
  className?: string
}

function format(n: number, decimals: number): string {
  return n.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

/** One-shot count-up. Reduced motion (or no JS timeline) shows the final value. */
export function Counter({ value, decimals, prefix, suffix, className }: Props) {
  const ref = useRef<HTMLSpanElement>(null)

  useGSAP(() => {
    const el = ref.current!
    const mm = gsap.matchMedia()
    mm.add('(prefers-reduced-motion: no-preference)', () => {
      const state = { n: 0 }
      gsap.to(state, {
        n: value,
        duration: 1.6,
        ease: 'power2.out',
        scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        onUpdate: () => {
          el.textContent = format(state.n, decimals)
        },
        onComplete: () => {
          el.textContent = format(value, decimals)
        },
      })
    })
    return () => mm.revert()
  }, [value, decimals])

  return (
    <span className={className}>
      {prefix}
      <span ref={ref}>{format(value, decimals)}</span>
      {suffix}
    </span>
  )
}
