# Change: public-bill-receipt-page

> Change 10 — depends on: 1 `scaffold-and-deploy`, 9 `polish-seo-launch`.
>
> **This is the child half of a pair.** The parent is `public-bill-receipt` in
> `shawarmania-ops` (`C:\Users\iamro\Code\shawarmania-ops`), which owns the
> receipt link, its revocation and the data. That change's task list drives this
> one, and neither ships alone: it produces a link with nothing to open, this
> produces a page with no link to serve. **Read its `design.md` before starting** —
> every decision behind this page was settled there.

## Why

Shawarmania's counter has rung 1,035 bills since 2026-08-12 and handed the
customer nothing. No paper, no record, no way to check later what they were
charged. The ops app now issues every bill a public receipt link on
`shawarmania.in`, and this repo owns the domain, so this repo serves the page.

The link must be on the brand domain rather than `ops.shawarmania.in`, because a
customer-facing URL should never expose the operations host. And the receipt is
**the only surface in the entire system a customer ever sees**, so it should look
like Shawarmania rather than like an ops portal.

**This change ends "fully static, no server" for this repo.** Today the site is a
Vite bundle on GitHub Pages, which cannot set a response header, cannot rate
limit, and cannot return `application/pdf`. A Cloudflare Worker is added on the
apex path `/bill/*`; Pages continues to serve everything else, unchanged. This is
the first server-side code and the first secret this repo has held, and the README
says the opposite today.

## What Changes

- **A Cloudflare Worker on `shawarmania.in/bill/*`.** GitHub Pages remains the
  origin for the whole site; the Worker intercepts one path prefix and nothing
  else. The landing page, its build, and `public/CNAME` are untouched.
- **A themed receipt page** at `/bill/<token>`: Shawarmania's logo, colours and
  type, laid out to read on a cheap Android phone without pinching, in light and
  dark. It shows the outlet, bill number, date and time, every line at its
  snapshotted list price, every discount as its own line naming what it was, the
  round-up line, the total, and the payment split.
- **The page names no customer.** No name, no phone number, no masked digits. This
  is a hard requirement from the parent change, not a styling choice, and the data
  the Worker receives does not contain them.
- **A PDF at `/bill/<token>.pdf`**, 80 mm wide with height fitted to its content,
  themed, built on demand with `pdf-lib`,
  served as an ordinary navigation with a recognisable filename. **Never stored,
  and never assembled in the reader's browser** — a script-generated `blob:`
  download is unreliable inside WhatsApp's in-app browser, which is where these
  links will be opened.
- **The Download control is a link, not an auto-download.** Opening a receipt shows
  the receipt; downloading is a deliberate tap.
- **A voided bill reads `Cancelled`**, unmistakably, because the page is built
  from a live read at the moment it is asked for.
- **One identical refusal** for a token that is unknown, malformed, revoked, or
  belongs to a disabled endpoint.
- **Nothing is invited to index a receipt**: `X-Robots-Tag: noindex, nofollow` and
  `Referrer-Policy: no-referrer` on every receipt response, and the site's
  `robots.txt` is deliberately **left alone** (see `design.md` — a `Disallow` here
  would defeat the `noindex`).
- **The preview card is generic** — logo and "Your receipt", with no amount, no
  item and no bill number — so a forwarded link does not spill its contents into a
  group chat before anybody opens it.
- **Per-client and global rate limits**, and a short cache TTL keyed on the token.

## Capabilities

### New Capabilities

- `public-receipt-page`: the Worker route, the themed receipt, the PDF, the
  refusal, the headers, the preview card, the caching and the rate limits.

### Modified Capabilities

- `pages-deployment`: the site gains a second deploy target and a runtime. The
  zone moves to Cloudflare, keeping the same apex records so Pages keeps serving;
  the Worker deploys separately from the Pages workflow and holds a secret that
  never enters the bundle or the repo.
- `seo-and-launch`: receipt responses are excluded from indexing by header, and
  `robots.txt` and `sitemap.xml` continue to describe the marketing site only and
  are not extended to `/bill/*`.

## Impact

- New: a `worker/` source tree, its own deploy configuration, and one dependency
  (`pdf-lib`) used only there.
- The site bundle, the page-weight budget, the GSAP runtime and every existing
  section are **untouched**. The Worker is not part of the Vite build and does not
  enter the Pages artifact.
- `README.md` — the "Fully static, hosted on GitHub Pages" and "static bundle, no
  server" claims both become false and must be rewritten.
- One secret (the ops project's service-role credential) held as a Worker secret,
  never committed and never bundled.

## Non-goals

- **Sending the link to a customer.** Delivery by WhatsApp, RCS or SMS is a change
  of its own, in neither repo yet.
- **Any change to the marketing site**: no new section, no navigation entry, no
  link from the landing page to a receipt. A receipt is reached only by its link.
- **A customer account, order history, reordering, loyalty or feedback.** This is
  one receipt, not a portal.
- **Editing anything about a bill.** The Worker reads. It has no write path of any
  kind against billing data.
- **Moving the landing site off GitHub Pages.**

## Manual QA checklist

The owner walked this in production on 2026-09-10 after the Cloudflare cutover,
including a real Android phone and WhatsApp's in-app browser.

- [x] A real receipt link from the ops app opens on `shawarmania.in/bill/<token>`
      and shows the correct outlet, bill number, date, items, discounts, round-up,
      total and payment split.
- [x] **No customer name and no phone number appear anywhere** on the page or in
      the PDF.
- [x] The page is readable on a phone without pinching, at 375px wide, and again at
      a tablet width. Check both light and dark.
- [x] The Download control produces a PDF that opens, is themed, and is named
      recognisably. Nothing downloads on its own when the page is opened.
- [x] **Open the link inside WhatsApp's in-app browser on an Android phone**, and
      download from there. This is the real delivery path and the one most likely
      to break.
- [x] A discounted bill shows each discount as its own line naming what it was, and
      a fully discounted bill shows a ₹1 total that reads as deliberate.
- [x] A voided bill reads `Cancelled` and cannot be mistaken for a valid receipt.
- [x] A revoked link, a link with one character changed, and an invented link all
      produce the same refusal page.
- [x] Pasting a link into a WhatsApp chat produces a preview with no amount, no
      item and no bill number.
- [x] The landing site itself is unchanged: it loads, scrolls, animates and builds
      exactly as before, and `npm run build` is green.
