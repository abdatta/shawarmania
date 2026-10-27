## Why

The receipt + menu Worker (`shawarmania-receipt`, serving `/bill*` and `/menu*`) only goes live
when someone runs `npm run worker:deploy` by hand on the owner's machine, where wrangler is
OAuth-logged-in. The static site deploys itself on every push to `main`; the Worker does not. So a
change to the table menu's wording or UI — the Google review popup and banner in
`worker/src/menu-page.ts`, most recently — needs a push **and** a separate manual deploy, and a push
alone silently leaves production on the old Worker. The owner wants a push to `main` to be enough.

## What Changes

- New workflow `.github/workflows/worker-deploy.yml`: on push to `main` that touches the Worker
  (`worker/**`, `wrangler.toml`, `package.json`, `package-lock.json`, the two repo files the Worker's
  assets or tests read, and the workflow itself), plus `workflow_dispatch`, it runs the Worker's own
  checks and then `npm run worker:deploy`.
- The checks gate the deploy: `npm run worker:typecheck`, `npm run worker:test`, and a freshness check
  that `npm run worker:assets` reproduces the committed `worker/src/assets.generated.ts` exactly.
- Authenticated by two GitHub repo secrets, `CLOUDFLARE_API_TOKEN` (a scoped token) and
  `CLOUDFLARE_ACCOUNT_ID`. The Worker's runtime secret `OPS_SERVICE_ROLE_KEY` stays in Cloudflare and
  is never given to GitHub; `wrangler deploy` keeps the secrets already on the Worker.
- A `worker-deploy` concurrency group that queues rather than cancels, so deploys land in push order
  and none is killed half-way. Never runs on pull requests.
- `.github/workflows/deploy.yml` (Pages) is not touched; `node worker/scripts/check-no-secret.mjs`
  keeps running inside its `npm run build`.
- Docs: `README.md` "Two deployables, one domain" and `worker/README.md` "Deploying it" describe the
  automatic path, keep `npm run worker:deploy` as the fallback, and state the release-order rule for
  ops migrations that add a `public_menu` field.

## Capabilities

### New Capabilities

_None._

### Modified Capabilities

- `pages-deployment`: the receipt runtime still deploys independently of the site's workflow, but now
  automatically on push to `main` from its own workflow, gated by its own checks, with Cloudflare
  credentials held as repo secrets and the runtime credential kept out of GitHub; the release-order
  rule for `public_menu` fields becomes a requirement.

## Impact

- **New**: `.github/workflows/worker-deploy.yml`.
- **Docs**: `README.md`, `worker/README.md`.
- **Unchanged**: `wrangler.toml`, `worker/src/**`, `package.json`, `.github/workflows/deploy.yml`.
- **Owner step**: create a Cloudflare API token and add `CLOUDFLARE_API_TOKEN` +
  `CLOUDFLARE_ACCOUNT_ID` as GitHub Actions secrets. Until they exist the workflow fails at the deploy
  step (red ✗ in Actions) and nothing is deployed — the manual path keeps working.
- **Ops repo**: no change, but a migration that widens `public_menu` must wait until this repo's
  "Deploy Worker" run for the accepting reader is green.

## Manual QA checklist

- [ ] With the secrets in place, push a comment-only change to `worker/src/menu-page.ts`: the
      "Deploy Worker" run goes typecheck → test → assets → deploy, green.
- [ ] Cloudflare dashboard → Workers → `shawarmania-receipt` → Deployments shows a new version at the
      time of the run; `OPS_SERVICE_ROLE_KEY` is still listed under Settings → Variables and Secrets.
- [ ] `https://shawarmania.in/menu/kalyani-cafe/` and a real `/bill?t=…` link load as before, at
      phone width (375 px) and desktop (1440 px); the review popup still docks into the banner.
- [ ] `https://shawarmania.in/` still loads from Pages.
- [ ] A push that touches only site files (e.g. `src/sections/**`) runs the Pages workflow and does
      **not** start the Worker workflow.
