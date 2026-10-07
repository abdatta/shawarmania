import { describe, expect, it } from 'vitest'

import { assertOnlyMenu, isMenuSlug, MenuSaysTooMuch, type PublicMenu } from '../src/menu'
import {
  formatRupees,
  renderMenuNotFound,
  renderMenuPage,
  renderMenuUnavailable,
  REVIEW_POPUP_SECONDS,
  sectionIds,
} from '../src/menu-page'

/**
 * The claims worth asserting about the table menu are pure functions over one
 * payload, as the receipt's are: what the page prints, what it must never
 * print, and what the reader may accept. Routing, redirects and the cache are
 * exercised against `wrangler dev`, where they are real.
 */
function aMenu(overrides: Partial<PublicMenu> = {}): PublicMenu {
  return {
    outlet: { name: 'Kalyani Cafe', slug: 'kalyani-cafe' },
    sections: [
      {
        name: 'Shawarmas',
        items: [
          {
            name: 'Peri Peri Chicken Shawarma',
            description: 'Our signature chicken shawarma with a fiery peri peri finish.',
            price_paise: 14500,
            is_veg: false,
            is_available: true,
          },
          {
            name: 'Mayonnaise Chicken Shawarma',
            description: null,
            price_paise: 15500,
            is_veg: false,
            is_available: false,
          },
        ],
      },
      {
        name: 'Tea & Coffee',
        items: [
          {
            name: 'Milk Tea',
            description: 'A comforting classic.',
            price_paise: 4000,
            is_veg: true,
            is_available: true,
          },
        ],
      },
    ],
    ...overrides,
  }
}

describe('the reader', () => {
  it('accepts a menu and nothing more', () => {
    expect(() => assertOnlyMenu(aMenu())).not.toThrow()
  })

  it('fails loudly on a field the page was never meant to publish', () => {
    const leaky = aMenu() as unknown as { sections: { items: Record<string, unknown>[] }[] }
    leaky.sections[0]!.items[0]!.cost_paise = 9000
    expect(() => assertOnlyMenu(leaky)).toThrow(MenuSaysTooMuch)
  })

  it('knows the shape ops enforces on an address', () => {
    expect(isMenuSlug('kalyani-cafe')).toBe(true)
    expect(isMenuSlug('kalyani2')).toBe(true)
    expect(isMenuSlug('Kalyani-Cafe')).toBe(false)
    expect(isMenuSlug('kalyani--cafe')).toBe(false)
    expect(isMenuSlug('_')).toBe(false)
    expect(isMenuSlug('a'.repeat(61))).toBe(false)
  })
})

describe('the page', () => {
  it('names the outlet, because prices differ between outlets', () => {
    const html = renderMenuPage(aMenu())
    expect(html).toContain('<p class="outlet">Kalyani Cafe</p>')
    expect(html).toContain('<link rel="canonical" href="https://shawarmania.in/menu/kalyani-cafe/">')
  })

  it('prints each available price in rupees', () => {
    const html = renderMenuPage(aMenu())
    expect(html).toContain('<span class="rupee">₹</span>145</span>')
    expect(html).toContain('<span class="rupee">₹</span>40</span>')
    expect(formatRupees(14550)).toBe('145.50')
  })

  it('greys out an unavailable dish and puts Unavailable where its price was', () => {
    const html = renderMenuPage(aMenu())
    const item =
      html.match(/<li class="dish[^"]*">(?:(?!<\/li>)[\s\S])*Mayonnaise(?:(?!<\/li>)[\s\S])*<\/li>/)?.[0] ?? ''
    expect(item).toContain('<li class="dish off">')
    expect(item).toContain('<span class="unavailable">Unavailable</span>')
    expect(item).not.toContain('155')
  })

  it('marks every dish veg or non-veg, with a label', () => {
    const html = renderMenuPage(aMenu())
    expect(html.match(/class="diet nonveg" role="img" aria-label="Non-vegetarian"/g)).toHaveLength(2)
    expect(html.match(/class="diet veg" role="img" aria-label="Vegetarian"/g)).toHaveLength(1)
  })

  it('links each chip to its section', () => {
    const html = renderMenuPage(aMenu())
    expect(html).toContain('<li><a href="#tea-coffee">Tea &amp; Coffee</a></li>')
    expect(html).toContain('<section class="course" id="tea-coffee"')
    expect(sectionIds(['Mains', 'Mains', '!!!'])).toEqual(['mains', 'mains-2', 'section'])
  })

  it('escapes what ops sends, so a menu cannot inject markup', () => {
    const html = renderMenuPage(
      aMenu({ outlet: { name: '<script>x</script>', slug: 'kalyani-cafe' } }),
    )
    expect(html).not.toContain('<script>x</script>')
    expect(html).toContain('&lt;script&gt;x&lt;/script&gt;')
  })

  it('carries a chip script with no bundler helpers in it', () => {
    const html = renderMenuPage(aMenu())
    const script = html.slice(html.lastIndexOf('<script>'))
    expect(script).toContain("setAttribute('aria-current', 'location')")
    expect(script).not.toContain('__name')
  })
})

