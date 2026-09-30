import { PDFDocument } from 'pdf-lib'
import { describe, expect, it } from 'vitest'

import { formatBasisPoints, formatBusinessDate, formatPaise } from '../src/money'
import { receiptPageOptions, renderReceiptPage, renderRefusal } from '../src/page'
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
    expect(formatBusinessDate('2026-09-03')).toBe('03 Sep 2026')
    expect(formatBusinessDate('2026-01-01')).toBe('01 Jan 2026')
  })
})

describe('the page states what was charged', () => {
  const html = renderReceiptPage(aReceipt(), 'Ab3-_x9QzT')

  it('names the outlet, the bill and when it was sold', () => {
    expect(html).toContain('Shawarmania Kalyani')
    expect(html).toContain('Bill 10')
    expect(html).toContain('03 Sep 2026 · 1:05 pm')
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


  /*
   * No GSTIN, no tax breakup and no tax line is what keeps the receipt from
   * resembling a tax invoice. The sentence saying so was dropped from both views
   * [owner, 2026-09-30]; the absence is what is asserted.
   */
  it('carries nothing resembling a tax invoice', () => {
    expect(html).not.toMatch(/gstin|\btax\b/i)
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

/*
 * The ops counter frames this page for a customer standing at the counter
 * (ops #63, `a-receipt-goes-out-on-whatsapp`). A download link there leads
 * nowhere a customer can use, so that view omits it. The page is otherwise the
 * same page, so the two can never disagree about the bill.
 */
describe('the counter’s view of the page', () => {
  it('reads the counter view from `?view=counter` and nothing else', () => {
    expect(receiptPageOptions(new URLSearchParams('view=counter'))).toEqual({ view: 'counter' })
    expect(receiptPageOptions(new URLSearchParams(''))).toEqual({ view: 'customer' })
    expect(receiptPageOptions(new URLSearchParams('view=pdf'))).toEqual({ view: 'customer' })
    expect(receiptPageOptions(new URLSearchParams('VIEW=counter'))).toEqual({ view: 'customer' })
  })

  /*
   * The counter shows the customer exactly what their own link shows [owner,
   * 2026-09-30]: the same header, the same lines, *Paid by* and the small print.
   * The earlier trims (no tender, no tax-invoice sentence, bill and time on one
   * row, a tighter logo gap) are reversed. Three differences remain, and only one
   * is visible: no Download PDF button, which leads nowhere from the tablet; the
   * height report the pop-up sizes itself by; and even spacing at the foot, where
   * the link keeps a deep margin for a phone scrolling in a browser.
   */
  it.each([
    ['a plain bill', aReceipt()],
    [
      'a gold member at a table, with points',
      aReceipt({
        outlet: { name: 'Kalyani Cafe' },
        phone_last4: '5801',
        gold_at_outlet: true,
        service_type: 'dine_in',
        points: { used: 0, earned: 6, balance: 42 },
      }),
    ],
    ['a cancelled bill', aReceipt({ status: 'void', void_reason: 'Rung twice' })],
  ] as const)(
    'is the customer’s page but for the download, the height report and the foot: %s',
    (_name, receipt) => {
      const full = renderReceiptPage(receipt, 'Ab3-_x9QzT')
      const counter = renderReceiptPage(receipt, 'Ab3-_x9QzT', { view: 'counter' })

      expect(counter).not.toContain('Download PDF')
      expect(counter).not.toContain('.pdf"')

      const withoutDownload = full.replace(/<div class="download">[\s\S]*?<\/div>/, '')
      const withoutCounterOnly = counter
        .replace(/<script>[\s\S]*?<\/script>/, '')
        .replace('<body class="counter">', '<body>')
        .replace(/body\.counter\s*\{[^}]*\}/, '')
      expect(withoutCounterOnly.replace(/\s+/g, '')).toBe(withoutDownload.replace(/\s+/g, ''))
    },
  )

  /*
   * Both views take the counter's layout and both keep the tender [owner,
   * 2026-09-30]: the receipt must state the payment split, and the link is the
   * customer's record of how they paid.
   */
  it.each(['customer', 'counter'] as const)(
    'puts the bill number and the date on one row, and says how it was paid: %s view',
    (view) => {
      const html = renderReceiptPage(aReceipt(), 'Ab3-_x9QzT', { view })
      const meta = html.match(/<p class="meta">([\s\S]*?)<\/p>/)?.[1] ?? ''
      expect(meta).toMatch(
        /^\s*<span class="lead">Bill 10<\/span>\s*<span>03 Sep 2026 · 1:05 pm<\/span>\s*$/,
      )
      expect(html).toContain('Paid by Cash ₹200 + UPI ₹55')
      expect(html).not.toContain('class="bill-no"')
      expect(html).not.toContain('tax invoice')
      expect(html).toMatch(/\.crest img\s*\{[^}]*margin:\s*0 auto 7px/)
    },
  )

  /*
   * Bill and how it was served at the left, the date and time at the right
   * [owner, 2026-09-30]. Never the table: a label for the length of a meal, like
   * the order number, which the receipt does not show either.
   */
  it.each(['customer', 'counter'] as const)(
    'reads bill and service at the left, date and time at the right: %s view',
    (view) => {
      const html = renderReceiptPage(
        {
          ...aReceipt({ service_type: 'dine_in' }),
          ...({ table_number: 12 } as object),
        } as Receipt,
        'Ab3-_x9QzT',
        { view },
      )
      const meta = html.match(/<p class="meta">([\s\S]*?)<\/p>/)?.[1] ?? ''
      expect(meta).toMatch(
        /^\s*<span class="lead">Bill 10 · <strong>Dine-in<\/strong><\/span>\s*<span>03 Sep 2026 · 1:05 pm<\/span>\s*$/,
      )
      expect(html).not.toMatch(/table \d/i)
    },
  )

  /*
   * The items are spaced like the discount rows beneath them, with no rule
   * between one item and the next [owner, 2026-09-30]. One rule still separates
   * the items from the money.
   */
  it('spaces the items like the discounts, with no rule between items', () => {
    const html = renderReceiptPage(aReceipt(), 'Ab3-_x9QzT')
    const row = html.match(/(?:^|\})\s*\.row\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(row).not.toMatch(/border/)
    expect(row).toMatch(/padding:\s*7px 0/)
    expect(html).toMatch(/\.totals\s*\{[^}]*border-top:\s*1px solid/)
  })

  /*
   * *Paid by* is a quiet line under the total, as the PDF has always drawn it,
   * not a bordered box: the box spent more height than the one fact in it
   * deserved [owner, 2026-09-30].
   */
  it('says how it was paid as a plain line, with no box around it', () => {
    const html = renderReceiptPage(aReceipt(), 'Ab3-_x9QzT')
    const rule = html.match(/\.paid\s*\{([^}]*)\}/)?.[1] ?? ''
    expect(rule).not.toMatch(/border/)
    expect(rule).not.toMatch(/padding/)
    expect(rule).toMatch(/text-align:\s*center/)
  })

  it('spaces the counter view evenly top and bottom', () => {
    const counter = renderReceiptPage(aReceipt(), 'Ab3-_x9QzT', { view: 'counter' })
    const full = renderReceiptPage(aReceipt(), 'Ab3-_x9QzT')

    expect(counter).toContain('<body class="counter">')
    expect(counter).toMatch(/body\.counter\s*\{\s*padding:\s*20px 16px;?\s*\}/)
    expect(full).toContain('<body>')
  })

  /*
   * The counter's pop-up cannot see into this page (another origin), so it sizes
   * itself to the height the page reports. Only the counter's view carries the
   * script: the customer's own link stays script-free, which is what keeps it
   * behaving inside a chat app's in-app browser.
   */
  it('reports its height to the counter, and only in the counter’s view', () => {
    const full = renderReceiptPage(aReceipt(), 'Ab3-_x9QzT')
    const counter = renderReceiptPage(aReceipt(), 'Ab3-_x9QzT', { view: 'counter' })

    expect(full).not.toContain('<script')
    expect(counter.match(/<script>/g)).toHaveLength(1)
    expect(counter).toContain("type: 'shawarmania-receipt-height'")
    expect(counter).toContain('parent.postMessage(')
    expect(counter).toContain('ResizeObserver')
    // The content's own height, never scrollHeight: a document's scrollHeight is
    // at least its frame's height, so a frame sized to it could grow and never
    // shrink back.
    expect(counter).toContain('getBoundingClientRect().height')
    expect(counter).not.toContain('scrollHeight')
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

  /*
   * Ops #58 returns the last four digits, which is the first time any part of the
   * number crosses the boundary. The leak that change could introduce is the
   * whole number arriving under a key nobody listed, so the tripwire also reads
   * values: a run of ten digits anywhere is refused, whatever it is called.
   */
  it('accepts a receipt carrying the last four digits, gold and how it was served', () => {
    expect(() =>
      assertNamesNobody(
        aReceipt({
          phone_last4: '0042',
          gold_at_outlet: true,
          service_type: 'dine_in',
        }),
      ),
    ).not.toThrow()
  })

  it.each([
    ['a whole number under a new key', { holder_phone: '+919000000042' }],
    ['a whole number with no country code', { note: '9000000042' }],
    ['a number typed into a void reason', { void_reason: 'Customer 9000000042 left' }],
    ['more than four digits as the last four', { phone_last4: '000042' }],
    ['fewer than four', { phone_last4: '42' }],
    ['not digits at all', { phone_last4: 'abcd' }],
  ] as const)('refuses %s', (_name, extra) => {
    expect(() => assertNamesNobody({ ...aReceipt(), ...extra })).toThrow(ReceiptNamesSomebody)
  })

  it('refuses a whole number buried in a line, under an innocent key', () => {
    const receipt = aReceipt()
    const poisoned = {
      ...receipt,
      lines: [{ ...receipt.lines[0]!, item_name: 'Shawarma for 9000000042' }],
    }
    expect(() => assertNamesNobody(poisoned)).toThrow(ReceiptNamesSomebody)
  })

  it('does not mistake the stored figures for a number', () => {
    // Amounts are numbers, not strings, and a date or a time is not ten digits
    // in a row, so an ordinary large bill passes.
    expect(() =>
      assertNamesNobody(
        aReceipt({
          bill_number: 1234567890,
          totals: {
            subtotal_paise: 9999999999,
            discount_paise: 0,
            tax_paise: 0,
            rounding_paise: 0,
            total_paise: 9999999999,
          },
        }),
      ),
    ).not.toThrow()
  })
})

describe('the page says whose it is and how it was served (ops #58)', () => {
  const yours = () =>
    aReceipt({
      outlet: { name: 'Kalyani Cafe' },
      phone_last4: '5801',
      gold_at_outlet: true,
      service_type: 'dine_in',
    })

  it('shows the last four digits, gold here and how it was served, on the customer’s page', () => {
    const html = renderReceiptPage(yours(), 'Ab3-_x9QzT')
    expect(html).toContain('+91 ••••• •5801')
    expect(html).toMatch(/<span class="gold"><span aria-hidden="true">⭐<\/span> Gold<\/span>/)
    expect(html).toContain('⭐')
    expect(html).toContain('<strong>Dine-in</strong>')
  })

  it('shows the same in the counter’s view', () => {
    const html = renderReceiptPage(yours(), 'Ab3-_x9QzT', { view: 'counter' })
    expect(html).toContain('+91 ••••• •5801')
    expect(html).toMatch(/<span class="gold"><span aria-hidden="true">⭐<\/span> Gold<\/span>/)
    expect(html).toContain('⭐')
    expect(html).toContain('<strong>Dine-in</strong>')
  })

  it('draws the star as decoration, so a screen reader reads the words once', () => {
    const html = renderReceiptPage(yours(), 'Ab3-_x9QzT')
    expect(html).toMatch(/<span[^>]*aria-hidden="true"[^>]*>⭐<\/span>/)
  })

  it('reads an old-shape payload exactly as before', () => {
    // The live ops function before its migration returns none of the new keys,
    // and the page it renders must carry none of the new lines.
    const html = renderReceiptPage(aReceipt(), 'Ab3-_x9QzT')
    expect(html).not.toContain('Phone')
    expect(html).not.toContain('class="gold"')
    expect(html).not.toContain('⭐')
    expect(html).not.toMatch(/Dine-in|Takeaway/)
    expect(html).not.toContain('class="yours"')
    expect(html).not.toContain('<strong>')
  })

  it('never renders a name, even beside the digits', () => {
    const html = renderReceiptPage(
      {
        ...yours(),
        ...({ customer_name: 'Placeholder Name' } as object),
      } as Receipt,
      'Ab3-_x9QzT',
    )
    expect(html).not.toContain('Placeholder')
  })

  it('draws the lines in the PDF too, and still no name', async () => {
    const pdf = await renderReceiptPdf(yours())
    const doc = await PDFDocument.load(pdf)
    expect(doc.getPageCount()).toBe(1)
    const text = new TextDecoder('latin1').decode(pdf)
    expect(text).not.toContain('Placeholder')
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
