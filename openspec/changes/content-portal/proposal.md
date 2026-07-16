# Change: content-portal

> Change 3 of 9 — depends on: content-data-layer.

## Why

The owner (non-technical) must be able to fill in and maintain brand info, menu, outlet details, franchise numbers, and testimonials without editing JSON by hand. A locally-run portal writes validated content back to `src/data/*.json`, which is then committed — keeping the deployed site fully static.

## What Changes

- `plugins/content-portal.ts` — Vite plugin (`apply: 'serve'`, dev-only) exposing `/api/content/:name`: GET returns the JSON file; PUT validates the payload against the shared zod schema and writes atomically (tmp + rename). Fixed allowlist of the six data files; no client-supplied paths.
- `src/portal/` — React admin UI mounted only in dev at `/admin` (dynamic import gated by `import.meta.env.DEV`, dead-code-eliminated from production): form per data file with field-level inputs, veg/spice/badge selectors for menu items, add/remove rows for lists, image filename pickers, save with inline validation errors.
- Live preview loop: saving triggers Vite HMR so the real site (open in another tab) re-renders instantly.
- `npm run content` script — alias of `npm run dev` plus a console hint printing the `/admin` URL.
- Portal landing view lists the "open questions" from research (franchise numbers, hours confirmation, founder story…) as a fill-me checklist.

## Capabilities

### New Capabilities
- `content-editing`: dev-only form UI + write API for all six content files, validated by the same schemas the build uses.

### Modified Capabilities
(none — `content-schema` is consumed, not changed)

## Impact

- New: `plugins/content-portal.ts`, `src/portal/**`.
- `vite.config.ts` gains the plugin. Production bundle provably unchanged (no portal chunks in `dist/`).
- Security: API only exists under `vite serve` on localhost; path allowlist; zod validation pre-write.

## Manual QA checklist

- [ ] `npm run dev` → `http://localhost:5173/admin` renders the portal; all six files load into forms.
- [ ] Editing a menu price and saving updates `src/data/menu.json` on disk (pretty-printed, newline-terminated) and hot-reloads the site tab.
- [ ] Submitting an invalid value (empty name, negative price) shows an inline error and does NOT write the file.
- [ ] `npm run build` output contains no portal code (`grep -r "portal" dist/` finds nothing) and no `/api` references.
- [ ] `git diff` after edits shows a clean, minimal JSON diff (owner-friendly commits).
