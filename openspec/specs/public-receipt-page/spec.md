# Public Receipt Page

## Purpose

The customer receipt is a private-by-capability document served from the brand
domain, rendered from stored bill facts without customer identity, and available
as both a responsive page and an on-demand PDF.

## Requirements

### Requirement: The receipt is served from the brand domain, on one path prefix

A receipt SHALL be served at `/bill/<token>` on the brand domain, and its PDF at
the same address suffixed `.pdf`.

The receipt runtime SHALL intercept that path prefix only. Every other path on the
domain SHALL continue to be served by the existing static deployment, unchanged.

The operations host SHALL NOT appear in any customer-facing receipt URL, in any
link on the page, or in the PDF.

#### Scenario: The marketing site is unaffected

- **WHEN** any page of the marketing site is requested
- **THEN** it is served exactly as before, from the static deployment

#### Scenario: A receipt is requested

- **WHEN** `/bill/<token>` is requested with a token that resolves
- **THEN** the receipt is served by the receipt runtime

### Requirement: The receipt renders stored figures, and computes none

The page SHALL show the outlet, the bill number, the business date and time of
sale, every line with its quantity and the unit price that line snapshotted, every
discount as its own line naming its basis, the rounding line, the total, and the
payment allocation across every method used.

Every monetary figure SHALL be a stored value formatted for display. The page and
the PDF SHALL NOT recompute a subtotal, a discount, a rounding amount or a total.

Line prices SHALL be shown as the list prices they snapshotted, never as reduced
unit prices.

The receipt SHALL carry no GSTIN, no tax breakup and no tax line, and SHALL NOT
resemble a tax invoice.

#### Scenario: A discounted bill

- **WHEN** a bill carrying a menu discount and a bill discount is served
- **THEN** each reads as its own line naming what it was, lines show list prices,
  and the rounding line and total are the figures the bill stored

#### Scenario: A bill discounted in full

- **WHEN** a bill whose discount reached its whole subtotal is served
- **THEN** a one rupee total is rendered as a deliberate figure, with the giveaway
  and the rounding both visible

### Requirement: The receipt names no customer

The page and the PDF SHALL NOT display the customer's name, their phone number, or
any part of either, in any form.

They SHALL NOT display any other person's identity, including the biller, the
approving manager, or the till.

#### Scenario: Nothing personal is rendered

- **WHEN** any receipt is served
- **THEN** no name and no telephone number appears in the page, the PDF, the
  document metadata, or the preview card

### Requirement: The reader asks for the download, and receives a real file

Opening a receipt SHALL display the receipt and SHALL NOT begin a download.

The download SHALL be an ordinary navigation to the PDF's own address, served with
a PDF content type, an attachment disposition and a filename identifying the
business, the outlet and the bill number.

The PDF SHALL NOT be assembled in the reader's browser, and SHALL NOT be delivered
through a script-generated object URL.

No rendered receipt, in either format, SHALL be persisted.

#### Scenario: Downloading inside a chat application's browser

- **WHEN** the download is tapped inside an in-app browser
- **THEN** the file is delivered by ordinary navigation, with no dependence on
  script-driven download behaviour

#### Scenario: Opening the receipt

- **WHEN** a receipt link is opened
- **THEN** the receipt is displayed and nothing downloads on its own

### Requirement: A cancelled bill says so, and every refusal is identical

A bill that has been voided SHALL be served as cancelled, stated unmistakably, and
SHALL NOT be served as a valid-looking receipt.

A request whose token is unknown, malformed, revoked, or served while the endpoint
is disabled SHALL receive one and the same refusal, disclosing nothing about which
case occurred or whether any bill exists.

#### Scenario: A voided bill

- **WHEN** a link to a since-voided bill is opened
- **THEN** the receipt states that the bill was cancelled

#### Scenario: Four ways to fail

- **WHEN** an unknown token, a malformed token, a revoked token and a request
  against a disabled endpoint are each made
- **THEN** all four responses are identical

### Requirement: The receipt reads current state, and is cached only briefly

A receipt SHALL be built from the bill's state at the time of the request.

A cached receipt SHALL have a lifetime short enough that a void or a tender
correction becomes visible promptly, and revoking or voiding SHALL invalidate any
cached copy.

#### Scenario: Tender corrected after the link was sent

- **WHEN** a bill's payment allocation is corrected and the link is reopened
- **THEN** the corrected allocation is shown

### Requirement: A receipt is never offered for indexing, and its preview says nothing

Every receipt response, page and PDF alike, SHALL carry an instruction not to
index it and not to follow from it, and SHALL suppress transmission of its own URL
as a referrer.

The site SHALL NOT exclude the receipt path from crawling, because an exclusion
would prevent that instruction from being read.

A preview generated for a receipt link SHALL identify the business and state that
a receipt is present, and SHALL disclose no bill number, no amount and no item.

#### Scenario: A crawler fetches a receipt

- **WHEN** a crawler requests a receipt link
- **THEN** it is permitted to fetch it and is served the instruction not to index

#### Scenario: A link is pasted into a chat

- **WHEN** a chat application fetches the link to build a preview
- **THEN** the preview carries no amount, item or bill number

### Requirement: Public traffic is bounded

The receipt runtime SHALL rate limit requests per client and SHALL enforce a
ceiling on total volume, refusing beyond either with the same refusal it gives an
unknown token.

A request that does not resolve to a bill SHALL NOT cause a write to the
operations database.

#### Scenario: A flood of invalid tokens

- **WHEN** a client makes a large volume of requests against tokens that do not
  resolve
- **THEN** they are refused beyond the limit, and none of them reaches the
  operations database as a write
