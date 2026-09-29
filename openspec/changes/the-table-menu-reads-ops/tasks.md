# Tasks: the-table-menu-reads-ops

> **Read `shawarmania-ops/openspec/changes/the-menu-is-public/design.md` first.**
> That change owns `outlets.menu_slug` and `public_menu(slug)`; section 2 here
> needs its migration in the database it reads.

## 1. Reading a menu

- [x] 1.1 `worker/src/menu.ts`: `readMenu(project, slug)` calling `public_menu`, null for every refusal and a throw for a broken call; the slug shape ops enforces.
- [x] 1.2 A tripwire: the payload may carry only the menu's own keys, or the page fails visibly (`assertOnlyMenu`).

## 2. Serving it

- [x] 2.1 `worker/src/menu-page.ts`: the page (Change 12's look, the outlet named, Unavailable in the price slot), the not-found page and the unavailable page.
- [x] 2.2 `worker/src/index.ts`: `/menu` and `/menu/` 302 to `DEFAULT_MENU_SLUG`; one canonical address per menu; `/menu/_/` assets; the minute's cache and the week's last-good copy; rate limit on a miss only.
- [x] 2.3 `wrangler.toml`: the `shawarmania.in/menu*` route and `DEFAULT_MENU_SLUG = "kalyani-cafe"`.
- [x] 2.4 Tests (`worker/test/menu.test.ts`): the tripwire, prices, section anchors, Unavailable in the price slot, escaping, the not-found page naming no outlet. 79/79 Worker tests pass.
- [x] 2.5 Against `wrangler dev` and the ops worktree's isolated local stack (2026-09-28): `/menu` and `/menu/` 302 to the default; a capitalised or slash-less address 301s to its canonical one; an unknown or malformed address is 404 without a database call; an item marked unavailable in the database is greyed out as Unavailable one cache minute later; with ops' gateway stopped the last-good copy is served (200) and a never-served address gets the 503 page; a closed outlet is 404 and its last-good copy is deleted (ops down afterwards gives 503, not the old menu); `/menu/_/` assets serve; `/bill/*` refuses exactly as before; the chip pill and tap work in the Worker-rendered page.

## 3. Retiring the site's copy (after the route is live)

- [x] 3.1 Remove `menu/index.html`, `plugins/dinein-menu.ts`, `src/data/dinein.json` with its schema and `/admin` tab, `src/styles/menu.css`, `src/menu/spy.ts`; drop the Vite entry.
- [x] 3.2 Sitemap: `/menu/kalyani-cafe/` instead of `/menu/`.
- [x] 3.3 README and `worker/README.md`: the Worker serves two routes.

## 4. Gate

- [x] 4.1 `npm run build`, `npm run worker:typecheck`, `npm run worker:test`. *Build within budget with no `dist/menu/`; 79/79 Worker tests.*
- [x] 4.2 Production, 2026-09-29: the ops migration applied (after the known
  cutover-window test failure cleared at midnight UTC), the Worker deployed on
  `/bill/*` and `/menu*`; `/menu/` reaches `/menu/kalyani-cafe/` with 9 sections
  and 55 dishes from ops, `/menu/kalyani/` serves, a closed outlet and an unknown
  address are 404, and the site's own pages are unchanged.
- [ ] 4.3 Owner's manual QA gate (`proposal.md`) on production.
