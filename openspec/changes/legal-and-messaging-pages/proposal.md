## Why

Shawarmania is registering an RCS bot (Telinfy / GreenAds Global) so a customer who gives their
number at the counter gets their bill on their phone — the ops repo already holds the bill and this
repo already serves it at `/bill/*`. The registration form, and Google's brand/agent review behind
it, will not accept the site as it stands: it demands a **live Terms & Conditions URL, a live Privacy
Policy URL, and an opt-in page**, each publicly reachable, each rendering without JavaScript, and the
first two linked from the site footer where reviewers look for them.

Today this site has none of those. Privacy and Terms are `<dialog>` modals inside the React bundle —
no URL exists to paste into the form, a reviewer with JS disabled sees nothing, and the copy is
marked "pending owner legal review". There is no page anywhere describing how a phone number is
collected or how a customer stops the messages.

## What Changes

- **Three new standalone documents**, each at its own URL, built as additional Vite HTML entries with
  no React, no GSAP and no Lenis — the same reasoning that keeps the receipt page a plain document:
  - `/privacy/` — how a phone number and a bill are collected, used, retained and **never sold or
    passed to third parties for marketing**; the Swiggy/Zomato carve-out; the ops-system carve-out.
  - `/terms/` — website terms (the counter price is authoritative; photography and branding), plus a
    **Messaging programme** section: message types, one per bill, carrier data rates, STOP/HELP.
  - `/messages/` — the **opt-in page**: the consent taken at the counter in the words staff use, what
    arrives, and the ways to stop — tell the counter, call, email, and reply STOP. Links Terms and
    Privacy above the fold, because review requires both reachable from the opt-in page. It offers
    **no WhatsApp opt-out**: `whatsappNumber` is `null` in the content layer and the only WhatsApp
    destination the brand has is a broadcast channel, which cannot be replied to. Offering it would
    be a dead end dressed as a promise; the page picks one up automatically if a real number is ever
    set through the portal.
- **The footer links them** — three real anchors replacing the two modal triggers. **BREAKING** for
  the `site-footer` spec, which currently states no routes are introduced.
- **`LegalModal` and its stylesheet are deleted.** Nothing else uses them, and leaving a second,
  divergent copy of privacy copy in the bundle is how the two drift apart.
- **The documents name one outlet — Kalyani — not two.** Kanchrapara is closing, so the legal
  documents state Kalyani's address and its own FSSAI licence `22825123001193`. The landing page is
  unchanged and still lists both. The aggregate helpers that pulled every outlet into a sentence are
  removed from the injection plugin, so naming a second outlet has to be deliberate.
- **The brand's real identity is recorded** — `brand.json` gains `legalEntityName: "De & Datta LLP"`
  and `email: "hello@shawarmania.in"`, both previously `null`, both required by the registration and
  both named on the new pages. The zod schema and the portal pick them up for free.
- **`sitemap.xml` lists the three URLs**; each page carries its own canonical, title and description.

Deliberately **not** in scope: any opt-in *form*. The consent for this programme is taken at the
counter, so a web form would be a second, fictional consent path. `/messages/` documents the real one
and offers the opt-out as `tel:` and `mailto:` links, needing no backend.

## Capabilities

### New Capabilities
- `legal-pages`: the three standalone documents — their URLs, their no-JavaScript rendering, the
  disclosures each must carry for messaging review, and the identity they name.

### Modified Capabilities
- `site-footer`: privacy and terms become links to real URLs rather than modals; a third link
  (messaging) joins them. Reverses the existing "no routes are introduced" requirement.
- `pages-deployment`: the build emits more than one document, each base-path aware, each served by
  GitHub Pages at a directory URL.
- `seo-and-launch`: the sitemap and per-page metadata extend to the three new URLs.

## Impact

- **Code**: new `privacy/`, `terms/`, `messages/` HTML entries + one shared stylesheet;
  `vite.config.ts` gains `rollupOptions.input`; `src/sections/Footer/Footer.tsx` + its module CSS;
  `src/components/LegalModal/` deleted; `src/data/brand.json` + `src/data/schema.ts`;
  `public/sitemap.xml`; `worker/src/page.ts` + `worker/src/content.ts` (one link, one string).
- **Budget**: initial-load is ~630 kB of 1.5 MB today; three documents plus one stylesheet add a few
  kB. The gate in `scripts/check-weight.mjs` already walks all of `dist/` and needs no change.
- **Downstream, outside this repo**: `/messages/` will promise that STOP works. The ops repo must
  honour it — a suppression flag on the customer, set from Telinfy's inbound webhook — and the
  counter needs the consent line the page quotes. Neither is this repo's code, and both must land
  before the RCS agent is submitted for review.
- **No dependency change.** No router, no new runtime package.

## Manual QA checklist

The owner walks this in a browser before the change is archived.

1. `npm run build` passes, printing the weight report within budget, and `dist/` contains
   `privacy/index.html`, `terms/index.html` and `messages/index.html`.
2. `npm run preview` — open `/privacy/`, `/terms/` and `/messages/` directly by URL. Each renders
   fully styled, in brand colours, with no console errors.
3. **With JavaScript disabled** in the browser, all three still render completely and every link works.
4. On a phone viewport (375 px) each page is readable with no horizontal scroll and every tap target
   is comfortable; on desktop the measure stays readable rather than stretching full-width.
5. The footer shows **Privacy · Terms · Messaging**, each navigating to the right page; back returns
   to the landing page with the scroll runtime intact.
6. From `/messages/`, both the Terms and Privacy links work, and the call/WhatsApp/email opt-out
   links open the right app with the right recipient.
7. Read `/privacy/` and `/messages/` end to end as the owner: every factual claim about how the
   counter takes a number, what is sent, and how STOP is honoured is **true today or scheduled
   before submission** — anything else is corrected now, not after a reviewer reads it.
8. The names on the pages are right: **De & Datta LLP**, both FSSAI numbers, both outlet addresses,
   `hello@shawarmania.in` **reachable** (send it a test mail and read it), `+91 89815 24778` rings.
9. `/bill/<token>` against `wrangler dev` still renders, its new footer link reaches `/messages/`,
   and the receipt still names no customer.
10. The landing page itself is untouched: hero, scroll choreography, menu gallery and
    `prefers-reduced-motion` all behave as before.
