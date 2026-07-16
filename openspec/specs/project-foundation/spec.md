# project-foundation Specification

## Purpose
TBD - created by archiving change scaffold-and-deploy. Update Purpose after archive.
## Requirements
### Requirement: Buildable Vite + React + TypeScript project
The project SHALL build with `npm run build` (tsc + vite build) and serve locally with `npm run dev`,
using React 19, TypeScript strict mode, and the folder architecture
`src/{sections,components,hooks,data,styles,assets,lib}` plus root `plugins/`.

#### Scenario: Clean install builds
- **WHEN** a fresh clone runs `npm ci && npm run build`
- **THEN** the build completes with zero TypeScript errors and emits a `dist/` bundle

#### Scenario: Dev server serves the app
- **WHEN** `npm run dev` is running and the browser opens the local URL
- **THEN** the token-proof page renders without console errors

### Requirement: Brand design tokens
The project SHALL define all brand colors, the fluid type scale, spacing, radii, and easing curves
as CSS custom properties in `src/styles/tokens.css`, using the researched palette (near-black
`#14100B` base, cream `#F5E4C7`, flame gradient gold→orange→red, maroon accent). Components MUST
consume tokens — no hard-coded colors in component CSS.

#### Scenario: Tokens visible in proof page
- **WHEN** the token-proof page renders
- **THEN** palette swatches, the flame gradient, and the fluid type ramp display using only var() references

#### Scenario: Fluid type scales
- **WHEN** the viewport resizes from 375px to 1440px
- **THEN** display type scales continuously via clamp() with no horizontal overflow

### Requirement: Self-hosted typography
The project SHALL self-host the display face (Lilita One — rounded, food-brand energy matched to
the hand-lettered Instagram logo), text face (Nunito Sans variable), and Bengali face
(Baloo Da 2 variable) as woff2 with `font-display: swap`, preloading critical faces via
base-path-safe links. No external font CDN requests SHALL occur.

#### Scenario: No external font requests
- **WHEN** the page loads with devtools network open
- **THEN** all font requests resolve from the site origin

#### Scenario: Bengali glyphs render
- **WHEN** the proof page shows "শাওয়ারমানী"
- **THEN** glyphs render from Baloo Da 2 (not a fallback tofu)

### Requirement: Single-RAF motion runtime
The project SHALL provide a motion runtime where GSAP plugins are registered exactly once
(`lib/gsap.ts`), and Lenis smooth scroll is driven exclusively by `gsap.ticker`
(`lagSmoothing(0)`), synchronized to ScrollTrigger. When `prefers-reduced-motion: reduce` is set,
Lenis SHALL NOT be instantiated and native scrolling applies.

#### Scenario: Smooth scroll active
- **WHEN** a user without reduced-motion scrolls the proof page
- **THEN** scrolling is interpolated by Lenis and ScrollTrigger positions stay in sync

#### Scenario: Reduced motion respected
- **WHEN** the OS reduce-motion preference is enabled and the page loads
- **THEN** native scrolling is used and scroll-driven demos render in their final state

### Requirement: Base-path-safe asset addressing
All runtime asset URLs SHALL resolve under `import.meta.env.BASE_URL` (via the `assetUrl()` helper
or bundler imports); `index.html` references SHALL use Vite's base-aware transforms. No source file
SHALL reference a root-absolute (`/...`) asset path.

#### Scenario: Preview under project base
- **WHEN** `npm run build && npm run preview` serves the bundle under the configured base path
- **THEN** every asset (fonts, images, scripts, styles) loads without 404

