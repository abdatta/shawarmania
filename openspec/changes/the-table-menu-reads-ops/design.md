# Design: the-table-menu-reads-ops

The decisions about the data — the address, who may call the reader, what it
returns, the one null — are the parent's (`shawarmania-ops`,
`the-menu-is-public/design.md`). These are this repo's.

## 1. The Worker renders the page itself

The receipt set the pattern and this follows it: the Worker builds the whole
HTML, inlines its stylesheet, and serves its own logo and fonts
(`/menu/_/…`; `_` can never be in a slug). It does not fetch a template from
Pages. The receipt's own comment records why forwarding is a trap — under
`wrangler dev` there is no Pages origin, and the request re-enters the Worker —
and a page assembled from two origins is two things that can be out of step.

The cost is that Change 12's stylesheet and chip script now live in
`worker/src/menu-page.ts` rather than in `src/`. The script is a plain string,
not a function's source, because Wrangler's bundler adds `__name(...)` calls to
function bodies and those would not exist in the customer's browser.

## 2. A minute at the edge, a week behind it

The **payload** is cached on the slug for 60 seconds, as the receipt caches its
payload, so a page change ships with a Worker deploy without waiting out a cache.
Sixty seconds is the owner's trade: an ops edit reaches the table within a
minute, and ops serves at most one call per outlet per minute of traffic — under
100 MB of egress a month at 60–80 customers a day [owner, 2026-09-28].

Every good answer is also kept for a week under a second key. If ops cannot be
reached, the customer at a table gets the menu as it was minutes ago rather than
an error. A null answer deletes that copy, so a closed outlet does not keep a
menu for a week. Only a cache miss is rate limited, because only a miss costs a
database call.

## 3. `/menu/` is a 302, not a 301

QR codes for `/menu/` are already printed and must keep working, so `/menu/`
redirects to Kalyani Cafe's menu. It is temporary on purpose: which outlet
`/menu/` means may change, and a permanent redirect is remembered by every phone
that ever followed it. The target is the `DEFAULT_MENU_SLUG` Worker variable.

Every menu has one address: lowercase, with its trailing slash. Anything else
with a valid shape is redirected there permanently; anything that cannot be a
slug is "not found" without a database call.

## 4. Unavailable replaces the price

An unavailable dish keeps its place, greyed out, and the price slot says
**Unavailable** — exactly what the counter tile does. A price beside something
nobody can order is a price a customer might try to order at.

## 5. The site's copy is removed, after the route is live

Once the route answers, Pages' `/menu/` is never reached; leaving the JSON, the
build plugin and the `/admin` tab in place would be a second menu that looks
editable and changes nothing. They go — but only in the push after the Worker
route is deployed, because until then Pages' `/menu/` is the one customers reach.

Order of rollout: ops migration → Worker deploy with the route → this repo's
removal push.
