## Context

This repo ships one document. `index.html` is the only Vite entry, React mounts into `#root`, and
everything a visitor can read is inside a bundle behind GSAP and Lenis. Privacy and Terms exist only
as `<dialog>` modals rendered by [`LegalModal`](../../../src/components/LegalModal/LegalModal.tsx)
from copy hard-coded in `Footer.tsx` — no URL, nothing without JavaScript, and a second copy of
privacy prose that no one maintains.

The RCS registration needs three URLs that a stranger — a Telinfy reviewer, then Google's brand
review — can open cold and read. That makes the constraint unusual for this repo: these are the
first pages here whose **audience is a reviewer and a worried customer**, not a hungry one. The same
reasoning that already governs `/bill/*` applies, and `worker/src/page.ts` states it plainly — the
motion runtime "exists to sell and has no business on a receipt somebody opened to check what they
were charged." Somebody opening `/privacy/` to find out what happened to their phone number is the
same person.

Three constraints shape everything below:

1. **They must render with JavaScript off.** Approval guides are explicit that reviewers load the
   links and read them; a blank `#root` is a rejection.
2. **The facts on them must not drift.** `src/data/*.json` is this repo's source of truth, guarded by
   zod and edited through `/admin`. A page that retypes the FSSAI numbers is a page that will be
   wrong after the next licence renewal.
3. **They must survive the base-path fallback.** `pages-deployment` still promises
   `VITE_BASE=/shawarmania/` works if the domain is ever dropped, so no page may hardcode a leading
   `/`.

## Goals / Non-Goals

**Goals:**

- Three permanent, crawlable, no-JavaScript URLs — `/privacy/`, `/terms/`, `/messages/` — carrying
  the disclosures RCS review requires, in brand voice and brand colour.
- One source of truth for every business fact they state: the existing data layer.
- Privacy and Terms reachable from the footer, where review looks; Terms and Privacy reachable from
  the opt-in page, where review also looks.
- The landing page's bundle, weight and motion untouched.

**Non-Goals:**

- A router. This change adds no client-side routing and no `react-router`; the landing page stays a
  single-page experience and the new pages are separate documents.
- An opt-in form, or any new backend. Consent for this programme is taken at the counter; a web form
  would invent a second consent path that nothing honours.
- A WhatsApp opt-out. `franchise.enquiry.whatsappNumber` and `brand.whatsappNumber` are both `null`,
  and `whatsappHref()`'s fallback is `brand.whatsappChannelUrl` — a **broadcast channel**, which
  cannot be replied to. A "WhatsApp us to stop" link resolving to a channel is a dead end on the one
  page whose whole job is to be a way out. It is omitted, and the page gains it the moment a real
  number is set through the portal.
- Lawyer-grade drafting. The copy is honest, specific and reviewable, written to describe what this
  business actually does. It still wants the owner's read — item 7 of the QA checklist — and it is
  no longer labelled "pending review" as a substitute for saying anything.
- Anything in the ops repo. STOP suppression and the counter consent line are named as dependencies
  and implemented there.

## Decisions

### D1 — Additional Vite HTML entries, not `public/`, not SPA routes, not the Worker

`build.rollupOptions.input` gains three entries whose sources live at `privacy/index.html`,
`terms/index.html` and `messages/index.html`. Rollup preserves the relative directory, so `dist/`
gains `privacy/index.html` and GitHub Pages serves it at the directory URL `/privacy/`.

Alternatives, and why not:

- **Hash or history routes in the SPA** (`/#privacy`) — fails constraint 1 outright, and a
  history route on Pages 404s without a `404.html` redirect hack. A reviewer who sees a 404 does not
  file a bug.
- **Hand-written files in `public/`** — copied verbatim, so they would render, but they get no
  `%BASE_URL%` substitution, no CSS pipeline, no hashing, and no way to read the data layer. Every
  fact would be retyped into three files: constraint 2 broken three times.
- **Serve them from the Worker** — it holds the ops service-role key and is scoped to `/bill/*` for
  exactly that reason. Widening its route to serve public marketing documents adds attack surface to
  the one thing here holding a credential, to solve a problem a static file solves.

Directory URLs rather than `/privacy.html` because these get pasted into a registration form, quoted
in a privacy notice, and printed in small print on a receipt. `/messages/` should still work the day
the implementation behind it changes.

### D2 — No React, no GSAP, no Lenis; brand faces reused, not re-shipped

Each page is hand-written HTML with one `<link>` to a shared `src/styles/legal.css`, which imports
`tokens.css` and `fonts.css`. No script tag of any kind.

Importing `fonts.css` costs **nothing in `dist`**: `@fontsource` emits the same hashed `woff2`
files the landing page already ships, so Rollup reuses them and the weight report does not move.
The pages look like Shawarmania rather than like a legal PDF, which matters more than it sounds —
a customer who taps "how we message you" from a receipt should land somewhere that is obviously the
same business.

