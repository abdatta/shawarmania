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
  /** `03 Sept 2026 · 1:05 pm` */
  when: string
  /** `Bill 10` */
  billLabel: string
  /** Present only for a voided bill, and unmistakable when it is. */
  cancelled: { label: string; reason: string | null } | null
  lines: ContentAmount[]
  /** Shown only when something adjusted the subtotal, or it would restate a line. */
  subtotal: ContentAmount | null
  /** Discounts, then the round-up. `giveaway` marks the ones to colour. */
  adjustments: (ContentAmount & { giveaway: boolean })[]
  total: ContentAmount
  /** `Paid by Cash ₹200 + UPI ₹55` */
  tender: string
  /** The small print, in order. */
  notes: string[]
}

const methodLabel = (method: string): string => (method === 'upi' ? 'UPI' : 'Cash')

/** `Menu Discount (15%)` over the categories it covered; `Discount (₹50)` on the bill. */
function discountLabel(row: ReceiptDiscountRow): string {
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
  return row.categories.length > 0 ? row.categories.join(', ') : 'Selected items'
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

  return {
    outletName: receipt.outlet.name,
    when: `${formatBusinessDate(receipt.business_date)} · ${formatSaleTime(receipt.sold_at)}`,
    billLabel: `Bill ${receipt.bill_number}`,
    cancelled:
      receipt.status === 'void' ? { label: 'Cancelled', reason: receipt.void_reason } : null,
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
    notes: [
      'Shawarmania · Kalyani & Kanchrapara',
      'This is a receipt, not a tax invoice.',
      /*
        Where the messaging programme is explained, and every way out of it.

        It lives here rather than in `page.ts` so the 80 mm roll carries it too
        -- small print on a receipt you keep is exactly where messaging terms
        are conventionally read, and the agreement test then holds both
        renderers to the same wording for free.

        **It says nothing about its reader.** Not "you gave us your number", not
        "you consented": this link also travels by WhatsApp and gets forwarded,
        and a receipt that tells the wrong person they opted in is worse than
        one that says nothing. It names where the explanation lives and stops.
      */
      'How we message you: shawarmania.in/messages',
    ],
  }
}

/**
 * Every string the content model says, flattened.
 *
 * This is what the agreement test compares the two renderers against, and it is
 * the reason a row cannot quietly appear in one and not the other.
 */
export function contentStrings(content: ReceiptContent): string[] {
  const out: string[] = [content.outletName, content.when, content.billLabel]

  if (content.cancelled) {
    out.push(content.cancelled.label)
    if (content.cancelled.reason) out.push(content.cancelled.reason)
  }

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

  out.push(content.tender, ...content.notes)
  return out
}
