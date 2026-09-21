## ADDED Requirements

### Requirement: The build emits more than one document

The build SHALL emit, alongside the landing page, one standalone HTML document per legal page, each
at a path whose directory names the URL it is served at — `privacy/index.html`, `terms/index.html`
and `messages/index.html` — so that the static host serves each at its directory URL with no
rewrite, no redirect and no `404.html` fallback.

A legal document SHALL NOT enter the landing page's JavaScript bundle, and the landing page SHALL NOT
grow a script chunk on account of one.

#### Scenario: The output contains the documents

- **WHEN** `npm run build` completes
- **THEN** `dist/privacy/index.html`, `dist/terms/index.html` and `dist/messages/index.html` exist,
  each a complete document

#### Scenario: A directory URL is served

- **WHEN** `https://shawarmania.in/privacy/` is requested from the static host
- **THEN** `privacy/index.html` is served, with no redirect

#### Scenario: The landing page's bundle is unchanged in kind

- **WHEN** the page-weight report runs after this change
- **THEN** the landing page's script bundle is the same single entry it was before, and the new
  documents contribute no JavaScript

## MODIFIED Requirements

### Requirement: Base path configuration
The Vite build SHALL emit assets under a configurable base path (default `/` — the apex custom
domain `shawarmania.in` serves from the root — and `/` for dev), overridable via the `VITE_BASE`
environment variable so the build can still target a project page if the custom domain is ever
dropped.

Every emitted document SHALL honour that base path, for its own assets and for its links to the
other emitted documents. No document SHALL hardcode a root-relative path.

#### Scenario: Default production base
- **WHEN** `npm run build` runs without overrides
- **THEN** every emitted HTML document references assets under `/`

#### Scenario: Base override
- **WHEN** `VITE_BASE=/shawarmania/ npm run build` runs
- **THEN** every emitted HTML document references assets under `/shawarmania/`, and cross-document
  links resolve under it too
