# Change: the-receipt-says-its-yours-page

> Depends on: 10 `public-bill-receipt-page` (the Worker), `the-receipt-shows-points`,
> `the-counter-views-the-receipt`.
>
> **This is the child half of a pair.** The parent is `the-receipt-says-its-yours`
> (#58) in `shawarmania-ops` (`C:\Users\iamro\Code\shawarmania-ops`), which owns the
> reader function this Worker calls. **Read its `proposal.md` and `design.md` first**:
> what the receipt says of its customer, and why never their name, was settled there
> [owner, 2026-09-30]. The two halves release in either order (parent design D1).

## Why

A receipt with nothing of the customer's on it does not look like *theirs*. From
2026-10-01 a customer who gives their number at Kalyani Cafe earns points and may
be gold there, and the owner already sends receipt links by WhatsApp (ops #63). The
receipt should let its holder say *yes, mine* at a glance, without telling a
stranger who holds a forwarded or misdelivered link who that is.

It also still does not say how a bill was served, which the ops database has
recorded since ops #60.

## What Changes

- **The receipt shows the last four digits of the number the customer gave**:
  *+91 ••••• •0042*. Only when the payload carries `phone_last4`, which ops returns
  only for a bill with a customer attached. **Never the name.**
- **A gold member's receipt says so**: *⭐ Gold*, and nothing more, because the
  receipt names its outlet already [owner, 2026-09-30]. Shown when the payload says
  `gold_at_outlet`. The star is presentation: the
  page draws the emoji, the PDF a small vector star, because the PDF's faces carry
  no emoji; the words are the content model's and agree across both.
- **The receipt says how the bill was served**: *Dine-in* or *Takeaway* beside the
  bill number, never the table (a label for the length of a meal, like the order
  number [owner, 2026-09-30]), or nothing when the payload carries no
  `service_type`.
- **All three renderings show them**: the customer's page, the counter view
  (`?view=counter`) and the PDF, drawn from the content model so they cannot word a
  line differently.
- **The counter and the link say the same thing** [owner, 2026-09-30]. Both take
  the counter view's layout (*Bill 46 · Takeaway* at the left of one row and *30 Sep 2026 · 7:05 pm* at the
  right, the tighter logo gap,
  no "not a tax invoice" sentence) and both show *Paid by*, which the counter view
  had dropped: the receipt must state how it was paid, and the link is the
  customer's record of it. The counter view keeps only its three invisible-or-
  necessary differences: no Download PDF, even spacing at the foot, and the height
  report. This modifies `the-counter-views-the-receipt`'s requirement, so this
  change archives after that one.
- **A tidier foot, on the page, the counter view and the PDF** [owner, 2026-09-30]:
  *Paid by* is a plain line under the total rather than a bordered box; the points
  a bill used are said once, as its *Points (N)* discount row, with no second
  *Points used* line; what it earned and the balance it left share one line,
  *+14 pts earned* at the left and *Balance: 96 pts* at the right (*pts* because
  *points* wrapped on a 320 px phone, measured); and the small print signs with
  the bill's own outlet, *Shawarmania · Kalyani Cafe*. The items are spaced like the
  discount rows, with no rule between one item and the next. This modifies
  `the-receipt-shows-points`'s requirement, so this change archives after that
  one too.
- **The tripwire is widened, not removed.** It still refuses a payload carrying a
  name or a biller by key. It now also refuses any string value with a run of ten
  or more digits (the shape of a whole phone number, which is the leak the parent
  could introduce), and a `phone_last4` that is not exactly four digits.
- **`/privacy/`'s receipt paragraph** no longer promises *"not even the last four
  digits"*. It says the page shows the last four digits and any gold mark, and never
  a name. **`/messages/` is not touched**: its *"names nobody"* stays true, and it
  is the page filed with the messaging registration.

## Non-goals

- No name, in any form, anywhere.
- No change to the refusal page, the headers, the preview card, the rate limits or
  the PDF's metadata (which still names nobody).
- No change to `/messages/` or `/terms/`.

## Impact

- `worker/src/receipt.ts`: the four optional payload fields; the widened tripwire.
- `worker/src/content.ts`: a `service` line and a `holder` block (phone, gold) in the
  content model and `contentStrings`.
- `worker/src/page.ts`: both lines in the crest, in both views; the star.
- `worker/src/pdf.ts`: both lines beneath the bill number; the vector star.
- `worker/test/content.test.ts`, `worker/test/receipt.test.ts`: new bill shapes in the
  agreement test; the counter view; the tripwire.
- `privacy/index.html`: the receipt paragraph.
- The main spec `public-receipt-page`: its *names no customer* requirement, and a new
  one for how the bill was served.

## Release

Either order against the ops migration. The privacy page and the Worker ship in the
owner's window, the page no later than the Worker (a push to `main` publishes the
page; `npm run worker:deploy` publishes the Worker).

## Manual QA checklist

- A receipt with a customer: *+91 ••••• •NNNN* on the page, the counter view and the
  PDF; no name anywhere.
- A gold member's receipt: *⭐ Gold* on all three.
- A skipped bill and a pre-#56 bill: neither line.
- Dine-in with a table, dine-in, takeaway, neither: the service line reads right.
- An old-shape payload (the live ops function before its migration) renders exactly
  as today.
- On a phone width, in the customer view and the counter view.
- `npm run build`, `npm run worker:typecheck` and `npm run worker:test` pass.
