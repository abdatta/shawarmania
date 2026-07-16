# franchise-section Specification

## Purpose
TBD - created by archiving change franchise-funnel. Update Purpose after archive.
## Requirements
### Requirement: Honest franchise funnel
A `#franchise` section SHALL render from franchise.json: momentum framing, three model tier cards
where null economics display "Contact for details" (no invented numbers anywhere), the support
row, a numbered 4-step process with scroll-drawn connector, and an FAQ accordion using native
details/summary.

#### Scenario: Null economics honest
- **WHEN** all models have null fee/investment
- **THEN** every tier card renders "Contact for details" chips and no numeric placeholder

#### Scenario: FAQ keyboard accessible
- **WHEN** a keyboard user tabs to a question and presses Enter
- **THEN** the answer toggles open/closed

### Requirement: Degrading enquiry CTAs
The enquiry block SHALL provide a WhatsApp deep link with prefilled message when
enquiry.whatsappNumber exists, otherwise a tel: CTA on the primary phone; and SHALL render the
Web3Forms enquiry form active only when both formEndpoint and formAccessKey exist, otherwise the
fields appear disabled with an honest activation note. A honeypot field SHALL be present when the
form is active.

#### Scenario: No WhatsApp number yet
- **WHEN** enquiry.whatsappNumber is null
- **THEN** the primary CTA is a tel: link labeled for franchising (no dead wa.me link)

#### Scenario: Form inactive without key
- **WHEN** formEndpoint or formAccessKey is null
- **THEN** the form fields are disabled and the note explains how to enquire meanwhile

