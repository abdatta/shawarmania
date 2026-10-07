## MODIFIED Requirements

### Requirement: Contact and trust footer
A `#contact` footer SHALL present the brand block (logo, tagline, social links, WhatsApp channel),
per-outlet addresses and phones, FSSAI licence numbers, and a line naming the legal entity that
operates the brand, in the words every other page under the domain uses: *Operated by De & Datta
LLP*. It SHALL NOT carry a copyright line [owner, 2026-10-03]. All external links open in new
tabs; phones are tel: links.

#### Scenario: Footer renders contact facts
- **WHEN** the footer renders
- **THEN** both outlet addresses, both phone numbers, Instagram/Facebook links and the WhatsApp
  channel are present and actionable

#### Scenario: Footer names the operator
- **WHEN** any page under the domain renders its footer, the receipt and the table menu included
- **THEN** it reads *Operated by De & Datta LLP*, and none carries a copyright line
