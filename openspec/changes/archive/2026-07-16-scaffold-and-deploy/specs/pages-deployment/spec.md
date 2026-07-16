# pages-deployment — delta spec

## ADDED Requirements

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

### Requirement: Project-page base path configuration
The Vite build SHALL emit assets under a configurable base path (default `/shawarmania/` for
production builds, `/` for dev), overridable via the `VITE_BASE` environment variable so the
workflow can adapt if the repository is renamed.

#### Scenario: Default production base
- **WHEN** `npm run build` runs without overrides
- **THEN** emitted HTML references assets under `/shawarmania/`

#### Scenario: Base override
- **WHEN** `VITE_BASE=/other-name/ npm run build` runs
- **THEN** emitted HTML references assets under `/other-name/`
