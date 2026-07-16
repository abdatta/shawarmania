import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { stats } from '../../data'
import { imageFor } from '../../assets/img'
import { Counter } from '../../components/Counter/Counter'
import styles from './Proof.module.css'

export function Proof() {
  const scope = useRef<HTMLElement>(null)
  const lab = stats.labReport

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.stat}`, {
          y: 44,
          autoAlpha: 0,
          stagger: 0.08,
          duration: 0.6,
          ease: 'back.out(1.4)',
          scrollTrigger: { trigger: `.${styles.statGrid}`, start: 'top 85%', once: true },
        })
        gsap.from(`.${styles.labCard}, .${styles.labPhoto}`, {
          y: 60,
          autoAlpha: 0,
          stagger: 0.15,
          duration: 0.75,
          scrollTrigger: { trigger: `.${styles.lab}`, start: 'top 80%', once: true },
        })
      })
      return () => mm.revert()
    },
    { scope },
  )

  return (
    <section ref={scope} className={styles.proof} aria-label="Proof and certifications">
      <div className={styles.inner}>
        <div className={styles.statGrid}>
          {stats.counters.map((c) => (
            <div key={c.id} className={styles.stat}>
              <Counter
                className={styles.statValue}
                value={c.value}
                decimals={c.decimals}
                prefix={c.prefix}
                suffix={c.suffix}
              />
              <span className={styles.statLabel}>{c.label}</span>
            </div>
          ))}
        </div>

        {lab && (
          <div className={styles.lab}>
            <div className={styles.labCard}>
              <p className={styles.labKicker}>Lab-tested · certified fresh</p>
              <h2 className={styles.labTitle}>
                &ldquo;Eat Healthy, Stay Happy&rdquo; isn&rsquo;t a slogan. It&rsquo;s a report.
              </h2>
              <dl className={styles.nutrition}>
                <div>
                  <dt>Protein</dt>
                  <dd>{lab.per100g.proteinG}g</dd>
                </div>
                <div>
                  <dt>Energy</dt>
                  <dd>{lab.per100g.energyKcal} kcal</dd>
                </div>
                <div>
                  <dt>Fat</dt>
                  <dd>{lab.per100g.fatG}g</dd>
                </div>
                <div>
                  <dt>Trans fat</dt>
                  <dd>{lab.per100g.transFatG}g</dd>
                </div>
              </dl>
              <p className={styles.per}>per 100g, {lab.sampleDescription.toLowerCase()}</p>
              <ul className={styles.safety}>
                {lab.safety.map((s) => (
                  <li key={s}>✓ {s}</li>
                ))}
              </ul>
              <p className={styles.labMeta}>
                {lab.lab} · report {lab.reportNo} · sampled {lab.sampledOn}
              </p>
            </div>

            {lab.image && imageFor(lab.image) && (
              <figure className={styles.labPhoto}>
                <img
                  src={imageFor(lab.image)!}
                  alt="Independent lab test certificate for Shawarmania's chicken shawarma"
                  loading="lazy"
                  width={720}
                  height={1280}
                />
                <figcaption>The actual certificate, straight from our reels</figcaption>
              </figure>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
