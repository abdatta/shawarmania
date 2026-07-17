# Shawarmania — brand site

Premium single-page landing/brand site for **Shawarmania** (Kalyani & Kanchrapara, West Bengal) —
for customers, prospective franchisees, and investors. Fully static, hosted on GitHub Pages.

## Stack

- **Vite + React 19 + TypeScript** — static bundle, no server.
- **GSAP (ScrollTrigger, SplitText) + Lenis** — scroll choreography, single RAF loop, full
  `prefers-reduced-motion` support.
- **Vanilla CSS design tokens + CSS Modules** — bespoke brand system (Lilita One / Nunito Sans /
  Baloo Da 2; exact Instagram logo assets).
- **zod-validated JSON content** in `src/data/` — every fact traceable to `src/data/SOURCES.md`;
  unknowns stay `null` and the UI renders honest fallbacks.

## For the owner: editing content

```bash
npm install        # once
npm run content    # starts the site + portal
```

Open **http://localhost:5173/admin** — the *To-do* tab lists what's still missing (franchise
economics, confirmed hours, WhatsApp number, Web3Forms key…). Edit → Save → the site tab
refreshes live. Then publish:

```bash
git add src/data && git commit -m "content: update menu/outlets" && git push
```

Pushing to `main` redeploys the site automatically.

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` / `npm run content` | Dev server + content portal at `/admin` |
| `npm run build` | Type-check, validate content, bundle, enforce page-weight budget |
| `npm run preview` | Serve the production bundle (base-path faithful) |

## Deploying

Live at **https://abdatta.github.io/shawarmania/** — every push to `main` deploys via
`.github/workflows/deploy.yml` (repo Settings → Pages → Source: GitHub Actions).

If the repo is ever renamed or moved to a custom domain, update `VITE_BASE` in the workflow and
the canonical/sitemap/robots URLs in `index.html` and `public/`.

## Project layout

```
openspec/          # spec-driven change history — see openspec/ROADMAP.md
research/          # brand research: build brief, Instagram findings, deep-research reports
scripts/           # shoot.mjs (visual review), check-weight.mjs (budget gate)
plugins/           # dev-only Vite plugins: content validation, portal write API
src/
  sections/        # Hero, Marquee, Craving, Menu, Story, Proof, Testimonials,
                   # Outlets, Franchise, Footer (one folder each, co-located styles)
  components/      # Header, SmoothScroll, Loader, FloatingCtas, Counter, VegMark, LegalModal…
  data/            # content JSON + zod schemas + SOURCES.md provenance
  portal/          # dev-only /admin editor
  assets/          # brand logo + curated Instagram photography (WebP at build)
```

## Notes & known limitations

- JSON-LD ratings in `index.html` are a snapshot — refresh them when platform ratings move.
- Legal modal texts are honest placeholders **pending owner legal review**.
- The franchise enquiry form activates once the owner adds a Web3Forms endpoint + key via the
  portal; until then it degrades to call/WhatsApp CTAs.
