import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import worker, { type Env } from '../src/index'
import {
  assertOnlyMenu,
  MenuPhotoMalformed,
  MenuSaysTooMuch,
  readMenu,
  type PublicMenu,
  type PublicMenuPhoto,
} from '../src/menu'
import { renderMenuPage } from '../src/menu-page'
import { parsePhotoPath, PHOTO_CACHE_CONTROL } from '../src/menu-photo'
import noPhotos from './fixtures/menu-no-photos.json'
import goldenWithReview from './fixtures/menu-no-photos.html?raw'
import goldenNoReview from './fixtures/menu-no-photos-no-review.html?raw'

/**
 * Dish photos (the-table-menu-shows-photos, child of ops' a-dish-can-show-its-photo):
 * the reader's `public_menu_v2` and its fallback, the photo route, and the page.
 *
 * The route is exercised through the Worker's own `fetch` with ops, storage and
 * the edge cache stubbed, so each refusal can be shown never to reach storage.
 */

const OPS = 'https://ops.example.supabase.co'
const KEY = 'service-role-key-for-tests'
const PROJECT = { url: OPS, serviceRoleKey: KEY }

const K1 = 'a'.repeat(64)
const K2 = '0123456789abcdef'.repeat(4)
const OUTLET = '7c0e1a52-0d3b-4c55-9a4e-1f2a3b4c5d6e'

const noPhotoMenu = (): PublicMenu => structuredClone(noPhotos) as PublicMenu

function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

const MISSING = () =>
  json({ code: 'PGRST202', message: 'Could not find the function public.public_menu_v2(p_slug)' }, 404)

/** A menu with photos in each aspect, a sold-out photographed dish, and one in Highlights. */
function photoMenu(): PublicMenu {
  const menu = noPhotoMenu()
  const photo = (key: string, format: PublicMenuPhoto['format'], aspect: PublicMenuPhoto['aspect']) => ({
    key,
    format,
    aspect,
  })
  menu.sections[0]!.items[0]!.photo = photo(K1, 'webp', '4:3') // Highlights
  menu.sections[1]!.items[0]!.photo = photo(K2, 'jpeg', '4:5')
  menu.sections[1]!.items[1]!.photo = photo('b'.repeat(64), 'webp', '1:1') // sold out
  menu.sections[1]!.items[2]!.photo = null
  return menu
}

