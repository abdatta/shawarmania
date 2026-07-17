# Change: qa-fixes-round-1

## Why

Owner QA of the completed site returned seven fixes: brand rules (English-only name, bigger logo
presence), content (dish photos, wording), and layout polish (stat spacing, testimonial grid,
franchise section order).

## What Changes

- **English-only branding**: remove the Bengali name (শাওয়ারমানী) from hero, marquee, story
  background, footer, and JSON-LD; drop `nameBengali` from the brand schema/data; remove the
  Bengali font entirely.
- **Iconic logo presence**: large logo added to the hero's right column above the neon photo card.
- **Dish photos**: crops from the brand's own festive-post food collage — Double Chicken Shawarma
  (wraps duo) and Healthy Chicken Shawarma Salad (salad bowl); Mozzarella reassigned the gooey
  close-up; Mayonnaise becomes a type card.
- **Wording sweep**: all "spit" phrasing replaced ("grill"/"slow-roasted" etc.) per owner
  direction; full proofread of every UI string.
- **Proof band**: stats centered with even columns.
- **Testimonials**: restructured into clean video row + quote row (no masonry overlap).
- **Franchise**: enquiry form moves before the FAQ; FAQ ends the section.

## Capabilities

### New Capabilities
(none)

### Modified Capabilities
- `hero-section`: hero composition requirement drops the Bengali accent and adds the prominent
  logo; marquee requirement drops Bengali script.

## Impact

brand schema+json, menu.json, image catalog (+2 assets), Hero, Marquee, Story, Proof,
Testimonials, Franchise, Footer, index.html, fonts (Baloo Da 2 removed).

## Manual QA checklist

- [ ] No Bengali glyphs anywhere on the page or in metadata.
- [ ] Logo clearly visible in hero right column at all widths.
- [ ] Double Chicken + Salad cards show the collage renders; Mozzarella shows the cheese close-up.
- [ ] No occurrence of the word "spit" sitewide; copy proofread.
- [ ] Stat band evenly spaced/centered at 375/768/1440.
- [ ] Testimonial rows tidy, no overlap.
- [ ] Franchise order: tiers → support → process → enquiry → FAQ.
