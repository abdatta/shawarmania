# pages-deployment

## RENAMED Requirements
- FROM: `### Requirement: Project-page base path configuration`
- TO: `### Requirement: Base path configuration`

## MODIFIED Requirements

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

## ADDED Requirements

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
The `shawarmania.in` zone (registrar/DNS: Hostinger) SHALL point the apex at GitHub Pages via
`A` records `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` and the
matching `AAAA` records `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153`,
`2606:50c0:8003::153`, with `www` as a `CNAME` to `abdatta.github.io`.

#### Scenario: DNS check passes
- **WHEN** the custom domain is saved in repo Settings → Pages
- **THEN** GitHub's DNS check succeeds and "Enforce HTTPS" becomes available
