## 1. The receipt says it's yours

- [x] 1.1 Failing first, in `worker/test/content.test.ts`: new shapes in the page / PDF
      agreement test (a customer, a gold member, dine-in at a table, dine-in, takeaway,
      and all at once), and the wording of each line
- [x] 1.2 Failing first, in `worker/test/receipt.test.ts`: the counter view shows both
      lines; the tripwire refuses a ten-digit run anywhere and a malformed
      `phone_last4`, and passes a new-shape payload; an old-shape payload renders as
      before
- [x] 1.3 `receipt.ts` (fields and tripwire), `content.ts`, `page.ts`, `pdf.ts`
- [x] 1.4 `privacy/index.html`: the receipt paragraph's new words, for the owner to
      approve. `/messages/` untouched
- [x] 1.5 `npm run worker:typecheck`, `npm run worker:test`, `npm run build`; the page,
      the counter view and the PDF looked at on a phone width

## 2. Ship, in the owner's window

- [x] 2.1 🧍 The owner approves the privacy page's words *(with the release,
      2026-10-01)*
- [x] 2.2 🧍 Push `main` (publishes the privacy page), then `npm run worker:deploy`;
      the page no later than the Worker. Either order against the ops migration
      `20260930000000_the_receipt_says_its_yours` *(2026-10-01: `ae97f9d`, the
      privacy page live, then Worker `a634c8f4`; the two-row header and the
      reasonless cancellation followed as `960e55a`, Worker `946bea0a`)*
- [x] 2.3 Open a real receipt from a bill where a customer gave their number, and the
      same bill from the ops counter's View receipt; both show the digits *(Bill
      199 at Kalyani Cafe, 2026-10-03: the link and `view=counter` both show
      *Dine-in* and the masked digits, and no whole number)*
- [ ] 2.4 Archive once a real customer's receipt has shown them
