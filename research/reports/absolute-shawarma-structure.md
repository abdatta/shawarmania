# Structural Breakdown — absoluteshawarma.com (researched 2026-07-16)

## 0. Tech snapshot (context for the structural findings)

- **Stack:** React SPA (Vite build, client-side rendered), Tailwind CSS + CSS modules, React Router, AOS scroll animations, Swiper (coverflow), react-lazy-load-image-component. Hosted on Hostinger static hosting.
- **Consequence of this stack as implemented:** the HTML shell is empty (`<div id="root">`); **every deep link 404s** (e.g. visiting `absoluteshawarma.com/about` directly shows "This Page Does Not Exist" — no SPA fallback rewrite configured). No per-page `<title>`, no meta description, no OG tags, no `robots.txt`, no `sitemap.xml`. All menu items, timeline entries, and copy are **hardcoded in the JS bundle** (no CMS).
- **Forms:** all forms POST to **Web3Forms** (`https://api.web3forms.com/submit`) with the access key exposed in the bundle and a hidden field `Query Type: "Franchise Enquiry"`.

## 1. Full sitemap (7 routes, all client-side)

| Page | Route | Purpose |
|---|---|---|
| Home | `/` | Brand intro + franchise funnel entry |
| About | `/about` | Story + team |
| Menu | `/menu` | Filterable product list (no prices) |
| Unit Franchise | `/unit-franchise` | Core franchise sales page (3 investment models) |
| Master Franchise | `/master-franchise` | Regional/master franchise pitch |
| Gallery | `/gallery` | Image grid (lazy-loaded photos) |
| Contact | `/contact` | WhatsApp CTA + enquiry form |

No blog, no store locator, no outlet list page, no legal pages (Privacy/T&C links exist in footer but are **dead** — `href=""`, resolving to the current page). Site-wide overlays: an **Enquiry Form modal** (triggered from homepage) and a **"DOWNLOAD BROUCHER" email-capture modal** present in code (email → "Download Brochure" button), apparently orphaned/rarely triggered.

## 2. Homepage — section by section (top → bottom)

