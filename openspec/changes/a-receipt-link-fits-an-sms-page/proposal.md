# Change: a-receipt-link-fits-an-sms-page

> Depends on: 10 `public-bill-receipt-page` (the Worker), `the-counter-views-the-receipt`.
>
> **This is the child half of a pair.** The parent is `a-receipt-link-fits-an-sms`
> (#66) in `shawarmania-ops` (`C:\Users\iamro\Code\shawarmania-ops`), which owns the
> link the app hands out. **Read its `proposal.md` and `design.md` first**: why the
> address moved, what was rejected, and the DLT template the link goes out in.
> This Worker releases **first** (parent design D2).

## Why

The receipt link is about to go out by SMS (ops #59), under the business's Airtel
DLT registration. TRAI's direction of 18 November 2025 requires a link in an SMS to
match a URL the sender registered. A per-bill link can only be registered as a
*dynamic* URL, which is fixed up to and including a `?`, with only what follows
varying.

The receipt lives at `/bill/<token>`: the token is in the path, there is no `?`, and
the address cannot be registered at all. It moves to `/bill?t=<token>`, and the owner
registers `https://shawarmania.in/bill?`.

## What Changes

- **The receipt is served at `/bill?t=<token>`**, the counter view at the same
  address with `&view=counter`.
- **`/bill/<token>` redirects there** (301), keeping `view`, before any lookup. No
  customer holds such a link; the redirect carries the counter's View receipt across
  the gap between this deploy and the ops one.
- **The PDF and the assets keep their addresses**: `/bill/<token>.pdf`,
  `/bill/logo.png`, `/bill/fonts/*.woff2`. The page's Download PDF link is unchanged.
- **A missing, empty, repeated or malformed `t` is the one refusal.**
- **The route becomes `shawarmania.in/bill*`**, replacing `shawarmania.in/bill/*`.
  An exact `shawarmania.in/bill` route was tried first and deployed on 2026-10-02:
  Cloudflare does not match a pattern with no wildcard once the URL carries a
  query string, so it answered `/bill` and let every `/bill?t=…` fall through to
  Pages. `bill*` also reaches `/billing` or `/bills`, which the site does not have
  and the Worker answers with its 404.
- **Routing is a pure function** (`worker/src/route.ts`) with its own tests, where
  until now it was checked only against `wrangler dev`.

## Non-goals

- The page, the counter view and the PDF render exactly as before.
- No change to the token's shape, the rate limits, the payload cache or the reader.
- No change to `/menu*`.

## Impact

- `worker/src/route.ts` (new), `worker/src/index.ts`, `wrangler.toml`.
- `worker/test/route.test.ts` (new).
- `README.md`, `worker/README.md`.
- Specs: `public-receipt-page` (where the receipt is served), `pages-deployment`
  (the routes).
