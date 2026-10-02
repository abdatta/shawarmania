import { describe, expect, it } from 'vitest'

import { isReceiptPath, routeReceipt } from '../src/route'

/**
 * Which receipt request is which, as a pure function of the URL
 * (ops #66, a-receipt-link-fits-an-sms).
 *
 * The receipt's address is `/bill?t=<token>`, because an SMS link is validated
 * against a dynamic URL registered on DLT up to its `?`, and only what follows
 * may vary. These are the claims the routing makes; that Cloudflare sends the
 * requests here at all is checked against `wrangler dev` and the live route.
 */

const at = (path: string) => routeReceipt(new URL(`https://shawarmania.in${path}`))

describe('the receipt address', () => {
  it('serves the page at /bill?t=<token>', () => {
    expect(at('/bill?t=Ab3-_x9QzT')).toEqual({ kind: 'page', token: 'Ab3-_x9QzT' })
  })

  it('serves the counter view from the same address, the view left to the page', () => {
    expect(at('/bill?t=Ab3-_x9QzT&view=counter')).toEqual({ kind: 'page', token: 'Ab3-_x9QzT' })
    expect(at('/bill?view=counter&t=Ab3-_x9QzT')).toEqual({ kind: 'page', token: 'Ab3-_x9QzT' })
  })

  it('takes a longer token, because ops may mint one', () => {
    expect(at('/bill?t=Ab3-_x9QzTk2Lm')).toEqual({ kind: 'page', token: 'Ab3-_x9QzTk2Lm' })
  })
})

describe('the PDF and the assets keep their addresses', () => {
  it('serves the PDF at /bill/<token>.pdf', () => {
    expect(at('/bill/Ab3-_x9QzT.pdf')).toEqual({ kind: 'pdf', token: 'Ab3-_x9QzT' })
  })

  it('serves the brand mark and both faces', () => {
    expect(at('/bill/logo.png')).toEqual({ kind: 'asset', asset: 'logo' })
    expect(at('/bill/fonts/lilita-one.woff2')).toEqual({ kind: 'asset', asset: 'lilita' })
    expect(at('/bill/fonts/nunito-sans.woff2')).toEqual({ kind: 'asset', asset: 'nunito' })
  })
})

describe('a link in the old shape', () => {
  /*
   * No customer holds one. It is redirected for the release: the live ops app
   * hands out `/bill/<token>` until its own deploy lands, and the counter's View
   * receipt frames that address meanwhile.
   */
  it('redirects to the new address', () => {
    expect(at('/bill/Ab3-_x9QzT')).toEqual({
      kind: 'redirect',
      location: 'https://shawarmania.in/bill?t=Ab3-_x9QzT',
    })
  })

  it('keeps the counter view across the redirect', () => {
    expect(at('/bill/Ab3-_x9QzT?view=counter')).toEqual({
      kind: 'redirect',
      location: 'https://shawarmania.in/bill?t=Ab3-_x9QzT&view=counter',
    })
  })

  it('takes the token from the path, never from a stray t beside it', () => {
    expect(at('/bill/Ab3-_x9QzT?t=Zz9_-kQ0aB')).toEqual({
      kind: 'redirect',
      location: 'https://shawarmania.in/bill?t=Ab3-_x9QzT',
    })
  })

  it('reads a token that happens to spell an object property as a token', () => {
    expect(at('/bill/constructor').kind).toBe('redirect')
    expect(at('/bill/__proto__').kind).toBe('redirect')
  })

  it('redirects without asking whether the bill exists, so the redirect says nothing', () => {
    // A pure function of the URL cannot have looked; the route type has no
    // lookup in it. An unknown token redirects and is refused at the new address.
    expect(at('/bill/NoSuchBill0').kind).toBe('redirect')
  })
})

describe('every refusal is one refusal', () => {
  it.each([
    ['no t', '/bill'],
    ['an empty t', '/bill?t='],
    ['two t parameters', '/bill?t=Ab3-_x9QzT&t=Zz9_-kQ0aB'],
    ['a token too short', '/bill?t=Ab3'],
    ['a token with a character base64url lacks', '/bill?t=Ab3-_x9Qz%2B'],
    ['a demo token', '/bill?t=demo~26'],
    ['the slash form with nothing after it', '/bill/'],
    ['the slash form with a query token and no path one', '/bill/?t=Ab3-_x9QzT'],
    ['a malformed old-shape token', '/bill/demo~26'],
    ['a malformed PDF token', '/bill/demo~26.pdf'],
    ['a deeper path', '/bill/Ab3-_x9QzT/extra'],
  ])('refuses %s', (_case, path) => {
    expect(at(path)).toEqual({ kind: 'refuse' })
  })
})

describe('what is not a receipt request at all', () => {
  it('owns /bill and /bill/… and nothing else', () => {
    expect(isReceiptPath('/bill')).toBe(true)
    expect(isReceiptPath('/bill/Ab3-_x9QzT.pdf')).toBe(true)
    expect(isReceiptPath('/billing')).toBe(false)
    expect(isReceiptPath('/bills')).toBe(false)
    expect(isReceiptPath('/')).toBe(false)
    expect(isReceiptPath('/menu/kalyani-cafe/')).toBe(false)
  })
})
