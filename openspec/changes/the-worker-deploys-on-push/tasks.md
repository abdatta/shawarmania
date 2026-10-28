## 1. The workflow

- [x] 1.1 Add `.github/workflows/worker-deploy.yml` ("Deploy Worker"): `push` to `main` with the path
      filters from design §2, plus `workflow_dispatch`; no `pull_request`; `permissions: contents: read`;
      `concurrency: { group: worker-deploy, cancel-in-progress: false }`
- [x] 1.2 One job on `ubuntu-latest`: `actions/checkout@v7`, `actions/setup-node@v6` (Node 22, npm
      cache) — the same versions as `deploy.yml` — then `npm ci`
- [x] 1.3 Gate steps: `npm run worker:typecheck`, `npm run worker:test`, `npm run worker:assets` followed
      by `git diff --exit-code -- worker/src/assets.generated.ts` with an error message naming the fix
- [x] 1.4 Deploy step: `npm run worker:deploy`, only `if: github.ref == 'refs/heads/main'`, with
      `CLOUDFLARE_API_TOKEN` / `CLOUDFLARE_ACCOUNT_ID` from secrets and `WRANGLER_SEND_METRICS=false`
      in that step's env only; no reference to `OPS_SERVICE_ROLE_KEY` anywhere in the file
- [x] 1.5 Confirm `.github/workflows/deploy.yml` is unchanged, and `npm run build` (which runs
      `check-no-secret.mjs`), `worker:typecheck`, `worker:test` and the assets freshness check pass
      locally

## 2. Docs

- [x] 2.1 `README.md` "Two deployables, one domain": the Worker row deploys by
      `.github/workflows/worker-deploy.yml` on a push to `main` that touches it, `npm run worker:deploy`
      as the fallback
- [x] 2.2 `worker/README.md` "Deploying it": the automatic path, what triggers it, what gates it, the two
      repo secrets and the token's permissions, the manual fallback, rollback; and the release-order rule
      (push the accepting Worker, wait for a green run, then apply the ops migration)

## 3. Owner: Cloudflare token and GitHub secrets (cannot be done by the agent)

- [x] 3.1 Cloudflare dashboard → profile icon (top right) → **My Profile** → **API Tokens** →
      **Create Token** → **Custom token: Get started**. Name `github-actions-shawarmania-receipt`.
      Permissions (use **+ Add more** for each row):
      `Account | Workers Scripts | Edit`, `Zone | Workers Routes | Edit`, `Zone | Zone | Read`.
      Account Resources: `Include | <the Shawarmania account>`. Zone Resources:
      `Include | Specific zone | shawarmania.in`. Leave IP filtering empty and TTL as you prefer →
      **Continue to summary** → **Create Token** → copy the token (shown once)
- [x] 3.2 Cloudflare dashboard → **Workers & Pages** (or the account home) → copy the **Account ID**
      from the right-hand sidebar (or from the URL, `dash.cloudflare.com/<account id>/…`)
- [x] 3.3 GitHub → `abdatta/shawarmania` → **Settings** → **Secrets and variables** → **Actions** →
      **New repository secret**: name `CLOUDFLARE_API_TOKEN`, value the token → **Add secret**; again for
      `CLOUDFLARE_ACCOUNT_ID` with the account id. Do not add `OPS_SERVICE_ROLE_KEY`

## 4. Verify

- [x] 4.1 GitHub → Actions → **Deploy Worker** → **Run workflow** on `main`; green, and Cloudflare →
      `shawarmania-receipt` → Deployments shows the new version. If the deploy fails with an auth error
      (code 10000), add only the read permission the error's endpoint needs, record it in
      `worker/README.md` and design §5, and re-run
- [x] 4.2 Push a comment-only change to `worker/src/menu-page.ts` to `main` (fast-forward); its push run
      deploys on its own; the Pages run behaves as before

## 5. Manual QA

- [x] 5.1 `https://shawarmania.in/menu/kalyani-cafe/` at 375 px and 1440 px: menu renders, the review
      popup appears and docks into the bottom banner after five seconds; with reduced motion on, the
      banner's arrow does not sway
- [ ] 5.2 A real `/bill?t=…` link opens the receipt and its PDF downloads
- [x] 5.3 `https://shawarmania.in/` and `/qr/` load from Pages as before; `npm run build` passes
- [x] 5.4 Cloudflare → `shawarmania-receipt` → Settings → Variables and Secrets still lists
      `OPS_SERVICE_ROLE_KEY`
- [ ] 5.5 The next site-only push (e.g. `src/sections/**`) does not start "Deploy Worker"
