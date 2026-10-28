# Agent contract

For Claude Code, Codex and any other agent working in this repo. The human docs are
[`README.md`](README.md) (the site) and [`worker/README.md`](worker/README.md) (the receipt + menu
Worker); this file is the short list of things an agent gets wrong without them.

## Deploying: a push to `main` is the whole release

| What | Deployed by | When |
|---|---|---|
| The static site (GitHub Pages) | `.github/workflows/deploy.yml` | every push to `main` |
| The receipt + menu Worker `shawarmania-receipt` (`/bill*`, `/menu*`) | `.github/workflows/worker-deploy.yml` ("Deploy Worker") | a push to `main` that touches `worker/**`, `wrangler.toml`, `package*.json`, `src/assets/brand/logo.png`, `src/data/brand.json` or the workflow |

- **Do not run `npm run worker:deploy` / `wrangler deploy` locally** to ship a change. Push to
  `main` and watch the run (`gh run list --workflow worker-deploy.yml`). The manual command is a
  fallback for when Actions itself is down, and only if the owner says so.
- To redeploy with no code change (e.g. after a secret rotation): Actions → Deploy Worker → Run
  workflow, or `gh workflow run worker-deploy.yml --ref main`.
- The Worker deploys only after `worker:typecheck`, `worker:test` and an assets-freshness check pass.
  Run those locally before pushing; if you changed the logo or a font, run `npm run worker:assets`
  and commit the result.
- Credentials: `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` are GitHub repo secrets.
  `OPS_SERVICE_ROLE_KEY` lives only in Cloudflare. Never put it in the repo, a workflow or GitHub.
  Never create, edit or move tokens yourself; that is the owner's step.
- **Release order with ops:** the Worker refuses `public_menu` fields it does not know. If an ops
  migration (`shawarmania-ops`) adds one, push the Worker change that accepts it here first, wait for
  its Deploy Worker run to go green, and only then apply the migration.

## Working here

- Spec-driven: `/opsx:propose` → owner approval → `/opsx:apply` → `/opsx:archive`. Specs are in
  `openspec/specs/`, changes in flight in `openspec/changes/`.
- Git: work on `main`, rebase onto the latest `origin/main`, fast-forward only, no merge commits.
