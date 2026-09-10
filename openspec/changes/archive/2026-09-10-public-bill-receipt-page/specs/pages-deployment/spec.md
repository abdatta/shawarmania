## ADDED Requirements

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

## MODIFIED Requirements

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
