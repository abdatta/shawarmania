import {
  decodeBase64,
  LILITA_WOFF2_BASE64,
  LOGO_PNG_BASE64,
  NUNITO_WOFF2_BASE64,
} from './assets.generated'
import { renderRefusal, renderReceiptPage } from './page'
import { pdfFilename, renderReceiptPdf } from './pdf'
import { readReceipt, type Receipt } from './receipt'

/**
 * `shawarmania.in/bill/*` — the customer's receipt, and nothing else.
 *
 * Every other path falls through to GitHub Pages exactly as before. This Worker
 * exists because Pages cannot do three things a receipt needs: set a response
 * header, return a real `application/pdf` for a generated document, and rate
 * limit. The PDF one is the load-bearing reason — these links are opened inside
 * WhatsApp's in-app browser on Android, where a `blob:` download fails silently,
 * so the download has to be an ordinary navigation to a real URL.
 *
 * Routes:
 *
 *   GET /bill/<token>       the themed page
 *   GET /bill/<token>.pdf   the same receipt, 80 mm, on demand, never stored
 *   GET /bill/logo.png      the brand mark, from the Worker's own bundle
 *   GET /bill/fonts/*.woff2 the brand faces, same
 *
 * **Every refusal is one refusal.** Unknown, malformed, revoked,
 * endpoint-disabled and rate-limited all answer with the same page and the same
 * status, so a caller learns nothing about which case occurred and nothing about
 * whether any bill exists.
 */

export interface Env {
  /** The ops Supabase project. Public. */
  OPS_SUPABASE_URL: string
  /**
   * The ops project's service-role key, held as a **Worker secret**.
   *
   * Never in this repo, never in `wrangler.toml`, never in the Vite bundle, and
   * never reachable by a browser. It exists so the Worker can call one function
   * that returns one receipt; that function accepts no argument that widens it,
   * so the blast radius is bounded by the function rather than by the key.
   */
  OPS_SERVICE_ROLE_KEY: string
  /** Optional per-minute ceiling per client. Defaults below. */
  RECEIPT_RATE_PER_MINUTE?: string
  /** Optional per-minute ceiling for the whole endpoint. Defaults below. */
  RECEIPT_GLOBAL_PER_MINUTE?: string
}

/**
 * A token is base64url and nothing else.
 *
 * Checked here so an obviously malformed path never becomes a request to the
 * database — which is the cheap half of not letting a flood of invalid tokens
 * cost anything. The length is deliberately a floor and a generous ceiling
 * rather than exactly ten: the ops schema puts no length constraint on the
 * column precisely so a longer token can be minted later, and a Worker that
 * hard-coded ten would silently refuse every new link on the day that happens.
 */
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{8,64}$/

const DEFAULT_PER_CLIENT_PER_MINUTE = 30
const DEFAULT_GLOBAL_PER_MINUTE = 600

/**
 * Cache TTL, in minutes.
 *
 * A bill is **not** immutable — a void or a tender correction changes what the
 * receipt must say — so a long TTL would serve a valid-looking receipt for a
 * bill cancelled minutes ago. Two minutes still captures nearly all the benefit,
 * because the download tap arrives seconds after the page load and that is the
 * repeat hit worth eliminating.
 */
const CACHE_SECONDS = 120

/**
 * The counters, per isolate.
 *
 * Deliberately in memory rather than in a Durable Object or KV. This is a
 * ceiling on *cost and noise*, not a security boundary — the security of the
 * scheme is the token's entropy and the fact that the page names nobody, and the
 * arithmetic in the ops repo's `docs/SECURITY_AND_PRIVACY.md` assumes an
 * attacker who is spreading requests across many addresses anyway. Per-isolate
 * counters cost nothing, add no latency and no state to operate, and bite hard
 * on the single-client flood they exist for. A Durable Object would be the next
 * step if the access record ever shows a distributed harvest.
 */
interface Window {
  minute: number
  count: number
}
const perClient = new Map<string, Window>()
let global: Window = { minute: 0, count: 0 }

function overLimit(window: Window, minute: number, ceiling: number): boolean {
  if (window.minute !== minute) {
    window.minute = minute
    window.count = 0
  }
  window.count += 1
  return window.count > ceiling
}

function rateLimited(request: Request, env: Env): boolean {
  const minute = Math.floor(Date.now() / 60_000)
  const client = request.headers.get('cf-connecting-ip') ?? 'unknown'

  const clientCeiling = Number(env.RECEIPT_RATE_PER_MINUTE) || DEFAULT_PER_CLIENT_PER_MINUTE
  const globalCeiling = Number(env.RECEIPT_GLOBAL_PER_MINUTE) || DEFAULT_GLOBAL_PER_MINUTE

  if (overLimit(global, minute, globalCeiling)) return true

  // Bounded so the map itself cannot be turned into a memory attack.
  if (perClient.size > 10_000) perClient.clear()
  const window = perClient.get(client) ?? { minute, count: 0 }
  perClient.set(client, window)
  return overLimit(window, minute, clientCeiling)
}

