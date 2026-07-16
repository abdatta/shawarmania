# seo-and-launch — delta spec

## ADDED Requirements

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
