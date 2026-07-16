# Recommended Frontend Stack — Premium Animated Single-Brand Landing Site (verified mid-2026)

## 1. Recommended stack with exact packages + rationale

### Core: **Vite 8 + React 19 + TypeScript** (not Astro, not Next static export)

| Package | Version (mid-2026) | Role |
|---|---|---|
| `vite` | ^8.x (docs currently at 8.1.5) | Build tool + dev server + portal middleware host |
| `@vitejs/plugin-react-swc` | latest | React fast-refresh via SWC |
| `react` / `react-dom` | ^19.x | UI |
| `typescript` | ^5.x | Types across data/components |
| `gsap` | ^3.13+ | Animation core + ScrollTrigger, SplitText, ScrollSmoother — **all free** |
| `@gsap/react` | ^2.x | `useGSAP()` hook — StrictMode-safe auto-cleanup of tweens/ScrollTriggers |
| `lenis` | ^1.3.x | Smooth scroll (import `lenis/react` for `<ReactLenis>`) |
| `zod` | ^4.x | Runtime validation of data files + portal payloads |
| `vite-imagetools` | latest | Build-time AVIF/WebP `srcset` generation (sharp-based) |
| `@fontsource-variable/<font>` or local woff2 | latest | Self-hosted fonts (Pages has no font CDN edge) |

**Why Vite+React over Astro:** Astro's islands win evaporates here — a GSAP-heavy site animates *everything*, so essentially the whole page hydrates anyway. More decisively, the **content portal requirement** is a first-class Vite feature: a plugin's `configureServer` middleware gives you a dev-only write API in ~50 lines with zero extra processes. Astro runs on Vite too, but you'd fight its routing/island model for no benefit on a single-page site.

**Why not Next static export:** `output: 'export'` on GitHub Pages requires `basePath` + `assetPrefix` gymnastics, forces `images: { unoptimized: true }` (killing its main value-add), and brings App Router/RSC complexity with zero payoff for a client-animated one-pager. Confirmed still the state of affairs in the Next static-export docs and community threads.

**GSAP licensing (verified):** Webflow acquired GreenSock (Oct 2024) and made **GSAP 100% free including all formerly Club-only plugins** (SplitText, MorphSVG, DrawSVG, ScrollSmoother) in April 2025, **including commercial use** — no license key, no auth token, plain `npm i gsap`. GSAP 3.13 also rewrote SplitText (50% smaller, screen-reader accessible, built-in masking for reveal effects — ideal for "premium" type reveals).

**Lenis (verified):** actively maintained by darkroom.engineering, v1.3.x publishing regularly through 2026. Use the `lenis` package (the old `@studio-freight/*` packages are retired). Standard ScrollTrigger sync:

```ts
lenis.on('scroll', ScrollTrigger.update)
gsap.ticker.add((t) => lenis.raf(t * 1000))
gsap.ticker.lagSmoothing(0)
```

### Styling verdict: **vanilla CSS with design tokens + CSS Modules** (Tailwind v4 as runner-up)

Tailwind v4 is healthy (CSS-first `@theme` config, Rust Oxide engine, first-party `@tailwindcss/vite` plugin, no `tailwind.config.js`) — but for a *bespoke* premium single-brand site I recommend against it:

- Premium sites live on hand-tuned fluid type (`clamp()`), bespoke easings, layered pseudo-elements, `@property`-registered custom properties for animatable tokens — all more natural in plain CSS.
- GSAP class-toggle effects (`toggleClass` on ScrollTrigger) pair cleanly with semantic CSS Module classes; utility soup makes toggled-state styling awkward.
- One brand = one token sheet. Tailwind's win (constraint system across a team/many pages) doesn't apply.

Structure: `styles/tokens.css` (colors, space scale, type scale, easings as CSS custom properties) + `styles/base.css` (reset, fonts) + co-located `*.module.css` per component. If the team strongly prefers utilities, `tailwindcss` + `@tailwindcss/vite` with `@theme` mapping the brand tokens is a legitimate second choice — don't mix both.

---

## 2. Repo layout

