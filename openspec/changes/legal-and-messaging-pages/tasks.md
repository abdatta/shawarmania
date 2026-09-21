## 1. Content layer: the two facts that stop being null

- [x] 1.1 Set `legalEntityName: "De & Datta LLP"` and `email: "hello@shawarmania.in"` in
      `src/data/brand.json`; confirm `schemas.brand` already accepts both (nullable strings) so no
      schema edit is needed, and that `npm run build`'s content validation passes
- [x] 1.2 Check `src/portal/fieldHints.ts` — nothing to remove: its `NULL_TYPE_HINTS` entries say
      what a null field *becomes* when toggled on, which stays correct for a field that now has a
      value, and the portal's To-do tab derives from the nulls themselves, so it shortens by two on
      its own

## 2. The fact-injection plugin

- [x] 2.1 Add `plugins/legal-facts.ts` exporting a Vite plugin with `transformIndexHtml`, reading
      `src/data/*.json` through `fs` + the shared zod schemas — never by `import` — following the
      pattern in `plugins/validate-content.ts` so data files stay out of the config's dependency
      graph and a portal save does not restart the dev server
- [x] 2.2 Resolve `{{path.to.value}}` placeholders against a flat facts object; expose each outlet's
      facts by its own id (`outlet.kalyani.address`) rather than exposing loops in markup — and, per
      4b.2, no aggregate across outlets
- [x] 2.3 Throw on any `{{…}}` surviving the pass, naming the file and the placeholder — this is the
      guard against a customer reading `{{brand.email}}`
- [x] 2.4 Register the plugin in `vite.config.ts` and assert it leaves `index.html` (which carries no
      placeholders) byte-identical

## 3. The shared stylesheet

- [x] 3.1 Add `src/styles/legal.css` importing `tokens.css` and `fonts.css`, defining a readable
      measure (~68ch), generous line height, cream-on-near-black palette, flame-gradient rule under
      headings, visible focus styles, and comfortable tap targets for inline links
- [x] 3.2 Add its print stylesheet — light background, dark ink, no decorative rules, URLs of links
      printed after their text so a kept copy stays useful
- [x] 3.3 Verify at 375 px: no horizontal scroll, no text smaller than 15px in body copy

## 4. The three documents

- [x] 4.1 `privacy/index.html` — head (title, description, canonical `https://shawarmania.in/privacy/`,
      lang, colour-scheme, theme-color), then the disclosures the `legal-pages` spec enumerates:
      what is collected, why, that numbers are never sold or passed on for third-party marketing,
      processors by role, retention and removal, the delivery-platform carve-out, and the entity /
      outlet / FSSAI / email / phone block from placeholders
- [x] 4.2 `terms/index.html` — website terms (counter price governs; brand assets), then a distinctly
      headed **Messaging programme** section: message types, roughly one per bill, carrier data
      rates, how to get help, how to stop
- [x] 4.3 `messages/index.html` — the opt-in document: the counter consent in the words staff use,
      what arrives and how often, and the opt-out paths — tell the counter, a `tel:` link, a
      `mailto:` link, and reply STOP alongside them. **No WhatsApp link**: both WhatsApp numbers are
      `null` and the only destination is a broadcast channel, which cannot be replied to. Terms and
      Privacy links above the fold at 375 px. **No form, no checkbox, no submit control**
- [x] 4.4 Give all three a minimal shared masthead (logo, brand name linking home) and footer
      (the other two documents, back to the site) — hand-written per page, base-path aware via
      `%BASE_URL%`, no shared component runtime
- [x] 4.5 Add the three as `build.rollupOptions.input` entries in `vite.config.ts` and confirm
      `dist/privacy/index.html` etc. land at the directory paths the `pages-deployment` spec requires
- [x] 4.6 Read all three end to end against the STOP question: every claim about what happens when a
      customer asks to stop must be one the business can honour today through the counter, the phone
      or email. Reply-STOP is named only as a path alongside those, never as the only one

## 4b. One outlet, not two

