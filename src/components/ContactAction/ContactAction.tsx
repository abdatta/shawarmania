import type { ReactNode } from 'react'
import { WhatsappIcon } from '../icons/WhatsappIcon'
import styles from './ContactAction.module.css'

type ContactActionProps = {
  kind: 'call' | 'whatsapp'
  href: string
  children?: ReactNode
  className?: string
  ariaLabel?: string
  newTab?: boolean
}

function CallIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <path d="M6.6 10.8a15.6 15.6 0 0 0 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1A17 17 0 0 1 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.2.2 2.4.6 3.6.1.3 0 .7-.2 1l-2.3 2.2Z" />
    </svg>
  )
}

/** Consistently aligned call/WhatsApp action, with optional visible text. */
export function ContactAction({
  kind,
  href,
  children,
  className = '',
  ariaLabel,
  newTab = false,
}: ContactActionProps) {
  return (
    <a
      className={`${styles.action} ${className}`.trim()}
      href={href}
      aria-label={ariaLabel}
      target={newTab ? '_blank' : undefined}
      rel={newTab ? 'noreferrer' : undefined}
    >
      <span className={styles.icon} aria-hidden="true">
        {kind === 'call' ? <CallIcon /> : <WhatsappIcon />}
      </span>
      {children != null && <span className={styles.label}>{children}</span>}
    </a>
  )
}
