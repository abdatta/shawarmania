# The receipt Worker

`shawarmania.in/bill/<token>` — a customer's own bill, as a page and as a PDF.

This is the **first server-side code this repo has ever held**, and the first
thing in it holding a secret. Everything else here is a static Vite bundle on
GitHub Pages, and that has not changed: the Worker intercepts `/bill/*` and
nothing else, is not part of the Vite build, does not enter the Pages artifact,
and does not count against the page-weight budget.

## Why a Worker at all

Not for the PDF, which is the assumption worth correcting first. It is for the
**credential**.

The ops database grants the anonymous role nothing — no policy lets `anon` read a
bill, a line, a payment or a link, by token or otherwise, because one policy
mistake there would be a full disclosure. So a browser cannot fetch a receipt.
Something server-side has to hold the ops project's service-role key and call one
`security definer` function. A static page on Pages cannot, however the PDF is
produced.

Two smaller reasons follow: GitHub Pages cannot set a response header
(`X-Robots-Tag: noindex`, `Referrer-Policy: no-referrer`) and cannot rate limit.

## What it serves

| Route | |
|---|---|
| `GET /bill/<token>` | the themed receipt page |
| `GET /bill/<token>.pdf` | the same receipt as an 80 mm roll, built on demand, never stored |
| `GET /bill/logo.png` | the brand mark, from the Worker's own bundle |
| `GET /bill/fonts/*.woff2` | the brand faces, likewise |

Anything else under `/bill/` is refused. Anything outside it is not the Worker's
business — the route pattern keeps it on Pages, and the Worker returns a plain
404 rather than proxying, because proxying re-enters the same handler under
`wrangler dev` and hangs.

**Every refusal is one refusal.** Unknown, malformed, revoked, endpoint-disabled
and rate-limited all answer with the same page and the same status, so a caller
learns nothing about which case occurred and nothing about whether any bill
exists.

## Running it locally

The Worker reads a real receipt, so it needs a database. Point it at the **local**
Supabase stack from the ops repo, never at production.

```bash
# in the ops repo
npm run db:start && npm run db:reset
npx supabase status          # copy SERVICE_ROLE_KEY

# here
cp .dev.vars.example .dev.vars   # paste the local key into it
npm run worker:dev
```

Then open `http://127.0.0.1:8787/bill/<token>`, where a token comes from
`bill_public_links` — every bill has one. To make the ops app's **Share** button
hand out local links, set `VITE_RECEIPT_BASE_URL=http://127.0.0.1:8787` in the ops
repo's `.env`.

`.dev.vars` is gitignored and must stay that way.

```bash
npm run worker:test        # the page, the PDF and the payload tripwire
npm run worker:typecheck
npm run worker:assets      # after changing the logo or a font
```

## Deploying it

```bash
npx wrangler secret put OPS_SERVICE_ROLE_KEY   # the ops project's service-role key
npm run worker:deploy
```

`wrangler.toml` carries the public Supabase URL and nothing secret. The apex route
is commented out there until the zone moves to Cloudflare, which is **the owner's
step** — the runbook and the rollback are in the ops repo's `docs/OPERATIONS.md`.
Until then `wrangler dev` and the `workers.dev` URL are how this is exercised, and
neither needs the DNS move.

### The secret

- Never in this repo, never in `wrangler.toml`, never in the Vite bundle, and
  never reachable by a browser. `npm run build` fails if the bundle contains
  anything resembling it — `worker/scripts/check-no-secret.mjs`.
- **Rotating it**: rotate in Supabase, `wrangler secret put` the new value,
  redeploy. Receipts refuse identically while the two disagree, which is an outage
  of this page and nothing else — no counter, no ops surface and no billing path
  touches it.

### If the DNS move is refused or reverted

`bill.shawarmania.in` as a `CNAME` at Hostinger pointing at the Worker. A
different URL, no nameserver migration, no other change. Links already issued
would be on the apex path, so this is a fallback for *before* launch rather than
after.

## Things here that are not obvious

**The PDF is an 80 mm roll, not A4.** An earlier draft was A4, reasoning that
somebody might file it. The owner looked at one and overruled it: a two-line bill
on A4 is mostly empty space, and 80 mm is the width every thermal roll printer
takes — so `bill-thermal-printing`, if it is ever built, inherits the right shape.
Height is computed from the content.

**The page prints as the same roll.** `@page { size: 80mm auto }` plus a print
stylesheet that inverts the near-black canvas, so somebody reaching for Print
instead of Download does not get an A4 sheet with a browser header on it.

**Three fonts, and the third is for one character.** `@fontsource` splits its
fonts by unicode range, and no single Nunito Sans file has both the digits and the
rupee sign: `latin` has the digits, `latin-ext` has `₹`. A browser stitches the
ranges together with two `@font-face` rules; a PDF must embed real fonts and pick
one per glyph, so both are embedded and each character is routed to a face that
can draw it.

**The fonts are not subsetted.** Subsetting a *variable* font through `pdf-lib`
produced a structurally valid PDF in which every Latin letter was a missing-glyph
box. Whole faces cost about 130 KB, which is the right trade against a receipt
nobody can read. Both were decompressed from woff2 files already in this repo's
dependency tree; no font was downloaded, and both are OFL.

**The assets are inlined as base64.** The logo cannot go in `public/` without
changing the Pages artifact, and the page should make every request to one origin,
so the Worker serves its own logo and faces from `worker/src/assets.generated.ts`.
Regenerate with `npm run worker:assets`.

**Rate limiting is per isolate, in memory.** A ceiling on cost and noise, not a
security boundary — the security of the scheme is the token's entropy and the fact
that the page names nobody. A Durable Object is the next step if the ops access
record ever shows a distributed harvest.

**The page names no customer.** Not a name, not a phone number, not four masked
digits, and not the biller or the till. That omission is enforced by the ops
function's projection, not by this page declining to render them; `receipt.ts`
carries a tripwire that refuses to serve a payload which somehow names anybody,
because the fix for that belongs in the ops repo rather than here.
