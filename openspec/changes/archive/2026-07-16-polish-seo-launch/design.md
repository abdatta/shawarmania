# Design — polish-seo-launch

## Context

Launch gate: the full page exists; make it findable, fast, accessible, and verified end-to-end.

## Goals / Non-Goals

**Goals:** complete head metadata + JSON-LD; robots/sitemap/og image; WebP image pipeline;
global ScrollTrigger refresh on load; skip link + a11y sweep; page-weight budget check in the
build; owner README; final whole-site review.
**Non-Goals:** analytics (owner opt-in later), Lighthouse CI automation (manual run is the user's
final QA; we verify the measurable proxies: weight, formats, meta, console cleanliness).

## Decisions

1. **Head:** title, description, canonical (placeholder domain noted in README), theme-color,
   OG/Twitter cards pointing at `%BASE_URL%og.jpg`, JSON-LD `Restaurant` (aggregate brand, both
   locations as `department` LocalBusiness entries with addresses/phones/served-cuisine/ratings
   from research).
2. **`public/`:** robots.txt (allow all + sitemap pointer), sitemap.xml (single URL),
   og.jpg (1200×630 composed from the neon storefront shot).
3. **Images → WebP:** imageCatalog imports switch to `?format=webp&quality=82` via vite-imagetools
   (JPEG sources stay in repo; build emits WebP). Logo stays PNG (transparency).
4. **Motion polish:** `ScrollTrigger.refresh()` on window `load` (after images) in SmoothScroll;
   ensures trigger positions account for late image layout.
5. **A11y:** skip-to-content link; `aria-hidden` sweep; marquee Bengali phrase gets `lang="bn"`;
   focus-visible verified on dark and paper sections.
6. **Budget:** `scripts/check-weight.mjs` — sums dist/ assets, fails build script (`npm run build`
   chains it) if initial-load weight (html+css+js+fonts+eager images) exceeds 1.5 MB or total
   dist exceeds 4 MB.
7. **README:** owner runbook — edit via portal, publish commands, deploy setup, updating prices.

## Risks / Trade-offs

- [WebP-only sources] → universal support since 2020; acceptable for this audience (mobile Chrome
  dominant in WB).
- [JSON-LD ratings drift] → values sourced from data snapshot; owner updates via portal are not
  reflected in JSON-LD automatically (documented limitation in README; revisit if needed).

## Migration Plan

Additive polish. Rollback = revert commit.

## Open Questions

Final production domain (canonical + sitemap use the GitHub Pages URL until a custom domain exists).
