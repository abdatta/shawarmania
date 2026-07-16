import { useRef } from 'react'
import styles from './LegalModal.module.css'

type Props = {
  label: string
  title: string
  children: React.ReactNode
}

/** Native <dialog> legal modal — built-in focus trap, Esc close, backdrop. */
export function LegalModal({ label, title, children }: Props) {
  const ref = useRef<HTMLDialogElement>(null)

  return (
    <>
      <button type="button" className={styles.trigger} onClick={() => ref.current?.showModal()}>
        {label}
      </button>
      <dialog
        ref={ref}
        className={styles.dialog}
        aria-label={title}
        onClick={(e) => {
          if (e.target === ref.current) ref.current.close()
        }}
      >
        <div className={styles.content}>
          <header className={styles.head}>
            <h3>{title}</h3>
            <button type="button" aria-label="Close" onClick={() => ref.current?.close()}>
              ✕
            </button>
          </header>
          {children}
        </div>
      </dialog>
    </>
  )
}
