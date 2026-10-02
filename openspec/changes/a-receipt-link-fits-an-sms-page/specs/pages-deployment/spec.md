## MODIFIED Requirements

### Requirement: DNS configuration of record

The `shawarmania.in` zone SHALL use Cloudflare as its authoritative DNS provider,
while the apex `A` records remain
`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, and
`185.199.111.153`, with the matching GitHub Pages `AAAA` records and `www` as a
`CNAME` to `abdatta.github.io`.

Cloudflare SHALL route only `shawarmania.in/bill`, `shawarmania.in/bill/*` and
`shawarmania.in/menu*` to the receipt Worker. Every other path SHALL continue to
reach the existing GitHub Pages deployment.

#### Scenario: DNS remains on the existing site

- **WHEN** the Cloudflare nameservers and receipt routes are active
- **THEN** the marketing site continues to resolve from GitHub Pages and only
  `/bill`, `/bill/*` and `/menu*` reach the Worker

### Requirement: The Worker answers the menu as well as the receipt

The Worker SHALL be routed on `shawarmania.in/menu*` as well as
`shawarmania.in/bill` and `shawarmania.in/bill/*`, and GitHub Pages SHALL keep
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