`legal.css` is deliberately small and layout-only: a single readable measure, generous line height,
the cream-on-near-black palette from tokens, flame-gradient rules under headings, and a print
stylesheet so a customer can keep a copy. No animation, no `prefers-reduced-motion` branch needed,
because nothing moves.

### D3 — Facts are injected at build time from `src/data`, never retyped

A new dev-and-build Vite plugin, `plugins/legal-facts.ts`, implements `transformIndexHtml` and
replaces `{{brand.legalEntityName}}`-style placeholders with values read from `src/data/*.json`.

It follows the pattern `plugins/validate-content.ts` already set: **read through `fs`, parse through
the shared zod schemas, never `import` the JSON** — so the data files stay out of the config's
dependency graph and a portal save does not restart the dev server. A reload picks the new value up.

The plugin **throws if any `{{…}}` placeholder survives the pass**, on a typo'd path as much as on a
missing value. The failure mode it exists to prevent is a page that reaches a customer reading
`{{brand.email}}`, and a build that fails loudly is the cheapest possible guard.

Placeholder syntax is `{{…}}` rather than Vite's own `%…%` so an unresolved one cannot be mistaken
for an env substitution, and so the two mechanisms — env for `BASE_URL`, plugin for business facts —
stay visibly distinct in the source.

Why not render the pages from React at build time (SSG)? It would need a prerender step, a second
render path for components written for a scroll runtime, and a build that can fail in a new way, to
produce documents that are three pages of prose with no interactivity. Placeholders in HTML are the
smaller mechanism that satisfies the same constraint.

### D4 — Two facts stop being `null`, in the data layer rather than in the pages

`brand.json` gets `legalEntityName: "De & Datta LLP"` and `email: "hello@shawarmania.in"`. Both were
`null` — the "unknowns stay `null` and render honest fallbacks" convention working as designed — and
both are now known, required by the registration, and named on the pages.

They go in the data layer, not inline in the HTML, because the footer, the JSON-LD and the portal's
to-do list all want them too, and because `brand.email` is the address a customer is told to write
to. That must be one string in one place.

The zod schema already declares both fields as nullable, so no schema change is needed; the portal
surfaces them automatically and the to-do list shortens by two.

### D4a — The documents speak for Kalyani only

Kanchrapara is closing [owner, 2026-09-21], so the three documents name **one outlet**: Kalyani —
Central Park, with its own FSSAI licence `22825123001193`. The landing page still lists both, which
is correct — it is describing a business that today has two counters — but a privacy notice and a
messaging consent record are about a specific place taking a specific number, and naming an outlet
that will not exist when the RCS agent goes live is a fact that starts wrong and gets worse.

The enforcement is in the injection mechanism rather than in the prose. `outlets.fssaiJoined` and
`outlets.count` are **deleted** from `legal-facts.ts`: those two aggregates were the only reason
Kanchrapara's licence appeared in three footers and a fact table, because a joiner is the convenient
thing to reach for. Per-outlet facts remain, addressed by id, so a document naming a second outlet
now has to name it on purpose.

What the plugin deliberately does **not** do is filter `kanchrapara` out of its own loop. That would
have been the one-line version and the worse one — it breaks silently the day the trading outlet
changes or a third opens, which for a brand whose whole roadmap is franchising is a matter of when.

Which licence belongs to Kalyani is not a guess: `src/data/SOURCES.md` records each number as read
off that outlet's own Zomato listing, and the licence type corroborates it — `2…` is a State Licence,
which the Kalyani storefront would hold, against Kanchrapara's `1…` Registration for a delivery-only
kitchen. A third number, `22819040000482`, appears on the lab certificate in
`research/instagram/findings.md` against the **Kanchrapara** address and is still flagged there for
the owner to reconcile; it is not Kalyani's and is not used.

### D5 — The footer links, and `LegalModal` is deleted

`Footer.tsx` swaps two modal triggers for three anchors — Privacy, Terms, Messaging — built with the
base-aware href helper rather than a literal `/privacy/`.

`LegalModal.tsx` and its module CSS are **deleted rather than left unused**. The component's only
consumer was this footer, and the real reason is the copy: leaving the modals in place would leave a
second, shorter, differently-worded privacy statement inside the bundle, one commit away from
contradicting the page a reviewer reads. One statement, one place.

This reverses a requirement the `site-footer` spec states outright ("No routes are introduced"), so
it is a spec delta rather than a quiet edit.

### D6 — The receipt says nothing about the messaging programme

