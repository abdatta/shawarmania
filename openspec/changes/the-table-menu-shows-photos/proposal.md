# Change: the-table-menu-shows-photos

> Depends on: `the-table-menu-reads-ops` (the Worker's `/menu*` route).
>
> **This is the child half of a pair.** The parent is `a-dish-can-show-its-photo`
> (#84) in `shawarmania-ops` (`C:\Users\iamro\Code\shawarmania-ops`), which owns
> the photo upload, the storage bucket, the `dish-photos` change gate and the
> two functions this Worker calls, `public_menu_v2(slug)` and
> `public_menu_photo(slug, key)`. **Read its `proposal.md` and `design.md`
> first**: storage, addressing, the layout and the large view were settled
> there with the owner on 2026-11-16. Its `mockup/index.html` is the visual
> reference for everything below.

## Why

The table menu is text only. The owner wants each dish's photo on it, uploaded
from ops, with dishes that have no photo left exactly as they read today.

## What Changes

- **The Worker reads `public_menu_v2`.** Same response as `public_menu` plus a
  `photo` per item: `{ key, format }` or null. If ops has not published
  `public_menu_v2` yet (PostgREST reports the function missing), the Worker
  falls back to `public_menu`, so this repo can be released before or after
  ops. The response validator accepts `photo` and still refuses any field it
  does not know.
- **A photo route**, `/menu/<slug>/photo/<key>.<format>` and
  `<key>-sm.<format>`. On an edge-cache miss it asks `public_menu_photo(slug,
  key)`; null is 404. Otherwise it fetches the object from the private
  `menu-photos` bucket with `OPS_SERVICE_ROLE_KEY`, answers with the right
  `Content-Type` and `Cache-Control: public, max-age=31536000, immutable`, and
  stores it in the edge cache. A key that is not 64 hex characters, or a format
  other than `webp`/`jpeg`, is 404 without calling ops.
- **The menu page renders photos** as the parent's design D8 and spec describe:
  photo floated left with an expand mark, name and price kept on one line,
  description wrapping under the photo, sold-out photos greyed, Highlights in
  the same rows as every section, and a large view that grows from the
  thumbnail with name, price and description, closed by ×, a tap outside,
  Escape or Back, with no animation under reduced motion. Thumbnails are lazy
  and sized; the large image loads on open.
- **A menu with no photos is today's page, byte for byte**: no `has-photo`
  class, no viewer markup, no viewer script.

No change gate of its own: the parent's `dish-photos` gate decides whether
`public_menu_v2` sends any photo, so turning it off in ops turns photos off
here within the menu's cache minute.

## Non-goals

The homepage menu section (`src/sections/Menu`, static data), the receipt
page, photo upload (ops), image resizing (done on the manager's phone).

## Manual QA checklist

- [ ] At 375 px: a section mixing photographed and plain dishes keeps every
      price in one right-hand column; a long description continues under the
      photo; a long name wraps and the price stays put.
- [ ] Highlights renders as rows, never as a horizontal scroller.
- [ ] A sold-out photographed dish shows a grey photo and *Unavailable*.
- [ ] Tapping a photo opens the large view with name, price and description;
      ×, tapping outside, Escape and the phone's Back each close it and the
      page is where it was.
- [ ] With reduced motion on, it opens and closes without animating.
- [ ] A photo URL returns `Cache-Control: ... immutable`, and a second request
      is a cache hit (`cf-cache-status: HIT`).
- [ ] With `dish-photos` off in ops, the page within a minute matches today's,
      and an uncached photo URL is 404.
- [ ] A menu with no photos is byte for byte today's HTML.
- [ ] `npm run worker:typecheck`, `npm run worker:test` and the build pass.
