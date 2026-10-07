# Public Receipt Page

## Purpose

The customer receipt is a private-by-capability document served from the brand
domain, rendered from stored bill facts, naming no customer beyond the last four
digits of the recorded number and a gold mark, and available as a responsive page,
an on-demand PDF and a counter view that fits the ops pop-up.
## Requirements
### Requirement: The receipt is served from the brand domain, on one path prefix

A receipt SHALL be served at `/bill?t=<token>` on the brand domain: the token is
the address's only varying part, and it follows the `?`, so that every receipt link
shares the prefix `https://shawarmania.in/bill?` registered with the telecom
operator as the sender's dynamic URL. The counter view SHALL be served at the same
address with `view=counter`. The PDF SHALL be served at `/bill/<token>.pdf`.

A request to `/bill` whose `t` is absent, empty, repeated or not of the token's
shape SHALL receive the one refusal.

A request to `/bill/<token>` for a token of the right shape SHALL be redirected to
`/bill?t=<token>`, keeping any other query parameter, before any lookup.

The receipt runtime SHALL answer `/bill` and the `/bill/` path prefix only, and
SHALL answer any other path routed to it with a plain not-found. Every path outside
`/bill` and `/menu` SHALL continue to be served by the existing static deployment,
unchanged.

The operations host SHALL NOT appear in any customer-facing receipt URL, in any
link on the page, or in the PDF.

#### Scenario: The marketing site is unaffected

- **WHEN** any page of the marketing site is requested
- **THEN** it is served exactly as before, from the static deployment

#### Scenario: A receipt is requested

- **WHEN** `/bill?t=<token>` is requested with a token that resolves
- **THEN** the receipt is served by the receipt runtime

#### Scenario: The counter views a receipt

- **WHEN** `/bill?t=<token>&view=counter` is requested with a token that resolves
- **THEN** the counter view is served

#### Scenario: A mangled link

- **WHEN** `/bill` is requested with no `t`, an empty `t`, two `t` parameters or a
  malformed one
- **THEN** the one refusal is served

#### Scenario: A link in the old shape

- **WHEN** `/bill/<token>?view=counter` is requested
- **THEN** it redirects to `/bill?t=<token>&view=counter`, whether or not the token
  names a bill

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

The page, its counter view and the PDF SHALL NOT display the customer's name, in any
form.

They SHALL NOT display the customer's phone number, or any part of it, except the
last four digits the receipt payload carries, shown masked (*+91 ••••• •0042*). They
SHALL show those digits, and that the customer was gold at the bill's outlet, only
when the payload carries them, and SHALL NOT derive either from anything else.

They SHALL NOT display why a bill was cancelled, even if a payload carries it: a
cancelled receipt reads *Cancelled* and nothing more [owner, 2026-09-30].

They SHALL NOT display any other person's identity, including the biller, the
approving manager, or the till.

The Worker SHALL refuse to serve a receipt whose payload carries a name or a biller
field, a run of ten or more digits in any string value, or last four digits that are
not exactly four digits, rather than rendering it.

#### Scenario: A receipt with a customer

- **WHEN** a receipt whose payload carries the last four digits 0042 is served
- **THEN** the page, the counter view and the PDF show *+91 ••••• •0042*, and no
  name

#### Scenario: A gold member's receipt

- **WHEN** a receipt from Kalyani Cafe whose payload says the customer was gold at
  its outlet is served
- **THEN** the page, the counter view and the PDF say *Gold*, marked
  with a star

#### Scenario: A receipt with no customer

- **WHEN** a receipt whose payload carries no digits and no gold is served
- **THEN** neither line appears, and the receipt reads exactly as before

#### Scenario: A payload that would leak

- **WHEN** a payload carries a customer name, or a whole phone number in any field
- **THEN** the Worker refuses to serve it, and nothing is rendered

#### Scenario: Nothing personal is rendered

- **WHEN** any receipt is served
- **THEN** no name and no whole telephone number appears in the page, the PDF, the
  document metadata, or the preview card

### Requirement: The reader asks for the download, and receives a real file

Opening a receipt SHALL display the receipt and SHALL NOT begin a download.

The download SHALL be an ordinary navigation to the PDF's own address, served with
a PDF content type, an attachment disposition and a filename identifying the
business, the outlet and the bill number.

