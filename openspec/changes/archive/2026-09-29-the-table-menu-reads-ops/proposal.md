# Change: the-table-menu-reads-ops

> Change 13 — depends on: 10 `public-bill-receipt-page` (the Worker), 12
> `table-menu-and-qr-maker` (the page it replaces).
>
> **This is the child half of a pair.** The parent is `the-menu-is-public` in
> `shawarmania-ops` (`C:\Users\iamro\Code\shawarmania-ops`), which owns each
> outlet's public address (`outlets.menu_slug`) and the one function this Worker
> calls, `public_menu(slug)`. **Read its `design.md` first**: the address, the
> credential and the one "not found" for three cases were settled there. Neither
> half ships alone — that change produces a menu nobody can open, this one a page
> with nothing to read.

## Why

`/menu/` is a copy of the printed card, built into the site from a JSON file. A
price changed in ops never reaches it, an item the kitchen has run out of still
looks orderable, and it can only ever be one outlet's menu. The owner asked for
the table menu to **come from ops**, for **every outlet that is active on ops,
without anybody setting one up**, and for items marked unavailable to show
greyed out as "Unavailable" [owner, 2026-09-28].

GitHub Pages serves files built in advance and cannot read ops. The receipt
Worker already can: it holds the ops service-role credential and calls one
narrow function. The menu takes the same route.

## What Changes

- **The Worker also answers `shawarmania.in/menu*`.** `/menu/<slug>/` is any
  trading outlet's menu, read live from ops through `public_menu(slug)`, cached
  at the edge for a minute, with the last menu ops answered kept for a week and
  served if ops cannot be reached.
- **`/menu/` redirects (302) to `/menu/kalyani-cafe/`**, so the QR codes already
  printed for `/menu/` keep working; the target is a Worker variable.
- **Unavailable items stay on the page, greyed out, with "Unavailable" where
  the price was** — the word the ops Menu screen and the counter use.
- The page keeps Change 12's look: chips, the sliding pill, the FSSAI marks. It
  now names the outlet under the title, because prices differ between outlets.
- **One "not found" page** for an address nobody holds, a closed outlet and an
  empty menu; a 503 "taking a break" page only when ops is unreachable and there
  is no recent copy.
- **The site's own copy goes**: `menu/index.html`, `src/data/dinein.json`,
  `plugins/dinein-menu.ts`, the `/admin` Table menu tab, `src/styles/menu.css`
  and `src/menu/spy.ts` are removed once the Worker route is live, because a
  second copy nobody's edits reach is a menu that lies. The sitemap lists
  `/menu/kalyani-cafe/`.

## Non-goals

- No ordering, no discounts, no prices other than the outlet's own.
- No index of outlets at `/menu/` — it redirects to one.
- No change to the receipt: `/bill/*` behaves exactly as before.

## Manual QA gate (owner)

1. Scan an existing `/menu/` QR code at Kalyani Cafe: it lands on
   `/menu/kalyani-cafe/` with the full menu.
2. In ops, mark an item unavailable; within a minute it is greyed out as
   "Unavailable" on the phone. Mark it available again; it comes back.
3. Change a price in ops; within a minute the new price shows.
4. Open `/menu/kalyani/` and `/menu/kanchrapara/`: each shows that outlet's menu.
5. Open `/menu/nonsense/`: "We couldn't find that menu".
6. A receipt link still opens and downloads its PDF.
