# Change: content-data-layer

> Change 2 of 9 — depends on: scaffold-and-deploy.

## Why

Every section renders real business content (menu, outlets, stats, franchise terms), and the owner must be able to edit it without touching components. A single typed, validated data layer — JSON files parsed through zod schemas — is the contract between the site, the future content portal, and the GitHub Pages build.

## What Changes

- `src/data/schema.ts`: zod schemas for six content domains — `brand`, `menu`, `outlets`, `stats`, `testimonials`, `franchise` (field lists per research/build-brief.md §5). Unknown business facts are nullable by design; components must render fallbacks ("Contact for details"), never invented numbers.
- Six `src/data/*.json` files seeded with **verified research data only**: Swiggy-verified menu prices (₹139–₹238), both outlets with addresses/phones/FSSAI, ratings (Google 4.4/362, Zomato 4.3/1,206+), taglines, socials, WhatsApp channel. Franchise economics stay null until the owner fills them.
- `src/data/index.ts`: typed gateway that `parse`s each JSON at module load — build fails loudly on schema violations.
- Brand asset intake: Instagram photos already downloaded to `research/instagram/images/` get curated into `src/assets/` with descriptive names; logo extracted from profile picture.
- Token-proof page extended to dump loaded data (dev-only debug list) so QA can verify parsing.

## Capabilities

### New Capabilities
- `content-schema`: zod-validated shape of all site content; the shared contract for site build and portal writes.
- `seed-content`: verified Shawarmania facts committed as the initial dataset, with explicit nulls for owner-pending fields.

### Modified Capabilities
(none)

## Impact

- New: `src/data/schema.ts`, `src/data/index.ts`, `src/data/{brand,menu,outlets,stats,testimonials,franchise}.json`, curated `src/assets/img/*`.
- `zod` becomes a production dependency (already installed in change 1).

## Manual QA checklist

- [ ] `npm run build` passes — all six JSON files satisfy their schemas.
- [ ] Corrupting a JSON field (wrong type) makes `npm run build` fail with a readable zod error, then revert.
- [ ] Dev debug page lists menu items with correct prices (spot-check ₹139 Classic Chicken Shawarma) and both outlets.
- [ ] Franchise nulls render as nulls (no fabricated numbers anywhere in JSON).
- [ ] Images in `src/assets/` load in dev and in `npm run preview` (base-path safe).
