# Tasks — scaffold-and-deploy

## 1. Project skeleton
- [x] 1.1 package.json: scripts (`dev`, `build` = `tsc -b && vite build`, `preview`), pinned deps
      (react, react-dom, gsap, @gsap/react, lenis, zod; dev: vite, @vitejs/plugin-react-swc,
      typescript, vite-imagetools, @fontsource packages).
- [x] 1.2 `vite.config.ts` (env-driven `base`, react-swc plugin), `tsconfig.json` strict,
      `index.html` (lang, viewport, font preloads, dark color-scheme).
- [x] 1.3 Folder architecture: `src/{main.tsx,App.tsx,sections,components,hooks,data,styles,assets,lib}`,
      root `plugins/` (empty placeholder README).

## 2. Design tokens & typography
- [x] 2.1 `styles/tokens.css`: palette (near-black/cream/flame gradient/maroon), fluid type scale,
      spacing, radii, easings, z-layers.
- [x] 2.2 `styles/base.css`: modern reset, selection color, focus-visible, scrollbar styling,
      body defaults (bg/cream).
- [x] 2.3 `styles/fonts.css` + @fontsource woff2 wiring for Anton, Inter var, Noto Serif Bengali var.

## 3. Motion runtime
- [x] 3.1 `lib/gsap.ts` — registerPlugin(ScrollTrigger, useGSAP) once; export configured gsap.
- [x] 3.2 `components/SmoothScroll/` + `hooks/useLenis.ts` — Lenis on gsap.ticker, lagSmoothing(0),
      ScrollTrigger sync, reduced-motion bypass, anchor scrollTo helper.
- [x] 3.3 `lib/assetUrl.ts` — BASE_URL join helper.

## 4. Token-proof page (temporary QA surface)
- [x] 4.1 `sections/Foundation/` — palette swatches, type ramp (display/text/Bengali), flame
      gradient sample, CTA button sample, tall smooth-scroll demo with a simple scrubbed reveal
      proving Lenis+ScrollTrigger sync.
- [x] 4.2 Reduced-motion check built into the page (badge shows "reduced motion: on/off").

## 5. Deployment
- [x] 5.1 `.github/workflows/deploy.yml` per design (Node 22, npm cache, official Pages actions,
      concurrency, workflow_dispatch).
- [x] 5.2 README.md — stack overview, scripts, deploy setup steps (Pages → GitHub Actions),
      base-path note, roadmap pointer.

## 6. Verification
- [x] 6.1 `npm run build` green; `npm run preview` spot-check under base path.
- [x] 6.2 QA: self-reviewed via headless screenshots at 375/768/1440 (static + live), fonts
      verified self-hosted, no console errors, no horizontal overflow, preview-build asset URLs
      base-path-correct. (User does final end-to-end QA at project completion per revised goal.)
