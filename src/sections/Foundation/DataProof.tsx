/** Dev-only content dump so seeded data can be eyeballed against the research docs. */
import { brand, menu, outlets, stats, testimonials, franchise } from '../../data'
import { imageFor } from '../../assets/img'
import styles from './Foundation.module.css'

export function DataProof() {
  return (
    <section className={styles.block}>
      <h2 className={styles.blockTitle}>Data proof (dev only)</h2>

      <h3 className={styles.dataHeading}>
        {brand.name} · {brand.nameBengali} · “{brand.tagline}” · {brand.phoneDelivery}
      </h3>

      <table className={styles.dataTable}>
        <thead>
          <tr>
            <th>Item</th>
            <th>₹ (platform)</th>
            <th>₹ (counter)</th>
            <th>Veg</th>
            <th>Rating</th>
            <th>Badge</th>
            <th>Img</th>
          </tr>
        </thead>
        <tbody>
          {menu.items.map((i) => (
            <tr key={i.id}>
              <td>{i.name}</td>
              <td>{i.price ?? '—'}</td>
              <td>{i.counterPrice ?? '—'}</td>
              <td>{i.isVeg ? 'V' : 'NV'}</td>
              <td>{i.rating ? `${i.rating} (${i.ratingCount})` : '—'}</td>
              <td>{i.badge ?? '—'}</td>
              <td>{i.image ? (imageFor(i.image) ? 'ok' : 'MISSING') : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <ul className={styles.dataList}>
        {outlets.outlets.map((o) => (
          <li key={o.id}>
            <strong>{o.name}</strong> — {o.addressLines.join(', ')} · {o.pincode ?? 'no pin'} ·
            FSSAI {o.fssai ?? '—'} · {o.deliveryOnly ? 'delivery only' : 'takeaway+delivery'} ·
            hours: {o.hours ? 'set' : `null (${o.hoursNote})`}
          </li>
        ))}
        <li>
          <strong>Counters:</strong>{' '}
          {stats.counters.map((c) => `${c.label}: ${c.prefix ?? ''}${c.value}${c.suffix ?? ''}`).join(' · ')}
        </li>
        <li>
          <strong>Lab report:</strong>{' '}
          {stats.labReport
            ? `${stats.labReport.lab} — ${stats.labReport.per100g.proteinG}g protein, ${stats.labReport.per100g.energyKcal} kcal, trans fat ${stats.labReport.per100g.transFatG}g`
            : 'null'}
        </li>
        <li>
          <strong>Testimonials:</strong> {testimonials.vloggerVideos.length} videos ·{' '}
          {testimonials.quotes.length} quotes
        </li>
        <li>
          <strong>Franchise:</strong> {franchise.models.length} models (fees:{' '}
          {franchise.models.map((m) => m.franchiseFee ?? 'null').join('/')}) ·{' '}
          {franchise.faqs.length} FAQs · form endpoint: {franchise.enquiry.formEndpoint ?? 'null'}
        </li>
      </ul>
    </section>
  )
}
