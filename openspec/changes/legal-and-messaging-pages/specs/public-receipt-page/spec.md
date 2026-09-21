## ADDED Requirements

### Requirement: The receipt's small print reaches the messaging document

The receipt's small print SHALL carry a note naming where the messaging programme is explained, and
that note SHALL resolve to `/messages/` on the brand domain.

The note SHALL be part of the receipt's content model, so that the page and the PDF carry it
identically and neither can carry it alone — a printed receipt is where messaging small print is
conventionally read, so the PDF is not exempt.

The note SHALL state nothing about its reader. It SHALL NOT assert that the reader gave a phone
number, consented, or received the receipt by message, because a receipt link also travels by
WhatsApp and by hand, and a receipt that tells the wrong person they opted in is worse than one that
says nothing.

#### Scenario: The note is on both renderings

- **WHEN** a receipt is rendered as a page and as a PDF
- **THEN** both carry the same messaging note, in the same words, among the small print

#### Scenario: The note is followable on the page

- **WHEN** a customer reads the receipt page and taps the messaging note
- **THEN** they reach `/messages/` on the brand domain

#### Scenario: The note claims nothing about the reader

- **WHEN** the note's wording is read by somebody the receipt was forwarded to
- **THEN** it makes no claim that they gave a number, consented, or were sent a message

#### Scenario: The receipt still names no customer

- **WHEN** the receipt is rendered with the note present
- **THEN** it names no customer, no phone number and no masked digits, as before