describe('the footer', () => {
  // The LLP behind the brand, in the receipt's words, on every menu page a table
  // customer can land on (ops #66).
  it('names the LLP that operates the brand, on the menu and on both refusals', () => {
    for (const html of [renderMenuPage(aMenu()), renderMenuNotFound(), renderMenuUnavailable()]) {
      expect(html).toContain('<p>Operated by De &amp; Datta LLP</p>')
    }
  })
})

describe('the pages for a missing menu', () => {
  it('say the same thing whatever the reason, naming no outlet', () => {
    const page = renderMenuNotFound()
    expect(page).toContain('We couldn’t find that menu')
    expect(page).toContain('<meta name="robots" content="noindex">')
    expect(page).not.toMatch(/Kalyani|Kanchrapara|Cafe/)
  })

  it('tell a customer to try again when ops cannot be reached', () => {
    expect(renderMenuUnavailable()).toContain('try again in a minute')
  })
})

describe('the Google review ask', () => {
  const review = { url: 'https://g.page/r/Cef3CrZy-ZyuEBE/review', percent: 5 }

  it('opens when ops sends one, linking straight to the listing’s review page', () => {
    const html = renderMenuPage(aMenu({ review }))
    expect(html).toContain('<div class="rv" id="rv" hidden>')
    expect(html).toContain('role="dialog" aria-modal="true"')
    expect(html).toContain('href="https://g.page/r/Cef3CrZy-ZyuEBE/review"')
    // The countdown that docks it, and the banner it docks into.
    expect(html).toContain(`animation: rv-count ${REVIEW_POPUP_SECONDS}s linear`)
    expect(html).toContain('<div class="rv-bar" role="complementary"')
  })

  it('names the percentage ops sets, in the headline, where it is claimed, and on the banner', () => {
    const html = renderMenuPage(aMenu({ review: { ...review, percent: 8 } }))
    expect(html).toContain('<span>get 8% off</span>')
    expect(html).toContain('Then show it at the counter</p>')
    expect(html).toContain('<span>Leave a review. Get 8% off!</span>')
    expect(html).not.toMatch(/(?<![\d.])5%/)
    expect(html).not.toMatch(/5[- ]star|good review|positive review/i)
  })

  it('remembers nothing, so every visit asks again', () => {
    expect(renderMenuPage(aMenu({ review }))).not.toMatch(/localStorage|sessionStorage|document.cookie/)
  })

  it('is left off when ops sends none, sends null, or sends something it cannot show', () => {
    for (const menu of [
      aMenu(),
      aMenu({ review: null }),
      aMenu({ review: { url: 'javascript:alert(1)', percent: 5 } }),
      aMenu({ review: { url: 'https://g.page/x" onclick="x', percent: 5 } }),
      aMenu({ review: { ...review, percent: 0 } }),
      aMenu({ review: { ...review, percent: 2.5 } }),
      aMenu({ review: { ...review, percent: 90 } }),
    ]) {
      const html = renderMenuPage(menu)
      expect(html).not.toContain('id="rv"')
      expect(html).not.toContain('.rv-pop')
    }
  })

  it('carries no bundler helpers in its script', () => {
    const html = renderMenuPage(aMenu({ review }))
    expect(html).toContain("document.getElementById('rv')")
    expect(html).not.toContain('__name')
  })

  it('is a field the menu reader accepts', () => {
    expect(() => assertOnlyMenu({ ...aMenu(), review })).not.toThrow()
    expect(() => assertOnlyMenu({ ...aMenu(), review: { ...review, owner_note: 'x' } })).toThrow(MenuSaysTooMuch)
  })
})
