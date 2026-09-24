import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'

import { formatBasisPoints, formatBusinessDate, formatPaise } from '../src/money'
import { renderReceiptPage, renderRefusal } from '../src/page'
import { pdfFilename, renderReceiptPdf } from '../src/pdf'
import { assertNamesNobody, ReceiptNamesSomebody, type Receipt } from '../src/receipt'

/**
 * The claims worth asserting about a receipt are all pure functions over one
 * payload: what it prints, what it must never print, and that the PDF says the
 * same thing as the page. Routing, headers and rate limits are exercised
 * against a running `wrangler dev`, because that is the only place they are
 * real.
 */

/** The bill every case below is a variation of: two lines, both kinds of
 * discount, a round-up and a split tender. */
function aReceipt(overrides: Partial<Receipt> = {}): Receipt {
  return {
    outlet: { name: 'Shawarmania Kalyani' },
    bill_number: 10,
    business_date: '2026-09-03',
    sold_at: '2026-09-03T07:35:00.000Z',
    status: 'settled',
    void_reason: null,
    totals: {
      subtotal_paise: 33700,
      discount_paise: 8215,
      tax_paise: 0,
      rounding_paise: 15,
      total_paise: 25500,
    },
    lines: [
      {
        item_name: 'Stuffed Lebanese Chicken Shawarma',
        quantity: 1,
        unit_price_paise: 23800,
        line_total_paise: 23800,
      },
      { item_name: 'Cold Coffee', quantity: 1, unit_price_paise: 9900, line_total_paise: 9900 },
    ],
    discount_rows: [
      {
        source: 'menu',
        basis: 'percent',
        value_bp: 1500,
        value_paise: null,
        categories: ['Shawarma'],
        amount_paise: 3570,
      },
      {
        source: 'bill',
        basis: 'amount',
        value_bp: null,
        value_paise: 4645,
        categories: [],
        amount_paise: 4645,
      },
    ],
    payments: [
      { method: 'cash', amount_paise: 20000 },
      { method: 'upi', amount_paise: 5500 },
    ],
    ...overrides,
  }
}

describe('formatting money at the display edge', () => {
  it('drops the paise on a whole rupee and keeps them when they exist', () => {
    expect(formatPaise(13900)).toBe('₹139')
    expect(formatPaise(3570)).toBe('₹35.70')
    expect(formatPaise(100)).toBe('₹1')
    expect(formatPaise(15)).toBe('₹0.15')
  })

  it('groups thousands the Indian way', () => {
    expect(formatPaise(1_00_00_000)).toBe('₹1,00,000')
  })

  it('reads a fractional percentage as a fraction', () => {
    expect(formatBasisPoints(1500)).toBe('15%')
    expect(formatBasisPoints(750)).toBe('7.5%')
  })

  /*
   * A business date is an explicit `date` column, never derived from a timestamp,
   * so it is formatted as the calendar date it is with no zone applied. Applying
   * one is how a business date becomes the wrong day.
   */
  it('formats a business date without letting a time zone move it', () => {
    expect(formatBusinessDate('2026-09-03')).toBe('03 Sept 2026')
    expect(formatBusinessDate('2026-01-01')).toBe('01 Jan 2026')
  })
})

