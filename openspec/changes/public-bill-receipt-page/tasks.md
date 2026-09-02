# Tasks: public-bill-receipt-page

> ## ⚠️ The domain move is the owner's step
>
> **`shawarmania.in`'s nameservers must move from Hostinger to Cloudflare** before
> a Worker can be routed on `/bill/*`. It touches the live site's DNS, so only the
> owner performs it, at a quiet hour. Runbook and rollback are in the parent
> change's `design.md` §1.
>
> **Nothing here is blocked on it** — build and verify against a `workers.dev` URL
> throughout. But tell the owner at the start, not at the end.

> **Read `shawarmania-ops/openspec/changes/public-bill-receipt/design.md` first.**
> Every decision behind this page was settled there, including several that look
> wrong until you read why. The parent change also owns the receipt function this
> Worker calls; sections 2 onward need it to exist.

> **Build against `workers.dev` throughout.** The DNS move is the owner's step and
> the last one. Nothing here is blocked on it.

## 1. The Worker, Beside The Site And Outside Its Build

- [ ] 1.1 Add a `worker/` source tree with its own deploy configuration, routed on `/bill/*`. **Do not touch `.github/workflows/deploy.yml`, `VITE_BASE` or `public/CNAME`.**
- [ ] 1.2 Confirm the Worker is excluded from the Vite build, from the Pages artifact and from `scripts/check-weight.mjs`. Prove it: run the build and check the artifact contents and the reported weight are unchanged.
- [ ] 1.3 Add `pdf-lib` as a dependency used only by the Worker.
- [ ] 1.4 Hold the ops service-role credential as a Worker secret. **Never in the repo, never in a committed config file, never in the bundle.** Add a check that the built site bundle does not contain it.
- [ ] 1.5 SECTION GATE — the marketing site builds, deploys and serves exactly as before, and a `workers.dev` route answers on `/bill/*`.

## 2. Reading One Bill

- [ ] 2.1 Call the parent's `security definer` receipt function with the token and nothing else. No other query, no other table, no second call.
- [ ] 2.2 Handle the four failure cases — unknown, malformed, revoked, endpoint disabled — with **one identical response**. Write the test that asserts all four are byte-identical before writing the handler.
- [ ] 2.3 Assert the payload carries **no customer name and no phone number**, and fail loudly if it ever does. That omission is the parent's job; this is the tripwire that catches a regression there.
- [ ] 2.4 Add per-client and global rate limiting, refusing beyond either with the same refusal an unknown token gets. Confirm a flood of invalid tokens produces **no** database write.
- [ ] 2.5 Cache on the token with a short TTL, in minutes, and purge on void or revocation. A long TTL would serve a valid-looking receipt for a bill cancelled minutes ago.
- [ ] 2.6 SECTION GATE — a valid token returns a receipt payload, four failures are indistinguishable, limits bite, and the cache does not outlive a void.

## 3. The Page

- [ ] 3.1 Render the themed receipt: logo, brand colours and faces, outlet, bill number, date and time, lines with quantity and snapshotted list price, each discount as its own line naming its basis, the rounding line, the total, the payment split.
- [ ] 3.2 **Render, never compute.** Every figure is a stored integer-paise value formatted at the display edge. Add a test over a discounted bill proving the rendered figures equal the stored ones.
- [ ] 3.3 Render a voided bill as `Cancelled`, unmistakably, and a fully discounted bill's ₹1 total as a deliberate figure.
- [ ] 3.4 Make it readable at 375px with no pinching, and correct at a tablet width. Light and dark.
- [ ] 3.5 Keep the page light: no GSAP, no Lenis, no router, none of the site's motion runtime. Fonts with `font-display: swap` so text paints immediately on a slow connection.
- [ ] 3.6 Add the Download control as an ordinary link to `/bill/<token>.pdf`. **Not a script-generated `blob:`** — that is the failure mode that ruled out static hosting in the first place.
- [ ] 3.7 Add response headers: `X-Robots-Tag: noindex, nofollow` and `Referrer-Policy: no-referrer`. **Do not add a `Disallow` to `robots.txt`** — it would prevent the header being read (`design.md` §6).
- [ ] 3.8 Add a generic preview card: logo and "Your receipt", with no amount, no item and no bill number.
- [ ] 3.9 SECTION GATE — a real bill renders correctly on a phone viewport in both themes, headers are present, and the preview discloses nothing.

## 4. The PDF

- [ ] 4.1 Build the PDF with `pdf-lib` on demand, A4, themed with the logo and brand faces. Never stored.
- [ ] 4.2 **Subset the embedded fonts** to the glyphs used. Visually identical, typically an order of magnitude smaller, free.
- [ ] 4.3 Serve it with a PDF content type, an attachment disposition and a filename of the form `Shawarmania-<Outlet>-Bill-<number>.pdf`.
- [ ] 4.4 Assert the PDF carries the same figures as the page, and that no name, phone number or personal data appears in its content **or its document metadata**.
- [ ] 4.5 SECTION GATE — the PDF downloads, opens, is themed, is named recognisably, and matches the page.

## 5. README And Reality

- [ ] 5.1 Rewrite the README's "Fully static, hosted on GitHub Pages" and "static bundle, no server" claims, which this change makes false.
- [ ] 5.2 Document the Worker: what it serves, how it deploys, its secret, how to rotate it, and the `bill.shawarmania.in` fallback if the DNS move is ever reverted.
- [ ] 5.3 Add the change to `openspec/ROADMAP.md` as change 10, and note that the "all nine changes archived" status line is now out of date.

## 6. Manual QA

The owner walks this in a browser. It is the change's gate.

- [ ] 6.1 A real receipt link copied from the ops app's Share button opens and shows the correct outlet, bill number, date, items, discounts, round-up, total and payment split.
- [ ] 6.2 **No customer name and no phone number anywhere** — page, PDF, or PDF metadata.
- [ ] 6.3 375px wide and a tablet width, both light and dark, no horizontal scrolling and no pinching to read.
- [ ] 6.4 **Open the link inside WhatsApp's in-app browser on a real Android phone and download from there.** This is the actual delivery path and the one most likely to fail.
- [ ] 6.5 The download produces a themed, recognisably named PDF; nothing downloads on its own when the page opens.
- [ ] 6.6 A discounted bill shows each discount as its own named line; a fully discounted bill shows ₹1 and reads as deliberate.
- [ ] 6.7 A voided bill reads `Cancelled` and cannot be mistaken for a valid receipt.
- [ ] 6.8 A revoked link, a link with one character changed, and an invented link all produce the same refusal.
- [ ] 6.9 Pasting a link into a WhatsApp chat shows a preview with no amount, item or bill number.
- [ ] 6.10 The marketing site loads, scrolls, animates and builds exactly as before; `npm run build` is green and the page-weight budget is unchanged.
