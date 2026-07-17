import { useRef } from 'react'
import { gsap, SplitText, useGSAP } from '../../lib/gsap'
import { brand, stats } from '../../data'
import styles from './Story.module.css'

export function Story() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        const split = SplitText.create(`.${styles.headline}`, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          onSplit: (self) =>
            gsap.from(self.lines, {
              yPercent: 110,
              duration: 0.8,
              stagger: 0.1,
              ease: 'power3.out',
              scrollTrigger: { trigger: `.${styles.headline}`, start: 'top 80%', once: true },
            }),
        })

        gsap.from(`.${styles.narrative}`, {
          y: 36,
          autoAlpha: 0,
          duration: 0.7,
          scrollTrigger: { trigger: `.${styles.narrative}`, start: 'top 85%', once: true },
        })

        gsap.from(`.${styles.entry}`, {
          y: 60,
          autoAlpha: 0,
          stagger: 0.12,
          duration: 0.65,
          ease: 'back.out(1.3)',
          scrollTrigger: { trigger: `.${styles.rail}`, start: 'top 82%', once: true },
        })

        gsap.fromTo(
          `.${styles.railLine}`,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: { trigger: `.${styles.rail}`, start: 'top 85%', end: 'bottom 55%', scrub: 0.6 },
          },
        )

        return () => split.revert()
      })
      return () => mm.revert()
    },
    { scope },
  )

  return (
    <section id="story" ref={scope} className={styles.story}>
      <span className={styles.bgWordmark} aria-hidden="true">
        {brand.name}
      </span>

      <div className={styles.inner}>
        <p className={styles.kicker}>Our story</p>
        <h2 className={styles.headline}>
          From one grill in Kalyani to a full-blown mania.
        </h2>
        <p className={styles.narrative}>
          {brand.positioning} Same recipes, same fresh-every-day rule — at every counter we open.
        </p>

        <div className={styles.rail}>
          <span className={styles.railLine} aria-hidden="true" />
          {stats.timeline.map((t) => (
            <article key={`${t.year}-${t.title}`} className={styles.entry}>
              <span className={styles.year}>
                {t.month ? `${t.month} ` : ''}
                {t.year}
              </span>
              <h3 className={styles.entryTitle}>{t.title}</h3>
              <p className={styles.entryDesc}>{t.description}</p>
            </article>
          ))}
        </div>

        <a className={styles.follow} href={brand.social.instagram} target="_blank" rel="noreferrer">
          Follow the story on Instagram ↗
        </a>
      </div>
    </section>
  )
}
