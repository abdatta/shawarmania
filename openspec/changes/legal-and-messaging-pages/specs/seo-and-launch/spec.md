## ADDED Requirements

### Requirement: The legal documents carry their own metadata and are listed for search

Each of `/privacy/`, `/terms/` and `/messages/` SHALL ship its own `<title>`, meta description and
canonical URL naming its own absolute address on `https://shawarmania.in/`, and SHALL declare the
document language and the site's existing colour scheme and theme colour.

`public/sitemap.xml` SHALL list the three URLs alongside the landing page.

The documents SHALL be crawlable and indexable. They SHALL NOT be excluded by `robots.txt` or by a
`noindex` directive: they exist to be found, both by a customer looking for how to stop messages and
by a reviewer checking that they are public.

#### Scenario: A document's head is inspected

- **WHEN** `/messages/` is loaded and its head inspected
- **THEN** it carries a title and description describing that document, and a canonical URL of
  `https://shawarmania.in/messages/`

#### Scenario: The sitemap after this change

- **WHEN** `public/sitemap.xml` is read
- **THEN** it lists the landing page and the three legal documents, and still lists no receipt

#### Scenario: A crawler reaches a legal document

- **WHEN** a crawler fetches `/privacy/`
- **THEN** it is allowed by `robots.txt` and the document carries no directive against indexing
