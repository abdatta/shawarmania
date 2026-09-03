# Shawarmania site — change roadmap

Premium single-page brand site for Shawarmania (Kalyani + Kanchrapara), deployed to GitHub Pages — plus one Cloudflare Worker on `/bill/*`, which since change 10 is the first server-side code this repo holds.
Source of truth for scope/design: `research/build-brief.md`. Each change ends with a **manual QA
gate** — the owner walks the checklist in the change's `proposal.md` before the next change begins.

## Status: ✅ changes 1–9 implemented and archived (2026-07-16); 🔄 change 10 active; site live at shawarmania.in

🔄 **Change 10 `public-bill-receipt-page` is active (2026-09-03)** — the child half of a pair, its
parent being `public-bill-receipt` in the `shawarmania-ops` repo, which owns the receipt link and the
data. Neither half is useful alone: that one produces a link with nothing to open, this one a page
with no link to serve.

It adds the first server-side code this repo has ever held, so the "fully static, no server"
description has been corrected in both places above and in `README.md` rather than left to rot.

| | |
|---|---|
| **Built** | `worker/` — the Worker, the themed page, the 80 mm PDF, the headers, the cache and the abuse limits. `worker/README.md` carries the reasoning. |
| **Verified** | against `wrangler dev` and the ops repo's local Supabase: real bills render, the PDF downloads from its own URL, a cancelled bill reads cancelled, revoked and invented links refuse identically, and the site's build and page-weight budget are unchanged. |
| **Not done** | the apex route, which needs the zone on Cloudflare — **the owner's step**. And the owner's own browser walkthrough, including opening a link inside WhatsApp on a real Android phone, which is the actual delivery path and the one most likely to fail. |

Two decisions here departed from the proposal, both deliberately and both recorded in
`worker/README.md`: the PDF is an **80 mm receipt roll rather than A4** [owner, 2026-09-03], and the
brand faces are **embedded whole rather than subsetted**, because subsetting a variable font through
`pdf-lib` produced a PDF in which every letter was a missing-glyph box.

Remaining before public launch (owner actions): fill portal to-do list (franchise economics,
hours, WhatsApp number, Web3Forms key, founder note, email), confirm repo name/Pages URL for
base path + canonical/sitemap, push to GitHub with Pages source = GitHub Actions.

## Sequence

| # | Change | Delivers | Depends on |
|---|--------|----------|------------|
| 1 | `scaffold-and-deploy` | Vite+React+TS skeleton, design tokens, fonts, GSAP+Lenis runtime, Pages deploy workflow | — |
| 2 | `content-data-layer` | zod schemas + six seeded JSON data files (verified facts only) + typed gateway + curated assets | 1 |
| 3 | `content-portal` | dev-only `/admin` portal: forms → validated writes to `src/data/*.json` | 2 |
| 4 | `hero-experience` | sticky header, pinned hero type scene, marquee, floating CTAs, branded loader | 2 |
| 5 | `menu-experience` | craving interlude + horizontal menu gallery + category tiles + order deep links | 4 |
| 6 | `story-and-proof` | story with SplitText reveals + timeline, stat counters, vlogger/testimonial wall | 4 |
| 7 | `outlets-and-contact` | outlet cards (order/directions/FSSAI), footer, legal modals | 2 (UI after 4) |
| 8 | `franchise-funnel` | tier cards, support row, process rail, FAQ, WhatsApp + enquiry form | 3, 7 |
| 9 | `polish-seo-launch` | SEO/JSON-LD, perf budget, a11y + motion audit, launch gate | all |
| 10 | `public-bill-receipt-page` | Cloudflare Worker on `/bill/*`: themed customer receipt page + on-demand A4 PDF, noindex headers, generic preview card, rate limits. **Parent: `public-bill-receipt` in shawarmania-ops** | 1, 9 |

Changes 5–7 are parallelizable after 4; the listed order is the recommended review order
(consumer path first, investor funnel once real content exists, polish last).

## Working agreement

- Propose → review artifacts → apply → **manual QA in browser** → archive change → next.
- Verified facts only in data files; unknowns stay `null` and render honest fallbacks.
- Every change must leave `npm run dev` and `npm run build` green.
