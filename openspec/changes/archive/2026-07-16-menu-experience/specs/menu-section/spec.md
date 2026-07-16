# menu-section — delta spec

## ADDED Requirements

### Requirement: Craving interlude
Following the marquee, a dark interlude SHALL present three real food/scene photographs as tilted
cards with giant fragment headlines, entering with staggered rise-and-rotate animation (one-shot)
and light parallax. Reduced motion renders them composed.

#### Scenario: Interlude reveals on scroll
- **WHEN** a motion-enabled user scrolls the interlude into view
- **THEN** cards and words rise in staggered order, transform/opacity only

### Requirement: Featured menu gallery
A `#menu` section on the paper (cream) palette SHALL present all `featured` menu items as large
cards — photo cards where an image exists, typographic cards otherwise — each showing name,
₹ price (or "in-store ₹N" / "price on ask" when null), Indian veg/non-veg marker, rating chip
when present, and badge sticker when present. On desktop with motion enabled the gallery SHALL be
a pinned horizontal scrub; on small screens or reduced motion it SHALL be a native snap-scroll
row with identical cards.

#### Scenario: Desktop pinned gallery
- **WHEN** a desktop motion-enabled user scrolls through `#menu`
- **THEN** the section pins and cards translate horizontally in sync with scroll, releasing
  cleanly at both ends

#### Scenario: Mobile snap gallery
- **WHEN** the viewport is under 900px
- **THEN** the same cards scroll natively with scroll-snap and momentum, no pinning

#### Scenario: Honest null prices
- **WHEN** an item has `price: null` and `counterPrice: 100`
- **THEN** the card shows "₹100 in-store" (never an invented delivery price)

### Requirement: Category board and order strip
Below the gallery, category tiles SHALL list the non-featured items with dotted-leader price rows,
and an order strip SHALL link "Order on Swiggy" / "Order on Zomato" (from outlets.json) plus the
delivery phone as tel:. Links open in new tabs.

#### Scenario: Order CTAs resolve
- **WHEN** the order strip renders
- **THEN** Swiggy/Zomato buttons carry the researched outlet URLs and the tel: link dials 033 2582 3100
