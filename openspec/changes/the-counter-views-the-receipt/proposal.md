# Change: the-counter-views-the-receipt

> Depends on: 10 `public-bill-receipt-page` (the Worker).
>
> **This is the child half of a pair.** The parent is `a-receipt-goes-out-on-whatsapp`
> (#63) in `shawarmania-ops` (`C:\Users\iamro\Code\shawarmania-ops`), whose design
> D12 puts a **View receipt** pop-up on the counter tablet: it frames this page, in
> a sandbox that permits scripts and nothing else, so a biller can show a customer
> their bill. Read D12 first. The two halves could ship in either order: a page
> that did not know the parameter ignored it, and the pop-up fell back to a fixed
> height.

## Why

The page was written for a customer holding their own link on their own phone.
Framed in the ops counter's pop-up, several parts of it read wrong [owner,
2026-09-30]:

- **Download PDF** is a dead control: the ops frame's sandbox refuses downloads,
  and a customer looking at the tablet sees a large button that does nothing.
- The pop-up sizes itself to the page, and **cannot measure a page on another
  origin**, so the page has to report its own height.
- In a pop-up sized to it, the page's deep bottom margin reads as a stray gap, and
  "Paid by", the tax-invoice sentence and the separate bill-number chip spend
  height a customer who has just paid at the counter does not need.

The frame cannot reach into the page to change any of it, so the page has to be
asked.

## What Changes

- **`?view=counter` draws the page without the Download PDF link.** It shows the
  same items, discounts and total as the customer's page, so the counter and the
  customer's own link can never disagree about a bill; what it trims is listed
  below.
- **The counter view reports its height** to the frame's parent, on load and
  on every resize, as `{ type: 'shawarmania-receipt-height', height }` [owner,
  2026-09-30]. The pop-up cannot measure a page on another origin, and the owner
  asked for it to grow with the receipt. It is the view's only script; **the
  customer's own link carries no script at all**, which is part of what keeps it
  behaving in a chat app's in-app browser.
- **The counter view spaces the page evenly and drops the tax-invoice sentence**
  [owner, 2026-09-30]. The customer's page keeps a deep bottom margin for a phone
  scrolling in a browser, which reads as a stray gap in a pop-up sized to the page;
  and in the pop-up the page is plainly a receipt. No GSTIN or tax line appears in
  either view, so the receipt still resembles no tax invoice. The customer's own
  link keeps both.
- **The counter view puts the bill number and the time on one plain row**, bill at
  the left and time at the right, in place of the centred time and the bill-number
  chip [owner, 2026-09-30], to save height in the pop-up. The customer's page keeps
  its layout.
- **The counter view leaves out how the bill was paid** [owner, 2026-09-30]. The
  customer at the counter has just paid and knows how; their own link keeps the
  tender line, which is what settles a later "I paid by UPI". A plain receipt that
  is not a tax invoice is not required to carry it either way.
- **The counter view tightens the gap under the logo** (12px to 7px) [owner,
  2026-09-30]. The logo image carries about 4px of transparent padding beneath its
  artwork, so the outlet's name sat closer to the row below than to the logo:
  about 29px above against 25px below, measured off the owner's screenshot.
- **The height reported is the content's own**, not the document's scroll height,
  which is at least the frame's height and so could grow the pop-up but never
  shrink it.
- **Nothing else reads the parameter.** No other value, no case variant, and no
  effect on the PDF itself, the refusal page, or the headers. Anybody may add it;
  all it can do is trim what the page shows and announce a number of pixels.
- The customer's own link, without the parameter, is unchanged.

## Impact

- `worker/src/page.ts`: `receiptPageOptions(search)`, a `view` option to
  `renderReceiptPage` defaulting to the customer's page, the counter view's styles
  (`COUNTER_STYLES`) and its one script (`REPORT_HEIGHT`).
- `worker/src/index.ts`: passes the request's parameters through.
- `worker/test/receipt.test.ts`: the parameter's reading; the counter view shows
  the same bill; and each trim, the script and the spacing, with the customer's
  page kept as it was.
- The main spec's download requirement notes the counter view, and a new
  requirement states what the counter view is.

## Manual QA checklist

- Open a real receipt link: Download PDF, *Paid by*, the tax-invoice sentence and
  the bill-number chip are all there, and the PDF still downloads.
- Open the same link with `?view=counter`: none of those, the bill number and time
  on one row, the same items, discounts and total, and no stray gap at the bottom.
- Open it with `?view=COUNTER` or `?view=other`: the customer's page.
- In the ops counter (tablet width), View receipt shows the counter view, fitted to
  the pop-up.
- `npm run build`, `npm run worker:typecheck` and `npm run worker:test` pass.
