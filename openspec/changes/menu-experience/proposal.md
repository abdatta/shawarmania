# Change: menu-experience

> Change 5 of 9 — depends on: hero-experience (motion foundation proven, App composition started).

## Why

The menu is the craving engine and the site's main consumer conversion surface — absoluteshawarma.com's biggest miss is having no real menu or ordering path. We show real dishes with real prices and deep-link to Swiggy/Zomato.

## What Changes

- `sections/Craving/` — appetite-building interlude: 3–4 macro food shots with fragment headlines ("PAN-FRIED." "STUFFED." "LOADED.") wiping in via clip-path reveals inside a scrubbed timeline; ingredient-transparency line (fresh daily prep).
- `sections/Menu/` — pinned horizontal-scroll gallery of featured items (the 6 Swiggy-verified shawarmas): large photo cards with name, price, veg/non-veg badge, item rating, per-card entrance driven by `containerAnimation`; snap between cards; hover lift/tilt.
- Category tiles after the gallery: Waffles, Crepes, Pancakes, Burgers, Wings (Zomato-verified categories) with item lists from `menu.json`.
- "Order on Swiggy / Zomato" buttons per card and a section-level ordering strip (uses `orderUrl`s from data; falls back to outlet order links).
- Mobile variant: native horizontal snap-scroll (no pin) — same cards, CSS scroll-snap.
- Reduced-motion: static grid layout, no pin.

## Capabilities

### New Capabilities
- `menu-section`: craving interlude + horizontal menu gallery + category tiles + order deep links, fully data-driven.

### Modified Capabilities
(none)

## Impact

- New: `src/sections/Craving`, `src/sections/Menu`, `src/components/MenuCard`.
- Consumes `menu.json`; food photography from `src/assets` (Instagram-sourced until owner supplies a shoot).
- Heaviest image section — images go through `vite-imagetools` (AVIF/WebP + explicit dimensions).

## Manual QA checklist

- [ ] Horizontal gallery pins and translates smoothly; snap lands cleanly on each card; releasing pin at both ends is jump-free.
- [ ] Every card shows correct name/price/badge from `menu.json` (spot-check against research/build-brief.md §4).
- [ ] Order buttons open the right Swiggy/Zomato pages in a new tab.
- [ ] Mobile (375px): native snap-scroll works with momentum; no pinned scene.
- [ ] Reduced-motion: static grid, all content reachable.
- [ ] Images ship as AVIF/WebP with width/height set — no CLS when they load (Lighthouse CLS ≈ 0).
- [ ] ScrollTriggers below the gallery still fire at correct positions after image load (`ScrollTrigger.refresh()` wired).
