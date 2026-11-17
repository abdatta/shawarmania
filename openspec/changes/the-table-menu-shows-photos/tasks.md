# Tasks: the-table-menu-shows-photos

Read the parent change first: `shawarmania-ops/openspec/changes/a-dish-can-show-its-photo/`.

## 1. Reading photos

- [ ] 1.1 `worker/src/menu.ts`: call `public_menu_v2`, fall back to
  `public_menu` when PostgREST reports the function missing; extend the
  validator to accept `photo` (`{ key: 64 hex, format: 'webp' | 'jpeg' }` or
  null) and keep refusing unknown fields. Tests for v2, the fallback, a bad
  photo shape and an unknown field.

## 2. The photo route

- [ ] 2.1 `/menu/<slug>/photo/<key>[-sm].<format>`: shape check without
  calling ops; edge cache lookup; `public_menu_photo` on a miss; fetch the
  object from the private bucket with the service-role key; content type,
  year-long immutable caching, cache put; 404 for every refusal. Tests for
  each path, including that a refusal never reaches storage.

## 3. The page

- [ ] 3.1 `worker/src/menu-page.ts`: photo rows, the expand mark, sold-out
  greying and the large view from the parent's design D8 and
  `mockup/index.html`; emit the viewer only when the page has a photo; Back
  closes the viewer through a history entry; reduced motion skips animation.
  Tests: a page with no photos is identical to today's output; a mixed page
  has the expected markup; highlights use ordinary rows.
- [ ] 3.2 Update `worker/README.md` (the photo route, its cache, the
  `public_menu_v2` fallback) and the `table-menu` spec delta's requirements in
  the living spec on archive.

## 4. Manual QA

- [ ] 4.1 Run the proposal's Manual QA checklist against a local ops stack and,
  after release, against `shawarmania.in/menu/<slug>/`: 375 px and a tablet
  width, reduced motion, both closing paths, cache headers, the gate off and
  on, and `worker:typecheck`, `worker:test` and the build passing.
