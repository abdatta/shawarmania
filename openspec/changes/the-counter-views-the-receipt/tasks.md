## 1. The counter's view

- [x] 1.1 Failing first, in `worker/test/receipt.test.ts`: `receiptPageOptions` reads
      `view=counter` and nothing else, and the counter page differs from the full page
      only by the download block
- [x] 1.2 `receiptPageOptions` and the options argument in `worker/src/page.ts`, passed
      through from the request in `worker/src/index.ts`
- [x] 1.3 `npm run worker:typecheck`, `npm run worker:test` and `npm run build`

## 2. Ship

- [x] 2.1 🧍 The owner approves the deploy. **`npm run worker:deploy` also ships
      `the-receipt-shows-points`**, whose own deploy (its 2.2) has not been run; confirm
      that is wanted in the same release
- [x] 2.2 `npm run worker:deploy` (2026-09-30, version `5033fcc6`; also shipped `the-receipt-shows-points`)

## 2b. The counter view reports its height (2026-09-30)

- [x] 2b.1 Failing first: the counter view carries one script posting
      `shawarmania-receipt-height`, and the customer's page carries no script
- [x] 2b.2 `REPORT_HEIGHT` in `worker/src/page.ts`, only in the counter view
- [x] 2b.3 `npm run worker:deploy` (version `e50bd734`), then the ops pop-up fits a short receipt and
      scrolls a long one

- [x] 2b.4 On the owner's word: the counter view spaces top and bottom evenly and
      drops the tax-invoice sentence; the customer's page keeps both
- [x] 2b.5 `npm run worker:deploy`

- [x] 2b.6 On the owner's word: the counter view puts the bill number (left) and
      the time (right) on one plain row, with no chip
- [x] 2b.7 `npm run worker:deploy`

- [x] 2b.8 On the owner's word: the counter view leaves out the tender line; the
      height reported is the content's own rather than the scroll height
- [x] 2b.9 `npm run worker:deploy`

## 3. Manual QA

- [ ] 3.1 A real receipt link: Download PDF present and still downloads (phone and
      desktop widths)
- [x] 3.2 The same link with `?view=counter`: no Download PDF, everything else identical;
      `?view=COUNTER` and `?view=other` keep it
- [ ] 3.3 The ops counter at tablet width: View receipt shows the receipt without the button
- [ ] 3.4 Archive with ops #63
