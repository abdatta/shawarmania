import { formatBasisPoints, formatBusinessDate, formatPaise, formatSaleTime } from './money'
import type { Receipt, ReceiptDiscountRow } from './receipt'

/**
 * **Everything a reader of a receipt sees, decided once.**
 *
 * The receipt is rendered twice — as an HTML page and as an 80 mm PDF — because
 * one is a thing you look at on a phone and the other is a document you keep,
 * and neither can be produced from the other inside a Worker. Two renderers over
 * one design is exactly the arrangement that drifts: somebody relabels a row on
 * the page, the PDF keeps the old wording, and a customer holding both sees two
 * different receipts for one bill.
 *
 * So the renderers do not decide anything a reader can read. This module turns a
 * receipt payload into the ordered list of labels, subtexts and formatted amounts
 * that a receipt *says*; `page.ts` and `pdf.ts` are then only presentation —
 * typography, spacing, colour, page size. A row cannot exist in one and not the
 * other, and a label cannot be worded differently in the two, because neither
 * writes one.
 *
 * `content.test.ts` holds them to it: every string this module produces must
 * appear in the HTML *and* in the PDF's own layout, and neither may invent one.
 *
 * **No arithmetic happens here either.** Every figure is a stored integer-paise
 * column from the payload, formatted by `money.ts` at the display edge. A
 * receipt that computes, disagreeing with a bill that stored, is the worst bug
 * available in this feature.
 */

export interface ContentAmount {
  /** What the row is called. */
  label: string
  /** The smaller line beneath it, where there is one. */
  detail: string | null
  /** Already formatted: `₹238`, `−₹35.70`. */
  amount: string
}

export interface ReceiptContent {
  outletName: string
  /** `03 Sep 2026 · 1:05 pm`: the business date and the time of sale. */
  when: string
  /** `Bill 10` */
  billLabel: string
  /**
   * `Dine-in` or `Takeaway`; null when the bill recorded neither. Never the
   * table [owner, 2026-09-30]: a label for the length of a meal, like the order
   * number, which the receipt does not show either.
   */
  service: string | null
  /**
   * Whose receipt it is, without saying who (ops #58): `+91 ••••• •0042`, and
   * `Gold` for a customer who was gold at this outlet, which the receipt names
   * already [owner, 2026-09-30]. Each null
   * when the payload does not carry it. Never a name.
   *
   * The gold line's star is presentation, not content: the page draws an emoji
   * and the PDF a vector star, because the PDF's faces carry no emoji.
   */
  holder: { phone: string | null; gold: string | null }
  /** Present only for a voided bill, and unmistakable when it is. */
  cancelled: { label: string } | null
  lines: ContentAmount[]
  /** Shown only when something adjusted the subtotal, or it would restate a line. */
  subtotal: ContentAmount | null
  /** Discounts, then the round-up. `giveaway` marks the ones to colour. */
  adjustments: (ContentAmount & { giveaway: boolean })[]
  total: ContentAmount
  /** `Paid by Cash ₹200 + UPI ₹55` */
  tender: string
  /**
   * One line beneath the tender [owner, 2026-09-30]: `+14 pts earned` at the
   * left, `Balance: 96 pts` at the right. `earned` is null for a bill that
   * earned nothing; the whole is null for a bill with no points. What the bill
   * used is its discount row, *Points (N)*, and is not said again here.
   */
  points: { earned: string | null; balance: string } | null
  /** The small print, in order. */
  notes: string[]
}

const methodLabel = (method: string): string => (method === 'upi' ? 'UPI' : 'Cash')

/** `Menu Discount (15%)` over the categories it covered; `Discount (₹50)` on the bill. */
function discountLabel(row: ReceiptDiscountRow): string {
  // One point is one rupee, so the points a row used are its rupees (ops #62).
  if (row.source === 'points') return `Points (${Math.round(row.amount_paise / 100)})`
  if (row.source === 'packaging') return 'Free packaging'
  const value =
    row.basis === 'percent'
      ? formatBasisPoints(row.value_bp ?? 0)
      : formatPaise(row.value_paise ?? 0)
  return row.source === 'menu' ? `Menu Discount (${value})` : `Discount (${value})`
}

/**
 * What the discount applied to.
 *
 * A menu row names the categories the bill actually carried. It deliberately
 * does **not** say "All Items" even when it covered them: that is a claim about
 * what the menu contained at the moment of sale, and this reader opens a bill
 * months later with no menu history to check it against. The ops app's own
 * manager bill detail declined the phrase for exactly that reason.
 */
function discountDetail(row: ReceiptDiscountRow): string {
  if (row.source === 'bill') return 'On this bill'
  if (row.source === 'points') return 'From your points'
  if (row.source === 'packaging') return 'Gold member'
  return row.categories.length > 0 ? row.categories.join(', ') : 'Selected items'
}

/**
 * The small print signs the receipt with the bill's own outlet [owner,
 * 2026-09-30]: `Shawarmania · Kalyani Cafe`. The brand is dropped from the
 * outlet's name before it is prefixed back on, as `pdfFilename` does, so the
 * older outlet `Shawarmania Kalyani` reads `Shawarmania · Kalyani`.
 */
function smallPrint(outletName: string): string {
  const place = outletName.replace(/shawarmania/gi, '').replace(/\s+/g, ' ').trim()
  return place ? `Shawarmania · ${place}` : 'Shawarmania'
}

