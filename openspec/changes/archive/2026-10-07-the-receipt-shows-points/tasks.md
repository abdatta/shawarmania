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

- [x] 2.1 🧍 Confirm the ops migration `20260929000000_a_regular_earns_points_and_gold` is live
      *(Applied by ops Deploy run 36674009186 on 2026-09-29, read back from production
      the same night.)*
- [x] 2.2 `npm run worker:deploy` *(deployed 2026-09-30 with `the-counter-views-the-receipt`, version `5033fcc6`; the Kalyani Cafe receipt check is still to do)*, then open a real trial receipt from Kalyani Cafe and confirm the
      points row reads *Points (…)*, the figures match the bill in ops, and the PDF says the same
      *(Closed 2026-10-07. Points went on at Kalyani Cafe on 2026-10-04, so there was no
      trial, only real bills. The receipt reader's points block matches the ops ledger:
      a ₹200 bill reads earned 5 and balance 5, and the one bill that used points reads
      used 9 and earned 9, with its `points` discount row of 900 paise. The owner opened
      a real Cafe receipt with a customer's number that day and found it as expected,
      and the page and the PDF render from the same `content.ts` labels, which the
      Worker's tests pin.)*
- [x] 2.3 Archive once a real customer's receipt has shown their points
      *(More than a hundred receipts that carry points have been opened by their
      customers since 2026-10-04. Archived with ops #62 on 2026-10-07.)*
