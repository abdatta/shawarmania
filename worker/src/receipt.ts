/**
 * The data contract, and the one call the Worker is allowed to make.
 *
 * The ops project exposes exactly one `security definer` function,
 * `bill_public_receipt`, which takes a token and returns one receipt. It accepts
 * no outlet, no bill id, no bill number, no date, no range and no limit — so the
 * service-role credential this Worker holds has a blast radius bounded by that
 * function rather than by the key's own power.
 *
 * **The payload carries no customer name and no phone number.** That is enforced
 * by the function's own projection in the ops repo, not by this page declining to
 * render them. {@link assertNamesNobody} is the tripwire for a regression there:
 * if a name ever arrives, this Worker refuses to serve the receipt rather than
 * printing it.
 */

export interface ReceiptLine {
  item_name: string
  quantity: number
  unit_price_paise: number
  line_total_paise: number
}

export interface ReceiptDiscountRow {
  source: 'menu' | 'bill'
  basis: 'percent' | 'amount'
  value_bp: number | null
  value_paise: number | null
  categories: string[]
  amount_paise: number
}

export interface ReceiptTotals {
  subtotal_paise: number
  discount_paise: number
  tax_paise: number
  rounding_paise: number
  total_paise: number
}

export interface ReceiptPayment {
  method: 'cash' | 'upi'
  amount_paise: number
}

export interface Receipt {
  outlet: { name: string }
  bill_number: number
  business_date: string
  sold_at: string
  status: 'settled' | 'void'
  void_reason: string | null
  totals: ReceiptTotals
  lines: ReceiptLine[]
  discount_rows: ReceiptDiscountRow[]
  payments: ReceiptPayment[]
}

export interface OpsProject {
  url: string
  serviceRoleKey: string
}

/**
 * Fields that must never appear in a receipt payload.
 *
 * Checked against the serialised payload rather than field by field, because the
 * risk is a field nobody thought to check. This is a tripwire, not a filter: if
 * one of these arrives the answer is to refuse and fix the ops function, because
 * quietly stripping it here would leave the real leak in place for the next
 * reader.
 */
const FORBIDDEN_KEYS = [
  'customer_name',
  'customer_phone',
  'customer_id',
  'biller_name',
  'biller_profile_id',
  'customer',
] as const

export class ReceiptNamesSomebody extends Error {
  constructor(key: string) {
    super(`the receipt payload carried "${key}": fix the ops projection, do not strip it here`)
    this.name = 'ReceiptNamesSomebody'
  }
}

export function assertNamesNobody(payload: unknown): void {
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      for (const item of value) walk(item)
      return
    }
    if (value === null || typeof value !== 'object') return
    for (const [key, nested] of Object.entries(value)) {
      if ((FORBIDDEN_KEYS as readonly string[]).includes(key)) {
        throw new ReceiptNamesSomebody(key)
      }
      walk(nested)
    }
  }
  walk(payload)
}

/**
 * One token in, one receipt out, or null.
 *
 * Null covers every refusal the database makes — unknown, malformed, revoked and
 * endpoint-disabled all return SQL null — and the caller turns all of them into
 * one identical response. A network or credential failure throws instead, so a
 * broken Worker is not mistaken for an invalid token.
 */
export async function readReceipt(
  project: OpsProject,
  token: string,
  client: { address: string | null; userAgent: string | null },
): Promise<Receipt | null> {
  const response = await fetch(`${project.url}/rest/v1/rpc/bill_public_receipt`, {
    method: 'POST',
    headers: {
      apikey: project.serviceRoleKey,
      Authorization: `Bearer ${project.serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      p_token: token,
      p_client_address: client.address,
      p_user_agent: client.userAgent,
    }),
  })

  if (!response.ok) {
    throw new Error(`the ops receipt reader answered ${response.status}`)
  }

  const payload: unknown = await response.json()
  if (payload === null) return null

  assertNamesNobody(payload)
  return payload as Receipt
}
