# Change: scaffold-and-deploy

> Change 1 of 9 — see `openspec/ROADMAP.md` for the full sequence.

## Why

Shawarmania has no website; everything downstream (data layer, portal, animated sections) needs a working project skeleton first. This change establishes the fixed tech stack (Vite + React 19 + TS, GSAP + Lenis, vanilla CSS tokens + CSS Modules), the folder architecture, and a GitHub Pages deploy pipeline so every later change ships behind the same build/deploy gate.

## What Changes

- Vite + React 19 + TypeScript project scaffold (multi-file architecture: `sections/`, `components/`, `hooks/`, `data/`, `styles/`, `lib/`).
- Design-token stylesheet (`styles/tokens.css`): near-black/cream palette, flame gradient accents, fluid type scale, spacing, easings — derived from the Instagram brand research.
- Self-hosted fonts (heavy condensed display + text sans) with preload wiring.
- GSAP + Lenis motion foundation: `lib/gsap.ts` (single registerPlugin), `hooks/useLenis.ts` (Lenis driven by gsap.ticker, `lagSmoothing(0)`, reduced-motion aware), `lib/assetUrl.ts` (BASE_URL-safe asset helper).
- Placeholder `App.tsx` rendering a token-proof page (brand colors, both typefaces, smooth scroll demo) so QA can verify the foundation visually.
- GitHub Actions workflow deploying `dist/` to GitHub Pages (`base` configured for project pages).
- Repo hygiene: `npm run dev|build|preview` scripts, README with owner-facing run instructions.

## Capabilities

### New Capabilities
- `project-foundation`: build system, folder architecture, design tokens, fonts, and motion runtime (GSAP+Lenis wiring) that all sections build on.
- `pages-deployment`: automated GitHub Pages deployment on push to main, with correct base-path handling for a project page.

### Modified Capabilities
(none — greenfield)

## Impact

- New: `package.json` deps (react, react-dom, gsap, @gsap/react, lenis, zod; dev: vite, @vitejs/plugin-react-swc, typescript, vite-imagetools), `vite.config.ts`, `tsconfig*.json`, `index.html`, `src/**`, `.github/workflows/deploy.yml`.
- No external services. Deploy requires repo Settings → Pages → Source = GitHub Actions (manual, one-time, done by owner).

## Manual QA checklist

- [ ] `npm run dev` serves the token-proof page; brand colors and both typefaces render.
- [ ] Scrolling feels smoothed (Lenis active); with OS "reduce motion" enabled, native scroll is used.
- [ ] `npm run build && npm run preview` works; page renders identically from the production bundle.
- [ ] Assets load with the project base path in the preview build (no absolute-`/` 404s in devtools).
- [ ] `deploy.yml` is syntactically valid (actionlint or GitHub UI dry run) — full Pages verification happens once the repo is pushed to GitHub.
- [ ] Resize 375px → 1440px: no horizontal scrollbar; fluid type scales.
