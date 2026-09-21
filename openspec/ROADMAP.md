# Shawarmania site — change roadmap

Premium single-page brand site for Shawarmania (Kalyani + Kanchrapara), deployed to GitHub Pages — plus one Cloudflare Worker on `/bill/*`, which since change 10 is the first server-side code this repo holds.
Source of truth for scope/design: `research/build-brief.md`. Each change ends with a **manual QA
gate** — the owner walks the checklist in the change's `proposal.md` before the next change begins.

## Status: ✅ changes 1–10 archived; change 11 implemented, awaiting owner QA

✅ **Change 10 `public-bill-receipt-page` archived 2026-09-10** — the child half of a pair, its
parent being `public-bill-receipt` in the `shawarmania-ops` repo, which owns the receipt link and the
data. Together they now serve the production receipt from the bill the owner or franchise admin
already sees.

It adds the first server-side code this repo has ever held, so the "fully static, no server"
description has been corrected in both places above and in `README.md` rather than left to rot.

| | |
|---|---|
| **Built** | `worker/` — the Worker, the themed page, the 80 mm PDF, the headers, the cache and the abuse limits. `worker/README.md` carries the reasoning. |
| **Verified** | against `wrangler dev` and the ops repo's local Supabase: real bills render, the PDF downloads from its own URL, a cancelled bill reads cancelled, revoked and invented links refuse identically, and the site's build and page-weight budget are unchanged. |
| **Production gate** | Passed 2026-09-10 after the Cloudflare cutover: the owner walked every manual check, including a real Android phone, WhatsApp's in-app browser, PDF download, special bill states, generic preview and the unchanged marketing site. |

Two decisions here departed from the proposal, both deliberately and both recorded in
`worker/README.md`: the PDF is an **80 mm receipt roll rather than A4** [owner, 2026-09-03], and the
brand faces are **embedded whole rather than subsetted**, because subsetting a variable font through
`pdf-lib` produced a PDF in which every letter was a missing-glyph box.

Remaining before public launch (owner actions): fill portal to-do list (franchise economics,
hours, WhatsApp number, Web3Forms key, founder note, email), confirm repo name/Pages URL for
base path + canonical/sitemap, push to GitHub with Pages source = GitHub Actions.

🚧 **Change 11 `legal-and-messaging-pages` implemented 2026-09-21, owner QA pending** — the site's
first pages that are not the brand experience. `/privacy/`, `/terms/` and `/messages/` exist because
an RCS messaging registration (Telinfy / GreenAds Global) requires a live privacy policy, live terms
and an opt-in page, each readable with JavaScript disabled; the `<dialog>` legal modals could satisfy
none of that and are deleted.

| | |
|---|---|
| **Built** | Three HTML entries with no script, one shared `src/styles/legal.css`, `plugins/legal-facts.ts` injecting business facts from `src/data` and failing the build on an unresolved placeholder, three footer links, three sitemap entries, and one more note in the receipt's small print. |
| **Verified** | `npm run build` green at 661 kB of a 1.5 MB initial budget with no new font files and no new JS chunk; the three documents emitted at their directory paths; `VITE_BASE=/shawarmania/` still resolves every asset and cross-link; the placeholder guard fails the build as intended; `npm run worker:test` 66/66 with the receipt's agreement test holding both renderers to the new note. |
| **QA gate** | Pending — the checklist is in the change's `proposal.md`. |

The documents name **Kalyani only**, with its own FSSAI licence `22825123001193` [owner, 2026-09-21:
Kanchrapara is closing]. The landing page still lists both outlets, which is right -- it describes the
business as it trades today, while the legal documents are forward-dated to the RCS launch. The
aggregates that pulled every outlet into a sentence are gone from `legal-facts.ts` rather than the
closing outlet being filtered out by id, which would break the day a third outlet opens.

**Two launch blockers for this live outside this repo**, and the RCS agent must not be submitted
before both land:

1. **`/messages/` says replying STOP works.** The ops repo has to honour it — a suppression flag on
   the customer, set from the messaging provider's inbound webhook. Until then the page's other
   opt-out paths (counter, phone, email) are the real ones, and the STOP sentence is a promise
   outstanding.
2. **The counter has to ask the question the page quotes** — "Want your bill on your phone? Give us
   your mobile number. One message per bill, no offers. Reply STOP any time." Staff briefing, and
   ideally the line on the ops billing screen and the printed bill.

Owner actions this change created: create `hello@shawarmania.in` and confirm mail arrives (it is
named on all three documents as the contact for data and consent requests), then read `/privacy/` and
`/messages/` end to end for factual accuracy before the registration is submitted.

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
| 10 | `public-bill-receipt-page` | Cloudflare Worker on `/bill/*`: themed customer receipt page + on-demand 80 mm PDF, noindex headers, generic preview card, rate limits. **Parent: `public-bill-receipt` in shawarmania-ops** | 1, 9 |
| 11 | `legal-and-messaging-pages` | `/privacy/`, `/terms/`, `/messages/` — three script-free documents as extra build entries, facts injected from `src/data`, footer links replacing the legal modals, sitemap entries, and a messaging note in the receipt's small print. **Unblocks the RCS bot registration** | 9, 10 |

Changes 5–7 are parallelizable after 4; the listed order is the recommended review order
(consumer path first, investor funnel once real content exists, polish last).

## Working agreement

- Propose → review artifacts → apply → **manual QA in browser** → archive change → next.
- Verified facts only in data files; unknowns stay `null` and render honest fallbacks.
- Every change must leave `npm run dev` and `npm run build` green.
