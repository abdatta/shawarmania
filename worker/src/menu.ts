import type { OpsProject } from './receipt'

/**
 * An outlet's public menu, read from ops.
 *
 * `shawarmania.in/menu/<slug>/` is what the QR code on a table opens. The menu
 * lives in the ops database, which grants the anonymous role nothing, so — like
 * the receipt — something server-side has to hold a credential to read it. The
 * credential calls one function, `public_menu_v2(slug)`, which can return
 * nothing but a menu: section names and, per item, its name, description, price,
 * veg flag, whether it is available today (ops: the-menu-is-public) and its photo
 * (ops: a-dish-can-show-its-photo). Until ops publishes `public_menu_v2`, the
 * reader falls back to `public_menu(slug)`, the same menu with no photos.
 */
export interface PublicMenuItem {
  name: string
  description: string | null
  price_paise: number
  is_veg: boolean
  is_available: boolean
  /** Null, or absent from `public_menu`, for a dish with no photo or while ops' `dish-photos` gate is off. */
  photo?: PublicMenuPhoto | null
}

/**
 * A dish's photo, as ops names it. `key` is the SHA-256 of the large photo's and
 * the thumbnail's bytes, so an address never changes what it serves; `format` is
 * also the file's extension; `aspect` is the large photo's shape, chosen by the
 * manager in ops' cropper. The thumbnail is always square.
 */
export interface PublicMenuPhoto {
  key: string
  format: PhotoFormat
  aspect: PhotoAspect
}

export type PhotoFormat = 'webp' | 'jpeg'
export type PhotoAspect = '4:3' | '1:1' | '4:5'

export const PHOTO_KEY_SHAPE = /^[0-9a-f]{64}$/
export const PHOTO_FORMATS: readonly PhotoFormat[] = ['webp', 'jpeg']
export const PHOTO_ASPECTS: readonly PhotoAspect[] = ['4:3', '1:1', '4:5']

export function isPhotoFormat(value: unknown): value is PhotoFormat {
  return typeof value === 'string' && (PHOTO_FORMATS as readonly string[]).includes(value)
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
  /** False: the outlet keeps only the bottom banner, with no popup. Absent means true. */
  popup?: boolean
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
  'popup',
  'photo',
])

/** The only keys a photo carries; it never names the kept original or the framings. */
const PHOTO_KEYS = ['aspect', 'format', 'key']

export class MenuSaysTooMuch extends Error {
  constructor(key: string) {
    super(`the public menu carried an unexpected field: ${key}`)
    this.name = 'MenuSaysTooMuch'
  }
}

/**
 * A photo whose shape the page cannot trust. Its key and format become part of
 * an address on the page, so anything but the exact shape ops promises is
 * refused, like an unknown field, rather than shown or quietly dropped.
 */
export class MenuPhotoMalformed extends Error {
  constructor() {
    super('the public menu carried a photo of the wrong shape')
    this.name = 'MenuPhotoMalformed'
  }
}

export function assertPhoto(value: unknown): asserts value is PublicMenuPhoto | null {
  if (value === null) return
  if (typeof value !== 'object' || Array.isArray(value)) throw new MenuPhotoMalformed()
  const keys = Object.keys(value)
  for (const key of keys) if (!PHOTO_KEYS.includes(key)) throw new MenuSaysTooMuch(`photo.${key}`)
  const { key, format, aspect } = value as Record<string, unknown>
  if (
    keys.length !== PHOTO_KEYS.length ||
    typeof key !== 'string' ||
    !PHOTO_KEY_SHAPE.test(key) ||
    !isPhotoFormat(format) ||
    !(PHOTO_ASPECTS as readonly unknown[]).includes(aspect)
  ) {
    throw new MenuPhotoMalformed()
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
      if (key === 'photo') assertPhoto(nested)
      else walk(nested)
    }
  }
  walk(payload)
}

/**
 * Calls one ops function with the service-role key. `missing` is PostgREST
 * saying the function does not exist (404, `PGRST202`): an ops that has not
 * published it yet, which a caller may treat as an ordinary answer.
 */
export async function callOps(
  project: OpsProject,
  name: string,
  args: Record<string, string>,
): Promise<{ missing: true } | { missing: false; payload: unknown }> {
  const response = await fetch(`${project.url}/rest/v1/rpc/${name}`, {
    method: 'POST',
    headers: {
      apikey: project.serviceRoleKey,
      Authorization: `Bearer ${project.serviceRoleKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(args),
  })

  if (response.status === 404) {
    const body: unknown = await response.json().catch(() => null)
    if (body && typeof body === 'object' && (body as { code?: unknown }).code === 'PGRST202') {
      return { missing: true }
    }
  }
  if (!response.ok) {
    throw new Error(`the ops function ${name} answered ${response.status}`)
  }
  return { missing: false, payload: await response.json() }
}

/**
 * One slug in, one menu out, or null.
 *
 * Null is every refusal ops makes — no such address, a closed outlet, an empty
 * menu — and the caller turns all of them into one "not found" page. A network
 * or credential failure throws instead, so a broken Worker is not reported to a
 * customer as a menu that does not exist.
 *
 * `public_menu_v2` first; if ops reports it missing, `public_menu`, whose menu
 * has no photos. So this Worker can be released before or after ops publishes
 * the newer function (ops: a-dish-can-show-its-photo, release and version skew).
 */
export async function readMenu(project: OpsProject, slug: string): Promise<PublicMenu | null> {
  let answer = await callOps(project, 'public_menu_v2', { p_slug: slug })
  if (answer.missing) answer = await callOps(project, 'public_menu', { p_slug: slug })
  if (answer.missing) throw new Error('the ops menu reader is missing')

  const { payload } = answer
  if (payload === null) return null

  assertOnlyMenu(payload)
  return payload as PublicMenu
}
