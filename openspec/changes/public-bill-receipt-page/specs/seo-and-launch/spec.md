## ADDED Requirements

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
- **THEN** it is allowed to fetch it and is instructed not to index it

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
