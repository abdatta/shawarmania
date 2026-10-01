## MODIFIED Requirements

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

#### Scenario: Nothing personal in the metadata or the preview

- **WHEN** any receipt is served
- **THEN** no name and no whole telephone number appears in the page, the PDF, the
  document metadata, or the preview card

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

## ADDED Requirements

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
