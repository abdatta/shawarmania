# Tasks: table-menu-and-qr-maker

> Recorded after the fact — every task below was done and deployed before this
> folder existed. See `proposal.md`.

## 1. The table menu

- [x] 1.1 Transcribe both PDFs into `src/data/dinein.json`, validated by `dineInSchema` and editable at `/admin` → Table menu.
- [x] 1.2 `menu/index.html` as its own Vite entry; `plugins/dinein-menu.ts` renders the sections into it at build time; the page is complete with no script.
- [x] 1.3 `src/styles/menu.css`: one column, sticky section chips, prices flush right, no horizontal page scroll at 375 px.
- [x] 1.4 `src/menu/spy.ts`: the sliding chip pill, the centred strip, the tap-glide that highlights only the tapped chip, reduced motion honoured.
- [x] 1.5 Reshape to the ops menu's shape: no Food/Drinks split, portions in descriptions, no MRP, `isVeg` with the FSSAI mark.
- [x] 1.6 `/menu/` in the sitemap.

## 2. The QR maker

- [x] 2.1 `qr/index.html` as its own Vite entry, `noindex`, out of the sitemap.
- [x] 2.2 `src/qr/render.ts`: the branded card, error correction H, UTF-8 encoding.
- [x] 2.3 `src/qr/main.ts`: live render, copy to clipboard as PNG, download, `?text=` and `?caption=` prefill.
- [x] 2.4 Decode checks: ZXing reads every card at full, 1/3 and 1/5 size; a single stain up to 6 % of the code is survived every time.

## 3. Gate

- [x] 3.1 `npm run build` green and within the page-weight budget.
- [x] 3.2 Owner QA on the live site, corrections folded in.
