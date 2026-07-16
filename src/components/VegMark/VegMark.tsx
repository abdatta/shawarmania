import styles from './VegMark.module.css'

/** FSSAI-style veg / non-veg marker. */
export function VegMark({ isVeg }: { isVeg: boolean }) {
  return (
    <span
      className={`${styles.mark} ${isVeg ? styles.veg : styles.nonveg}`}
      role="img"
      aria-label={isVeg ? 'Vegetarian' : 'Non-vegetarian'}
    >
      <span />
    </span>
  )
}