An earlier draft put a third note in the receipt's small print — `How we message you:
shawarmania.in/messages` — in `content.ts` so the page and the 80 mm PDF carried it identically,
with a generic linkifier in `page.ts`. It was built, tested and committed. **It has been taken back
out** [owner, 2026-09-21], and the reasoning is worth keeping because the mistake is an easy one to
make again.

The owner's objection was simply that no restaurant receipt they had ever seen carries such a line,
and they were right. The disclosure belongs on **the message, not the receipt**. Every SMS and RCS
regime puts "Reply STOP to stop" in the message footer, which is where it is required and where
people look for it. A receipt is a record of a transaction; the messaging programme is not
transaction data. And the case is worse here than in general, because the receipt *arrives by* the
message — so its reader already holds the artifact that should carry the instruction.

The argument for it had been discoverability: somebody who wants the messages stopped is already
looking at the receipt. That is true, and it is not worth a line on every bill, on the kept PDF, for
every reader — most of whom received the link by WhatsApp or by hand and are not in the programme at
all. `page.ts` already states the principle this violated: the motion runtime "exists to sell and has
no business on a receipt somebody opened to check what they were charged." A messaging link is in
that same category.

What stays is the outlet line, corrected: the small print read `Shawarmania · Kalyani &
Kanchrapara` and now reads `Shawarmania · Kalyani`, for the same reason the documents name one
outlet.

### D7 — Indexed, listed in the sitemap, and canonical

These pages should be found. Each carries its own `<title>`, meta description, canonical URL and the
existing theme-color, and `public/sitemap.xml` grows three `<url>` entries at priority 0.3. Nothing
about the receipt's `noindex` posture changes — that is a header on a different origin path and is
explicitly out of scope here.

## Risks / Trade-offs

- **The pages promise that STOP works, and today nothing honours it.** → The copy on `/messages/`
  describes the opt-out paths a customer can already use *for certain* — tell the counter, call,
  write — and names replying STOP alongside them. The ops-side suppression flag and the
  Telinfy inbound webhook are listed in the proposal's Impact as launch blockers, and QA item 7 makes
  the owner confirm every claim is true or scheduled **before the agent is submitted**, not after. If
  ops slips, the honest fix is to cut the STOP sentence, not to ship a promise.
- **A second HTML entry is a new way for the build to behave differently.** → `rollupOptions.input`
  changes how Rollup names shared chunks, which could in principle perturb the landing page's
  bundle. The pages carry no script, so there is no shared JS chunk to split; the weight gate prints
  a per-file report on every build, and QA item 10 walks the landing page.
- **The placeholder plugin is a new failure point in front of every HTML file, including
  `index.html`.** → It only rewrites `{{…}}`, a token that appears nowhere in the repo today, so a
  file without placeholders passes through untouched. The throw-on-leftover behaviour means its
  worst realistic failure is a red build, not a wrong page.
- **Three pages of prose are three pages that can go stale** — hours, licences, an outlet closing.
  → Every such fact is a placeholder resolved from `src/data`, so the portal remains the single edit
  point. What is genuinely hand-written is policy, which changes when the business decides it does.
- **Deleting `LegalModal` loses the modal-based a11y flow** the `site-footer` spec valued (focus
  trap, Esc). → A page is the stronger accessible answer: real navigation, real back button, real
  URL to share, readable at any zoom, and no focus management to get wrong.

## Migration Plan

Nothing to migrate — there is no state, no data and no URL that previously existed. Deploy is the
ordinary push to `main`; GitHub Pages serves the three new directories on the next build. The Worker
deploys separately (`npm run worker:deploy`) for the receipt note, and the two are independent by
design: the pages can go live before the note, and should, since the note points at them.

Rollback is a revert. The only external commitment is the three URLs pasted into the Telinfy form, so
the pages must not be removed or renamed once the agent is submitted — `/messages/` in particular is
printed on receipts from the moment the Worker ships.

Order of operations for the owner, which matters:

1. Create `hello@shawarmania.in` and confirm mail arrives (Cloudflare Email Routing — the zone is
   already there since the receipt cutover).
2. Merge and deploy this change; check the three URLs load.
3. Deploy the Worker so receipts carry the note.
4. Get ops to honour STOP and give the counter its consent line.
5. Only then paste the URLs into Telinfy and submit for review.

## Open Questions

- **Is `hello@shawarmania.in` the address staff can actually answer?** The pages tell customers to
  write there about their data and their consent, which is a mailbox someone must read. If it is
  forwarding to a personal inbox, that is fine and worth knowing.
- **Does Telinfy's "Opt in Page" field want a URL or free text?** The form's styling suggests a URL,
  which `/messages/` satisfies. If it turns out to be a textarea, the opt-in description drafted with
  this change is what goes in it — the page and the field then say the same thing either way.
- **Does the LLP's registered address differ from the outlet addresses?** The pages name the outlets
  from `outlets.json`. If De & Datta LLP's registered office is a third address, a privacy notice is
  the conventional place to state it, and it would come from a new `brand.json` field.
- **Is DLT registration (entity + header) already done on Telinfy's side?** Not a blocker for these
  pages, but it gates the SMS fallback for non-RCS handsets and is worth asking them before review.
