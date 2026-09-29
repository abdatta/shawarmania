# Change: table-menu-and-qr-maker

> Change 12 — depends on: 1 `scaffold-and-deploy`, 11 `legal-and-messaging-pages`
> (whose script-free document pattern `/menu/` copies).
>
> **Recorded after the fact.** This work shipped on 2026-09-26 and 2026-09-28
> without a change folder, which is not how this repo works [owner, 2026-09-28].
> The two shipped commits and this record were later squashed into the one
> commit that carries this folder. This folder states what was built and why, as it
> is, so the living specs describe the site that is live; it is archived as soon
> as it is written. Change 13 `the-table-menu-reads-ops` builds on it the proper
> way.

## Why

The owner's dine-in menus existed only as two print PDFs (food, 7 A4 pages;
drinks, 2 A5 pages; 27 MB and 6.5 MB). Tables at Kalyani Cafe needed a QR code
that opens the menu on a customer's phone [owner, 2026-09-26]. The PDFs were too
heavy for restaurant Wi-Fi and unreadable at phone width, so the menu became a
page.

Printing that QR code, and any other the business needs, then wanted a tool:
paste a link, get a Shawarmania-branded code, copy it [owner, 2026-09-26].

## What Changed

- **`/menu/`** — one phone-first page with every dish from both PDFs, built at
  deploy time from `src/data/dinein.json` by `plugins/dinein-menu.ts`, complete
  with no script; editable in `/admin` → Table menu.
  - Sticky section chips; a small scroll-spy slides a flame pill to the section
    being read, keeps it centred, and glides the page when a chip is tapped
    [owner, 2026-09-26].
  - Since 2026-09-28 the data carries exactly what the ops menu can store
    [owner, 2026-09-28]: no Food/Drinks split, portions in the description as
    "(4 pieces)", no "MRP" price (Packaged Water left off), and a veg flag per
    item shown as the FSSAI mark. Veg/non-veg was derived from the names and
    confirmed by the owner (desserts and the Eye Opener's brownie are eggless).
- **`/qr/`** — a QR maker: link or text and an optional caption in, a branded card
  out (logo, cream plate, rounded maroon-to-ember modules, flame finder eyes, the
  flame-roll badge in the centre, error correction H), copied to the clipboard or
  downloaded as a 1000 px wide PNG. Browser-only; `noindex`, not in the sitemap.
- **`brand/qr/`** — a plain level-Q code for `https://shawarmania.in/menu/`.

## Departures from the source PDFs

- The Smashed Veg Burger's printed description is the Lebanese Chicken
  Shawarma's ("Tender chicken paired with silky hummus & tahini…"); on a veg item
  it would mislead, so the page shows none.
- "Fish Fry [Vetki]" reads "Fish Fry (Vetki)".
- "Sauted Mushroom Rice" keeps the printed spelling, to match bills.

## Manual QA gate

Walked by the owner on the live site between 2026-09-26 and 2026-09-28, with
their corrections folded in: chip transitions smoothed, the QR maker's labels
replaced by placeholders, its copy and download moved to icon buttons in the
preview frame's corner, portions bracketed.
