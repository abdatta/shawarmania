# Change: the-receipt-shows-points

> Depends on: 10 `public-bill-receipt-page` (the Worker).
>
> **This is the child half of a pair.** The parent is `a-regular-earns-points-and-gold`
> (#62) in `shawarmania-ops` (`C:\Users\iamro\Code\shawarmania-ops`), which owns the
> points ledger and the two receipt functions this Worker calls. **Read its
> `design.md` D14 first**: what the receipt says about points, and why every figure
> is a stored ledger row, was settled there. Ops deploys first; this follows.

## Why

From 2026-10-01 a customer who gives their number at Kalyani Cafe earns points on
every bill and may spend them on the next. The receipt is where they see it
happen. Without this change the Worker draws a points discount as
*Discount (₹20) · On this bill*: the right amount, in words that say the biller
gave it. And it says nothing about what the bill earned or what the customer now
holds, which is the one thing a customer collecting points reads a receipt for.

The receipt already names a gold member's free packaging wrongly the same way
(ops #60 made it a row with `source = 'packaging'`, and the Worker's typing only
knows `menu` and `bill`). It is fixed in passing, because it is the same widening.

## What Changes

- **A points discount reads as its own row**: *Points (20)*, beneath it *From your
  points*, and its amount off, among the bill's other discounts, so the printed
  rows still add up to the stored discount.
- **Free packaging reads as its own row**: *Free packaging*, *Gold member*.
- **Beneath the tender, the bill's points**: *Points used* (when it used any),
  *Points earned* and *Points balance*, as counts. Every figure comes from the
  receipt payload's `points` object, which ops reads from the bill's own ledger
  rows. Nothing is computed here.
- **A bill with no points says nothing about points.** A payload served before ops
  #62, which has no `points` key, reads the same.
- The page and the PDF say the same thing, held to it by the existing agreement
  test, which gains three bill shapes.

## Impact

- `worker/src/receipt.ts`, `content.ts`, `page.ts`, `pdf.ts`; `worker/test/content.test.ts`.
- `public-receipt-page` spec: the discount rows and the points figures.
- **Deploy order**: after the ops migration `20260929000000_a_regular_earns_points_and_gold`
  is live. Before it, nothing changes on any receipt: no payload carries `points`,
  and no row carries `source = 'points'`.
- The receipt still names nobody: the points figures carry no name, no phone and no
  outlet other than the one already printed.
