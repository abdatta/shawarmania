# site-footer — delta spec

## ADDED Requirements

### Requirement: Contact and trust footer
A `#contact` footer SHALL present the brand block (logo, tagline, social links, WhatsApp channel),
per-outlet addresses and phones, FSSAI licence numbers, and a copyright line. All external links
open in new tabs; phones are tel: links.

#### Scenario: Footer renders contact facts
- **WHEN** the footer renders
- **THEN** both outlet addresses, both phone numbers, Instagram/Facebook links and the WhatsApp
  channel are present and actionable

### Requirement: Accessible legal modals
Privacy and Terms SHALL open as native dialog modals (focus-trapped, Esc-closable, backdrop) with
honest informational copy flagged as pending owner legal review. No routes are introduced.

#### Scenario: Modal keyboard flow
- **WHEN** a keyboard user opens Privacy and presses Escape
- **THEN** the dialog closes and focus returns to the page
