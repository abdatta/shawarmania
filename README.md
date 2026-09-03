# Shawarmania — brand site

Premium single-page landing/brand site for **Shawarmania** (Kalyani & Kanchrapara, West Bengal) —
for customers, prospective franchisees, and investors. A static bundle on GitHub Pages, plus **one
Cloudflare Worker on `/bill/*`** that serves a customer their own receipt — see
[`worker/README.md`](worker/README.md).

## Stack

- **Vite + React 19 + TypeScript** — static bundle. The site itself has no server; the receipt
  page does, and it is deliberately separate (see below).
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

## Two deployables, one domain

Since the receipt page landed there are two independent things behind
`shawarmania.in`, and they share nothing but the domain:

| | Deploys by | Serves |
|---|---|---|
| **The site** | `.github/workflows/deploy.yml` on a push to `main` | everything except `/bill/*` |
| **The receipt Worker** | `npm run worker:deploy` | `/bill/*` only |

The Worker is not part of the Vite build, does not enter the Pages artifact, and does not count
against the page-weight budget — `npm run build` asserts the second and third. It exists because the
ops database grants the anonymous role nothing, so **something server-side has to hold a credential
to read a bill at all**; a static page cannot. Its own README carries the rest, including the secret
and how to rotate it.

## Deploying the site

Live at **https://shawarmania.in/** — every push to `main` deploys via
`.github/workflows/deploy.yml` (repo Settings → Pages → Source: GitHub Actions).

The apex domain serves from the root, so the build uses `VITE_BASE: /` and `public/CNAME` carries
the domain into the deployed artifact. The old `abdatta.github.io/shawarmania/` URL redirects here.

**DNS moves to Cloudflare so the Worker can be routed on the apex path**, keeping the same records:
apex `A` to the four GitHub Pages IPs (185.199.108–111.153), matching `AAAA`, and `www` as a `CNAME`
to `abdatta.github.io`. GitHub Pages keeps serving the site throughout; Cloudflare only adds the one
route. **That move is the owner's step** — the runbook and the rollback (switch the nameservers back
to Hostinger, whose records are unchanged) are in the ops repo's `docs/OPERATIONS.md`. Nothing here
is blocked on it: the Worker builds and runs against `wrangler dev` and a `workers.dev` URL first.

If the domain is ever dropped, set `VITE_BASE: /shawarmania/` in the workflow, delete
`public/CNAME`, and revert the absolute URLs in `index.html`, `public/sitemap.xml` and
`public/robots.txt`.

## Project layout

```
openspec/          # spec-driven change history — see openspec/ROADMAP.md
worker/            # the receipt Worker: /bill/* only, outside the Vite build — worker/README.md
research/          # brand research: build brief, Instagram findings, deep-research reports
scripts/           # shoot.mjs (visual review), check-weight.mjs (budget gate),
                   # geometry-sweep.mjs + hero-scroll-check.mjs (layout gates)
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
