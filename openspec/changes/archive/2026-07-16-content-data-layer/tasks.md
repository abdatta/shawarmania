# Tasks — content-data-layer

## 1. Schemas & gateway
- [x] 1.1 `src/data/schema.ts` — zod schemas for brand/menu/outlets/stats/testimonials/franchise.
- [x] 1.2 `src/data/index.ts` — parse-at-boot typed gateway.

## 2. Seed data
- [x] 2.1 Six JSON files seeded with verified facts; nulls for unknowns.
- [x] 2.2 `src/data/SOURCES.md` provenance notes.

## 3. Assets
- [x] 3.1 Curate/crop images into `src/assets/img/` with descriptive names.
- [x] 3.2 `src/assets/img/index.ts` typed image catalog.

## 4. QA surface & review
- [x] 4.1 Foundation page: dev-only data dump (menu, outlets, stats) for eyeball QA.
- [x] 4.2 Self-review: build green; corrupt-a-field build fails readably; screenshots of data
      dump at phone/desktop; verify every seeded number against research docs.
