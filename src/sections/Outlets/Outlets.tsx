import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { brand, outlets } from '../../data'
import { imageFor } from '../../assets/img'
import styles from './Outlets.module.css'

export function Outlets() {
  const scope = useRef<HTMLElement>(null)

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.card}`, {
          y: 70,
          autoAlpha: 0,
          stagger: 0.14,
          duration: 0.7,
          ease: 'back.out(1.3)',
          scrollTrigger: { trigger: `.${styles.grid}`, start: 'top 82%', once: true },
        })
      })
      return () => mm.revert()
    },
    { scope },
  )

  const telDelivery = brand.phoneDelivery.replace(/\s/g, '')

  return (
    <section id="outlets" ref={scope} className={styles.outlets}>
      <div className={styles.inner}>
        <p className={styles.kicker}>Find us</p>
        <h2 className={styles.title}>Two counters. One obsession.</h2>

        <div className={styles.grid}>
          {outlets.outlets.map((o) => {
            const img = imageFor(o.image)
            const tel = o.phone.replace(/\s/g, '')
            return (
              <article key={o.id} className={styles.card}>
                {img && (
                  <div className={styles.photo}>
                    <img src={img} alt={`${o.name} outlet`} loading="lazy" width={720} height={403} />
                  </div>
                )}
                <div className={styles.body}>
                  <h3 className={styles.name}>{o.name}</h3>
                  <p className={styles.landmark}>{o.landmark}</p>

                  <p className={styles.address}>
                    {o.addressLines.join(', ')}
                    {o.pincode ? ` — ${o.pincode}` : ''}
                  </p>

                  <div className={styles.chips}>
                    <span className={styles.chip}>
                      {o.deliveryOnly ? 'Delivery only' : 'Takeaway + delivery'}
                    </span>
                    {o.fssai && <span className={styles.chip}>FSSAI {o.fssai}</span>}
                  </div>

                  {o.hoursNote && (
                    <p className={styles.hours}>
                      🕐 {o.hoursNote}{' '}
                      <a href={`tel:${tel}`} className={`${styles.hoursCall} tap-target`}>
                        {o.phone}
                      </a>
                    </p>
                  )}

                  <div className={styles.actions}>
                    {o.mapsUrl && (
                      <a href={o.mapsUrl} target="_blank" rel="noreferrer" className={styles.directions}>
                        Get Directions
                      </a>
                    )}
                    {o.swiggyUrl && (
                      <a href={o.swiggyUrl} target="_blank" rel="noreferrer" className={styles.swiggy}>
                        Swiggy
                      </a>
                    )}
                    {o.zomatoUrl && (
                      <a href={o.zomatoUrl} target="_blank" rel="noreferrer" className={styles.zomato}>
                        Zomato
                      </a>
                    )}
                  </div>
                </div>
              </article>
            )
          })}
        </div>

        <div className={styles.deliveryStrip}>
          <p>
            Craving at home? <strong>Direct home delivery:</strong>
          </p>
          <a href={`tel:${telDelivery}`} className={styles.deliveryPhone}>
            {brand.phoneDelivery}
          </a>
        </div>
      </div>
    </section>
  )
}
