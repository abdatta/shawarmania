# Change: the-counter-views-the-receipt

> Depends on: 10 `public-bill-receipt-page` (the Worker).
>
> **This is the child half of a pair.** The parent is `a-receipt-goes-out-on-whatsapp`
> (#63) in `shawarmania-ops` (`C:\Users\iamro\Code\shawarmania-ops`), whose design
> D12 puts a **View receipt** pop-up on the counter tablet: it frames this page, in
> a sandbox that permits scripts and nothing else, so a biller can show a customer
> their bill. Read
> D12 first. The two halves ship in either order: until this is deployed the page
> ignores the parameter and draws its Download PDF link as before.

## Why

On the counter, the framed page's **Download PDF** button is a dead control. The
ops frame's sandbox refuses downloads, so tapping it does nothing, and a
customer looking at the tablet sees a large button that does not work. The owner
asked on 2026-09-30 for the counter's view to leave it out.

The frame cannot reach into the page to hide it (the page is on another origin),
so the page has to be asked.

## What Changes

- **`?view=counter` draws the page without the Download PDF link.** Everything else
  is the same page: the same rows, the same totals, the same notes, so the counter
  and the customer's own link can never disagree about a bill.
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
- **Nothing else reads the parameter.** No other value, no case variant, and no
  effect on the PDF itself, the refusal page, or the headers. Anybody may add it;
  all it can do is hide a link and announce a number of pixels.
- The customer's own link, without the parameter, is unchanged.

## Impact

- `worker/src/page.ts`: `receiptPageOptions(search)` and an options argument to
  `renderReceiptPage`, defaulting to today's page.
- `worker/src/index.ts`: passes the request's parameters through.
- `worker/test/receipt.test.ts`: the parameter's reading, and a page that differs
  from the full one only by the download block.
- The main spec's download requirement gains the counter view.

## Manual QA checklist

- Open a real receipt link: Download PDF is there and still downloads.
- Open the same link with `?view=counter`: no Download PDF, everything else identical.
- Open it with `?view=COUNTER` or `?view=other`: Download PDF is there.
- In the ops counter (tablet width), View receipt shows the receipt without the button.
- `npm run build`, `npm run worker:typecheck` and `npm run worker:test` pass.
