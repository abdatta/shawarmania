## 1. The receipt's address

- [x] 1.1 Failing first, in `worker/test/route.test.ts`: `/bill?t=` is the page, with
      or without `view=counter`; the PDF and the three assets keep their addresses;
      `/bill/<token>` redirects keeping `view` and dropping a stray `t`; a token
      spelling an object property is still a token; every mangled `t` and malformed
      old-shape token is the one refusal; `/billing` and `/bills` are not ours
- [x] 1.2 `worker/src/route.ts`, `worker/src/index.ts` (uses it; the redirect before
      the rate limit and the lookup), `wrangler.toml` (the exact `shawarmania.in/bill`
      route)
- [x] 1.3 `README.md`, `worker/README.md`: the routes and the local URL
- [x] 1.4 `npm run worker:typecheck`, `npm run worker:test`, `npm run build`; the real
      runtime under `wrangler dev`, pointed at the **local** ops database: the page,
      the counter view, the PDF, the redirect and each refusal

## 2. Ship, in the owner's window, before the ops push

- [ ] 2.1 🧍 Push `main`, then `npm run worker:deploy`. Then, before the ops push:
      `https://shawarmania.in/bill?t=AAAAAAAAAA` is the Worker's refusal (it carries
      `X-Robots-Tag`), a real `/bill/<token>` redirects, and `/`, `/menu/`,
      `/privacy/` are unchanged
- [ ] 2.2 Archive with the parent, once DLT has accepted the template and a real
      receipt has been opened at the new address
