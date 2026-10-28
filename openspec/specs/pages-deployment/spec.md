# pages-deployment Specification

## Purpose
TBD - created by archiving change scaffold-and-deploy. Update Purpose after archive.
## Requirements
### Requirement: Automated GitHub Pages deployment
The repository SHALL contain a GitHub Actions workflow (`.github/workflows/deploy.yml`) that, on
push to `main` (and manual `workflow_dispatch`), builds the site with Node 22 and deploys `dist/`
to GitHub Pages using the official Pages actions (configure-pages, upload-pages-artifact,
deploy-pages) with `pages: write` + `id-token: write` permissions and cancel-in-progress
concurrency.

#### Scenario: Push to main deploys
- **WHEN** a commit lands on `main` with Pages source set to "GitHub Actions"
- **THEN** the workflow builds and publishes the site to the project's Pages URL

#### Scenario: Concurrent pushes do not race
- **WHEN** two pushes land in quick succession
- **THEN** the earlier in-flight deploy is cancelled and the latest commit wins

### Requirement: Base path configuration
The Vite build SHALL emit assets under a configurable base path (default `/` — the apex custom
domain `shawarmania.in` serves from the root — and `/` for dev), overridable via the `VITE_BASE`
environment variable so the build can still target a project page if the custom domain is ever
dropped.

#### Scenario: Default production base
- **WHEN** `npm run build` runs without overrides
- **THEN** emitted HTML references assets under `/`

#### Scenario: Base override
- **WHEN** `VITE_BASE=/shawarmania/ npm run build` runs
- **THEN** emitted HTML references assets under `/shawarmania/`

### Requirement: Custom apex domain
The site SHALL be served from `https://shawarmania.in/`. The deployed artifact SHALL contain a
`CNAME` file naming that domain, and every absolute URL the page publishes — canonical, `og:url`,
`og:image`, `twitter:image`, JSON-LD `url`, `sitemap.xml` and the `robots.txt` sitemap line —
SHALL use it.

#### Scenario: Apex domain serves the site
- **WHEN** a visitor opens `https://shawarmania.in/`
- **THEN** the site loads over HTTPS with all assets resolving from the root

#### Scenario: Legacy and www URLs redirect
- **WHEN** a visitor opens `https://abdatta.github.io/shawarmania/` or `https://www.shawarmania.in/`
- **THEN** they are redirected to `https://shawarmania.in/`

#### Scenario: Social preview resolves
- **WHEN** a crawler that does not resolve relative URLs reads the page head
- **THEN** `og:image` and `twitter:image` are absolute `https://shawarmania.in/` URLs

### Requirement: DNS configuration of record

