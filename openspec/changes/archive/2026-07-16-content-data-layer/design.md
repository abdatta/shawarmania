# Design — content-data-layer

## Context

All sections render from six JSON content files; the portal (change 3) writes them; the build
validates them. Verified facts come from research/build-brief.md §4 and
research/instagram/findings.md (incl. the June-2026 lab certificate and in-store neon-sign prices).

## Goals / Non-Goals

**Goals:** one zod schema module shared by site + portal; seeded data that is 100% sourced;
typed, parse-at-boot gateway; curated image assets with descriptive names.
**Non-Goals:** portal UI (change 3); section components consuming the data (changes 4–8).

## Decisions

1. **zod v4, one `schema.ts`**, exporting `schemas` record keyed by file name — the portal API
   imports the same record for validation. Types via `z.infer` re-exported from `data/index.ts`.
2. **Nullable-by-design:** unknown business facts (franchise fees, founder, email, exact hours)
   are `nullable()` fields seeded as `null`. UI contracts render fallbacks. A `sourcing` comment
   convention documents where each seeded value came from (JSON has no comments — sources live in
   `data/SOURCES.md`).
3. **Menu model:** `categories[]` + `items[]` with `featured` flag for the signature gallery;
   `price` = current Swiggy price (₹), `counterPrice` optional (neon-sign in-store price where
   known, e.g. Chicken Shawarma ₹100); veg boolean; optional rating/ratingCount from Swiggy.
4. **Lab report** gets its own object in `stats.json` (`labReport`) — protein/energy/safety
   values + cert metadata — powering a distinctive "lab-tested" trust module later.
5. **Images:** curated copies in `src/assets/img/` (bundler-hashed, imported by sections),
   crops via PIL where reel covers carry text overlays. Data files reference images by
   catalog key (e.g. `"image": "shawarma-plate"`), resolved by a typed `imageCatalog` in
   `src/assets/img/index.ts` — keeps JSON portable and the portal simple (dropdown of keys).
6. **Dev debug view:** Foundation page gains a data dump block (dev-only) listing parsed
   content so QA can eyeball every seeded fact.

## Risks / Trade-offs

- [Three conflicting FSSAI numbers in the wild] → outlet cards use the per-outlet numbers from
  Zomato listings; cert number stored on labReport; portal open-questions list asks the owner to
  reconcile.
- [Platform prices drift] → prices carry `asOf: "2026-07"` metadata; portal makes updating trivial.
- [Image rights] → all assets are the brand's own public posts, used for the brand's own site at
  the owner's direction; testimonial faces are brand-published marketing with source links.

## Migration Plan

Additive only. Rollback = revert commit.

## Open Questions

Tracked in `franchise.json`/portal checklist (change 3): franchise economics, founder story,
canonical hours/phones/FSSAI, veg/dessert prices, third-outlet status.
