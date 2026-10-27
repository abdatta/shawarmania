## Context

`shawarmania.in` has two deployables (README "Two deployables, one domain"):

| | Deploys by today |
|---|---|
| The site (Vite → GitHub Pages) | `.github/workflows/deploy.yml`, every push to `main` |
| The receipt + menu Worker `shawarmania-receipt` (`/bill*`, `/menu*`) | `npm run worker:deploy` by hand, wrangler OAuth-logged-in on the owner's machine |

The Worker's checks already exist and are fast and hermetic: `npm run worker:typecheck` (tsc over
`worker/`), `npm run worker:test` (vitest in plain Node — 4 files, ~200 tests, no network, no
database), and `npm run worker:assets`, which rewrites `worker/src/assets.generated.ts` from
`src/assets/brand/logo.png`, three `@fontsource` woff2 files in `node_modules`, and the TTFs in
`worker/fonts/`. That generated file **is committed**, and wrangler bundles the committed copy;
regenerating it today on `main` produces no diff, so the script is deterministic.

What the Worker reads from outside `worker/`: `wrangler.toml`; its npm dependencies (`pdf-lib`,
`@pdf-lib/fontkit`, the fontsource packages, `wrangler`, `typescript`, `vitest`) via
`package.json`/`package-lock.json`; `src/assets/brand/logo.png` (assets); and `src/data/brand.json`,
which `worker/test/content.test.ts` checks the Worker's receipt content against.

`OPS_SERVICE_ROLE_KEY` is a Worker secret set with `wrangler secret put`. `wrangler deploy` uploads
code, `[vars]` and routes and leaves existing secrets alone.

## Goals / Non-Goals

**Goals:**

- A push to `main` that changes the Worker deploys it, with no manual step.
- Nothing deploys unless the Worker's own checks pass on that exact commit.
- Deploys land in push order.
- The Pages deploy is byte-for-byte unchanged.
- The runtime credential never leaves Cloudflare.

**Non-Goals:**

- Preview / staging Workers per PR. PRs run nothing here.
- Managing Worker secrets from CI.
- Coupling the two deploys (e.g. Worker waits for Pages). They stay independent, as the
  `pages-deployment` spec already requires.
- Changing `wrangler.toml`, the routes or the Worker's code.

## Decisions

### 1. A separate `worker-deploy.yml`, not a job in `deploy.yml`

The spec says the receipt runtime deploys independently of the site's workflow, and that a failure
of either does not block or trigger the other. A separate file makes that structural: its own path
filters (a job inside `deploy.yml` cannot have path filters — they are per workflow), its own
concurrency group (`deploy.yml` uses `pages` with cancel-in-progress, which is right for Pages and
wrong for wrangler), and its own permissions (`contents: read` only — no `pages`/`id-token`).

_Alternative_: one workflow with a `dorny/paths-filter` step gating a second job. Adds a third-party
action and couples the two runs' status for no gain.

### 2. Trigger: push to `main` with path filters, plus `workflow_dispatch`

```
worker/**
wrangler.toml
package.json
package-lock.json
src/assets/brand/logo.png     # inlined by worker:assets
src/data/brand.json           # read by worker/test/content.test.ts
.github/workflows/worker-deploy.yml
```

`package.json`/`package-lock.json` are broad (a site-only dependency bump redeploys the Worker), but
a redeploy of unchanged code is harmless and missing a `pdf-lib` or `wrangler` bump is not.
`workflow_dispatch` covers "redeploy now" (e.g. after a secret rotation, or the first run once the
secrets exist). The deploy step additionally requires `github.ref == 'refs/heads/main'`, so a manual
run from another branch can check but never deploy. No `pull_request` trigger.

### 3. One job: checks, then deploy

Steps: checkout → setup-node 22 with npm cache (same versions as `deploy.yml`) → `npm ci` →
`npm run worker:typecheck` → `npm run worker:test` → `npm run worker:assets` then
`git diff --exit-code -- worker/src/assets.generated.ts` → `npm run worker:deploy`.

The assets step is a **freshness check, not a build**: the committed file is the source of truth
for what the Worker serves and what reviewers saw. If someone changes the logo or bumps a font
without regenerating, CI fails and says so, rather than silently deploying something nobody
committed. One job rather than check-job + deploy-job: the checks take well under a minute, and a
single job avoids re-running `npm ci`.

`check-no-secret.mjs` scans `dist/`, which only the site build produces; it stays inside
`npm run build` in `deploy.yml`, untouched. This workflow never builds `dist/` and never handles the
secret, so there is nothing for it to scan here.

### 4. Deploy with the repo's own wrangler, not `cloudflare/wrangler-action`

