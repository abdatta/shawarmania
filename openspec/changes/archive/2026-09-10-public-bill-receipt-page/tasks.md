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

- [x] 1.1 Add a `worker/` source tree with its own deploy configuration, routed on `/bill/*`. **Do not touch `.github/workflows/deploy.yml`, `VITE_BASE` or `public/CNAME`.** `worker/` plus `wrangler.toml` at the root. The route was enabled after the owner moved the zone to Cloudflare on 2026-09-10; `wrangler dev` and `workers.dev` remain available independently.
- [x] 1.2 Confirm the Worker is excluded from the Vite build, from the Pages artifact and from `scripts/check-weight.mjs`. Prove it: run the build and check the artifact contents and the reported weight are unchanged. Proved: `npm run build` reports the same `initial-load` and `total dist` figures, and `find dist` turns up no worker source, font or logo.
- [x] 1.3 Add `pdf-lib` as a dependency used only by the Worker.
- [x] 1.4 Hold the ops service-role credential as a Worker secret. **Never in the repo, never in a committed config file, never in the bundle.** Add a check that the built site bundle does not contain it. **A standing check rather than a one-time look.** `worker/scripts/check-no-secret.mjs` runs inside `npm run build` and fails on the variable name, the literal `service_role`, or any JWT in the bundle whose payload decodes to that role.
- [x] 1.5 SECTION GATE — the marketing site builds, deploys and serves exactly as before, and a `workers.dev` route answers on `/bill/*`.

## 2. Reading One Bill

- [x] 2.1 Call the parent's `security definer` receipt function with the token and nothing else. No other query, no other table, no second call. `readReceipt()` in `worker/src/receipt.ts`. One `POST` to one RPC; no other query, no other table, no second call.
- [x] 2.2 Handle the four failure cases — unknown, malformed, revoked, endpoint disabled — with **one identical response**. Write the test that asserts all four are byte-identical before writing the handler. All five, in fact — rate-limited lands on the same refusal. Asserted byte-identical.
- [x] 2.3 Assert the payload carries **no customer name and no phone number**, and fail loudly if it ever does. That omission is the parent's job; this is the tripwire that catches a regression there. `assertNamesNobody()` walks the payload to any depth and **throws rather than stripping**, because the fix for a name arriving belongs in the ops projection and quietly filtering it here would leave the real leak in place for the next reader.
- [x] 2.4 Add per-client and global rate limiting, refusing beyond either with the same refusal an unknown token gets. Confirm a flood of invalid tokens produces **no** database write. Per-isolate in-memory counters, deliberately, not a Durable Object: this is a ceiling on cost and noise, not a security boundary — the security is the token's entropy and the page naming nobody. Recorded in `worker/README.md`, with the Durable Object named as the next step if the ops access record ever shows a distributed harvest. No database write happens for an invalid token, because the token shape is checked at the edge and the ops function itself writes nothing when a token does not resolve.
- [x] 2.5 Cache on the token with a short TTL, in minutes, and purge on void or revocation. A long TTL would serve a valid-looking receipt for a bill cancelled minutes ago. Two minutes, on the token, caching the **payload** rather than the rendered output — so a page load and the download tap seconds later share one database read while still producing two correctly-typed responses.
- [x] 2.6 SECTION GATE — a valid token returns a receipt payload, four failures are indistinguishable, limits bite, and the cache does not outlive a void.

## 3. The Page

- [x] 3.1 Render the themed receipt: logo, brand colours and faces, outlet, bill number, date and time, lines with quantity and snapshotted list price, each discount as its own line naming its basis, the rounding line, the total, the payment split. Themed with the logo, brand colours and both faces, served from the Worker's own route so the page makes every request to one origin.
- [x] 3.2 **Render, never compute.** Every figure is a stored integer-paise value formatted at the display edge, by one `money.ts`. Asserted over nine shapes of bill.
- [x] 3.2b **The two renderers cannot drift — added because the owner asked, 2026-09-03.** The receipt is rendered twice, as HTML and as an 80 mm PDF, and neither can be produced from the other inside a Worker. Two renderers over one design is the arrangement that rots: somebody relabels a row on the page, the PDF keeps the old wording, and a customer holding both sees two different receipts for one bill. So **`worker/src/content.ts` decides every label, subtext and amount** and the renderers decide only how they look. `content.test.ts` holds them to it over nine shapes of bill: the page must render every string the model says, and the PDF's layout must emit **exactly** those strings in the same order — equality, not containment, because the PDF carries no chrome and therefore has no excuse. The one permitted difference is presentational and named in the test: the page shouts `Cancelled` with CSS, the PDF has no CSS to shout with and upper-cases it.
- [x] 3.3 Render a voided bill as `Cancelled`, unmistakably, and a fully discounted bill's ₹1 total as a deliberate figure.
- [x] 3.4 Make it readable at 375px with no pinching, and correct at a tablet width. Light and dark. **One deliberate departure: the page commits to the brand's near-black canvas in both schemes rather than inverting.** A receipt is a small document glanced at once, and the cream-on-dark lockup *is* the brand; a light variant would be a second design to keep correct for no gain. `color-scheme: dark` is declared so the browser's own chrome matches rather than fighting it. Verified at 375px and at a tablet width.
- [x] 3.5 Keep the page light: no GSAP, no Lenis, no router, none of the site's motion runtime. Fonts with `font-display: swap` so text paints immediately on a slow connection. Confirmed by construction: the Worker imports none of the site's runtime. The served CSS also has its comments stripped — they are worth keeping in the source and not worth shipping two kilobytes of design rationale to a phone.
- [x] 3.6 Add the Download control as an ordinary link to `/bill/<token>.pdf`. **Not a script-generated `blob:`** — that is the failure mode that ruled out static hosting in the first place.
- [x] 3.7 Add response headers: `X-Robots-Tag: noindex, nofollow` and `Referrer-Policy: no-referrer`. **Do not add a `Disallow` to `robots.txt`** — it would prevent the header being read (`design.md` §6). Plus `X-Content-Type-Options: nosniff`. `robots.txt` untouched, deliberately.
- [x] 3.8 Add a generic preview card: logo and "Your receipt", with no amount, no item and no bill number.
- [x] 3.9 SECTION GATE — a real bill renders correctly on a phone viewport in both themes, headers are present, and the preview discloses nothing. Verified against four seeded bills through `wrangler dev`: a full bill with both discount kinds and a split tender, a fully discounted ₹1 bill, a cancelled bill, and a revoked link.

