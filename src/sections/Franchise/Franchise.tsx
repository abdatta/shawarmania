import { useRef, useState } from 'react'
import { gsap, useGSAP } from '../../lib/gsap'
import { brand, franchise } from '../../data'
import styles from './Franchise.module.css'

const SUPPORT_ICONS: Record<string, string> = {
  training: '👨‍🍳',
  supply: '🚚',
  site: '📍',
  marketing: '📣',
  quality: '✅',
}

function Detail({ label, value }: { label: string; value: string | null }) {
  return (
    <div className={styles.detailRow}>
      <dt>{label}</dt>
      <dd>{value ?? <span className={styles.askChip}>Contact for details</span>}</dd>
    </div>
  )
}

export function Franchise() {
  const scope = useRef<HTMLElement>(null)
  const [sent, setSent] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle')

  const { enquiry } = franchise
  const formActive = enquiry.formEndpoint != null && enquiry.formAccessKey != null
  const whatsappHref = enquiry.whatsappNumber
    ? `https://wa.me/${enquiry.whatsappNumber.replace(/\D/g, '')}?text=${encodeURIComponent(enquiry.whatsappPrefill)}`
    : null
  const telPrimary = `tel:${brand.phonePrimary.replace(/\s/g, '')}`

  useGSAP(
    () => {
      const mm = gsap.matchMedia()
      mm.add('(prefers-reduced-motion: no-preference)', () => {
        gsap.from(`.${styles.tier}`, {
          y: 64,
          autoAlpha: 0,
          stagger: 0.12,
          duration: 0.65,
          ease: 'back.out(1.3)',
          scrollTrigger: { trigger: `.${styles.tiers}`, start: 'top 82%', once: true },
        })
        gsap.from(`.${styles.supportItem}`, {
          y: 36,
          autoAlpha: 0,
          stagger: 0.07,
          duration: 0.5,
          scrollTrigger: { trigger: `.${styles.support}`, start: 'top 85%', once: true },
        })
        gsap.fromTo(
          `.${styles.processLine}`,
          { scaleX: 0 },
          {
            scaleX: 1,
            ease: 'none',
            scrollTrigger: { trigger: `.${styles.process}`, start: 'top 85%', end: 'bottom 55%', scrub: 0.6 },
          },
        )
        gsap.from(`.${styles.step}`, {
          y: 50,
          autoAlpha: 0,
          stagger: 0.1,
          duration: 0.6,
          scrollTrigger: { trigger: `.${styles.process}`, start: 'top 82%', once: true },
        })
      })
      return () => mm.revert()
    },
    { scope },
  )

  const submit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formActive) return
    const form = e.currentTarget
    const data = new FormData(form)
    data.append('access_key', enquiry.formAccessKey!)
    data.append('subject', 'Shawarmania franchise enquiry')
    setSent('sending')
    try {
      const res = await fetch(enquiry.formEndpoint!, { method: 'POST', body: data })
      setSent(res.ok ? 'ok' : 'err')
      if (res.ok) form.reset()
    } catch {
      setSent('err')
    }
  }

  return (
    <section id="franchise" ref={scope} className={styles.franchise}>
      <div className={styles.inner}>
        <p className={styles.kicker}>Franchise</p>
        <h2 className={styles.title}>{franchise.momentumLine}</h2>
        <p className={styles.intro}>{franchise.intro}</p>

        <div className={styles.tiers}>
          {franchise.models.map((m) => (
            <article key={m.id} className={styles.tier}>
              <h3 className={styles.tierName}>{m.name}</h3>
              {m.notes && <p className={styles.tierNotes}>{m.notes}</p>}
              <dl className={styles.details}>
                <Detail label="Area" value={m.areaSqft} />
                <Detail label="Franchise fee" value={m.franchiseFee} />
                <Detail label="Total investment" value={m.totalInvestment} />
                <Detail label="Menu" value={m.menuScope} />
              </dl>
            </article>
          ))}
        </div>

        <div className={styles.support}>
          <h3 className={styles.subheading}>What you get</h3>
          <ul className={styles.supportList}>
            {franchise.support.map((s) => (
              <li key={s.title} className={styles.supportItem}>
                <span className={styles.supportIcon} aria-hidden="true">
                  {SUPPORT_ICONS[s.icon] ?? '⭐'}
                </span>
                <strong>{s.title}</strong>
                <p>{s.description}</p>
              </li>
            ))}
          </ul>
        </div>

        <div className={styles.process}>
          <h3 className={styles.subheading}>How it works</h3>
          <div className={styles.rail}>
            <span className={styles.processLine} aria-hidden="true" />
            {franchise.process.map((p) => (
              <div key={p.step} className={styles.step}>
                <span className={styles.stepNo}>{p.step}</span>
                <strong>{p.title}</strong>
                <p>{p.description}</p>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.enquiry}>
          <div className={styles.enquiryCopy}>
            <h3>Ready to bring the mania home?</h3>
            <p>Tell us your city and budget — we&rsquo;ll take it from there.</p>
            {whatsappHref ? (
              <a className={styles.ctaPrimary} href={whatsappHref} target="_blank" rel="noreferrer">
                WhatsApp us about franchising
              </a>
            ) : (
              <a className={styles.ctaPrimary} href={telPrimary}>
                Call about franchising · {brand.phonePrimary}
              </a>
            )}
          </div>

          <form className={styles.form} onSubmit={(e) => void submit(e)}>
            {!formActive && (
              <p className={styles.formNote}>
                The enquiry form goes live soon — call or message us meanwhile.
              </p>
            )}
            <div className={styles.fields}>
              <label>
                Name
                <input name="name" type="text" required disabled={!formActive} autoComplete="name" />
              </label>
              <label>
                Phone
                <input name="phone" type="tel" required disabled={!formActive} autoComplete="tel" />
              </label>
              <label>
                City
                <input name="city" type="text" required disabled={!formActive} />
              </label>
              <label>
                Budget
                <input name="budget" type="text" disabled={!formActive} placeholder="e.g. 5–10 lakh" />
              </label>
            </div>
            {formActive && (
              <input type="checkbox" name="botcheck" className={styles.honeypot} tabIndex={-1} aria-hidden="true" />
            )}
            <button type="submit" className={styles.submit} disabled={!formActive || sent === 'sending'}>
              {sent === 'sending' ? 'Sending…' : 'Send enquiry'}
            </button>
            {sent === 'ok' && <p className={styles.sentOk}>Got it! We&rsquo;ll call you back soon.</p>}
            {sent === 'err' && (
              <p className={styles.sentErr}>Something went wrong — please call {brand.phonePrimary}.</p>
            )}
          </form>
        </div>

        <div className={styles.faqs}>
          <h3 className={styles.subheading}>Questions, answered</h3>
          {franchise.faqs.map((f) => (
            <details key={f.q} className={styles.faq}>
              <summary>{f.q}</summary>
              <p>{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