describe('the reader', () => {
  const fetchMock = vi.fn<typeof fetch>()
  beforeEach(() => {
    fetchMock.mockReset()
    vi.stubGlobal('fetch', fetchMock)
  })
  afterEach(() => vi.unstubAllGlobals())

  it('reads public_menu_v2, photos and all', async () => {
    fetchMock.mockResolvedValueOnce(json(photoMenu()))
    const menu = await readMenu(PROJECT, 'kalyani-cafe')
    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [url, init] = fetchMock.mock.calls[0]!
    expect(url).toBe(`${OPS}/rest/v1/rpc/public_menu_v2`)
    expect(init?.body).toBe(JSON.stringify({ p_slug: 'kalyani-cafe' }))
    expect(menu?.sections[1]?.items[0]?.photo).toEqual({ key: K2, format: 'jpeg', aspect: '4:5' })
  })

  it('falls back to public_menu while ops has not published public_menu_v2', async () => {
    fetchMock.mockResolvedValueOnce(MISSING()).mockResolvedValueOnce(json(noPhotoMenu()))
    const menu = await readMenu(PROJECT, 'kalyani-cafe')
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      `${OPS}/rest/v1/rpc/public_menu_v2`,
      `${OPS}/rest/v1/rpc/public_menu`,
    ])
    expect(menu?.outlet.slug).toBe('kalyani-cafe')
    expect(menu?.sections.flatMap((s) => s.items).some((i) => i.photo)).toBe(false)
  })

  it('still answers null for a menu ops does not have, through either function', async () => {
    fetchMock.mockResolvedValueOnce(json(null))
    expect(await readMenu(PROJECT, 'nowhere')).toBeNull()
    fetchMock.mockResolvedValueOnce(MISSING()).mockResolvedValueOnce(json(null))
    expect(await readMenu(PROJECT, 'nowhere')).toBeNull()
  })

  it('throws on any other failure, without falling back', async () => {
    fetchMock.mockResolvedValueOnce(json({ code: '42501', message: 'permission denied' }, 401))
    await expect(readMenu(PROJECT, 'kalyani-cafe')).rejects.toThrow('answered 401')
    fetchMock.mockResolvedValueOnce(json({ code: 'PGRST000' }, 404))
    await expect(readMenu(PROJECT, 'kalyani-cafe')).rejects.toThrow('answered 404')
    fetchMock.mockResolvedValueOnce(new Response('upstream', { status: 503 }))
    await expect(readMenu(PROJECT, 'kalyani-cafe')).rejects.toThrow('answered 503')
    expect(fetchMock).toHaveBeenCalledTimes(3)
  })

  it('refuses a photo of the wrong shape', async () => {
    const good = { key: K1, format: 'webp', aspect: '4:3' }
    for (const photo of [
      { ...good, key: K1.toUpperCase() },
      { ...good, key: K1.slice(1) },
      { ...good, key: `${K1.slice(1)}g` },
      { ...good, format: 'jpg' },
      { ...good, format: 'png' },
      { ...good, aspect: '16:9' },
      { key: K1, format: 'webp' },
      'https://elsewhere.example/photo.webp',
      [good],
    ]) {
      const menu = noPhotoMenu() as unknown as { sections: { items: Record<string, unknown>[] }[] }
      menu.sections[1]!.items[0]!.photo = photo
      expect(() => assertOnlyMenu(menu), JSON.stringify(photo)).toThrow(MenuPhotoMalformed)
      fetchMock.mockResolvedValueOnce(json(menu))
      await expect(readMenu(PROJECT, 'kalyani-cafe')).rejects.toThrow(MenuPhotoMalformed)
    }
  })

  it('refuses a photo that says more than its address, and any field it does not know', () => {
    const withOriginal = photoMenu() as unknown as { sections: { items: Record<string, unknown>[] }[] }
    withOriginal.sections[0]!.items[0]!.photo = { key: K1, format: 'webp', aspect: '4:3', source_key: K2 }
    expect(() => assertOnlyMenu(withOriginal)).toThrow(MenuSaysTooMuch)

    // A photo's own keys are allowed inside a photo, and nowhere else.
    const stray = photoMenu() as unknown as { sections: { items: Record<string, unknown>[] }[] }
    stray.sections[1]!.items[2]!.key = K1
    expect(() => assertOnlyMenu(stray)).toThrow(MenuSaysTooMuch)

    const leaky = photoMenu() as unknown as { sections: { items: Record<string, unknown>[] }[] }
    leaky.sections[1]!.items[0]!.cost_paise = 9000
    expect(() => assertOnlyMenu(leaky)).toThrow(MenuSaysTooMuch)

    expect(() => assertOnlyMenu(photoMenu())).not.toThrow()
  })
})