## 4. The PDF

- [x] 4.1 Build the PDF with `pdf-lib` on demand as an 80 mm receipt roll whose height follows its content, themed with the logo and brand faces. Never stored. The owner chose the roll after opening the earlier A4 output.
- [x] 4.2 **Resolved by an accepted design correction:** the fonts are embedded whole. Subsetting a *variable* font through `pdf-lib` produced a structurally valid PDF in which **every Latin letter was a missing-glyph box** — found by looking at the output, which no test would have caught. Whole faces cost about 130 KB, which is the right trade against a receipt nobody can read. `@fontsource` also splits the digits and `₹` across different unicode-range files, so both required faces are embedded and each character is routed to a face that can draw it. The owner verified the resulting production PDF on 2026-09-10.
- [x] 4.3 Serve it with a PDF content type, an attachment disposition and a filename of the form `Shawarmania-<Outlet>-Bill-<number>.pdf`.
- [x] 4.4 Both, in `worker/test/receipt.test.ts`. The figures come from one payload through one `money.ts`, so there is no second source to disagree; the metadata dictionary is set explicitly rather than left to defaults, because a PDF that says nothing on the page and names somebody in its `Author` field has leaked all the same.
- [x] 4.5 SECTION GATE — downloads with `application/pdf` and an attachment disposition, opens, is themed, is `Shawarmania-Kalyani-Bill-10.pdf` (the brand name is stripped from the outlet's own name first, or every file would read `Shawarmania-Shawarmania-Kalyani-…`), and carries the page's figures. **The owner opened one and confirmed the format**, which is what turned A4 into a receipt roll.

## 5. README And Reality

- [x] 5.1 Rewrite the README's "Fully static, hosted on GitHub Pages" and "static bundle, no server" claims, which this change makes false.
- [x] 5.2 Document the Worker: what it serves, how it deploys, its secret, how to rotate it, and the `bill.shawarmania.in` fallback if the DNS move is ever reverted.
- [x] 5.3 Add the change to `openspec/ROADMAP.md` as change 10, and note that the "all nine changes archived" status line is now out of date.

## 6. Manual QA

The owner completed this production walkthrough on 2026-09-10 after the
Cloudflare cutover, including a real Android phone and WhatsApp's in-app browser.

- [x] 6.1 A real receipt link copied from the ops app's Share button opens and shows the correct outlet, bill number, date, items, discounts, round-up, total and payment split.
- [x] 6.2 **No customer name and no phone number anywhere** — page, PDF, or PDF metadata.
- [x] 6.3 375px wide and a tablet width, both light and dark, no horizontal scrolling and no pinching to read.
- [x] 6.4 **Open the link inside WhatsApp's in-app browser on a real Android phone and download from there.** This is the actual delivery path and the one most likely to fail.
- [x] 6.5 The download produces a themed, recognisably named PDF; nothing downloads on its own when the page opens.
- [x] 6.6 A discounted bill shows each discount as its own named line; a fully discounted bill shows ₹1 and reads as deliberate.
- [x] 6.7 A voided bill reads `Cancelled` and cannot be mistaken for a valid receipt.
- [x] 6.8 A revoked link, a link with one character changed, and an invented link all produce the same refusal.
- [x] 6.9 Pasting a link into a WhatsApp chat shows a preview with no amount, item or bill number.
- [x] 6.10 The marketing site loads, scrolls, animates and builds exactly as before; `npm run build` is green and the page-weight budget is unchanged.
