import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { menu, outlets } from '../../data'
import { imageFor } from '../../assets/img'
import { VegMark } from '../../components/VegMark/VegMark'
import type { MenuItem } from '../../data'
import styles from './Menu.module.css'

function priceLabel(item: MenuItem): string {
  if (item.price != null) return `₹${item.price}`
  if (item.counterPrice != null) return `₹${item.counterPrice} in-store`
  return 'ask in-store'
}

function FeaturedCard({ item }: { item: MenuItem }) {
  const img = imageFor(item.image)
  return (
    <article className={`${styles.card} ${img ? '' : styles.typeCard}`}>
      {item.badge && <span className={styles.badge}>{item.badge}</span>}
      {img && (
        <div className={styles.cardImgWrap}>
          <img src={img} alt={item.name} loading="lazy" width={720} height={540} />
        </div>
      )}
      <div className={styles.cardBody}>
        <h3 className={styles.cardName}>
          <VegMark isVeg={item.isVeg} /> {item.name}
        </h3>
        {item.description && <p className={styles.cardDesc}>{item.description}</p>}
        <p className={styles.cardMeta}>
          <span className={styles.price}>{priceLabel(item)}</span>
          {item.rating != null && (
            <span className={styles.rating}>
              ★ {item.rating.toFixed(1)}
              {item.ratingCount != null && <small> ({item.ratingCount})</small>}
            </span>
          )}
        </p>
      </div>
    </article>
  )
}

export function Menu() {
  const scope = useRef<HTMLElement>(null)
  const trackRef = useRef<HTMLDivElement>(null)

  const featured = menu.items.filter((i) => i.featured)
  const byCategory = menu.categories
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((c) => ({ ...c, items: menu.items.filter((i) => i.category === c.id && !i.featured) }))
    .filter((c) => c.items.length > 0)

  const kalyani = outlets.outlets.find((o) => o.id === 'kalyani')
  const kanchrapara = outlets.outlets.find((o) => o.id === 'kanchrapara')

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference) and (min-width: 900px)', () => {
        const track = trackRef.current!
        const gallery = track.parentElement!
        const distance = () => track.scrollWidth - gallery.clientWidth
        gsap.to(track, {
          x: () => -distance(),
          ease: 'none',
          scrollTrigger: {
            trigger: gallery,
            start: 'center center',
            end: () => `+=${distance()}`,
            pin: scope.current,
            scrub: 0.7,
            invalidateOnRefresh: true,
            anticipatePin: 1,
          },
        })
      })
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.heading} > *`, {
          y: 44,
          autoAlpha: 0,
          stagger: 0.08,
          duration: 0.7,
          scrollTrigger: { trigger: `.${styles.heading}`, start: 'top 85%' },
        })
        gsap.from(`.${styles.catTile}`, {
          y: 60,
          autoAlpha: 0,
          stagger: 0.09,
          duration: 0.6,
          scrollTrigger: { trigger: `.${styles.categories}`, start: 'top 85%' },
        })
      })
      return () => mm.revert()
    },
    { scope },
  )

  return (
    <section id="menu" ref={scope} className={styles.menu}>
      <header className={styles.heading}>
        <p className={styles.kicker}>The menu</p>
        <h2 className={styles.title}>Big flavor. Small prices.</h2>
        <p className={styles.sub}>
          Swiggy-listed prices shown — walk-in prices at the counter start even lower.
        </p>
      </header>

      <div className={styles.gallery}>
        <div ref={trackRef} className={styles.track}>
          {featured.map((item) => (
            <FeaturedCard key={item.id} item={item} />
          ))}
        </div>
      </div>

      <div className={styles.categories}>
        {byCategory.map((cat) => (
          <div key={cat.id} className={styles.catTile}>
            <h3 className={styles.catName}>{cat.name}</h3>
            {cat.blurb && <p className={styles.catBlurb}>{cat.blurb}</p>}
            <ul className={styles.catList}>
              {cat.items.map((item) => (
                <li key={item.id}>
                  <span className={styles.rowName}>
                    <VegMark isVeg={item.isVeg} /> {item.name}
                  </span>
                  <span className={styles.leader} aria-hidden="true" />
                  <span className={styles.rowPrice}>{priceLabel(item)}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div className={styles.orderStrip}>
        <p className={styles.orderLine}>Hungry yet?</p>
        <div className={styles.orderCtas}>
          {kalyani?.swiggyUrl && (
            <a href={kalyani.swiggyUrl} target="_blank" rel="noreferrer" className={styles.swiggy}>
              Order on Swiggy
            </a>
          )}
          {(kalyani?.zomatoUrl ?? kanchrapara?.zomatoUrl) && (
            <a
              href={kalyani?.zomatoUrl ?? kanchrapara?.zomatoUrl ?? '#'}
              target="_blank"
              rel="noreferrer"
              className={styles.zomato}
            >
              Order on Zomato
            </a>
          )}
          <a href="tel:03325823100" className={`${styles.phone} tap-target`}>
            Home delivery: 033 2582 3100
          </a>
        </div>
      </div>
    </section>
  )
}
