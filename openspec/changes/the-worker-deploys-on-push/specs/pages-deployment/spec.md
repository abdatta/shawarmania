## MODIFIED Requirements

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

## ADDED Requirements

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