1. **Sticky header (black bar, `sticky top-0 z-50`)** — logo left; links: Home, About, Menu, Franchise (dropdown → Unit Franchise / Master Franchise), Gallery, Contact. Hamburger ("Open main menu") on mobile.
2. **Video hero** — full-width autoplay/loop/muted MP4 (2.7 MB) with 50% black overlay. Copy stacked left-center: "Welcome to **Absolute Shawarma**" / "A Product of Julu Hospitality Pvt. Ltd." / "**150+ OUTLETS IN 30+ CITIES**". Bottom-right: an animated **"click here" image button that opens the Enquiry modal** (the hero's only CTA — an image, not a button).
3. **Brand intro / "welcome area"** — headings "Absolute Shawarma" + "A Product of Julu Hospitality Pvt. Ltd.", then 3 paragraphs: 8-year history, 150+ outlets in 30+ cities, "Best Shawarma Restaurant in India" claim, menu breadth (Momos, rolls, chicken/paneer shawarma, burgers, waffles, crunchy chicken), commitment-to-quality closer. CTA: **"Know More" → /unit-franchise** (note: goes to the franchise page, not About — everything funnels to franchise).
4. **Franchise CTA band** — "Revolutionizing **Business** with our Authentic Blends and Unique Franchiese Model" (sic) + **"Enquiry Now"** button → opens modal: heading "ENQUIRY FORM", fields Name / Email / Phone / City + "Send Enquiry" (Web3Forms).
5. **"Our Success Journey" timeline** — 4 milestones with icons: **2017** first store in Bangalore → **2020** 30+ outlets in major metros → **2022** franchise model PAN India, 60+ stores in 10+ cities → **2024** 150+ outlets in 30+ cities "and Still Growing".
6. **Photo strip ("gallery" component)** — a row of lazy-loaded image boxes (from a pool of 16 numbered photos, each ~900 KB) with staggered fade-up animations. No captions, no lightbox here.
7. **"Stay Connected By Earning Yourself!" (fixed-background finale)** — 4 checkmark USP bullets: "150+ Outlets Across 30+ Cities in Country." / "A Profit Margin Ranges From 30% to 40%" / "India's Leading Shawarma Based Fast Food Franchise Chain" / "As Less as Investment of 5 Lakhs Inclusive of all Taxes" + a bordered autoplay video (1.1 MB) + two buttons: **"Unit Franchise"** and **"Master Franchise"**.
8. **Floating buttons (fixed bottom-right, all pages)** — two white circular buttons: **call** (`tel:919353852071`) and **WhatsApp** (`wa.me/919353852071` pre-filled: "Hello I would like to inquire about your Franchise").
9. **Footer (all pages)** — 4 columns: (a) logo + "A Product of Julu Hospitality Pvt. Ltd." + office address (Sarjapur Main Road, Bangalore 560035) + phone + email; (b) RESOURCES: Home, About, gallery (lowercase — inconsistent), Menu; (c) FRANCHISE MODEL: Unit Franchise, Master Franchise; (d) LEGAL: Privacy Policy, Terms & Conditions (both dead links). Bottom row: "Design & Developed By Go Sparrow" credit, "copyright © 2017-2024", social icons: Facebook, Instagram, YouTube.

**Messaging tone:** entirely **B2B/franchise-first**. The consumer (hungry customer) is an afterthought — no "order online", no outlet finder, no Swiggy/Zomato links. Voice is enthusiastic, superlative-heavy ("Best Shawarma Restaurant in India", "India's Leading"), with frequent typos and grammatical errors.

## 3. Franchise pages

### /unit-franchise (the money page)
1. **Intro paragraph** — "The Best Shawarma Franchise Opportunity…", risk-reduction framing, "build its business on AS's brand image as a long-time partner".
2. **3-column USP row:**
   - **150+ OUTLETS** — lists states covered: Karnataka, Andhra Pradesh, Telangana, Maharashtra, Madhya Pradesh, Uttar Pradesh, Mizoram, Sikkim, Assam, Jharkhand, Jammu & Kashmir, Bihar.
   - **LESS INVESTMENT** — "A middle-class family also can afford"; from ₹5 Lakhs; franchise fee includes marketing + complete startup kit (refrigerator, deep freezer, stoves, utensils) + initial stock.
   - **"HIGHT" PROFIT MARGIN** (sic) — 30–40% margin; **payback 5–10 months**; product prices ₹49 (Veg Burger) to ₹80 (Arabic Shawarma).
3. **3 franchise model cards** (the structural core):
   | Model | Area | Franchise fee | Total investment | Menu scope |
   |---|---|---|---|---|
   | KIOSK / TAKE AWAY | 100 sq.ft. | ₹2 L | ₹5–5.5 L onwards | 8 categories (shawarma, rolls, crispy chicken, fries, mocktails, shakes, momos) |
   | CAFE | 200–300 sq.ft. | ₹2 L | ₹6–6.5 L onwards | + burger, pizza, momos 8–10 varieties |
   | DINE-IN | 300 sq.ft. | ₹3 L | ₹8.5–10 L onwards | + waffles, pasta, momos 16–20 varieties |
4. **Photo gallery with lightbox** — 6 outlet photos (c1–c6) with prev/next navigation.
5. **Long SEO essay** — "The Ultimate Absolute Shawarma Shop: Your Path to Success…" with sub-blocks: A Trusted Brand / Location Matters (site-selection guidance promised) / Takeaway & KIOSK Model / Owning a Best Shawarma Franchise ("entrepreneurial spirit of Bangalore") / In Conclusion. Keyword-stuffed, typo-ridden.
6. **"Download Menu" button** — JS-triggered download of `images/Menu-AbsoluteShawarma.pdf` — **the file 404s; the download is broken**.

**Notably absent:** no enquiry form on this page (only floating WhatsApp/call), no FAQs, no franchisee testimonials, no royalty/fee breakdown table, no process timeline ("how it works"), no application form.

### /master-franchise
- Intro pitch (globally expanding, "passionate and motivated entrepreneurs") — **contains an uncorrected copy-paste from a tea franchise website: "…grow and expand with Tea Time Franchise"**.
- Explanation of master-franchise economics: share of franchise fees in territory + share of monthly royalty revenue + reduced royalty on own stores; **ROI claimed within 12–14 months**.
- **"Responsibilities of Master Franchise"** — 3 cards: SELLING UNIT FRANCHISE (closing franchisees), STOCK MANAGEMENT (warehouse + 2 staff, supply all unit outlets, track sales), LOGISTIC SUPPORT (transport to stores).
- No form, no territory map, no investment figure for the master franchise itself.

## 4. Other pages

- **/about:** "OUR STORY" (3 paragraphs, stats inconsistent with homepage — says "100+ outlets in 20+ cities") + "Success story…" paragraphs; **3 autoplay videos** interleaved (store video, customer video, food video — one is **73.8 MB**, a page-weight disaster); "Meet The Team": 4 members with photo + role + bio (Rashmi Priya — Founder & Director; Uday Raj — Sr. Operation Manager & BDM; Suday Raj — Operation Manager; Ved Prakash — Operation Manager). Bios are typo-heavy ("enterpreneur", "adn", "visio", "passionetely").
- **/menu:** filter tab bar (All Items / Shawarma / Momo / Beverages / Snacks) → card grid of **54 items**, each: photo, name, "Category : x" label, description **with nutrition data** ("[Calorie - 230Kcal, Protein - 24g, Fat - 14g] | Serve 1") — but the same nutrition numbers copy-pasted across all 30 shawarma items. **No prices.** Structure within shawarma: 5 flavors (Arabian/Mexican/Peri-Peri/New Spicy/Tandoori) × 3 formats (Roll/On Plate/Combo) × 2 breads (Khubbus/Rumali) = 30 SKUs. Momos: 3 fillings × 5 styles = 15. Below the grid: **"Get Franchise Enquiry"** (WhatsApp link with WhatsApp logo), a **Swiper coverflow carousel of 3 scanned menu-page images**, and **"Download Menu"** (same broken PDF).
- **/gallery:** a heading "Gallery" + lazy-loaded grid of the 16 numbered photos (no captions, no filters, no lightbox on this page).
- **/contact:** heading "Looking For A Food Franchise Business?" + **"Book Now" → WhatsApp**; "ENQUIRY FORM" (Name, Email, Phone, City → Web3Forms). **No map, no outlet addresses, no general-purpose contact form, no hours.** Contact info only exists in the footer.

## 5. Navigation structure

- **Header (sticky, all pages):** Home · About · Menu · Franchise ▾ (Unit / Master) · Gallery · Contact. Logo → home. Mobile hamburger.
- **Footer:** brand/address/phone/email column + Resources (Home/About/gallery/Menu) + Franchise Model (Unit/Master) + Legal (Privacy, T&C — dead) + Go Sparrow credit + copyright + FB/IG/YT.
- **Floating (all pages, bottom-right):** phone call button + WhatsApp button with pre-filled franchise enquiry text.
- **Modals:** Enquiry Form modal (Name/Email/Phone/City); "DOWNLOAD BROUCHER" email-gate modal in code.
- **Scroll-to-top on route change** (React Router effect). AOS animations on nearly every block.

## 6. Data/content types the site implies (its content model)

1. **Menu items** — name, category (shawarma/momo/beverages/snacks), description, nutrition (kcal/protein/fat), serving size, photo. (No price, no veg/non-veg flag, no spice level — all obvious gaps.)
2. **Franchise models** — name, area required, franchise fee, total investment, included menu categories.
3. **Stats/counters** — outlet count, city count, profit margin %, payback period, min investment. (Hardcoded and mutually inconsistent between pages: 150+/30+ vs 100+/20+.)
4. **Timeline milestones** — year + description + icon.
5. **Team members** — name, role, bio, photo.
6. **Gallery images** — flat list, no metadata.
7. **Videos** — hero video, store/customer/food videos.
8. **Enquiry leads** — name, email, phone, city, query type (via Web3Forms); plus email-only brochure leads.
9. **Contact/company info** — HQ address, phone, email, social URLs.
10. **Menu PDF / brochure** — downloadable collateral (currently broken).
11. **Implied-but-unbuilt content types** (unused assets shipped in the bundle: `storelocatorBanner`, `successMap`, `offer1/offer2`, icon set `rupee/margin/outletGrowing/outletSupport/operational/foodSupply/manpower`): **store locator/outlet list, offers/promotions, a "support we provide" icon grid, an India success map**. They planned these and never built them.

## 7. What works well (structure worth borrowing)

- **Single-minded conversion funnel:** every page and CTA converges on the franchise enquiry (WhatsApp + short modal form). Persistent floating call/WhatsApp is the right pattern for the Indian F&B franchise market.
- **The 3-tier franchise model card layout** (Kiosk/Cafe/Dine-in with area, fee, total investment, menu scope) — concrete, comparable, scannable. This is the strongest section on the site.
- **Concrete numbers up front:** investment from ₹5L, 30–40% margin, 5–10-month payback, product price points. Specificity builds credibility.
- **Growth timeline** (2017→2024) as social proof; outlet/city counters in hero.
- **Menu with category filter tabs** + nutrition-flavored descriptions; the flavor × format matrix is a sensible SKU structure.
- **Short-form enquiry** (4 fields) minimizes friction; WhatsApp deep link with pre-filled message is even lower friction.
- Sticky header + scroll-to-top on navigation; consistent footer with grouped link columns.

## 8. What's weak/dated (avoid or fix in Shawarmania's build)

- **Broken fundamentals:** deep links 404 (no SPA fallback — kills shareability and SEO entirely); "Download Menu" PDF 404s; Privacy/T&C links are dead; Gallery page is a bare heading with an uncaptioned dump of ~900 KB images.
- **Zero SEO infrastructure:** one static `<title>` for all pages, no meta descriptions, no OG/social cards, no robots.txt/sitemap.xml, no structured data (Restaurant/LocalBusiness/FAQ schema) — fatal for a business whose page copy is visibly written *for* SEO.
- **Grave performance issues:** 73.8 MB autoplay video on About, ~900 KB gallery images, 3 autoplay videos on one page.
- **Copy quality erodes trust:** pervasive typos ("HIGHT PROFIT", "Franchiese", "Estmated", "BROUCHER", "enterpreneur"), and an unedited **"Tea Time Franchise" copy-paste from another brand's website** on the master-franchise page. Inconsistent stats between pages (150+/30+ vs 100+/20+); footer link casing inconsistent ("gallery").
- **Missing structural pieces a franchise site needs:** no outlet locator/list or map (despite claiming 150+ outlets — the single most persuasive proof left unshown); no franchisee testimonials or video interviews; no FAQ; no "how it works" process steps; no support-offered section (training, supply chain, marketing); no press mentions; no downloadable brochure that works; no royalty/fee transparency; no form on the franchise pages themselves (the page with peak intent has no capture).
- **Consumer journey ignored:** no online ordering links, no per-outlet pages, no hours, no prices on the menu.
- **No CMS:** menu, stats, and team are hardcoded in the JS bundle — every update requires a rebuild; nutrition data is copy-pasted and non-credible.
- **Sloppy details:** Web3Forms access key exposed client-side, hero CTA is an image with an onClick (inaccessible), duplicated identical `<source>` tags on videos, orphaned modal and unused assets shipped to production.

**Net takeaway for Shawarmania:** the site's *skeleton* (franchise-funnel homepage → tiered model cards with hard numbers → dual Unit/Master paths → filterable menu → WhatsApp-first floating CTAs) is a proven regional pattern worth structurally emulating — but it must be paired with everything Absolute Shawarma omitted: outlet locator/map, franchisee proof (testimonials/FAQ/process), working legal + collateral downloads, per-page SEO with SSR/SSG or prerendering, CMS-driven content, and a consumer ordering path.