describe('the page states what was charged', () => {
  const html = renderReceiptPage(aReceipt(), 'Ab3-_x9QzT')

  it('names the outlet, the bill and when it was sold', () => {
    expect(html).toContain('Shawarmania Kalyani')
    expect(html).toContain('Bill 10')
    expect(html).toContain('03 Sept 2026')
  })

  it('shows each line at the list price it snapshotted, not a reduced one', () => {
    expect(html).toContain('Stuffed Lebanese Chicken Shawarma')
    expect(html).toContain('1 × ₹238')
    expect(html).toContain('₹238')
  })

  it('gives each discount its own line naming what it was', () => {
    expect(html).toContain('Menu Discount (15%)')
    expect(html).toContain('Shawarma')
    expect(html).toContain('Discount (₹46.45)')
    expect(html).toContain('On this bill')
  })

  it('shows the round-up and the stored total', () => {
    expect(html).toContain('Round up')
    expect(html).toContain('₹0.15')
    expect(html).toContain('₹255')
  })

  it('shows both allocations of a split tender', () => {
    expect(html).toContain('₹200')
    expect(html).toContain('₹55')
  })

  it('offers the PDF as an ordinary link to its own address', () => {
    // Not a script-generated `blob:`: that is the failure mode inside WhatsApp's
    // in-app browser, and it is the reason static hosting was ruled out.
    expect(html).toContain('href="/bill/Ab3-_x9QzT.pdf"')
    expect(html).not.toContain('blob:')
    expect(html).not.toContain('createObjectURL')
  })

  it('carries nothing resembling a tax invoice', () => {
    expect(html).not.toMatch(/gstin/i)
    expect(html).toContain('This is a receipt, not a tax invoice.')
  })

  /*
   * The preview card a chat app builds must not disclose the contents, because
   * it is fetched the moment a link is pasted -- before anybody opens it.
   */
  it('offers a preview card with no amount, item or bill number', () => {
    const head = html.slice(0, html.indexOf('</head>'))
    const og = [...head.matchAll(/<meta property="og:[^"]+" content="([^"]*)"/g)].map((m) => m[1])
    // "Shawarma" is deliberately not in this list: it is a substring of the
    // brand name, which the card is allowed to carry.
    expect(og.join(' ')).not.toMatch(/255|238|Stuffed Lebanese|Bill 10/)
    expect(og.join(' ')).toContain('Your receipt')
  })

  it('prints as the same 80 mm roll the PDF uses, in ink a printer survives', () => {
    expect(html).toContain('@page { size: 80mm auto; margin: 0; }')
    expect(html).toMatch(/@media print[\s\S]*background: #fff/)
  })
})

describe('the page names nobody', () => {
  it('renders no customer name or phone even when the payload somehow carries them', () => {
    // The payload never should -- the ops projection omits them -- so this is the
    // page's half of the same promise rather than a substitute for it.
    const html = renderReceiptPage(
      {
        ...aReceipt(),
        ...({ customer_name: 'Placeholder Name', customer_phone: '+919000000042' } as object),
      } as Receipt,
      'Ab3-_x9QzT',
    )
    expect(html).not.toContain('Placeholder Name')
    expect(html).not.toContain('9000000042')
  })

  it('names neither the biller nor the till', () => {
    const html = renderReceiptPage(aReceipt(), 'Ab3-_x9QzT')
    expect(html).not.toMatch(/biller|operator|till|tablet/i)
  })
})

describe('the payload tripwire', () => {
  it('accepts a receipt that names nobody', () => {
    expect(() => assertNamesNobody(aReceipt())).not.toThrow()
  })

  /*
   * A tripwire, not a filter. If a name ever arrives the answer is to fix the
   * ops projection: quietly stripping it here would leave the real leak in place
   * for the next reader of that function.
   */
  it.each([
    'customer_name',
    'customer_phone',
    'customer_id',
    'biller_name',
  ])('refuses a payload carrying %s, at the top level', (key) => {
    expect(() => assertNamesNobody({ ...aReceipt(), [key]: 'x' })).toThrow(ReceiptNamesSomebody)
  })

  it('refuses one buried inside a line, where nobody would look', () => {
    const receipt = aReceipt()
    const poisoned = {
      ...receipt,
      lines: [{ ...receipt.lines[0]!, customer_phone: '+919000000042' }],
    }
    expect(() => assertNamesNobody(poisoned)).toThrow(ReceiptNamesSomebody)
  })
})

describe('every refusal is the same refusal', () => {
  it('says nothing about which case occurred', () => {
    const html = renderRefusal()
    expect(html).toContain('This receipt is not available')
    // No hint of revoked-versus-unknown-versus-off, and no bill referenced.
    expect(html).not.toMatch(/revoked|expired|disabled|unknown|invalid|rate/i)
  })

  it('is byte-identical every time it is produced', () => {
    expect(renderRefusal()).toBe(renderRefusal())
  })

  it('names only the trading outlet', () => {
    // The refusal footer is hand-written rather than driven by `content.notes`,
    // so it was missed when Kanchrapara was dropped everywhere else and went on
    // naming a closing outlet in production. Pin it.
    const html = renderRefusal()
    expect(html).toContain('Shawarmania · Kalyani')
    expect(html).not.toContain('Kanchrapara')
  })
})

describe('the PDF', () => {
  it('is an 80 mm roll whose height follows its contents', async () => {
    const short = await renderReceiptPdf(
      aReceipt({
        lines: [
          { item_name: 'Cold Coffee', quantity: 1, unit_price_paise: 9900, line_total_paise: 9900 },
        ],
        discount_rows: [],
        totals: {
          subtotal_paise: 9900,
          discount_paise: 0,
          tax_paise: 0,
          rounding_paise: 0,
          total_paise: 9900,
        },
        payments: [{ method: 'cash', amount_paise: 9900 }],
      }),
    )
    const long = await renderReceiptPdf(aReceipt())

    const shortSize = await pageSize(short)
    const longSize = await pageSize(long)

    // 80 mm at 72 dpi, whatever the bill.
    expect(shortSize.width).toBeCloseTo(226.77, 1)
    expect(longSize.width).toBeCloseTo(226.77, 1)
    // A one-line bill is a shorter roll than a two-line bill carrying two
    // discounts and a round-up. That is the whole point of a computed height.
    expect(longSize.height).toBeGreaterThan(shortSize.height)
  })

  it('is named recognisably, without doubling the brand name', () => {
    expect(pdfFilename(aReceipt())).toBe('Shawarmania-Kalyani-Bill-10.pdf')
    expect(pdfFilename(aReceipt({ outlet: { name: 'Shawarmania Kanchrapara' } }))).toBe(
      'Shawarmania-Kanchrapara-Bill-10.pdf',
    )
  })

  it('names nobody in its bytes or its metadata', async () => {
    const pdf = await renderReceiptPdf(
      aReceipt({
        ...({ customer_name: 'Placeholder Name', customer_phone: '+919000000042' } as object),
      } as Partial<Receipt>),
    )
    const text = new TextDecoder('latin1').decode(pdf)
    expect(text).not.toContain('Placeholder')
    expect(text).not.toContain('9000000042')

    // The information dictionary is set explicitly, so nothing a library or a
    // platform decides to write can name somebody.
    const doc = await PDFDocument.load(pdf)
    expect(doc.getAuthor()).toBe('Shawarmania')
    expect(doc.getTitle()).toContain('Bill 10')
    expect(doc.getKeywords() ?? '').toBe('')
  })

  it('renders a cancelled bill without throwing, and a fully discounted one', async () => {
    await expect(
      renderReceiptPdf(aReceipt({ status: 'void', void_reason: 'Rung twice by mistake' })),
    ).resolves.toBeInstanceOf(Uint8Array)

    await expect(
      renderReceiptPdf(
        aReceipt({
          lines: [
            {
              item_name: 'Classic Chicken Shawarma',
              quantity: 1,
              unit_price_paise: 13900,
              line_total_paise: 13900,
            },
          ],
          discount_rows: [
            {
              source: 'menu',
              basis: 'percent',
              value_bp: 10000,
              value_paise: null,
              categories: ['Shawarma'],
              amount_paise: 13900,
            },
          ],
          totals: {
            subtotal_paise: 13900,
            discount_paise: 13900,
            tax_paise: 0,
            rounding_paise: 100,
            total_paise: 100,
          },
          payments: [{ method: 'cash', amount_paise: 100 }],
        }),
      ),
    ).resolves.toBeInstanceOf(Uint8Array)
  })
})

/**
 * The first page's size, read back through `pdf-lib`.
 *
 * Not scraped from the bytes: `pdf-lib` writes the page tree into a compressed
 * object stream, so a regex over the raw file finds no `/MediaBox` at all.
 */
async function pageSize(pdf: Uint8Array): Promise<{ width: number; height: number }> {
  const doc = await PDFDocument.load(pdf)
  return doc.getPage(0).getSize()
}
