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

Cloudflare SHALL route only `shawarmania.in/bill/*` to the receipt Worker. Every
other path SHALL continue to reach the existing GitHub Pages deployment.

#### Scenario: DNS remains on the existing site

- **WHEN** the Cloudflare nameservers and receipt route are active
- **THEN** the marketing site continues to resolve from GitHub Pages and only
  `/bill/*` reaches the Worker

### Requirement: The site keeps its deployment, and the receipt runtime gets its own

The static site SHALL continue to build and deploy exactly as it does today, to
GitHub Pages, from the same workflow, with the same base path and the same
`public/CNAME`.

The receipt runtime SHALL deploy independently of the site's workflow, SHALL NOT
be part of the site's build, and SHALL NOT enter the deployed Pages artifact or
count against the page-weight budget.

A failure to deploy the receipt runtime SHALL NOT prevent the site deploying, and
a failure of the site's build SHALL NOT deploy a receipt runtime.

#### Scenario: The site is deployed

- **WHEN** a change to the marketing site is pushed
- **THEN** it builds and publishes as before, and the receipt runtime is untouched

#### Scenario: The page-weight budget

- **WHEN** the build's page-weight check runs
- **THEN** the receipt runtime and its dependencies do not count toward it

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