```
shawarmania/
├─ .github/workflows/deploy.yml
├─ public/
│  ├─ favicon.svg
│  └─ og.jpg
├─ src/
│  ├─ main.tsx                  # mounts <App/>; dev-only dynamic import of portal
│  ├─ App.tsx                   # section composition + <ReactLenis root>
│  ├─ components/               # Button, Logo, MenuCard, OutletCard, Marquee…
│  │  └─ Button/{Button.tsx, Button.module.css}
│  ├─ sections/                 # one folder per scroll section
│  │  ├─ Hero/{Hero.tsx, Hero.module.css}
│  │  ├─ Story/  Menu/  Outlets/  Footer/
│  ├─ hooks/
│  │  ├─ useLenisScrollTrigger.ts   # Lenis↔ScrollTrigger wiring (once)
│  │  ├─ useReducedMotion.ts
│  │  └─ useSectionReveal.ts        # shared reveal patterns
│  ├─ data/
│  │  ├─ brand.json  menu.json  outlets.json     # portal-writable
│  │  ├─ schema.ts               # zod schemas (shared with portal API)
│  │  └─ index.ts                # parse JSON through zod → typed exports
│  ├─ portal/                    # dev-only content portal UI
│  │  ├─ Portal.tsx  fields/  api.ts
│  ├─ styles/{tokens.css, base.css, fonts.css}
│  ├─ assets/                    # images/fonts imported via bundler (hashed)
│  └─ lib/{gsap.ts, assetUrl.ts} # gsap.registerPlugin once; BASE_URL helper
├─ plugins/content-portal.ts     # Vite plugin: dev write API
├─ vite.config.ts                # base: '/shawarmania/'
├─ tsconfig.json
└─ package.json
```

Data pattern: JSON on disk (portal-writable, diff-friendly) + a TS gateway (`data/index.ts`) that `zod.parse`s each file so the site gets full types and fails loudly at build if the owner's edits break the schema.

---

## 3. Content portal architecture (dev-only Vite middleware)

**Single process, no separate server.** A Vite plugin registers middleware only under `vite serve`; the portal UI and API are physically absent from the production bundle.

```ts
// plugins/content-portal.ts
import type { Plugin } from 'vite'
import fs from 'node:fs/promises'
import path from 'node:path'
import { schemas } from '../src/data/schema'   // zod, shared with the UI

const DATA_DIR = path.resolve(__dirname, '../src/data')
const ALLOWED = new Set(['brand', 'menu', 'outlets'])   // path allowlist

export function contentPortal(): Plugin {
  return {
    name: 'content-portal',
    apply: 'serve',                       // <-- never part of `vite build`
    configureServer(server) {
      server.middlewares.use('/api/content', async (req, res) => {
        const name = req.url!.slice(1).replace(/\.json$/, '')
        if (!ALLOWED.has(name)) { res.statusCode = 404; return res.end() }
        const file = path.join(DATA_DIR, `${name}.json`)

        if (req.method === 'GET') {
          res.setHeader('content-type', 'application/json')
          return res.end(await fs.readFile(file))
        }
        if (req.method === 'PUT') {
          const body = await readBody(req)                 // collect stream
          const parsed = schemas[name].safeParse(JSON.parse(body))
          if (!parsed.success) { res.statusCode = 422; return res.end(JSON.stringify(parsed.error.format())) }
          const tmp = file + '.tmp'                        // atomic write
          await fs.writeFile(tmp, JSON.stringify(parsed.data, null, 2) + '\n')
          await fs.rename(tmp, file)
          res.statusCode = 204; return res.end()
        }
        res.statusCode = 405; res.end()
      })
    },
  }
}
```

Safety properties:
- **`apply: 'serve'`** — plugin isn't even instantiated during build; no write API can ship.
- **Allowlist, not paths from the client** — the URL selects from a fixed set; no traversal possible.
- **Zod validation before write** — the same schemas the site build uses, so the portal *cannot* write data the build would reject.
- **Atomic tmp+rename** — no torn JSON if HMR reads mid-write.
- **Server binds to localhost by default** — don't pass `--host` when the owner runs it.

**Portal UI:** gate it in `main.tsx` so Rollup dead-code-eliminates it from production:

```ts
if (import.meta.env.DEV && location.pathname.endsWith('/admin')) {
  import('./portal/Portal').then(m => m.mount())
}
```

Owner workflow: `npm run dev` → open `http://localhost:5173/admin` → edit forms (fields generated from the zod schemas) → Save issues `PUT /api/content/menu` → file written → **Vite HMR instantly re-renders the real site in another tab** — live preview for free. Publishing = commit + push (a `npm run publish` script wrapping `git add src/data && git commit && git push` keeps the owner out of git).

---

## 4. GitHub Actions workflow (Pages, verified against current Vite docs)

`vite.config.ts`:

```ts
export default defineConfig({
  base: '/shawarmania/',        // repo name — project pages requirement
  plugins: [react(), contentPortal(), imagetools()],
})
```

`.github/workflows/deploy.yml` (action majors current per vite.dev: checkout v7, setup-node v6, configure-pages v6, upload-pages-artifact v5, deploy-pages v5 — pin to SHAs in production):

```yaml
name: Deploy to GitHub Pages
on:
  push: { branches: [main] }
  workflow_dispatch:

permissions:
  contents: read
  pages: write
  id-token: write

concurrency: { group: pages, cancel-in-progress: true }

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v7
      - uses: actions/setup-node@v6
        with: { node-version: 22, cache: npm }
      - run: npm ci
      - run: npm run build          # tsc -b && vite build
      - uses: actions/configure-pages@v6
      - uses: actions/upload-pages-artifact@v5
        with: { path: dist }
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v5
```

