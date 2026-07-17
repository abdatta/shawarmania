import { brand } from '../../data'
import { WhatsappIcon } from '../icons/WhatsappIcon'
import styles from './FloatingCtas.module.css'

export function FloatingCtas() {
  const tel = brand.phoneDelivery.replace(/\s/g, '')
  return (
    <div className={styles.wrap}>
      {brand.whatsappChannelUrl && (
        <a
          className={`${styles.fab} ${styles.whatsapp}`}
          href={brand.whatsappChannelUrl}
          target="_blank"
          rel="noreferrer"
          aria-label="Join the Shawarmania WhatsApp channel"
        >
          <WhatsappIcon size={22} />
        </a>
      )}
      <a
        className={`${styles.fab} ${styles.call}`}
        href={`tel:${tel}`}
        aria-label={`Call for home delivery: ${brand.phoneDelivery}`}
      >
        <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
          <path d="M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z" />
        </svg>
      </a>
    </div>
  )
}
