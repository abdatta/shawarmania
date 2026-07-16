# Shawarmania — brand site

Premium single-page landing/brand site for **Shawarmania** (Kalyani & Kanchrapara, West Bengal) —
for visitors, prospective franchisees, and investors. Static site on GitHub Pages.

## Stack

- **Vite + React 19 + TypeScript** — static bundle, no server.
- **GSAP (ScrollTrigger, SplitText) + Lenis** — Apple-grade scroll choreography, single RAF loop.
- **Vanilla CSS design tokens + CSS Modules** — bespoke brand system, no utility framework.
- **zod-validated JSON content** in `src/data/` — edited via a local content portal (`/admin`, dev-only).

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Dev server (content portal at `/admin` once change 3 lands) |
| `npm run build` | Type-check + production bundle to `dist/` |
| `npm run preview` | Serve the production bundle locally (base-path faithful) |

## Project layout

```
openspec/          # change proposals/specs/tasks — see openspec/ROADMAP.md
research/          # brand research: build brief, Instagram findings, deep-research reports
src/
  sections/        # one folder per page section (co-located *.module.css)
  components/      # shared UI (SmoothScroll, Header, …)
  hooks/           # useReducedMotion, …
  lib/             # gsap registration, assetUrl helper
  data/            # JSON content + zod schemas (change 2)
  styles/          # tokens.css, base.css, fonts.css
plugins/           # dev-only Vite plugins (content portal API, change 3)
```

## Deploying

Pushes to `main` deploy automatically via `.github/workflows/deploy.yml`.
One-time setup: repo **Settings → Pages → Source: GitHub Actions**.

The site is built for a *project page* under `/shawarmania/`. If the repo has a
different name, set `VITE_BASE` in the workflow (and locally when previewing):
`VITE_BASE=/my-repo/ npm run build`.

## Working agreement

Work proceeds as incremental OpenSpec changes (`openspec/ROADMAP.md`), each ending with a
**manual QA checklist** in its `proposal.md`. Data files contain **verified facts only** —
unknown business numbers stay `null` and the UI renders honest fallbacks.
