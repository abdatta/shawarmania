# plugins/

Dev-only Vite plugins. `content-portal.ts` (change 3) will live here — it registers the
`/api/content/:name` middleware under `vite serve` only and is never part of the production build.
