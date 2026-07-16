# Change: polish-seo-launch

> Change 9 of 9 — depends on: all previous changes (final gate before public launch).

## Why

A premium brand page earns nothing if it's slow, unfindable, or janky on real phones. This change is the launch gate: SEO, structured data, performance budget, accessibility, and a full cross-device motion audit.

## What Changes

- SEO: static `index.html` head — title, meta description, canonical, OG/Twitter cards with `og.jpg`; JSON-LD `Restaurant` + two `LocalBusiness` blocks (addresses, hours, ratings, FSSAI-verifiable identity); `robots.txt` + `sitemap.xml` in `public/`.
- Performance: image audit through `vite-imagetools` (AVIF/WebP, responsive srcsets, explicit dimensions), font subsetting (Latin + Bengali subset only where used), preload critical assets, lazy-load below-fold sections, bundle-size check; page-weight budget < 4 MB enforced by a build-time check script.
- Motion audit: every ScrollTrigger start/end re-verified after final content; `will-change` applied/released just-in-time; mid-tier Android throttled-CPU pass; kill-switch CSS class that disables all pinning if a section errors.
- Accessibility: full keyboard pass, focus-visible styles, aria labels on icon buttons, contrast check (cream-on-black + accent), reduced-motion end-to-end audit, alt text for all food photography.
- Analytics-ready: optional lightweight, cookie-less analytics hook (owner opt-in via `brand.json`), left disabled by default.
- README/OWNERS.md finalized: how to edit content, run the portal, publish, and what each section needs.

## Capabilities

### New Capabilities
- `seo-and-launch`: metadata, structured data, sitemap/robots, performance budget, and launch checklist.

### Modified Capabilities
- `project-foundation`: build gains the page-weight budget check; index.html gains full head metadata.

## Impact

- Touches `index.html`, `public/`, image imports across sections, README.
- No new runtime dependencies (analytics only as opt-in stub).

## Manual QA checklist

- [ ] Lighthouse (mobile emulation, production preview): Performance ≥ 90, Accessibility ≥ 95, SEO ≥ 95, CLS ≈ 0.
- [ ] Rich Results test: Restaurant/LocalBusiness JSON-LD validates.
- [ ] Social share preview (OG debugger): correct title/description/image.
- [ ] Full site walkthrough on a real phone (or 4× CPU throttle): all pinned scenes smooth, no scroll jank.
- [ ] Reduced-motion walkthrough end-to-end: every section readable and complete.
- [ ] Keyboard-only walkthrough: every interactive element reachable and operable.
- [ ] `npm run build` prints page-weight report under budget; GitHub Pages deploy from main succeeds end-to-end.
