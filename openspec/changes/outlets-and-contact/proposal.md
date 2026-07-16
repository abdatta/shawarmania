# Change: outlets-and-contact

> Change 7 of 9 — depends on: content-data-layer (can run parallel to story-and-proof after hero-experience).

## Why

This is the consumer conversion surface (find us / order now) and quiet investor proof (real, verifiable footprint — the anti-pattern is Absolute Shawarma claiming 150+ outlets while showing zero). Everything here is verifiable: addresses, hours, phones, FSSAI licences, live order links.

## What Changes

- `sections/Outlets/` — one card per outlet from `outlets.json`: name + landmark, address lines, hours, phone (tel: link), "Get Directions" (Google Maps URL), Swiggy/Zomato order buttons, delivery-only badge, FSSAI number; staggered fade-up entrance; map-pin SVG micro-draw accent.
- Direct-delivery strip: "Home delivery: 033 2582 3100" with tel: link.
- `sections/Footer/` — full contact block (addresses, phones, WhatsApp channel link, social icons IG/FB/YT), FSSAI licences, © line, Privacy & Terms as lightweight in-page modals (no routes), "Made in Kalyani" sign-off; footer logo mask-rise reveal on approach.
- Hours displayed with an "open now" indicator computed client-side from `hours[]` (IST), with honest fallback while owner confirms conflicting source hours.

## Capabilities

### New Capabilities
- `outlets-section`: data-driven outlet cards with ordering and directions.
- `site-footer`: contact/legal/trust footer with modal legal texts.

### Modified Capabilities
(none)

## Impact

- New: `src/sections/{Outlets,Footer}`, `src/components/{OutletCard,LegalModal,SocialLinks}`.
- Consumes `outlets.json`, `brand.json`.
- Completes the `#outlets` target that hero/header CTAs already point to.

## Manual QA checklist

- [ ] Both outlet cards render correct data (cross-check research/build-brief.md §4: addresses, FSSAI 22825123001193 / 12826013000341).
- [ ] tel:, wa.me, Maps, Swiggy, Zomato links all open correctly (mobile emulation for tel/wa).
- [ ] "Open now" logic: fake system time before/after hours → indicator flips correctly; unknown hours show "Call to confirm".
- [ ] Legal modals open/close with keyboard (Esc, focus trap) and scroll-lock behind.
- [ ] Footer reveal animation plays once and is skipped under reduced-motion.
- [ ] Header/hero "Order Now" anchors land at the outlets section with correct offset.
