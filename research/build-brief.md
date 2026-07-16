# Shawarmania — Build Brief
*Synthesized 2026-07-16 from 5 research reports: absolute-shawarma structure teardown, Apple scroll techniques, restaurant landing inspiration, Shawarmania web presence, stack/portal recommendation.*

---

## 1. RECOMMENDED SITE STRUCTURE

**Decision: one single-page scroll site with anchor navigation. No client-side routing.** GitHub Pages has no SPA rewrite (Absolute Shawarma's deep links all 404 for exactly this reason), and a single choreographed scroll is what enables the Apple-grade motion. Franchise content lives at the bottom of the same scroll behind a `#franchise` anchor — consumer sections stay appetite-first (the GDK/BurgerFuel audience-separation rule), while the header link and floating CTAs give franchise prospects a one-click jump.

**Design direction (fixed):** warm near-black base (`#14100B` family) + warm cream (`#F5E4C7` family) + one ember-red accent — the Bucks Sauce/GDK "nighttime craving" pole, chosen over cream-base because shawarma's char/flame/rotisserie imagery demands darkness. Two colors strictly enforced; food photography is the third color. Type: one heavy condensed sans display at massive scale (uppercase fragments), one quiet text sans. Bengali script "শাওয়ারমানী" used as a graphic accent motif.

### Homepage sections, in order

| # | Section (anchor) | Purpose | Content needs | CTA |
|---|---|---|---|---|
| 0 | **Sticky header** | Nav + persistent order path | Logo; anchors: Menu, Story, Outlets, Franchise, Contact; "Order Now" button | "Order Now" → `#outlets` (order links) |
| 1 | **Hero** (`#top`) | 3-word category claim + instant craving | Giant type: "KALYANI'S PREMIUM SHAWARMA" treatment (their own positioning); sub-line "Fresh ingredients. Bold flavors. Unforgettable taste."; one macro shawarma shot (melt/char close-up); rating badge "4.4 ★ · 700+ ratings across Google, Zomato, Swiggy" | Primary "Order Now" (scroll to outlets); secondary "Franchise" ghost link |
| 2 | **Marquee strip** | Rhythmic brand texture | Repeating mantra strip, e.g. "SPICY · CHEESY · LEBANESE · DESI TWIST ·" (their actual tagline language) | none |
| 3 | **The Craving** (`#menu` intro) | Build desire before the ask | 3–4 macro food shots + fragment headlines ("PAN-FRIED. STUFFED. LOADED."); ingredient-transparency line (fresh daily prep, real mozzarella, saaj bread) | none |
| 4 | **Signature Menu** (`#menu`) | Menu as visual grid with real prices | Card grid/horizontal gallery: 6 verified shawarma SKUs with Swiggy prices + item ratings; category tiles for Waffles, Crepes, Pancakes, Burgers, Wings; veg/non-veg badges | Each card → "Order on Swiggy/Zomato" deep link |
| 5 | **Our Story** (`#story`) | Heritage/consistency narrative | Founded mid-2025 in Kalyani; went viral (15.2K-like reel); expanded to Kanchrapara within a year; consistency promise ("same bold flavor, every outlet") — the Burrito Madre franchise-grade trust message | "Follow the story" → Instagram |
| 6 | **Proof band** | Stats as social proof | Animated counters: 4.4★ Google (362 reviews) · 4.3★ Zomato (1,300+ ratings) · 2 outlets · ₹139 starting price · 15.2K-like viral reel | none |
| 7 | **Outlets** (`#outlets`) | Conversion surface for visitors + footprint proof for investors | 2 outlet cards: address, hours, phone, Google Maps link, Swiggy/Zomato order buttons, "delivery: 033 2582 3100" | "Order Now" / "Get Directions" per card |
| 8 | **Vlogger/testimonial wall** | Third-party credibility | 3–4 embedded-thumbnail cards linking to Khana Pina (840+ reactions), Sonali Majumder, Petuk TV videos; pull-quote review snippets | "See what Kalyani is saying" → Instagram/Facebook |
| 9 | **Franchise** (`#franchise`) | The investor funnel (Absolute Shawarma's proven skeleton, fixed) | Momentum framing ("2 outlets in under a year, viral demand, courting partners"); 3-tier model cards (Kiosk / Café / Dine-in — area, fee, investment; **numbers from owner via portal**); "Support we provide" icon row; 4-step "How it works" process; short FAQ (5 Q&A) | Primary: WhatsApp deep link with pre-filled franchise message; secondary: 4-field enquiry form (Name/Phone/City/Budget → Web3Forms, fresh access key) |
| 10 | **Footer** (`#contact`) | Contact, legal, trust | Both addresses, both phones, WhatsApp channel, IG/FB/YT links, FSSAI licence numbers (22825123001193, 12826013000341 — real trust signals), working Privacy/T&C pages (plain anchored text blocks or modal), copyright | Floating call + WhatsApp buttons persist site-wide |

**What we deliberately keep from absoluteshawarma.com:** franchise funnel convergence, 3-tier model cards with hard numbers, growth timeline framing, floating call/WhatsApp buttons, 4-field short enquiry.
**What we deliberately fix:** consumer ordering path is first-class (they had none); outlets shown with maps/hours (they claimed 150+ and showed zero); FAQ + process + support sections on the franchise block (they had none); working legal links; per-page SEO (static `index.html` with title, meta description, OG image, and JSON-LD `Restaurant` + `LocalBusiness` schema per outlet, `robots.txt`, `sitemap.xml`); copy professionally edited (their typos erode trust); no 900 KB images or 73 MB videos.

**Secondary pages: none.** Privacy/Terms render as in-page sections or lightweight modals. If a brochure PDF is later supplied, it goes in `public/` — and the link must be verified in CI (Absolute's is a 404).

---

## 2. MOTION DESIGN SPEC

Engine: **GSAP ScrollTrigger everywhere; Lenis for smooth scroll; SplitText for type; IntersectionObserver/CSS `animation-timeline` for cheap reveals.** Two motion tiers, Apple-style: only sections 1, 4 and 5 get cinematic pinned treatment; everything else is lightweight transform/opacity. All effects wrapped in `gsap.matchMedia()` honoring `prefers-reduced-motion` (static fallback) and gating pinned scenes to `(min-width: 768px)`.

| Section | Effect (recipe # from Apple research) | Implementation |
|---|---|---|
| Hero | **Huge typography scale-down (4.8)**: "SHAWARMANIA" fills viewport at ~300% scale, scrubs to 100% while the macro food shot parallax-reveals behind it | Pinned section, `end: '+=200%'`, `scrub: 1`, timeline animating `scale` + `opacity`; `transform-origin: center`, `force3D: true` |
| Marquee | Infinite horizontal text loop, speed subtly modulated by scroll velocity | GSAP `to()` loop + Lenis velocity read; pure transform |
| The Craving | **Pinned scrub scene (4.1)** — the one cinematic hero moment: shawarma assembly/rotation driven by scroll (the food-site "ingredient explosion" trope) | Canvas image-sequence scrub (4.2): 80–100 WebP frames at q70, two resolutions (750px mobile / 1500px desktop), pre-decoded via `createImageBitmap()`, lazy-loaded one viewport ahead. If a rotating-spit video shoot happens instead, video-currentTime scrub (4.3) with `ffmpeg -g 5 -crf 24 -movflags +faststart` re-encode; canvas remains the reliable default |
| Craving headlines | **Text mask/clip reveal (4.4)**: fragments wipe in via `clip-path: inset()` inside the same scrub timeline | Same pinned timeline, position parameters `'<0.2'` for choreographed overlap |
| Signature Menu | **Horizontal scroll gallery (4.7)**: card row translates `xPercent` in a pinned section; per-card price/badge fades via `containerAnimation` nested triggers; `snap: 1/(n-1)` | GSAP; hover lift/tilt micro-interactions on cards via CSS |
| Our Story | **SplitText staggered line reveal (4.5)**: lines rise from masks, `stagger: 0.12`, triggered once at `start: 'top 75%'`; entrance-only blur ≤8px | GSAP SplitText (free since 2025, screen-reader safe) + one-shot ScrollTrigger |
| Proof band | Counter tween (0 → value) on enter + subtle **parallax (4.6)** on background texture (`yPercent` −10/−25 layers, `ease: 'none'`) | GSAP `snap` number tween; CSS `animation-timeline: view()` parallax as progressive enhancement inside `@supports` |
| Outlets | Simple staggered fade-up cards; map-pin micro-draw on the accent SVG | IntersectionObserver-triggered CSS transitions (cheap tier) |
| Vlogger wall | Staggered `y + opacity` card entrance | Plain `gsap.from` with stagger, one-shot |
| Franchise | Model cards fade-up with stagger; process steps connected by a **scroll-drawn line** | `gsap.from` stagger + DrawSVG (free) scrubbed on the connector path |
| Footer | Animated footer reveal (Crav-style detail): logo mask-rise on approach | Small scrubbed clip-path timeline |
| Global | Lenis smooth scroll driven from `gsap.ticker` (`lagSmoothing(0)`); anchors via `lenis.scrollTo()`; branded 2-frame loader (logo mask) | Wiring once in `hooks/useLenisScrollTrigger.ts` |

**Non-negotiable performance rules:** animate only `transform`/`opacity`; `will-change` applied just-in-time and removed; `ScrollTrigger.refresh()` after `document.fonts.ready` and image loads; explicit `width/height` on every image; test on mid-tier Android; total page weight target < 4 MB excluding the lazy canvas sequence (< 8 MB with it).

**Build order:** (1) Lenis+ticker wiring → (2) hero typography scene → (3) SplitText reveals + counters → (4) horizontal menu gallery → (5) canvas scrub scene last (it's the only expensive asset dependency).

---

## 3. TECH STACK DECISION

**Vite 8 + React 19 + TypeScript + GSAP + Lenis, vanilla CSS with design tokens + CSS Modules, deployed to GitHub Pages via Actions.** No Astro, no Next, no Tailwind, no router, no Framer Motion.

```
npm i react react-dom gsap @gsap/react lenis zod
npm i -D vite @vitejs/plugin-react-swc typescript vite-imagetools
```
Fonts self-hosted woff2 (`@fontsource-variable/*` or local), preloaded with `%BASE_URL%`; verify webfont license for any premium display face.

**Repo layout** (as specified in stack research):

```
shawarmania/
├─ .github/workflows/deploy.yml
├─ public/            # favicon.svg, og.jpg, robots.txt, sitemap.xml
├─ plugins/content-portal.ts      # dev-only Vite middleware
├─ src/
│  ├─ main.tsx        # dev-only dynamic import of portal at /admin
│  ├─ App.tsx         # <ReactLenis root> + section composition
│  ├─ sections/       # Hero/ Marquee/ Craving/ Menu/ Story/ Proof/ Outlets/ Testimonials/ Franchise/ Footer/
│  ├─ components/     # Button, MenuCard, OutletCard, Marquee, FloatingCTAs…
│  ├─ hooks/          # useLenisScrollTrigger, useReducedMotion, useSectionReveal
│  ├─ data/           # *.json (portal-writable) + schema.ts (zod) + index.ts (typed gateway)
│  ├─ portal/         # dev-only admin UI (forms generated from zod schemas)
│  ├─ styles/         # tokens.css, base.css, fonts.css
│  ├─ assets/         # images/fonts (hashed by bundler)
│  └─ lib/            # gsap.ts (registerPlugin once), assetUrl.ts (BASE_URL helper)
└─ vite.config.ts     # base: '/shawarmania/'
```

**Content portal:** Vite plugin with `apply: 'serve'` registering `/api/content/:name` middleware — GET reads, PUT validates through the shared zod schema then atomic tmp+rename writes. Allowlist: `brand, menu, outlets, stats, testimonials, franchise`. Portal UI dead-code-eliminated from production via `import.meta.env.DEV` gate. Owner workflow: `npm run dev` → `localhost:5173/admin` → edit → HMR live-previews the real site → `npm run publish` script (git add data + commit + push) triggers redeploy.

**Deploy:** GitHub Actions Pages flow — checkout@v7, setup-node@v6 (Node 22, npm cache), `npm ci && npm run build` (`tsc -b && vite build`), configure-pages@v6, upload-pages-artifact@v5 (`dist`), deploy-pages@v5; `permissions: pages: write, id-token: write`; Settings → Pages → Source: GitHub Actions. No `.nojekyll` needed on this path.

**Known pitfalls to enforce:** never hardcode leading-`/` asset URLs (use `assetUrl()` / `%BASE_URL%`); watch file-name casing (Windows dev, Linux CI); images pre-generated via `vite-imagetools` (`?format=avif;webp&as=picture`); `useGSAP({ scope })` everywhere (StrictMode/HMR cleanup); one RAF loop only (Lenis on gsap.ticker; do not add ScrollSmoother).

**Forms:** WhatsApp deep link is the primary franchise CTA (`wa.me/<number>?text=` pre-filled); the enquiry form POSTs to Web3Forms with a fresh access key and a honeypot field — the key is public by design on Web3Forms, but do not reuse Absolute Shawarma's pattern of shipping it without spam protection.

---

## 4. SHAWARMANIA FACTS (verified, with sources)

**Identity**
- Shawarmania (Bengali: শাওয়ারমানী), shawarma QSR in Kalyani (Nadia) + Kanchrapara, West Bengal. No existing website.
- Own positioning: "Kalyani's premium shawarma | Made with passion, served with love | Fresh ingredients, bold flavors, unforgettable taste" (Instagram bio, @shawarmania.kalyani).
- Tagline in posts: "Best shawarma in Kalyani & Kanchrapara — Spicy, cheesy & Lebanese shawarma with a desi twist!" (Facebook page 61576804640340).
- Cuisine tags: Swiggy "Turkish, Mediterranean"; Zomato "Shawarma, Rolls, Fast Food".
- Timeline: Kalyani flagship ~mid-2025; Kanchrapara outlet late 2025/early 2026; viral IG reel Nov 27 2025 (15.2K likes). A YouTube snippet ("Bindas Food") indicates they already invite franchise inquiries.

**Outlet A — Kalyani, Central Park (flagship)**
- Address: Ward 10, B-9 Diagonal Road, Near Central Park Ground, Kalyani 741235 (Zomato: zomato.com/kolkata/shawarmania-1-kalyani); Google Maps variant: "B-10/180, opposite SBI, Block B, Kalyani" (plus code XCGP+36). Brand's own wording: "Central Park (Near SBI Bank)".
- Hours: 12:30 pm–10:30 pm (Zomato); Google says opens 12 pm; Swiggy delivery from 1:30 pm.
- Phones: +91 89815 24778 (Zomato); +91 33 2582 3100 (Google Maps + brand's own "Home Delivery" posts).
- Takeaway + delivery, vegetarian-friendly, **no seating**. Avg cost ₹100/order; ₹300 for two (Swiggy). FSSAI: 22825123001193.
- Swiggy: restaurant ID 1096540, slug `shawarmania-kalyani-kalyani-2`.

**Outlet B — Kanchrapara**
- Address: 281, KG Path / KGR Path, Kanchrapara (Zomato: zomato.com/kolkata/shawarmania-2-kalyani); brand wording: "Near Joramandir Bus Stand". Delivery only; Google local pack says opens 4 pm. Phone +91 89815 24778. FSSAI: 12826013000341.

**Menu with verified prices (Swiggy Central Park, July 2026)**
| Item | Price | Rating (count) |
|---|---|---|
| Classic Chicken Shawarma | ₹139 | 4.3 (85) |
| Mayonnaise Chicken Shawarma | ₹159 | 4.6 (15) |
| Double Chicken Shawarma | ₹179 | 4.1 (30) |
| Mozzarella Cheese Chicken Shawarma | ₹199 | 4.1 (12) |
| Healthy Chicken Shawarma Salad | ₹219 | 4.5 (30) |
| Stuffed Lebanese Chicken Shawarma (pita/saaj) | ₹238 | 3.6 (9) |

- Kanchrapara Zomato categories (prices hidden while closed): Shawarma ×5 incl. veg Pan-Fried Paneer & Paneer-Mushroom; Waffles ×5 (Honey Butter, Maple, Naked Nutella, KitKat, Biscoff); Crepes ×3; Pancakes ×2.
- Vlogger-verified: non-veg shawarma combo ₹170, pan-fried chicken wings ₹120, "Taste: 09/10" (Khana Pina FB video, 840+ reactions). Smashed Burger ₹250→₹150 promo, Kanchrapara only (brand FB post).

**Ratings**
- Google Kalyani **4.4 / 362 reviews**; Google Kanchrapara 4.2 / 41; Zomato Central Park 4.3 / ~1,206; Zomato Kanchrapara 4.3 / 140; Swiggy 4.3 / 185; JustDial 4.4 / 312.
- Praise: value for money, juicy/spicy/cheesy Lebanese-with-desi-twist, fresh daily prep, student/local favorite. Weak: Stuffed Lebanese at 3.6 on Swiggy.

**Ordering + social**
- Zomato ×3 listings (order pages for `shawarmania-1-kalyani`, `shawarmania-2-kalyani`, `shawarmania-kalyani`); Swiggy ×1 (ID 1096540); direct delivery phone 033 2582 3100.
- Instagram @shawarmania.kalyani (~911 followers, reels far outperform: 15.2K + 1.1K likes); Facebook "Shawarmania Kalyani" (~3K likes); WhatsApp channel + community (weekly deals); own YouTube "SHAWARMANIA- KANCHRAPARA" (nascent).
- Promos observed: buy-4-get-5th-free loyalty (₹250+ meals), flat 10% off combos, cold-drink add-on combos.

---

## 5. CONTENT/DATA SCHEMA

Six JSON files in `src/data/`, each with a zod schema in `schema.ts` shared by site build and portal.

**`brand.json`**
`name, nameBengali, tagline, heroClaim, heroSub, positioning, foundedYear, city, region, phonePrimary, phoneDelivery, whatsappNumber, whatsappChannelUrl, email?, social { instagram, facebook, youtube }, legalEntityName?, colors { bg, cream, accent }, ogDescription`

**`menu.json`**
`categories[] { id, name, order }` + `items[] { id, name, category, description, price?, priceNote? ("promo"), isVeg, spiceLevel?, rating?, ratingCount?, badge? ("Bestseller"|"New"|"Viral"), image, orderUrl?, availableAt[] (outlet ids), featured (bool → appears in Signature gallery) }`

**`outlets.json`**
`outlets[] { id, name ("Kalyani – Central Park"), landmark, addressLines[], city, pincode, plusCode?, mapsUrl, phone, hours[] { days, open, close }, deliveryOnly (bool), seating (bool), fssai, swiggyUrl?, zomatoUrl?, openingStatusNote?, image }`

**`stats.json`**
`counters[] { id, label, value, suffix?, source }` — e.g. googleRating 4.4, totalRatings 2100+, outletCount 2, startingPrice 139, viralReelLikes 15200. `timeline[] { year, month?, title, description }` — founding → viral → Kanchrapara → (future milestones via portal).

**`testimonials.json`**
`vloggerVideos[] { id, creator, platform, title, url, thumbnail, metric ("840+ reactions") }` + `quotes[] { id, text, author?, source, url? }`

**`franchise.json`**
`intro, momentumLine, models[] { id, name (Kiosk|Cafe|Dine-in), areaSqft, franchiseFee?, totalInvestment?, menuScope, notes? }, support[] { icon, title, description } (training, supply chain, site selection, marketing, launch), process[] { step, title, description } (enquire → meet & taste → sign & fit-out → launch), faqs[] { q, a }, enquiry { whatsappPrefill, formEndpoint, fields[] }, roiNote?`
*(Model cards render "Contact for details" when fee/investment fields are null — the schema allows launch before the owner fills numbers.)*

---

## 6. OPEN QUESTIONS (owner must fill via content portal)

1. **Franchise economics** — investment tiers, franchise fee, royalty, expected payback, territory policy. Nothing public exists; every number in `franchise.json` starts null. (Do not invent numbers — Absolute Shawarma's inconsistent stats are a cautionary tale.)
2. **Founder name(s) and story** — no founder, owner, or registered company found anywhere. Needed for the Story section byline and legal entity in footer/privacy.
3. **Is there a third outlet?** Zomato lists "A-10/399, Kalyani" as a third listing and JustDial lists "Titan World, B7 Road, Kalyani" — real locations, stale duplicates, or a cloud-kitchen record?
4. **Authoritative hours per outlet** — sources conflict: 12:00 vs 12:30 pm vs 5:30 pm (JustDial) for Kalyani; 4 pm opening for Kanchrapara. `outlets.json` hours need owner confirmation.
5. **Canonical phone/WhatsApp** — three numbers in the wild (+91 89815 24778, 033 2582 3100, 84848 64009). Which is the official franchise-enquiry WhatsApp, and the exact WhatsApp channel/community URLs?
6. **Kanchrapara menu prices** — waffles/crepes/pancakes/burger prices hidden on Zomato while closed; also veg shawarma prices.
7. **Brand assets** — logo files, brand font (if any), and high-resolution photography/video. Current social images are phone-quality; the canvas scrub scene needs a dedicated shoot (rotating spit or assembly sequence, 80–100 frames). Placeholder art direction ships first.
8. **Email address and legal text** — no business email found; privacy policy/terms content needs owner sign-off.
9. **Loyalty program formalization** — "buy 4 get 5th free" appears in posts; confirm current terms before featuring it as a designed section.
10. **Web3Forms account** — owner must create their own account/access key for the enquiry form endpoint.