import { useRef } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { brand, outlets } from '../../data'
import { LegalModal } from '../../components/LegalModal/LegalModal'
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
      <div className={styles.inner}>
        <div className={styles.brandCol}>
          <img className={styles.logo} src={logo} alt="Shawarmania" width={226} height={162} />
          <p className={styles.tagline}>{brand.tagline}</p>
          <div className={styles.socials}>
            <a href={brand.social.instagram} target="_blank" rel="noreferrer">
              Instagram
            </a>
            {brand.social.facebook && (
              <a href={brand.social.facebook} target="_blank" rel="noreferrer">
                Facebook
              </a>
            )}
            {brand.whatsappChannelUrl && (
              <a href={brand.whatsappChannelUrl} target="_blank" rel="noreferrer">
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
              <a href={`tel:${o.phone.replace(/\s/g, '')}`}>{o.phone}</a>
            </p>
          ))}
          <p>
            <strong>Home delivery</strong>
            <br />
            <a href={`tel:${brand.phoneDelivery.replace(/\s/g, '')}`}>{brand.phoneDelivery}</a>
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
          <p className={styles.legalRow}>
            <LegalModal label="Privacy" title="Privacy">
              <p>
                This is a static informational website for Shawarmania. It sets no cookies, runs no
                trackers, and collects no personal data on its own.
              </p>
              <p>
                The franchise enquiry form (when enabled) sends only what you type to our form
                provider so we can reply to you. Ordering happens on Swiggy/Zomato under their
                privacy policies.
              </p>
              <p>
                Business details shown here come from our own public listings. Spotted something
                off? Call {brand.phoneDelivery}. <em>(Pending owner legal review.)</em>
              </p>
            </LegalModal>
            <LegalModal label="Terms" title="Terms of Use">
              <p>
                Content on this site is for information only. Menu items, prices and hours can
                change at the counter without notice — the platform listing or the counter price is
                authoritative on any given day.
              </p>
              <p>
                All photography and branding belong to Shawarmania. Third-party video links belong
                to their creators. <em>(Pending owner legal review.)</em>
              </p>
            </LegalModal>
          </p>
        </div>
      </div>

      <div className={styles.bar}>
        <p>
          © {year} {brand.name} · {brand.city}, {brand.region}
        </p>
        <p className={styles.made}>
          Made in {brand.city} with 🔥 · <span lang="bn">{brand.nameBengali}</span>
        </p>
      </div>
    </footer>
  )
}