/**
 * The legal entity behind the brand, beneath the outlet [owner, 2026-10-03].
 *
 * The receipt link goes out by SMS under a DLT registration held by the LLP, not
 * by "Shawarmania", and a reviewer who opens one should see they are the same
 * business (ops #66). One line, in the words the legal pages already use ("De &
 * Datta LLP, operating Shawarmania"). The name is `src/data/brand.json`'s
 * `legalEntityName`, which a test holds this to; it is copied rather than
 * imported because the Worker is built apart from the site.
 */
export const OPERATOR_LINE = 'Operated by De & Datta LLP'

/** How the bill was served, in the counter's own words (ops #60). */
function serviceLine(receipt: Receipt): string | null {
  if (receipt.service_type === 'takeaway') return 'Takeaway'
  if (receipt.service_type === 'dine_in') {
    return 'Dine-in'
  }
  return null
}

export function receiptContent(receipt: Receipt): ReceiptContent {
  const { totals } = receipt

  const lines: ContentAmount[] = receipt.lines.map((line) => ({
    label: line.item_name,
    detail: `${line.quantity} × ${formatPaise(line.unit_price_paise)}`,
    amount: formatPaise(line.line_total_paise),
  }))

  const adjustments: (ContentAmount & { giveaway: boolean })[] = receipt.discount_rows.map(
    (row) => ({
      label: discountLabel(row),
      detail: discountDetail(row),
      amount: `−${formatPaise(row.amount_paise)}`,
      giveaway: true,
    }),
  )

  // Always shown when it exists, because it is a stored line of the bill rather
  // than a rendering detail — and on a fully discounted meal it is the line that
  // explains a ₹1 total.
  if (totals.rounding_paise > 0) {
    adjustments.push({
      label: 'Round up',
      detail: 'To the nearest rupee',
      amount: formatPaise(totals.rounding_paise),
      giveaway: false,
    })
  }

  const tender = receipt.payments
    .map((payment) =>
      receipt.payments.length > 1
        ? `${methodLabel(payment.method)} ${formatPaise(payment.amount_paise)}`
        : methodLabel(payment.method),
    )
    .join(' + ')

  // Read, never worked out: the figures are the bill's own ledger rows. What the
  // bill used is already its discount row, *Points (N)*, so it is not said again
  // here; a second *Points used* read as more points spent [owner, 2026-09-30].
  const count = (n: number): string => `${n} ${n === 1 ? 'pt' : 'pts'}`
  const points = receipt.points
    ? {
        earned: receipt.points.earned > 0 ? `+${count(receipt.points.earned)} earned` : null,
        balance: `Balance: ${count(receipt.points.balance)}`,
      }
    : null

  return {
    outletName: receipt.outlet.name,
    when: `${formatBusinessDate(receipt.business_date)} · ${formatSaleTime(receipt.sold_at)}`,
    billLabel: `Bill ${receipt.bill_number}`,
    service: serviceLine(receipt),
    holder: {
      phone: receipt.phone_last4 ? `+91 ••••• •${receipt.phone_last4}` : null,
      gold: receipt.gold_at_outlet === true ? 'Gold' : null,
    },
    // Cancelled, and never why: the reason is the outlet's own note, not the
    // customer's business [owner, 2026-09-30]. Ops stops sending it; a payload
    // from before that may still carry it, and it is not read.
    cancelled: receipt.status === 'void' ? { label: 'Cancelled' } : null,
    lines,
    // Restating a single undiscounted line as a subtotal is noise; beside
    // adjustments it is what they adjust.
    subtotal:
      adjustments.length > 0
        ? { label: 'Subtotal', detail: null, amount: formatPaise(totals.subtotal_paise) }
        : null,
    adjustments,
    total: { label: 'Total', detail: null, amount: formatPaise(totals.total_paise) },
    tender: `Paid by ${tender}`,
    points,
    // No "not a tax invoice" sentence [owner, 2026-09-30]: the receipt carries no
    // GSTIN, no tax breakup and no tax line, which is what keeps it from
    // resembling one, and the sentence read as clutter on the counter's pop-up
    // before it was dropped from both.
    notes: [smallPrint(receipt.outlet.name), OPERATOR_LINE],
  }
}

/**
 * Every string the content model says, flattened.
 *
 * This is what the agreement test compares the two renderers against, and it is
 * the reason a row cannot quietly appear in one and not the other.
 */
export function contentStrings(content: ReceiptContent): string[] {
  // One row at the top: the bill and how it was served at the left, the date
  // and time at the right [owner, 2026-09-30].
  // Reading order [owner, 2026-09-30]: bill and the date and time, then how it
  // was served, gold and the number.
  const out: string[] = [content.outletName, content.billLabel, content.when]
  if (content.service) out.push(content.service)
  if (content.holder.gold) out.push(content.holder.gold)
  if (content.holder.phone) out.push(content.holder.phone)

  if (content.cancelled) out.push(content.cancelled.label)

  for (const row of [
    ...content.lines,
    ...(content.subtotal ? [content.subtotal] : []),
    ...content.adjustments,
    content.total,
  ]) {
    // Reading order -- label, then the subtext beneath it, then the amount --
    // because the agreement test compares this against a renderer's own order
    // and a row is read top to bottom.
    out.push(row.label)
    if (row.detail) out.push(row.detail)
    out.push(row.amount)
  }

  out.push(content.tender)
  if (content.points) {
    if (content.points.earned) out.push(content.points.earned)
    out.push(content.points.balance)
  }
  out.push(...content.notes)
  return out
}
