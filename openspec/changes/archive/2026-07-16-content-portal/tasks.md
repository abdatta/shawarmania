# Tasks — content-portal

- [x] 1.1 `plugins/content-portal.ts` — serve-only middleware, allowlist, zod validation, atomic writes.
- [x] 1.2 `validate-content.ts` → fs-based reads (data files stop being config deps).
- [x] 2.1 `src/portal/` — Portal shell (tabs per file, checklist home), SchemaForm renderer, api client, styles.
- [x] 2.2 `main.tsx` dev-only `/admin` branch; `npm run content` script.
- [x] 3.1 Self-review: playwright drives /admin — edit+save menu price (file changes, 200), invalid
      price (422, file untouched), image dropdown lists catalog keys; dist/ contains no portal
      traces; screenshots of portal at desktop width; revert test edits.
