# Shawarmania site — change roadmap

Premium single-page brand site for Shawarmania (Kalyani + Kanchrapara), deployed to GitHub Pages.
Source of truth for scope/design: `research/build-brief.md`. Each change ends with a **manual QA
gate** — the owner walks the checklist in the change's `proposal.md` before the next change begins.

## Status: ✅ changes 1–9 implemented and archived (2026-07-16); site live at shawarmania.in

📝 **Change 10 `public-bill-receipt-page` is proposed (2026-09-03)** and is the child half of a pair — its parent is `public-bill-receipt` in the `shawarmania-ops` repo, which owns the receipt link and the data. It adds the first server-side code this repo has ever held, so the "fully static, no server" description above and in `README.md` stops being true when it lands.

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