/**
 * The headers every receipt response carries.
 *
 * `X-Robots-Tag` rather than a `Disallow` in `robots.txt`, and that is a
 * correction worth keeping: `robots.txt` stops the crawler *fetching* the page,
 * so it never reads the `noindex`, and a URL discovered through a link can still
 * be listed. The right combination is to allow the fetch and refuse the
 * indexing. `Referrer-Policy: no-referrer` keeps a token out of a `Referer`.
 */
function receiptHeaders(extra: Record<string, string> = {}): Headers {
  return new Headers({
    'X-Robots-Tag': 'noindex, nofollow',
    'Referrer-Policy': 'no-referrer',
    'X-Content-Type-Options': 'nosniff',
    ...extra,
  })
}

function refuse(): Response {
  return new Response(renderRefusal(), {
    status: 404,
    headers: receiptHeaders({
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-store',
    }),
  })
}

function asset(base64: string, contentType: string): Response {
  return new Response(decodeBase64(base64), {
    headers: receiptHeaders({
      'Content-Type': contentType,
      // Immutable: these change only when the Worker is redeployed.
      'Cache-Control': 'public, max-age=31536000, immutable',
    }),
  })
}

/**
 * The receipt payload, cached on the token for a couple of minutes.
 *
 * The **payload** is cached rather than the rendered page, so the page load and
 * the download tap that follows it seconds later share one database read while
 * still producing two correctly-typed responses.
 */
async function receiptFor(
  request: Request,
  env: Env,
  token: string,
): Promise<Receipt | null | 'unavailable'> {
  const cacheKey = new Request(`https://receipt.internal/${token}`, { method: 'GET' })
  const cache = caches.default

  const cached = await cache.match(cacheKey)
  if (cached) return (await cached.json()) as Receipt

  let receipt: Receipt | null
  try {
    receipt = await readReceipt(
      { url: env.OPS_SUPABASE_URL, serviceRoleKey: env.OPS_SERVICE_ROLE_KEY },
      token,
      {
        address: request.headers.get('cf-connecting-ip'),
        userAgent: request.headers.get('user-agent'),
      },
    )
  } catch (cause) {
    // A broken Worker or a rotated key is not an invalid token, and must not be
    // reported as one — a 404 here would send somebody to ask the outlet for a
    // new link that would fail identically.
    console.error('the ops receipt reader failed', cause)
    return 'unavailable'
  }

  if (receipt === null) return null

  await cache.put(
    cacheKey,
    new Response(JSON.stringify(receipt), {
      headers: { 'Cache-Control': `max-age=${CACHE_SECONDS}`, 'Content-Type': 'application/json' },
    }),
  )
  return receipt
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url)

    /*
     * Not ours.
     *
     * **Deliberately not proxied.** The route pattern is `shawarmania.in/bill/*`,
     * so in production this Worker is never invoked for another path and Pages
     * serves it without this code being involved at all. Forwarding with
     * `fetch(request)` looks like the polite thing to do and is a trap: under
     * `wrangler dev` there is no Pages origin behind the Worker, so the request
     * re-enters this same handler and hangs until it times out. Found by a health
     * check on `/` filling the log with 19-second 500s.
     */
    if (!url.pathname.startsWith('/bill/')) {
      return new Response('Not found', {
        status: 404,
        headers: receiptHeaders({ 'Content-Type': 'text/plain; charset=utf-8' }),
      })
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method not allowed', { status: 405, headers: receiptHeaders() })
    }

    const rest = url.pathname.slice('/bill/'.length)

    // The Worker's own assets, so nothing enters the Pages artifact and the page
    // makes every request to one origin.
    if (rest === 'logo.png') return asset(LOGO_PNG_BASE64, 'image/png')
    if (rest === 'fonts/lilita-one.woff2') return asset(LILITA_WOFF2_BASE64, 'font/woff2')
    if (rest === 'fonts/nunito-sans.woff2') return asset(NUNITO_WOFF2_BASE64, 'font/woff2')

    const wantsPdf = rest.endsWith('.pdf')
    const token = wantsPdf ? rest.slice(0, -'.pdf'.length) : rest

    if (!TOKEN_SHAPE.test(token)) return refuse()
    if (rateLimited(request, env)) return refuse()

    const receipt = await receiptFor(request, env, token)

    if (receipt === 'unavailable') {
      return new Response(renderRefusal(), {
        status: 503,
        headers: receiptHeaders({
          'Content-Type': 'text/html; charset=utf-8',
          'Cache-Control': 'no-store',
          'Retry-After': '60',
        }),
      })
    }

    if (receipt === null) return refuse()

    if (wantsPdf) {
      const pdf = await renderReceiptPdf(receipt)
      return new Response(pdf as BodyInit, {
        headers: receiptHeaders({
          'Content-Type': 'application/pdf',
          // `attachment` so the browser's own download machinery handles it,
          // which is the whole point of serving it from its own URL.
          'Content-Disposition': `attachment; filename="${pdfFilename(receipt)}"`,
          'Cache-Control': 'no-store',
        }),
      })
    }

    return new Response(renderReceiptPage(receipt, token), {
      headers: receiptHeaders({
        'Content-Type': 'text/html; charset=utf-8',
        // Not cached at the browser: a void or a correction must be visible on a
        // reload. The payload cache above is what keeps the database read cheap.
        'Cache-Control': 'no-store',
      }),
    })
  },
}