The `shawarmania.in` zone SHALL use Cloudflare as its authoritative DNS provider,
while the apex `A` records remain
`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and
`185.199.111.153`, with the matching GitHub Pages `AAAA` records and `www` as a
`CNAME` to `abdatta.github.io`.

Cloudflare SHALL route only `shawarmania.in/bill*` and `shawarmania.in/menu*` to
the receipt Worker. Every other path SHALL continue to
reach the existing GitHub Pages deployment.

#### Scenario: DNS remains on the existing site

- **WHEN** the Cloudflare nameservers and receipt routes are active
- **THEN** the marketing site continues to resolve from GitHub Pages and only
  paths beginning `/bill` or `/menu` reach the Worker

### Requirement: The site keeps its deployment, and the receipt runtime gets its own

The static site SHALL continue to build and deploy exactly as it does today, to
GitHub Pages, from the same workflow, with the same base path and the same
`public/CNAME`.

The receipt runtime SHALL deploy independently of the site's workflow, from its
own workflow, SHALL NOT be part of the site's build, and SHALL NOT enter the
deployed Pages artifact or count against the page-weight budget.

A failure to deploy the receipt runtime SHALL NOT prevent the site deploying, and
a failure of the site's build SHALL NOT deploy a receipt runtime.

#### Scenario: The site is deployed

- **WHEN** a change to the marketing site only is pushed
- **THEN** it builds and publishes as before, and the receipt runtime is untouched

#### Scenario: The page-weight budget

- **WHEN** the build's page-weight check runs
- **THEN** the receipt runtime and its dependencies do not count toward it

#### Scenario: The receipt runtime's deploy fails

- **WHEN** the receipt runtime's workflow fails on a push that also changes the site
- **THEN** the site still builds and publishes from its own workflow

### Requirement: The receipt runtime's credential is a deployment secret

The credential the receipt runtime uses to read a bill SHALL be held as a
deployment secret. It SHALL NOT appear in the repository, in any committed
configuration file, in the site bundle, or in any response.

Rotating the credential SHALL require no change to the repository.

#### Scenario: The credential is not in the repository

- **WHEN** the repository and the deployed site bundle are searched
- **THEN** the credential appears in neither

### Requirement: The domain is fronted without moving the site

The brand domain SHALL resolve through a provider capable of routing one path
prefix to the receipt runtime, while continuing to serve every other path from the
existing static deployment.

The apex records SHALL continue to point at the existing static host, so that the
site is served by the same infrastructure before and after.

A documented fallback SHALL exist that serves receipts from a subdomain without
changing the domain's nameservers, in case the change of provider is refused or
reverted.

#### Scenario: After the domain is fronted

- **WHEN** the marketing site is requested
- **THEN** it is served from the same static host as before

#### Scenario: The change of provider is reverted

- **WHEN** the nameservers are returned to the previous provider
- **THEN** the marketing site continues to serve, unchanged, from records that were
  never modified

### Requirement: The Worker answers the menu as well as the receipt

The Worker SHALL be routed on `shawarmania.in/menu*` as well as
`shawarmania.in/bill*`, and GitHub Pages SHALL keep
serving every other path.
The menu SHALL be read with the same deployment-secret credential as the
receipt, through `public_menu(slug)` alone. The site's own build SHALL NOT carry
a copy of any outlet's menu once the route is live.

#### Scenario: The route is live

- **WHEN** a customer opens `/menu/kalyani-cafe/`
- **THEN** the Worker answers it from ops, and the home page, `/qr/` and the legal pages are served by Pages exactly as before

#### Scenario: The receipt is untouched

- **WHEN** a receipt link is opened after this change
- **THEN** it behaves exactly as it did before

### Requirement: The receipt runtime deploys itself on push

A push to `main` that changes the receipt runtime's code, configuration,
dependencies, or the repository files its assets and tests read SHALL deploy the
receipt runtime with no manual step. The same deploy SHALL be startable by hand.
A pull request SHALL NOT deploy it, and a manual run from any ref other than
`main` SHALL NOT deploy it.

The manual deploy from a developer machine SHALL remain available as a fallback.

#### Scenario: A menu wording change is pushed

- **WHEN** a commit changing only `worker/src/menu-page.ts` lands on `main`
- **THEN** the receipt runtime's workflow runs and the live Worker serves that commit

#### Scenario: A site-only change is pushed

- **WHEN** a commit that touches none of the receipt runtime's files lands on `main`
- **THEN** the receipt runtime's workflow does not run

#### Scenario: A pull request is opened

- **WHEN** a pull request changes `worker/**`
- **THEN** nothing is deployed

### Requirement: The receipt runtime's checks gate its deploy

The receipt runtime SHALL be deployed only after its type check, its test suite,
and a check that regenerating its inlined assets reproduces the committed file
exactly, all pass on the commit being deployed. If any fails, nothing SHALL be
deployed and the previously deployed runtime SHALL keep serving.

#### Scenario: A test fails

- **WHEN** a pushed commit breaks a Worker test
- **THEN** the workflow fails before deploying and production is unchanged

#### Scenario: Assets were not regenerated

- **WHEN** a commit changes the logo or a font package without regenerating `worker/src/assets.generated.ts`
- **THEN** the workflow fails before deploying and names the stale file

### Requirement: Automatic deploys hold no runtime credential

The automatic deploy SHALL authenticate to the hosting provider with a scoped
deploy token and an account identifier held as repository secrets, scoped to
deploying this one runtime's code and routes on the brand zone. The runtime's
database credential SHALL remain a deployment secret on the hosting provider
only: it SHALL NOT be stored in the repository's CI secrets, the workflow, or its
logs, and a deploy SHALL leave it in place.

#### Scenario: After an automatic deploy

- **WHEN** the workflow has deployed a new version
- **THEN** the runtime still holds its database credential, and the repository's CI secrets contain only the deploy token and account identifier

### Requirement: Deploys land in push order

Two pushes in quick succession SHALL deploy in the order they were pushed, and a
deploy in progress SHALL NOT be cancelled by a later push; the live runtime SHALL
end on the latest commit.

#### Scenario: Two quick pushes

- **WHEN** a second Worker change is pushed while the first is deploying
- **THEN** the first deploy completes, then the second, and the live Worker serves the second

### Requirement: A reader that accepts a new menu field ships first

Because the receipt runtime refuses any menu field it does not know, an ops change
that adds a field to the public menu SHALL be applied only after the receipt
runtime that accepts it has been deployed successfully. This ordering SHALL be
documented in the receipt runtime's README.

#### Scenario: Ops adds a menu field

- **WHEN** an ops migration adds a field to `public_menu`
- **THEN** the Worker change accepting it is pushed first, its deploy run is green, and only then is the migration applied