Repo Settings → Pages → Source: **GitHub Actions**. Data edits pushed by the owner trigger redeploys automatically.

---

## 5. Pitfalls

**Base path**
- Everything the bundler touches (imported images, CSS `url()`, chunks) is rewritten with `base` automatically. Anything referenced by raw absolute string — `public/` files, OG meta tags, manifest, favicons in `index.html` — is **not** where you write JS strings; use `import.meta.env.BASE_URL + 'og.jpg'` (a tiny `assetUrl()` helper) and `%BASE_URL%` in `index.html`.
- Site works locally at `/` but 404s assets on Pages → almost always a hardcoded leading `/`.
- Dev on Windows, build on Linux CI: **file-path casing mismatches** build fine locally and 404 in CI. Keep imports exactly matching filenames.

**404 / routing**
- Single-page landing: use in-page anchors (`#menu`, `#outlets`) driven by Lenis `lenis.scrollTo()` — no router, no 404 problem. If you ever add client routes, GitHub Pages has no SPA rewrite; you'd need the `404.html` copy-of-index hack or a hash router. Avoid by staying single-page.

**Fonts**
- Self-host (woff2 in `src/assets/fonts` or `@fontsource-variable/*`); no external font CDN dependency and no CSP/latency surprises. `<link rel="preload" as="font" type="font/woff2" crossorigin>` the 1–2 critical faces (remember `%BASE_URL%`).
- **GSAP-specific:** SplitText measured before fonts load = wrong line breaks; ScrollTrigger positions computed before layout settles = misfired triggers. Run `document.fonts.ready.then(() => { split(); ScrollTrigger.refresh() })`, and `font-display: swap` + preload to minimize the window.
- Check the *webfont license* of any premium typeface — self-hosting on a public site usually needs a web license.

**Images**
- Pages serves static bytes only — no on-the-fly optimization. Pre-generate at build with `vite-imagetools`: `import hero from './hero.jpg?w=800;1600;2400&format=avif;webp;jpeg&as=picture'`. Explicit `width`/`height` (or `aspect-ratio`) on every image — late layout shifts silently break every ScrollTrigger start/end below them (or call `ScrollTrigger.refresh()` on image load).
- Hashed asset filenames = immutable caching for free; keep hero media lean (Pages has no edge tuning, soft 1 GB site / ~100 MB file limits).

**GSAP/Lenis integration**
- Register plugins once in `lib/gsap.ts` (`gsap.registerPlugin(ScrollTrigger, SplitText)`), import that everywhere.
- Always `useGSAP(() => {...}, { scope: containerRef })` — auto-reverts tweens/triggers on unmount and survives StrictMode double-invoke; stray ScrollTriggers after HMR are the classic dev-mode bug.
- Drive Lenis from `gsap.ticker` (snippet in §1) and `lagSmoothing(0)`; don't run two RAF loops.
- Wrap effects in `gsap.matchMedia()` and honor `prefers-reduced-motion` — part of "premium" is not nauseating users; also gate heavy pinned scenes to `(min-width: ...)`.
- Since ScrollTrigger + Lenis is the stack, you don't need ScrollSmoother (now free too) — Lenis is lighter and framework-agnostic; pick one, not both.

**Jekyll**
- Deploying via `actions/deploy-pages` skips Jekyll processing entirely (no `.nojekyll` needed). Only branch-based Pages deploys need `.nojekyll` — a common stale-blog-post trap.

Sources:
- [Webflow makes GSAP 100% free](https://webflow.com/updates/gsap-becomes-free)
- [GSAP 3.13 release (free plugins, new SplitText)](https://gsap.com/blog/3-13/)
- [GSAP pricing](https://gsap.com/pricing/)
- [GSAP + React resources (useGSAP)](https://gsap.com/resources/React/)
- [Lenis](https://www.lenis.dev/) / [darkroomengineering/lenis GitHub](https://github.com/darkroomengineering/lenis) / [lenis on npm](https://www.npmjs.com/package/lenis)
- [Tailwind CSS v4.0 announcement (CSS-first, @tailwindcss/vite)](https://tailwindcss.com/blog/tailwindcss-v4)
- [Vite — Deploying a Static Site (GitHub Pages, base config, workflow)](https://vite.dev/guide/static-deploy)
- [Next.js — Static Exports guide (image/basePath limitations)](https://nextjs.org/docs/pages/guides/static-exports)
- [next-image-export-optimizer (Next static image workaround)](https://github.com/Niels-IO/next-image-export-optimizer)