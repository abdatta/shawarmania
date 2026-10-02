/**
 * Which receipt request is which, decided from the URL alone.
 *
 * A pure function, so every claim the routing makes is a unit test rather than
 * something only a running `wrangler dev` could show. It never looks anything
 * up: a route says what was asked for, and `index.ts` decides what to answer.
 *
 * **The receipt's address is `/bill?t=<token>`** (ops #66,
 * a-receipt-link-fits-an-sms). The link goes out by SMS, and an Indian SMS's
 * link is validated against a URL the sender registered on DLT. A per-bill link
 * can only be registered as a *dynamic* URL, fixed up to and including its `?`,
 * so the token has to be what follows it: `https://shawarmania.in/bill?` is
 * registered, and only `t=<token>` varies.
 *
 *   GET /bill?t=<token>        the page (`&view=counter` for the counter's view)
 *   GET /bill/<token>.pdf      the same receipt, 80 mm; reached only from the
 *                              page, never from a message, so DLT has no say in it
 *   GET /bill/logo.png         the brand mark
 *   GET /bill/fonts/*.woff2    the brand faces
 *   GET /bill/<token>          301 to `/bill?t=<token>`, keeping `view`
 *
 * **The redirect is for the release, not for old links.** No customer was ever
 * sent a `/bill/<token>` link. But the ops app hands that shape out until its own
 * deploy lands, and the counter's View receipt frames it, so this Worker ships
 * first and answers both. It redirects before any lookup, so it says nothing
 * about whether a bill exists.
 */

/**
 * A token is base64url and nothing else.
 *
 * Checked here so an obviously malformed request never becomes a request to the
 * database — which is the cheap half of not letting a flood of invalid tokens
 * cost anything. The length is deliberately a floor and a generous ceiling
 * rather than exactly ten: the ops schema puts no length constraint on the
 * column precisely so a longer token can be minted later, and a Worker that
 * hard-coded ten would silently refuse every new link on the day that happens.
 */
const TOKEN_SHAPE = /^[A-Za-z0-9_-]{8,64}$/

export type ReceiptAsset = 'logo' | 'lilita' | 'nunito'

export type ReceiptRoute =
  | { kind: 'page'; token: string }
  | { kind: 'pdf'; token: string }
  | { kind: 'asset'; asset: ReceiptAsset }
  | { kind: 'redirect'; location: string }
  | { kind: 'refuse' }

// A Map, not an object literal: `ASSETS['constructor']` on an object finds the
// prototype's, and `/bill/constructor` would be served a font.
const ASSETS = new Map<string, ReceiptAsset>([
  ['logo.png', 'logo'],
  ['fonts/lilita-one.woff2', 'lilita'],
  ['fonts/nunito-sans.woff2', 'nunito'],
])

/**
 * The paths this Worker answers: `/bill` exactly, and anything under `/bill/`.
 *
 * Not a prefix match on `/bill`, which would take `/billing` or `/bills` from the
 * static site. The Cloudflare routes are the same two patterns; under
 * `wrangler dev`, which has no routes, this is the only boundary.
 */
export function isReceiptPath(pathname: string): boolean {
  return pathname === '/bill' || pathname.startsWith('/bill/')
}

export function routeReceipt(url: URL): ReceiptRoute {
  if (url.pathname === '/bill') {
    // Exactly one `t`. Two is not "take the first": a link that has been
    // tampered with is refused like any other that does not resolve.
    const [token, ...more] = url.searchParams.getAll('t')
    if (token === undefined || more.length > 0 || !TOKEN_SHAPE.test(token)) {
      return { kind: 'refuse' }
    }
    return { kind: 'page', token }
  }

  const rest = url.pathname.slice('/bill/'.length)

  const asset = ASSETS.get(rest)
  if (asset) return { kind: 'asset', asset }

  if (rest.endsWith('.pdf')) {
    const token = rest.slice(0, -'.pdf'.length)
    return TOKEN_SHAPE.test(token) ? { kind: 'pdf', token } : { kind: 'refuse' }
  }

  if (!TOKEN_SHAPE.test(rest)) return { kind: 'refuse' }

  // The token from the path comes first and is the only `t`; whatever else the
  // old link carried (the counter's `view`) follows it.
  const search = new URLSearchParams({ t: rest })
  for (const [key, value] of url.searchParams) {
    if (key !== 't') search.append(key, value)
  }
  return { kind: 'redirect', location: `${url.origin}/bill?${search}` }
}
