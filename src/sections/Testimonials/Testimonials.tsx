import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { testimonials } from '../../data'
import { imageFor } from '../../assets/img'
import styles from './Testimonials.module.css'

const PLATFORM_LABEL = { facebook: 'Facebook', instagram: 'Instagram', youtube: 'YouTube' } as const

export function Testimonials() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        for (const row of [styles.videoRow, styles.quoteRow]) {
          gsap.from(`.${row} > *`, {
            y: 56,
            autoAlpha: 0,
            stagger: 0.09,
            duration: 0.65,
            ease: 'back.out(1.3)',
            scrollTrigger: { trigger: `.${row}`, start: 'top 85%', once: true },
          })
        }
      })
      return () => mm.revert()
    },
    { scope },
  )

  return (
    <section ref={scope} className={styles.testimonials} aria-label="Reviews and vlogger coverage">
      <div className={styles.inner}>
        <p className={styles.kicker}>The word on the street</p>
        <h2 className={styles.title}>Kalyani can&rsquo;t stop talking.</h2>

        <div className={styles.videoRow}>
          {testimonials.vloggerVideos.map((v) => {
            const img = imageFor(v.image)
            return (
              <a key={v.id} className={styles.videoCard} href={v.url} target="_blank" rel="noreferrer">
                {img && (
                  <img src={img} alt="" loading="lazy" width={640} height={480} />
                )}
                <div className={styles.videoBody}>
                  <span className={styles.creator}>
                    {v.creator} · {PLATFORM_LABEL[v.platform]}
                  </span>
                  <span className={styles.videoTitle}>{v.title}</span>
                  {v.metric && <span className={styles.metric}>{v.metric}</span>}
                </div>
              </a>
            )
          })}
        </div>

        <div className={styles.quoteRow}>
          {testimonials.quotes.map((q) => (
            <blockquote key={q.id} className={styles.quote}>
              <p>&ldquo;{q.text}&rdquo;</p>
              <footer>
                {q.author ? `${q.author} · ` : ''}
                {q.url ? (
                  <a href={q.url} target="_blank" rel="noreferrer">
                    {q.source}
                  </a>
                ) : (
                  q.source
                )}
              </footer>
            </blockquote>
          ))}
        </div>
      </div>
    </section>
  )
}
