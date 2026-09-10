# Design: public-bill-receipt-page

> **The reasoning lives in the parent.** `shawarmania-ops/openspec/changes/public-bill-receipt/design.md`
> records why the receipt is served here rather than from Supabase, why the token
> is what it is, why the page names no customer, and every alternative that was
> rejected on the way. This file covers only what is specific to this repo.

## 1. Why a Worker, when this repo has never had a server

GitHub Pages serves static files. It cannot set a response header, cannot rate
limit, and cannot return `application/pdf` for a generated document. The receipt
needs all three:

- **A real `Content-Type` and `Content-Disposition`**, because the download has to
  work inside WhatsApp's in-app browser on Android. Building the PDF in the page
  and handing over a `blob:` URL is the alternative, and it fails silently there.
  This is the single reason the static option was rejected in the parent change.
- **`X-Robots-Tag: noindex`**, which is a header and cannot be a meta tag on a PDF.
- **Rate limiting**, which has to exist somewhere and cannot exist on Pages.

The Worker intercepts `/bill/*` and nothing else. Every other path falls through
to Pages exactly as today. **The Vite build is untouched** — the Worker is not
part of it, does not enter the Pages artifact, and does not count against the
page-weight budget.

## 2. Request flow

```
GET /bill/<token>          ──► Worker ──► cache? ──► hit: themed HTML
                                            │
                                            └─ miss: one RPC to the ops Supabase
                                                     project (~2 KB JSON)
                                                     └─► render HTML, cache, serve

GET /bill/<token>.pdf      ──► Worker ──► same data (usually a cache hit,
                                          since the tap follows the page load
                                          by seconds) ──► pdf-lib ──► application/pdf
```

Supabase only ever ships JSON. Every byte the customer downloads comes from
Cloudflare, whose bandwidth is unmetered. At ~1,400 bills a month that is roughly
3 MB of Supabase egress instead of the ~840 MB that serving PDFs from Supabase
would have cost.

## 3. The data contract

The Worker calls **one** `security definer` function in the ops Supabase project,
passing **only** the token. It receives outlet, bill number, business date and
time of sale, lines with quantity and snapshotted unit price, discount records
with their basis, the rounding amount, the total, the payment allocations, and the
void state and reason.

**The response does not contain the customer's name or phone number.** That is
enforced by the function's projection in the parent change, not by this page
declining to render them. If they ever appear in the payload, that is a bug in the
parent, not a styling decision here.

**Render, never compute.** Every monetary figure is a stored integer-paise value
formatted to rupees at the display edge. The Worker must not re-derive a subtotal,
a discount, a rounding amount or a total. A receipt that computes, disagreeing
with a bill that stored, is the worst bug available in this feature.

Line prices are **list prices**. Discounts are separate lines carrying their own
basis (`Menu Discount (15%)` over the categories it covered, `Discount (₹50)` over
`On this bill`). A fully discounted bill legitimately totals ₹1 and must render as
a deliberate figure rather than a fault.

## 4. The credential

The Worker holds the ops project's service-role credential as a **Worker secret**.

- It is never committed, never in `wrangler.toml`, never in the Vite bundle, and
  never reachable by a browser.
- It exists so the Worker can call one function that returns one receipt. That
  function accepts no argument that widens it, so the credential's blast radius is
  bounded by the function rather than by the key's own power.
- Rotating it is a Worker secret update and nothing else.

## 5. Caching

**Short TTL, in minutes.** A bill is *not* immutable — a void or a tender
correction changes what the receipt must say — so a long cache would serve a
valid-looking receipt for a bill cancelled minutes ago.

A short TTL still captures nearly all the benefit, because the download tap
arrives seconds after the page load and that is the repeat hit worth eliminating.
The cache key is the token. Revocation and voiding purge the entry so the change
shows immediately rather than after the TTL.

## 6. Indexing, and the mistake not to make

**Do not add `Disallow: /bill/` to `robots.txt`.** It looks right and it defeats
itself: `robots.txt` stops the crawler *fetching* the page, so it never reads the
`noindex` header, and a URL discovered through a link can still be listed with no
content.

The correct combination is to **allow the fetch and refuse the indexing**:

- `X-Robots-Tag: noindex, nofollow` on every receipt response, HTML and PDF alike.
- `Referrer-Policy: no-referrer`, so a token never travels in a `Referer` header.
- `robots.txt` and `sitemap.xml` stay exactly as they are, describing the
  marketing site. Neither mentions `/bill/`.

**The preview card is deliberately generic.** A chat application fetches the link
to build a card the moment it is pasted. Open Graph tags carry the logo and "Your
receipt" and nothing else — no amount, no item, no bill number — so a forwarded
link does not disclose its contents to a group before anybody opens it.

## 7. The page and the PDF

**The page is what people look at, so it stays light.** Themed with the brand
logo, colours and faces, but fonts load with `font-display: swap` so text paints
immediately on a slow connection instead of holding a blank screen. It uses the
brand's near-black receipt canvas in both system colour schemes and declares that
scheme to the browser chrome. It is a plain server-rendered document: no GSAP, no
Lenis, no router, none of the site's motion runtime. Those exist for the marketing
page and have no business on a receipt.

**The PDF carries the logo and brand faces, embedded whole.** Subsetting the
variable font through `pdf-lib` produced missing-glyph boxes for every Latin
letter, while the rupee sign and digits live in different `@fontsource` unicode
ranges. The working PDF therefore embeds both required faces and routes each
character to a font that can draw it. The roughly 130 KB cost is accepted in
exchange for a readable receipt.

The PDF is an **80 mm receipt roll whose height follows its content**, chosen by
the owner after opening the earlier A4 output. Filename
`Shawarmania-<Outlet>-Bill-<number>.pdf`, never `download.pdf`.

## 8. Rejected alternatives specific to this repo

- **Serving the receipt from a `/bill/` route in the existing SPA.** Would need the
  GitHub Pages `404.html` fallback trick, would pull the whole marketing bundle and
  its motion runtime onto a receipt, and still could not produce a real PDF
  response. Rejected on all three.
- **A separate subdomain on Vercel (`bill.shawarmania.in`).** Needs only a `CNAME`
  at Hostinger and no nameserver migration. **Kept as the documented fallback** if
  the DNS move is refused or goes wrong. Not chosen because the apex path is the
  better URL and Cloudflare in front of the whole site is worth having anyway.
- **Moving the entire site to Vercel** so `/bill/*` is just a function. Relocates a
  working, deployed marketing site to serve a feature it has nothing to do with.
- **Headless-browser PDF rendering.** A receipt is a table and a logo. `pdf-lib`
  draws it directly, runs in a Worker, and needs no Chromium.

## 9. Deployment

Two independent pipelines against one domain:

- **The site**: unchanged. `.github/workflows/deploy.yml`, `VITE_BASE: /`,
  `public/CNAME`, Pages. Do not touch it.
- **The Worker**: its own deploy, its own secret, routed on `/bill/*`.

**The zone move to Cloudflare is the owner's step**, and the parent change carries
the runbook and the rollback. Everything here can be built and verified against a
`workers.dev` URL first, so **do not block this change on DNS**. The apex route is
the last step, and it does not go in while the counter is trading.