`npm run worker:deploy` runs the wrangler pinned by `package-lock.json` (4.128.0 today) — the same
binary, the same command, the same config the manual fallback uses. `wrangler-action` would install
its own wrangler version (a second pin to keep in step) and adds a third-party action with access to
the token. wrangler authenticates non-interactively from `CLOUDFLARE_API_TOKEN` and
`CLOUDFLARE_ACCOUNT_ID` in the environment of that one step only. `WRANGLER_SEND_METRICS=false`.

### 5. Credentials: a scoped API token and the account id, as repo secrets

- `CLOUDFLARE_API_TOKEN`: a **custom** token (not the global key, not the broad "Edit Cloudflare
  Workers" template, which also grants KV, R2, Pages and more), with:
  - Account → **Workers Scripts: Edit** — upload the script, its vars, observability, the
    `workers.dev` toggle.
  - Zone → **Workers Routes: Edit**, zone resources limited to `shawarmania.in` — the two `[[routes]]`.
  - Zone → **Zone: Read**, same zone — wrangler resolves `zone_name = "shawarmania.in"` to a zone id
    before it can touch routes.
  - Account resources: only the Shawarmania account. Optional: client IP filtering is not used
    (GitHub runners' IPs vary); a TTL is optional and, if set, needs a calendar reminder.

  This is the smallest set the config needs as far as wrangler's documented API calls go; the first
  real run confirms it. If it fails with a Cloudflare authentication error (code 10000) on a named
  endpoint, add only the read permission that endpoint names (most likely Account → Account
  Settings: Read) and re-run — the design does not pre-grant it.
- `CLOUDFLARE_ACCOUNT_ID`: not secret, but kept beside the token so wrangler never needs
  `User → Memberships: Read` to discover it.
- `OPS_SERVICE_ROLE_KEY`: **not** in GitHub, not in the workflow. The token above cannot read it
  (Cloudflare never returns secret values) and `wrangler deploy` does not modify it.

Repo secrets are not exposed to workflows triggered from forks, and this workflow has no PR trigger
anyway.

### 6. Concurrency: queue, never cancel

`concurrency: { group: worker-deploy, cancel-in-progress: false }`. Two quick pushes: the first
finishes; the second waits and then deploys, so the live Worker is always the later commit. GitHub
keeps at most one pending run per group, so a third push replaces the waiting second — still the
newest wins, and never by killing an upload mid-flight.

### 7. The release-order hazard, kept and written down

`worker/src/menu.ts` (`assertOnlyMenu` / `MenuSaysTooMuch`) refuses any `public_menu` field it does
not know. When an ops migration (`shawarmania-ops`) adds one, the reader that accepts it must be live
first, or every menu fails until it is. Automatic deploys make the safe order easier but do not
enforce it across two repos. The rule, in this design, the spec and `worker/README.md`:

1. Push the Worker change that accepts the new field to this repo's `main`.
2. Wait for the "Deploy Worker" run on that commit to be **green** (Actions tab, or Cloudflare →
   Deployments).
3. Only then apply the ops migration.

The reverse (removing a field) is safe in either order, as today.

## Risks / Trade-offs

- [Secrets missing or token wrong] → The deploy step fails red, nothing is deployed, production stays
  on the previous Worker; `npm run worker:deploy` by hand still works. The first run after adding the
  secrets is a `workflow_dispatch`, so the failure mode is seen before any real change depends on it.
- [Token leaked] → It can replace the Worker's code and routes on one zone, which is serious (it could
  serve anything on `/bill*` and `/menu*`) but cannot read the service-role key or touch DNS, Pages
  or other zones. Mitigation: least privilege as above; rotate by rolling the token in Cloudflare and
  updating the one GitHub secret.
- [Bad code passes the checks] → Same as today's manual deploy. Rollback: Cloudflare dashboard →
  Workers → `shawarmania-receipt` → Deployments → roll back to the previous version, or
  `npx wrangler rollback`; then fix forward with a push.
- [Dashboard edits overwritten] → `wrangler deploy` makes the dashboard match `wrangler.toml`, as the
  manual deploy already does. Vars and routes belong in `wrangler.toml`.
- [Broad `package-lock.json` filter] → Some redundant Worker redeploys on site-only dependency bumps.
  Accepted; they are idempotent.
- [Ops migration applied before the Worker run is green] → Menus 500 until the Worker deploys.
  Mitigation is process (§7), now documented where both repos' authors look.

## Migration Plan

1. Merge the workflow and docs (fast-forward onto `main`). Its first automatic run fails at the deploy
   step if the secrets are not yet there — expected, harmless.
2. Owner creates the token and adds the two secrets (tasks §3).
3. Run "Deploy Worker" via `workflow_dispatch`; confirm green and a new Cloudflare deployment.
4. Push a comment-only change to `worker/src/menu-page.ts`; confirm it deploys on its own.

Rollback of this change: delete `worker-deploy.yml` (or disable it in the Actions tab); the manual
path never went away.

## Open Questions

- None blocking. The exact minimal permission set is confirmed by step 3 above; any added read
  permission is recorded in `worker/README.md`.
