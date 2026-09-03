/**
 * The only place a number becomes text on a receipt.
 *
 * **The Worker performs no money arithmetic.** Every figure it prints is a
 * stored integer-paise column from the receipt payload, and this turns paise
 * into rupees at the very display edge and nothing else. A receipt that
 * computes, disagreeing with a bill that stored, is the worst bug available in
 * this feature — so there is deliberately no function here that adds, subtracts
 * or derives anything.
 */

/**
 * `2085` → `₹20.85`, `13900` → `₹139`.
 *
 * Whole rupees drop the paise, because every bill total is a whole rupee by
 * construction and printing `₹139.00` on a receipt reads like a machine. Paise
 * appear when they exist, which on a discount line they often do.
 */
export function formatPaise(paise: number): string {
  const negative = paise < 0
  const absolute = Math.abs(Math.trunc(paise))
  const rupees = Math.floor(absolute / 100)
  const remainder = absolute % 100

  const grouped = rupees.toLocaleString('en-IN')
  const body = remainder === 0 ? grouped : `${grouped}.${String(remainder).padStart(2, '0')}`
  return `${negative ? '−' : ''}₹${body}`
}

/** `1500` basis points → `15%`; `750` → `7.5%`. */
export function formatBasisPoints(bp: number): string {
  return `${bp / 100}%`
}

/**
 * A bill's business date, in the form the rest of the app writes dates in.
 *
 * The date arrives as a plain `date` string — an explicit column, never derived
 * from a timestamp — so it is formatted as the calendar date it is, with no time
 * zone applied to it. Applying one is how a business date becomes the wrong day.
 */
export function formatBusinessDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number)
  if (!year || !month || !day) return isoDate
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sept',
    'Oct',
    'Nov',
    'Dec',
  ]
  return `${String(day).padStart(2, '0')} ${months[month - 1]} ${year}`
}

/**
 * The time of sale, in Asia/Kolkata.
 *
 * `sold_at` is a `timestamptz` — an instant — so this one genuinely does need a
 * zone, and the business's zone is the only one a customer would recognise.
 */
export function formatSaleTime(isoTimestamp: string): string {
  const at = new Date(isoTimestamp)
  if (Number.isNaN(at.getTime())) return ''
  return at
    .toLocaleTimeString('en-IN', {
      timeZone: 'Asia/Kolkata',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    .toLowerCase()
}
