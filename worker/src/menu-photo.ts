import { callOps, isMenuSlug, isPhotoFormat, PHOTO_KEY_SHAPE, type PhotoFormat } from './menu'
import type { OpsProject } from './receipt'

/**
 * `/menu/<slug>/photo/<key>.<format>` and `<key>-sm.<format>`: a dish's photo and
 * its square thumbnail (ops: a-dish-can-show-its-photo, D1 and D3).
 *
 * The files live in ops' private `menu-photos` bucket, which no browser can
 * read. This Worker already holds the service-role key for `public_menu`, so on
 * an edge-cache miss it asks ops which file the address names, fetches that
 * file with the key and keeps it at the edge for a year. A key is the hash of
 * what the customer sees, so the bytes behind an address never change and the
 * year is safe; a re-cropped photo is a new address.
 *
 * Every refusal is the same 404: an address of the wrong shape (never a call to
 * ops), an unknown outlet, a replaced or removed photo, the kept original's
 * key, ops' `dish-photos` gate off, and a file missing from storage.
 */

/** The photo part of the path: `<key>.<format>` or `<key>-sm.<format>`. */
const PHOTO_FILE_SHAPE = /^([0-9a-f]{64})(-sm)?\.([a-z]+)$/

export interface PhotoAddress {
  slug: string
  key: string
  thumbnail: boolean
  format: PhotoFormat
}

/**
 * The address a photo path names, or null for one that cannot be a photo.
 * Exact: lowercase only and no redirect, since the page only ever links the
 * canonical form.
 */
export function parsePhotoPath(slug: string, file: string): PhotoAddress | null {
  if (!isMenuSlug(slug)) return null
  const match = PHOTO_FILE_SHAPE.exec(file)
  if (!match) return null
  const [, key, sm, format] = match
  if (!key || !PHOTO_KEY_SHAPE.test(key) || !isPhotoFormat(format)) return null
  return { slug, key, thumbnail: sm === '-sm', format }
}

/** The page's address for a photo; the thumbnail when `thumbnail`. */
export function photoPath(slug: string, key: string, format: PhotoFormat, thumbnail = false): string {
  return `/menu/${slug}/photo/${key}${thumbnail ? '-sm' : ''}.${format}`
}

const CONTENT_TYPES: Record<PhotoFormat, string> = { webp: 'image/webp', jpeg: 'image/jpeg' }

/** What a photo is served with, from the edge cache or fresh. */
export const PHOTO_CACHE_CONTROL = 'public, max-age=31536000, immutable'

export function photoRefusal(status = 404): Response {
  return new Response(status === 404 ? 'Not found' : 'Bad gateway', {
    status,
    headers: new Headers({
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    }),
  })
}

/**
 * `public_menu_photo`'s answer, checked: the object's base name, `<outlet>/<key>`
 * for the key that was asked for, and its format.
 */
function storedPhoto(
  payload: unknown,
  key: string,
): { object: string; format: PhotoFormat } | null {
  if (payload === null || typeof payload !== 'object') return null
  const { object, format } = payload as Record<string, unknown>
  if (typeof object !== 'string' || !/^[0-9a-f-]{36}\/[0-9a-f]{64}$/.test(object)) return null
  if (!object.endsWith(`/${key}`)) return null
  if (!isPhotoFormat(format)) return null
  return { object, format }
}

/**
 * Serves one photo address. `cache` is the edge cache (`caches.default` in the
 * Worker), `cacheUrl` the address it is kept under.
 */
export async function servePhoto(
  project: OpsProject,
  address: PhotoAddress,
  cache: Pick<Cache, 'match' | 'put'>,
  cacheUrl: string,
): Promise<Response> {
  const cacheKey = new Request(cacheUrl, { method: 'GET' })
  const cached = await cache.match(cacheKey)
  if (cached) return cached

  let stored: { object: string; format: PhotoFormat } | null
  try {
    const answer = await callOps(project, 'public_menu_photo', {
      p_slug: address.slug,
      p_key: address.key,
    })
    // An ops that has not published the function has no photos to serve.
    stored = answer.missing ? null : storedPhoto(answer.payload, address.key)
  } catch (cause) {
    console.error('the ops photo reader failed', cause)
    return photoRefusal(502)
  }

  // The format is part of the address: `<key>.jpeg` for a WebP photo is not it.
  if (stored === null || stored.format !== address.format) return photoRefusal()

  const name = `${stored.object}${address.thumbnail ? '-sm' : ''}.${stored.format}`
  let file: Response
  try {
    file = await fetch(`${project.url}/storage/v1/object/menu-photos/${name}`, {
      headers: {
        apikey: project.serviceRoleKey,
        Authorization: `Bearer ${project.serviceRoleKey}`,
      },
    })
  } catch (cause) {
    console.error('the ops photo store could not be reached', cause)
    return photoRefusal(502)
  }

  if (!file.ok) {
    // Supabase answers a missing object with 400 or 404; either is a photo
    // that is not there. Anything else is the store failing, not the photo.
    console.error(`the ops photo store answered ${file.status}`)
    return photoRefusal(file.status === 400 || file.status === 404 ? 404 : 502)
  }

  const bytes = await file.arrayBuffer()
  const headers = {
    'Content-Type': CONTENT_TYPES[stored.format],
    'Cache-Control': PHOTO_CACHE_CONTROL,
    'X-Content-Type-Options': 'nosniff',
  }
  await cache.put(cacheKey, new Response(bytes, { headers }))
  return new Response(bytes, { headers })
}
