## 1. The receipt says points

- [x] 1.1 Widen `ReceiptDiscountRow.source` to `menu | packaging | bill | points`, and add the
      optional `points` object (`used`, `earned`, `balance`) to `Receipt`
- [x] 1.2 `content.ts`: *Points (N)* / *From your points* and *Free packaging* / *Gold member*
      labels; the points figures beneath the tender, *Points used* only when some were used;
      none at all on a bill without points
- [x] 1.3 Render the figures on the page and in the PDF; add the three bill shapes to the
      agreement test, and two tests that pin the wording and the silence
- [x] 1.4 `npm run worker:typecheck` and `npm run worker:test`

## 2. Ship after the parent

- [ ] 2.1 🧍 Confirm the ops migration `20260929000000_a_regular_earns_points_and_gold` is live
- [ ] 2.2 `npm run worker:deploy`, then open a real trial receipt from Kalyani Cafe and confirm the
      points row reads *Points (…)*, the figures match the bill in ops, and the PDF says the same
- [ ] 2.3 Archive once a real customer's receipt has shown their points
