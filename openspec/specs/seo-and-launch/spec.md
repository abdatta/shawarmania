# seo-and-launch Specification

## Purpose
TBD - created by archiving change polish-seo-launch. Update Purpose after archive.
## Requirements
### Requirement: Complete search and social metadata
`index.html` SHALL ship title, meta description, canonical URL, theme-color, OG and Twitter card
tags with a real og image, and JSON-LD describing the Restaurant with both locations (addresses,
phones, cuisines, price range, aggregate rating with source counts). `public/` SHALL contain
robots.txt and sitemap.xml.

#### Scenario: Structured data parses
- **WHEN** the JSON-LD block is parsed
- **THEN** it is valid JSON with @type Restaurant and two location entries carrying the
  researched addresses

### Requirement: Performance budget enforced
The build SHALL emit WebP for photographic assets and fail if initial-load weight exceeds 1.5 MB
or total dist exceeds 4 MB, printing a per-file report.

#### Scenario: Budget check runs on build
- **WHEN** `npm run build` completes bundling
- **THEN** the weight report prints and the command fails on budget violation

### Requirement: Accessibility floor
The page SHALL provide a skip-to-content link, `lang` attributes on Bengali text, aria-labels on
icon-only controls, and visible focus styles on both dark and paper sections.

#### Scenario: Skip link works
- **WHEN** a keyboard user presses Tab once on page load and activates the link
- **THEN** focus moves to the main content

### Requirement: Receipts are excluded from search by header, not by crawl exclusion

Receipt responses SHALL be excluded from indexing by a response header instructing
crawlers not to index and not to follow.

`robots.txt` SHALL NOT disallow the receipt path. Disallowing it would prevent the
crawler fetching the response and therefore reading that instruction, leaving the
URL eligible to be listed without content.

`robots.txt` and `sitemap.xml` SHALL continue to describe the marketing site only,
and SHALL NOT be extended to enumerate, reference or exclude receipts.

#### Scenario: A receipt URL is discovered

- **WHEN** a crawler discovers and fetches a receipt link
- **THEN** it is allowed to fetch it and is instructed not to index

#### Scenario: The sitemap

- **WHEN** the sitemap is generated
- **THEN** it lists the marketing site's pages and no receipt

### Requirement: The marketing site's metadata is unchanged

The site's existing head metadata, canonical URL, structured data and social cards
SHALL be unaffected by the receipt runtime.

A receipt SHALL NOT be reachable from any link, navigation entry or sitemap on the
marketing site, and SHALL be reachable only by its own link.

#### Scenario: The landing page after the change

- **WHEN** the landing page is loaded and its head inspected
- **THEN** its metadata, structured data and cards are as they were, and nothing
  references a receipt