describe('the photo route', () => {
  const fetchMock = vi.fn<typeof fetch>()
  const store = new Map<string, Response>()
  const cache = {
    match: vi.fn(async (request: Request) => store.get(request.url)?.clone()),
    put: vi.fn(async (request: Request, response: Response) => {
      store.set(request.url, response)
    }),
  }
  const env: Env = { OPS_SUPABASE_URL: OPS, OPS_SERVICE_ROLE_KEY: KEY }
  const get = (path: string) => worker.fetch(new Request(`https://shawarmania.in${path}`), env)
  const BYTES = new Uint8Array([82, 73, 70, 70, 1, 2, 3, 4])
  const storageCalls = () =>
    fetchMock.mock.calls.filter(([url]) => String(url).includes('/storage/v1/'))

  /** Ops names the photo; storage holds it. */
  function opsHas(answer: unknown, storage: Response = new Response(BYTES)) {
    fetchMock.mockImplementation(async (input) => {
      const url = String(input)
      if (url.endsWith('/rest/v1/rpc/public_menu_photo')) {
        return typeof answer === 'function' ? (answer as () => Response)() : json(answer)
      }
      if (url.includes('/storage/v1/object/menu-photos/')) return storage.clone()
      throw new Error(`unexpected fetch ${url}`)
    })
  }

  beforeEach(() => {
    fetchMock.mockReset()
    store.clear()
    cache.match.mockClear()
    cache.put.mockClear()
    vi.stubGlobal('fetch', fetchMock)
    vi.stubGlobal('caches', { default: cache })
    vi.spyOn(console, 'error').mockImplementation(() => {})
  })
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.restoreAllMocks()
  })

  it('serves the large photo from storage, immutable for a year, and keeps it at the edge', async () => {
    opsHas({ object: `${OUTLET}/${K1}`, format: 'webp' })
    const response = await get(`/menu/kalyani-cafe/photo/${K1}.webp`)

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/webp')
    expect(response.headers.get('Cache-Control')).toBe('public, max-age=31536000, immutable')
    expect(PHOTO_CACHE_CONTROL).toBe('public, max-age=31536000, immutable')
    expect(new Uint8Array(await response.arrayBuffer())).toEqual(BYTES)

    const [rpc, storage] = fetchMock.mock.calls
    expect(rpc?.[0]).toBe(`${OPS}/rest/v1/rpc/public_menu_photo`)
    expect(rpc?.[1]?.body).toBe(JSON.stringify({ p_slug: 'kalyani-cafe', p_key: K1 }))
    expect(storage?.[0]).toBe(`${OPS}/storage/v1/object/menu-photos/${OUTLET}/${K1}.webp`)
    expect(storage?.[1]?.headers).toEqual({ apikey: KEY, Authorization: `Bearer ${KEY}` })

    expect(cache.put).toHaveBeenCalledTimes(1)
    expect(cache.put.mock.calls[0]![0].url).toBe(`https://shawarmania.in/menu/kalyani-cafe/photo/${K1}.webp`)
  })

  it('serves the thumbnail from its own -sm file, as JPEG when the photo is JPEG', async () => {
    opsHas({ object: `${OUTLET}/${K2}`, format: 'jpeg' })
    const response = await get(`/menu/kalyani-cafe/photo/${K2}-sm.jpeg`)
    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/jpeg')
    expect(storageCalls()[0]?.[0]).toBe(`${OPS}/storage/v1/object/menu-photos/${OUTLET}/${K2}-sm.jpeg`)
  })

  it('serves the second customer from the edge, without asking ops', async () => {
    opsHas({ object: `${OUTLET}/${K1}`, format: 'webp' })
    await get(`/menu/kalyani-cafe/photo/${K1}.webp`)
    fetchMock.mockClear()

    const again = await get(`/menu/kalyani-cafe/photo/${K1}.webp`)
    expect(again.status).toBe(200)
    expect(again.headers.get('Content-Type')).toBe('image/webp')
    expect(new Uint8Array(await again.arrayBuffer())).toEqual(BYTES)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('keeps one copy per address, whatever query string is added', async () => {
    opsHas({ object: `${OUTLET}/${K1}`, format: 'webp' })
    await get(`/menu/kalyani-cafe/photo/${K1}.webp?v=1`)
    fetchMock.mockClear()
    await get(`/menu/kalyani-cafe/photo/${K1}.webp?v=2`)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('refuses an address of the wrong shape without calling ops', async () => {
    for (const path of [
      `/menu/kalyani-cafe/photo/${K1.toUpperCase()}.webp`,
      `/menu/kalyani-cafe/photo/${K1.slice(1)}.webp`,
      `/menu/kalyani-cafe/photo/${K1}0.webp`,
      `/menu/kalyani-cafe/photo/${K1}.jpg`,
      `/menu/kalyani-cafe/photo/${K1}.png`,
      `/menu/kalyani-cafe/photo/${K1}.WEBP`,
      `/menu/kalyani-cafe/photo/${K1}-src.webp`,
      `/menu/kalyani-cafe/photo/${K1}-sm-sm.webp`,
      `/menu/kalyani-cafe/photo/${K1}`,
      `/menu/kalyani-cafe/photo/../${K1}.webp`,
      `/menu/Kalyani-Cafe/photo/${K1}.webp`,
      `/menu/kalyani--cafe/photo/${K1}.webp`,
      `/menu/_/photo/${K1}.webp`,
      `/menu/kalyani-cafe/photo/${K1}.webp/`,
      `/menu/kalyani-cafe/photos/${K1}.webp`,
    ]) {
      const response = await get(path)
      expect(response.status, path).toBe(404)
    }
    expect(fetchMock).not.toHaveBeenCalled()
    expect(parsePhotoPath('kalyani-cafe', `${K1}-sm.jpeg`)).toEqual({
      slug: 'kalyani-cafe',
      key: K1,
      thumbnail: true,
      format: 'jpeg',
    })
  })

  it('refuses whatever ops refuses, and never reaches storage for it', async () => {
    const refusals: [string, unknown][] = [
      // Unknown outlet, replaced key, a kept original's key, removed dish, gate off: all null.
      ['null', null],
      ['a format other than the address names', { object: `${OUTLET}/${K1}`, format: 'jpeg' }],
      ['an object for another key', { object: `${OUTLET}/${K2}`, format: 'webp' }],
      ['an object of the wrong shape', { object: `../${K1}`, format: 'webp' }],
      ['public_menu_photo not published yet', MISSING],
    ]
    for (const [why, answer] of refusals) {
      fetchMock.mockReset()
      opsHas(answer)
      const response = await get(`/menu/kalyani-cafe/photo/${K1}.webp`)
      expect(response.status, why).toBe(404)
      expect(response.headers.get('Cache-Control'), why).toBe('no-store')
      expect(storageCalls(), why).toHaveLength(0)
    }
    expect(cache.put).not.toHaveBeenCalled()
  })

  it('answers 502 when ops itself fails, again without reaching storage', async () => {
    opsHas(() => new Response('down', { status: 500 }))
    const response = await get(`/menu/kalyani-cafe/photo/${K1}.webp`)
    expect(response.status).toBe(502)
    expect(storageCalls()).toHaveLength(0)
    expect(cache.put).not.toHaveBeenCalled()
  })

  it('treats a file missing from storage as not found and a failing store as a bad gateway, naming no key', async () => {
    for (const [status, expected] of [
      [400, 404],
      [404, 404],
      [500, 502],
      [403, 502],
    ] as const) {
      fetchMock.mockReset()
      opsHas({ object: `${OUTLET}/${K1}`, format: 'webp' }, json({ error: 'x' }, status))
      const response = await get(`/menu/kalyani-cafe/photo/${K1}.webp`)
      expect(response.status, String(status)).toBe(expected)
      const body = await response.text()
      expect(body).not.toContain(K1)
      expect(body).not.toContain(OUTLET)
    }
    expect(cache.put).not.toHaveBeenCalled()
  })
})

describe('the page', () => {
  it('is, for a menu with no photos, byte for byte the page before photos', () => {
    // The goldens are what the renderer produced for this menu before this
    // change: a menu with no photo, from public_menu (no field) or from
    // public_menu_v2 (null on every dish), must still produce them exactly.
    const absent = noPhotoMenu()
    const nulls = noPhotoMenu()
    for (const section of nulls.sections) for (const item of section.items) item.photo = null

    for (const menu of [absent, nulls]) {
      expect(renderMenuPage(menu)).toBe(goldenWithReview)
      expect(renderMenuPage({ ...menu, review: null })).toBe(goldenNoReview)
    }
    expect(goldenWithReview).not.toMatch(/has-photo|viewer|thumb/)
  })

  it('floats a thumbnail before the line of a photographed dish, linking its large photo', () => {
    const html = renderMenuPage(photoMenu())
    const row = html.match(/<li class="dish has-photo">\n<button[^]*?<\/li>/g) ?? []
    const jpeg = row.find((r) => r.includes(K2)) ?? ''
    expect(jpeg).toContain(
      `<button type="button" class="thumb" data-full="/menu/kalyani-cafe/photo/${K2}.jpeg" data-aspect="4:5" aria-label="See a photo of Peri Peri Chicken Shawarma">`,
    )
    expect(jpeg).toContain(
      `<img src="/menu/kalyani-cafe/photo/${K2}-sm.jpeg" alt="" loading="lazy" decoding="async" width="400" height="400">`,
    )
    expect(jpeg).toContain('<span class="expand" aria-hidden="true"><svg viewBox="0 0 16 16">')
    // The float first, then the name and price on their line, then the description.
    expect(jpeg.indexOf('class="thumb"')).toBeLessThan(jpeg.indexOf('<div class="line">'))
    expect(jpeg.indexOf('<div class="line">')).toBeLessThan(jpeg.indexOf('<p class="desc">'))
  })

  it('leaves a dish with no photo as it was, beside photographed ones', () => {
    const html = renderMenuPage(photoMenu())
    expect(html).toContain(
      '<li class="dish">\n<div class="line"><h3><span class="diet veg" role="img" aria-label="Vegetarian" title="Vegetarian"></span>Paneer Shawarma',
    )
    expect(html.match(/class="thumb"/g)).toHaveLength(3)
  })

  it('keeps a sold-out dish’s photo, greyed, beside Unavailable', () => {
    const html = renderMenuPage(photoMenu())
    const row = html.match(/<li class="dish off has-photo">[^]*?<\/li>/)?.[0] ?? ''
    expect(row).toContain(`/menu/kalyani-cafe/photo/${'b'.repeat(64)}-sm.webp`)
    expect(row).toContain('<span class="unavailable">Unavailable</span>')
    expect(html).toContain('.dish.off .thumb img { filter: grayscale(1) brightness(0.6); }')
  })

  it('shows Highlights in the same rows as every section', () => {
    const html = renderMenuPage(photoMenu())
    const highlights = html.match(/<section class="course" id="highlights"[^]*?<\/section>/)?.[0] ?? ''
    expect(highlights).toContain('<ul class="dishes">\n<li class="dish has-photo">\n<button type="button" class="thumb"')
    expect(highlights).toContain(`data-aspect="4:3"`)
    expect(highlights).not.toMatch(/scroll|carousel|overflow/)
  })

  it('carries the large view once, after the menu, only when there is a photo', () => {
    const html = renderMenuPage(photoMenu())
    expect(html.match(/<div class="viewer" id="viewer" role="dialog" aria-modal="true" aria-label="Dish photo" hidden>/g)).toHaveLength(1)
    expect(html.match(/var v = document.getElementById\('viewer'\)/g)).toHaveLength(1)
    expect(html.indexOf('id="viewer"')).toBeGreaterThan(html.indexOf('</main>'))
    expect(html).toContain('.dish.has-photo { display: flow-root; }')

    const one = noPhotoMenu()
    one.sections[2]!.items[0]!.photo = { key: K1, format: 'webp', aspect: '1:1' }
    expect(renderMenuPage(one)).toContain('id="viewer"')
  })

  it('sizes the large view by the photo’s shape and caps its height', () => {
    const html = renderMenuPage(photoMenu())
    expect(html).toContain("var RATIOS = { '4:3': 4 / 3, '1:1': 1, '4:5': 4 / 5 };")
    expect(html).toContain('width: min(100%, 34rem, calc(62dvh * var(--ar, 1.3333)));')
    expect(html).toContain('aspect-ratio: var(--ar, 1.3333);')
  })

  it('closes on Back through its own history entry, and honours reduced motion', () => {
    const html = renderMenuPage(photoMenu())
    const script = html.slice(html.lastIndexOf('<script>'))
    expect(script).toContain("history.pushState({ dishPhoto: true }, '')")
    expect(script).toContain("window.addEventListener('popstate'")
    expect(script).toContain("event.key === 'Escape'")
    expect(script).toContain("matchMedia('(prefers-reduced-motion: reduce)')")
    expect(script).not.toContain('__name')
  })

  it('escapes the dish name in the photo’s label', () => {
    const menu = photoMenu()
    menu.sections[1]!.items[2]!.photo = { key: K1, format: 'webp', aspect: '4:3' }
    const html = renderMenuPage(menu)
    expect(html).toContain('aria-label="See a photo of Paneer Shawarma &lt;Spicy&gt; &amp; &quot;Loaded&quot;"')
  })
})
