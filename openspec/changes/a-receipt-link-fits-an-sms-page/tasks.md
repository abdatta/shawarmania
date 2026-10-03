## 1. The receipt's address

- [x] 1.1 Failing first, in `worker/test/route.test.ts`: `/bill?t=` is the page, with
      or without `view=counter`; the PDF and the three assets keep their addresses;
      `/bill/<token>` redirects keeping `view` and dropping a stray `t`; a token
      spelling an object property is still a token; every mangled `t` and malformed
      old-shape token is the one refusal; `/billing` and `/bills` are not ours
- [x] 1.2 `worker/src/route.ts`, `worker/src/index.ts` (uses it; the redirect before
      the rate limit and the lookup), `wrangler.toml` (the route becomes `shawarmania.in/bill*`;
      an exact `bill` route does not match a URL with a query string)
- [x] 1.3 `README.md`, `worker/README.md`: the routes and the local URL
- [x] 1.4 `npm run worker:typecheck`, `npm run worker:test`, `npm run build`; the real
      runtime under `wrangler dev`, pointed at the **local** ops database: the page,
      the counter view, the PDF, the redirect and each refusal

- [x] 1.5 *Operated by De & Datta LLP* beneath the outlet in `content.ts` (so the
      page, counter view and PDF), and in the refusal's hand-written footer; held to
      `brand.json`'s `legalEntityName` by a test. The refusal's "says nothing about
      which case" check now matches whole words, since *Operated* contains *rate*
- [x] 1.6 The same line on every page under the domain: `Footer.tsx` (home), the
      three legal pages' footers, and `menu-page.ts` (menu, not-found, unavailable,
      held by a test). No *©* anywhere; `site-footer` spec modified to say so

## 2. Ship, in the owner's window, before the ops push

- [x] 2.1 🧍 Push `main`, then `npm run worker:deploy`. Then, before the ops push:
      `https://shawarmania.in/bill?t=AAAAAAAAAA` is the Worker's refusal (it carries
      `X-Robots-Tag`), a real `/bill/<token>` redirects, and `/`, `/menu/`,
      `/privacy/` are unchanged
- [ ] 2.2 Archive with the parent, once DLT has accepted the template and a real
      receipt has been opened at the new address
