# Design — menu-experience

## Context

Consumer conversion core. Fast-food "menu board" energy; real Swiggy prices; only some items have
photos (Instagram-sourced), so the gallery mixes photo cards and bold typographic cards.

## Goals / Non-Goals

**Goals:** appetite interlude; horizontal featured gallery (the one pinned scene that earns it);
full category board; Swiggy/Zomato order CTAs; Indian veg/non-veg markers.
**Non-Goals:** per-item ordering deep links (null until owner supplies), cart/ordering UI.

## Decisions

1. **Craving interlude (dark):** three tilted photo cards (shawarma plate, cheese-pull burger,
   counter scene) with giant fragment words "PAN-FRIED." "STUFFED." "LOADED." — staggered rise +
   rotate-in on enter, light per-card parallax after. No pin.
2. **Menu section (paper):** cream "menu board" — the palette flip is the section identity.
   Sticky-pinned horizontal gallery on desktop (scrub, `x` to `-(scrollWidth - clientWidth)`,
   recalculated on refresh); native `overflow-x` + scroll-snap on <900px and reduced-motion.
   Cards: photo card (image, name, ₹ price big Lilita, veg mark, rating chip, badge sticker) and
   type card (flame/maroon gradient, giant name + price) for photo-less items.
3. **Veg/non-veg:** authentic Indian FSSAI-style markers — green/red square outline with dot.
4. **Category board:** 4 category tiles (grid) listing remaining items as name–dotted-leader–price
   rows ("—" when price null, honest `counterPrice` shown with "in-store" note).
5. **Order strip:** section-level CTAs — "Order on Swiggy" (Kalyani URL) and "Order on Zomato"
   (Central Park URL) from outlets.json; phone-delivery line with tel link.
6. **Anchor:** section id `#menu` (header link becomes live).

## Risks / Trade-offs

- [Pinned horizontal scroll + Lenis jank] → transform-only scrub; `invalidateOnRefresh`; tested
  headless with wheel + steps shots.
- [Few real photos] → typographic cards designed as first-class (menu-board aesthetic), not
  placeholders.
- [Paper section contrast] → ink-on-paper tokens (AA against #F5E4C7 verified in change 9 audit).

## Migration Plan

Additive section between Marquee and the 60vh spacer. Rollback = revert commit.

## Open Questions

None — prices/URLs from data; nulls render honestly.