- [x] 4b.1 Kanchrapara is closing [owner, 2026-09-21] — the three documents name Kalyani only, with
      its own FSSAI licence `22825123001193`. Confirm the attribution against `src/data/SOURCES.md`
      (each number read off that outlet's own Zomato listing) rather than assuming
- [x] 4b.2 Delete `outlets.fssaiJoined` and `outlets.count` from `plugins/legal-facts.ts`: those two
      aggregates were the only reason the Kanchrapara licence reached three footers and a fact table.
      Do **not** filter the outlet out of the loop by id — that breaks silently when the trading
      outlet changes
- [x] 4b.3 Sweep the documents for plural phrasing the aggregates left behind — "our two outlets",
      "one of our counters", "our kitchens", "one of the outlets"
- [x] 4b.4 Leave the landing page listing both outlets: it describes a business that today has two
      counters, and only the legal documents are forward-dated to the RCS launch

## 5. The footer, and the modals it replaces

- [x] 5.1 Replace the two `LegalModal` triggers in `src/sections/Footer/Footer.tsx` with three
      anchors — Privacy, Terms, Messaging — using the base-aware href helper in `src/lib/assetUrl.ts`
      rather than literal `/privacy/`
- [x] 5.2 Adjust `Footer.module.css` `.legalRow` for links rather than buttons; keep the tap-target
      class and the focus treatment
- [x] 5.3 Delete `src/components/LegalModal/LegalModal.tsx` and `LegalModal.module.css`, and confirm
      nothing else imports them

## 6. Search metadata

- [x] 6.1 Add the three URLs to `public/sitemap.xml` at priority 0.3; leave the landing page's entry
      and `robots.txt` untouched, and add nothing about receipts
- [x] 6.2 Confirm none of the three documents carries a `noindex` directive

## 7. The receipt's messaging note

- [x] 7.1 Add `'How we message you: shawarmania.in/messages'` to the `notes` array in
      `worker/src/content.ts`, after the existing two
- [x] 7.2 Add one **generic** rule in `worker/src/page.ts`: a `shawarmania.in/…` token inside a note
      renders as an anchor. Generic — no matching on a specific sentence, which is the drift
      `content.ts` exists to prevent
- [x] 7.3 Leave `worker/src/pdf.ts` rendering the note as text (a printed link is text) and confirm
      `worker/test/content.test.ts` — the agreement test — passes unchanged, proving both renderers
      carry it
- [x] 7.4 `npm run worker:test` and `npm run worker:typecheck` green; confirm the receipt still names
      no customer

## 8. Documentation

- [x] 8.1 `README.md` — the "Notes & known limitations" line saying legal modal texts are honest
      placeholders pending owner legal review is no longer true; replace it with the three URLs and
      what they are for. Note in the project layout that `privacy/`, `terms/` and `messages/` are
      additional build entries
- [x] 8.2 `openspec/ROADMAP.md` — add this change as 11 in the sequence table, and record the
      launch-blocking dependencies that live outside this repo (ops-side STOP suppression, the
      counter's consent line) so they are not lost between repos

## 9. Manual QA

The owner walks this before the change is archived. Some of it was checked during implementation and
is recorded here so the owner knows what is left rather than what is merely claimed:

- **Already verified in implementation** — 9.1 (build green, 660.9 kB of a 1.5 MB initial budget, the
  same eight font files as before, one JS chunk still); 9.2 partially, against the dev server rather
  than `preview`; the no-script requirement by grep on the built documents (0 `<script>` in each);
  no horizontal overflow and the stacked facts table at 375 px; the base-path fallback with
  `VITE_BASE=/shawarmania/`; the placeholder guard failing a build on purpose; the footer's three
  links and their computed styling; `worker:test` 71/71 including new tests for the note.
- **Left for the owner** — 9.3 (JavaScript disabled), 9.5 (print preview), 9.6 (back button and the
  scroll runtime), 9.7 (the links actually dialling and addressing), 9.8 (the landing page's motion,
  which needs a visible browser — the pane freezes rAF when hidden), 9.9 (a real bill through
  `wrangler dev`), and 9.10, which nobody else can do.

- [ ] 9.1 `npm run build` passes, the weight report prints within budget (initial-load was ~630 kB of
      1.5 MB before this change) and the font file count in the report is unchanged
- [ ] 9.2 `npm run preview` — open `/privacy/`, `/terms/` and `/messages/` directly by URL: each
      renders fully styled with no console errors
- [ ] 9.3 Reload all three **with JavaScript disabled**: full text, full styling, every link works
- [ ] 9.4 At 375 px and at desktop width: no horizontal scroll, readable measure rather than
      full-width prose, comfortable tap targets; from `/messages/`, Terms and Privacy visible without
      scrolling
- [ ] 9.5 Print-preview one document and confirm it is legible on paper
- [ ] 9.6 Footer on the landing page shows Privacy · Terms · Messaging, each navigates correctly, and
      the browser back button returns with the scroll runtime intact
- [ ] 9.7 The `/messages/` opt-out links open the right app with the right recipient — call rings
      `+91 89815 24778`, the mail link addresses `hello@shawarmania.in` — and no link on the page
      leads to the WhatsApp broadcast channel as a way to opt out
- [ ] 9.8 Landing page regression: hero pin, marquee, menu gallery, counters and
      `prefers-reduced-motion` all behave as before, at 375 px and desktop
- [ ] 9.9 `/bill/<token>` against `wrangler dev`: renders, the new note is in the small print, the
      link reaches `/messages/`, the PDF downloads and carries the note as text
- [ ] 9.10a The three documents name **Kalyani only** — no Kanchrapara address, and FSSAI
      `22825123001193` rather than `12826013000341` — while the landing page still lists both
- [ ] 9.10 Owner sign-off on the facts: **De & Datta LLP** is the correct entity name, Kalyani's
      FSSAI number and address are right, `hello@shawarmania.in` receives a test mail and is read by
      someone, and every claim on `/messages/` about stopping messages is true today or scheduled
      before the RCS agent is submitted
