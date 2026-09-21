import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { brand, outlets } from '../../data'
import { assetUrl } from '../../lib/assetUrl'
import logo from '../../assets/brand/logo.png'
import styles from './Footer.module.css'

export function Footer() {
  const scope = useRef<HTMLElement>(null)
  const year = new Date().getFullYear()

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.logo}`, {
          y: 60,
          autoAlpha: 0,
          duration: 0.8,
          ease: 'back.out(1.5)',
          scrollTrigger: { trigger: scope.current, start: 'top 85%', once: true },
        })
      })
      return () => mm.revert()
    },
    { scope },
  )

  return (
    <footer id="contact" ref={scope} className={styles.footer}>
      <div className={styles.inner} data-scroll-anchor>
        <div className={styles.brandCol}>
          <img className={styles.logo} src={logo} alt="Shawarmania" width={226} height={162} />
          <p className={styles.tagline}>{brand.tagline}</p>
          <div className={styles.socials}>
            <a className="tap-target" href={brand.social.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
            {brand.social.facebook && (
              <a className="tap-target" href={brand.social.facebook} target="_blank" rel="noreferrer">
                Facebook
              </a>
            )}
            {brand.whatsappChannelUrl && (
              <a className="tap-target" href={brand.whatsappChannelUrl} target="_blank" rel="noreferrer">
                WhatsApp channel
              </a>
            )}
          </div>
        </div>

        <div className={styles.col}>
          <h3>Outlets</h3>
          {outlets.outlets.map((o) => (
            <p key={o.id}>
              <strong>{o.name}</strong>
              <br />
              {o.addressLines.join(', ')}
              {o.pincode ? ` — ${o.pincode}` : ''}
              <br />
              <a className="tap-target" href={`tel:${o.phone.replace(/\s/g, '')}`}>{o.phone}</a>
            </p>
          ))}
          <p>
            <strong>Home delivery</strong>
            <br />
            <a className="tap-target" href={`tel:${brand.phoneDelivery.replace(/\s/g, '')}`}>{brand.phoneDelivery}</a>
          </p>
        </div>

        <div className={styles.col}>
          <h3>The fine print</h3>
          <p>
            FSSAI:{' '}
            {outlets.outlets
              .map((o) => o.fssai)
              .filter(Boolean)
              .join(' · ')}
          </p>
          {/*
            Real documents, not modals. Messaging review loads a brand's privacy
            policy and terms as URLs and reads them, and a <dialog> in the bundle
            has no URL to load — see
            openspec/changes/legal-and-messaging-pages.
          */}
          <div className={styles.legalRow}>
            <a className="tap-target" href={assetUrl('privacy/')}>
              Privacy
            </a>
            <a className="tap-target" href={assetUrl('terms/')}>
              Terms
            </a>
            <a className="tap-target" href={assetUrl('messages/')}>
              Messaging
            </a>
          </div>
        </div>
      </div>

      <div className={styles.bar}>
        <p>
          © {year} {brand.name} · {brand.city}, {brand.region}
        </p>
        <p className={styles.made}>Made in {brand.city} with 🔥</p>
      </div>
    </footer>
  )
}