The PDF SHALL NOT be assembled in the reader's browser, and SHALL NOT be delivered
through a script-generated object URL.

No rendered receipt, in either format, SHALL be persisted.

Where the page is requested in the counter's view (below), it SHALL omit the
download link.

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

### Requirement: The receipt says what the bill did to the customer's points

> Added by `the-receipt-shows-points` and modified here [owner, 2026-09-30]: what
> the bill used is said once, as its discount row, and what it earned and left is
> one line. This change archives after that one.

A points discount SHALL read as its own discount row naming the points it used,
*Points (N)*, and a gold member's free packaging SHALL read as its own row, *Free
packaging*. Both SHALL be among the bill's discount rows, so the printed rows add up
to the discount the bill stored. The points a bill used SHALL NOT be stated a second
time elsewhere on the receipt.

Where the receipt payload carries the bill's points, the receipt SHALL show, on one
line beneath the payment, the points the bill earned at the left (*+14 pts earned*,
only when it earned any) and the balance the bill left at the right (*Balance: 96
pts*), with *pt* for exactly one. Each figure SHALL be the stored value the payload
carries. The page and the PDF SHALL NOT compute a points figure.

A bill whose payload carries no points SHALL say nothing about points.

#### Scenario: A bill that used and earned points

- **WHEN** a bill that used 18 points and earned 6, leaving 42, is served
- **THEN** its discount rows include *Points (18)*, *From your points*, *−₹18*, and
  beneath the payment one line reads *+6 pts earned* and *Balance: 42 pts*, on the
  page, the counter view and the PDF alike, with no separate *Points used* line

#### Scenario: A bill that earned nothing

- **WHEN** a bill paid wholly with points, earning none and leaving 2, is served
- **THEN** the points line reads only *Balance: 2 pts*

#### Scenario: A bill with no points

- **WHEN** a bill with no points is served
- **THEN** neither the page nor the PDF mentions points

#### Scenario: A voided bill

- **WHEN** a voided bill that had earned points is served
- **THEN** it reads as cancelled, and still shows the points line it was sold with

### Requirement: The counter's view of a receipt fits a pop-up

> Added by `the-counter-views-the-receipt` (the child of ops #63) and modified here
> [owner, 2026-09-30]: the counter and the customer's link now say the same thing.
> This change archives after that one.

Where the page is requested with `view=counter`, exactly, it SHALL say everything
the customer's page says, in the same layout, and SHALL differ from it only in
that it:

- omits the download link;
- spaces its top and bottom evenly;
- reports its own content height to the page that framed it, on load and whenever
  that height changes.

Both views SHALL show, under the outlet's name, the bill number at the left of one
row and the date and time of sale at its right; and on a second row how the bill
was served at the left, the gold mark at the centre and the masked number at the
right. Both SHALL show how the bill was paid. Neither SHALL carry a sentence about tax invoices, a
GSTIN or a tax line.

No other value of any parameter SHALL change the page. The page without it SHALL
carry no script.

#### Scenario: The counter's view

- **WHEN** a receipt is requested with `?view=counter`
- **THEN** it shows exactly what the customer's page shows, including how it was
  paid, with no download link and one script reporting its height

#### Scenario: The customer's own link

- **WHEN** a receipt is requested with no parameter, or with `?view=COUNTER` or
  any other value
- **THEN** it is the customer's page, with its download link and no script, and
  the bill number with the date and time on one row, and how it was served, the
  gold mark and the masked number on the next

### Requirement: The receipt says how the bill was served

Where the payload carries how a bill was served, the page, its counter view and the
PDF SHALL say *Dine-in* or *Takeaway* at the left of the row beneath the bill
number. A payload that carries none SHALL produce nothing there.

The receipt SHALL NOT show a table number [owner, 2026-09-30]: a table is a label for
the length of a meal, like the day's order number, which the receipt does not show
either. The Worker SHALL NOT render one even if a payload carries it.

#### Scenario: Dine-in

- **WHEN** a receipt for a dine-in bill is served
- **THEN** all three renderings read *Dine-in* at the left of the second row, and
  no table appears

#### Scenario: A bill from before the choice existed

- **WHEN** a receipt whose payload carries no service type is served
- **THEN** the left of the second row is empty, and gold and the number keep their
  places

