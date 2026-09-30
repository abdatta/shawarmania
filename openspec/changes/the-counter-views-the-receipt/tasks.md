## 1. The counter's view

- [x] 1.1 Failing first, in `worker/test/receipt.test.ts`: `receiptPageOptions` reads
      `view=counter` and nothing else, and the counter page differs from the full page
      only by the download block
- [x] 1.2 `receiptPageOptions` and the options argument in `worker/src/page.ts`, passed
      through from the request in `worker/src/index.ts`
- [x] 1.3 `npm run worker:typecheck`, `npm run worker:test` and `npm run build`

## 2. Ship

- [ ] 2.1 🧍 The owner approves the deploy. **`npm run worker:deploy` also ships
      `the-receipt-shows-points`**, whose own deploy (its 2.2) has not been run; confirm
      that is wanted in the same release
- [ ] 2.2 `npm run worker:deploy`

## 3. Manual QA

- [ ] 3.1 A real receipt link: Download PDF present and still downloads (phone and
      desktop widths)
- [ ] 3.2 The same link with `?view=counter`: no Download PDF, everything else identical;
      `?view=COUNTER` and `?view=other` keep it
- [ ] 3.3 The ops counter at tablet width: View receipt shows the receipt without the button
- [ ] 3.4 Archive with ops #63
