import type { OpsProject } from './receipt'

/**
 * An outlet's public menu, read from ops.
 *
 * `shawarmania.in/menu/<slug>/` is what the QR code on a table opens. The menu
 * lives in the ops database, which grants the anonymous role nothing, so — like
 * the receipt — something server-side has to hold a credential to read it. The
 * credential calls one function, `public_menu(slug)`, which can return nothing
 * but a menu: section names and, per item, its name, description, price, veg
 * flag and whether it is available today (ops: the-menu-is-public).
 */
export interface PublicMenuItem {
  name: string
  description: string | null
  price_paise: number
  is_veg: boolean
  is_available: boolean
}

/**
 * The outlet's Google review ask, as its manager set it on the ops outlet page:
 * where its Google listing takes a review, and the thank-you discount, in whole
 * percent. Absent, or null, when the outlet has it off — and absent from every
 * menu ops served before it existed, which the page treats the same way.
 */
export interface PublicMenuReview {
  url: string
  percent: number
}

export interface PublicMenu {
  outlet: { name: string; slug: string }
  sections: { name: string; items: PublicMenuItem[] }[]
  review?: PublicMenuReview | null
}

/**
 * The shape ops enforces on `outlets.menu_slug`. Checked here first so an
 * address that cannot exist never becomes a database call — the cheap half of
 * not letting a flood of invented addresses cost anything.
 */
export const MENU_SLUG_SHAPE = /^[a-z0-9]+(-[a-z0-9]+)*$/
export const MENU_SLUG_MAX_LENGTH = 60

export function isMenuSlug(value: string): boolean {
  return value.length <= MENU_SLUG_MAX_LENGTH && MENU_SLUG_SHAPE.test(value)
}

/**
 * What the reader may return, and nothing else.
 *
 * The receipt has a tripwire for names; this is its counterpart. The page
 * renders only these keys, so a function that one day returned more — an id, a
 * discount, a cost price — would be publishing it without anybody noticing.
 * Throwing turns that into a visible failure of the page instead.
 */
const ALLOWED_KEYS = new Set([
  'outlet',
  'name',
  'slug',
  'sections',
  'items',
  'description',
  'price_paise',
  'is_veg',
  'is_available',
  'review',
  'url',
  'percent',
])

export class MenuSaysTooMuch extends Error {
  constructor(key: string) {
    super(`the public menu carried an unexpected field: ${key}`)
    this.name = 'MenuSaysTooMuch'
  }
}

export function assertOnlyMenu(payload: unknown): void {
  const walk = (value: unknown): void => {
    if (Array.isArray(value)) {
      value.forEach(walk)
      return
    }
    if (value === null || typeof value !== 'object') return
    for (const [key, nested] of Object.entries(value)) {
      if (!ALLOWED_KEYS.has(key)) throw new MenuSaysTooMuch(key)
      walk(nested)
    }
  }
  walk(payload)
}

/**
 * One slug in, one menu out, or null.
 *
 * Null is every refusal ops makes — no such address, a closed outlet, an empty
 * menu — and the caller turns all of them into one "not found" page. A network
 * or credential failure throws instead, so a broken Worker is not reported to a
 * customer as a menu that does not exist.
 */
export async function readMenu(project: OpsProject, slug: string): Promise<PublicMenu | null> {
  const response = await fetch(`${project.url}/rest/v1/rpc/public_menu`, {
    method: 'POST',
    headers: {
      apikey: project.serviceRoleKey,
      Authorization: `Bearer ${project.serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ p_slug: slug }),
  })

  if (!response.ok) {
    throw new Error(`the ops menu reader answered ${response.status}`)
  }

  const payload: unknown = await response.json()
  if (payload === null) return null

  assertOnlyMenu(payload)
  return payload as PublicMenu
}
