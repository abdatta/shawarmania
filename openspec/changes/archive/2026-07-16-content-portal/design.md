# Design — content-portal

## Context

The owner needs a local form UI to maintain `src/data/*.json` without hand-editing. Deployed site
stays fully static; the portal exists only under `vite serve`.

## Goals / Non-Goals

**Goals:** dev-only write API validated by the shared zod schemas; owner-friendly form UI at
`/admin`; atomic writes; zero portal bytes in production.
**Non-Goals:** auth (localhost dev tool), image uploads (assets are curated in-repo), git
automation (documented commands instead — owner commits explicitly).

## Decisions

1. **Vite plugin middleware** (`plugins/content-portal.ts`, `apply: 'serve'`):
   `GET/PUT /api/content/:name` over a fixed allowlist (the six schema names). PUT parses body,
   validates with `schemas[name]`, writes `tmp` + `rename` (atomic), pretty-printed + trailing
   newline for clean diffs. 422 with `z.prettifyError` output on validation failure.
2. **Validation source of truth:** the same `src/data/schema.ts` used by the site build — the
   portal literally cannot write content the build would reject.
3. **`validate-content.ts` switches to fs-reads** (no JSON imports) so data files are not config
   dependencies — dev server no longer restarts on every save; the site tab hot-reloads through
   the normal module graph instead.
4. **Portal UI:** value-driven recursive form renderer (`SchemaForm`) over the loaded JSON —
   strings/numbers/booleans/arrays-of-objects with add/remove; nullable fields get a null toggle
   with a per-field type hint map (we control the schemas, so hints stay in lockstep); fields
   named `image` render as a dropdown of image-catalog keys; `badge`/`platform` render as enums.
   Server-side zod remains the actual gate. Chosen over zod→JSON-schema introspection to keep the
   renderer small and predictable.
5. **Mounting:** `main.tsx` branches — in dev, `/admin` dynamically imports the portal instead of
   the site. Production builds tree-shake the branch (`import.meta.env.DEV` guard), so no portal
   chunks ship.
6. **Owner UX:** portal home shows the open-questions checklist (franchise numbers, hours, founder
   story, canonical WhatsApp, dessert prices, email, Web3Forms key) with fill-state derived from
   the data (e.g. hours still null → unchecked).

## Risks / Trade-offs

- [Owner edits while site tab open → stale form] → forms re-fetch on window focus.
- [Concurrent writes torn] → atomic tmp+rename; last-writer-wins is fine for a single owner.
- [Renderer hint map drifts from schema] → server-side 422 still blocks bad writes; hints only
  affect UI affordances. Covered by a self-review test editing every file.

## Migration Plan

Additive; portal removal is deleting `src/portal` + plugin. No production impact by construction.

## Open Questions

None blocking — Web3Forms key handling lands with change 8 (field exists in franchise.json now).
