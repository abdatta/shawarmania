# Design — scaffold-and-deploy

## Context

Greenfield repo. The build brief (research/build-brief.md §3) fixes the stack: Vite + React 19 + TS,
GSAP + Lenis, vanilla CSS tokens + CSS Modules, GitHub Pages via Actions. This change lays that
foundation plus a visible "token-proof" page so the QA gate has something to look at.

## Goals / Non-Goals

**Goals:**
- Deterministic, clean multi-file architecture every later change slots into.
- Brand design tokens as CSS custom properties, derived from the Instagram identity.
- One (and only one) RAF loop: Lenis driven from `gsap.ticker`.
- Deploy pipeline correct for a *project page* (base path `/shawarmania/`).

**Non-Goals:**
- No real sections, no data layer, no portal (changes 2–4).
- No font subsetting/perf budget yet (change 9).

## Decisions

1. **Fonts.** Display: `Anton` (heavy condensed grotesque, free/OFL, the "huge uppercase fragments"
   look). Text: `Inter` (variable). Bengali accent: `Noto Serif Bengali` (variable) for "শাওয়ারমানী".
   All self-hosted woff2 via `@fontsource`, preloaded in `index.html` with `%BASE_URL%`-safe hrefs.
   Alternatives considered: Archivo Black (wider, less condensed), Bebas Neue (thinner strokes,
   weaker at massive sizes with photography behind).
2. **Tokens as `@property`-registered custom properties** where animatable (accent gradient stops),
   plain custom properties elsewhere. Fluid type via `clamp()` scale (`--fs-hero` … `--fs-xs`).
3. **Palette encoding:** `--bg #14100B`, `--bg-raised #1E1710`, `--cream #F5E4C7`, `--cream-dim`,
   flame gradient `--flame-gold #FFC53D → --flame-orange #F97316 → --flame-red #DC2626`, plus
   `--maroon #7F1D1D` from the festive lockup. Two-color discipline: cream on near-black; flame
   gradient reserved for accents/CTAs.
4. **Motion runtime shape:** `lib/gsap.ts` registers plugins once and exports gsap/ScrollTrigger;
   `hooks/useLenis.ts` creates Lenis inside `useGSAP`, wires `lenis.on('scroll', ScrollTrigger.update)`
   + `gsap.ticker.add`, `lagSmoothing(0)`, respects `prefers-reduced-motion` by not instantiating
   Lenis at all (native scroll). App-level `<SmoothScroll>` component owns this.
5. **Base path:** `vite.config.ts` reads `base` from env `VITE_BASE` defaulting to `/shawarmania/`
   in build and `/` in dev — CI can override when the repo name differs. `lib/assetUrl.ts` wraps
   `import.meta.env.BASE_URL`.
6. **Deploy:** official Pages actions flow (checkout@v7 → setup-node@v6 → npm ci → build →
   configure-pages@v6 → upload-pages-artifact@v5 → deploy-pages@v5), `workflow_dispatch` enabled.
   Chosen over `gh-pages` branch pushes: no history pollution, no `.nojekyll` concerns.
7. **Token-proof page** is a temporary `sections/Foundation/` section (deleted in change 4) showing
   palette swatches, type ramp, gradient, marquee-speed smooth-scroll sample content.

## Risks / Trade-offs

- [Repo name unknown → wrong base path] → env-driven `base`, README documents changing it; QA
  checks preview build asset URLs.
- [React 19 + gsap/@gsap/react ecosystem drift] → pin exact versions in package.json; `useGSAP`
  handles StrictMode double-invoke.
- [Windows dev vs Linux CI casing] → ESLint-free zone for now, but README rule + consistent
  kebab/Pascal naming convention from day one.
- [Lenis + pinned ScrollTriggers interplay] → wiring pattern from GSAP docs (ticker-driven),
  validated in the token-proof page with a tall scroll region before any real section exists.

## Migration Plan

Greenfield — nothing to migrate. Rollback = revert the change commits.

## Open Questions

- Final GitHub repo name (affects default `base`) — owner confirms before first deploy.
- Whether the owner has a licensed brand font to replace Anton later (portal open-question list).
