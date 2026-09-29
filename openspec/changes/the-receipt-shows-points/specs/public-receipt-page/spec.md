## ADDED Requirements

### Requirement: The receipt says what the bill did to the customer's points

A points discount SHALL read as its own discount row naming the points it used,
*Points (N)*, and a gold member's free packaging SHALL read as its own row, *Free
packaging*. Both SHALL be among the bill's discount rows, so the printed rows add up
to the discount the bill stored.

Where the receipt payload carries the bill's points, the receipt SHALL show, beneath
the payment, the points the bill used (only when it used any), the points it earned,
and the balance the bill left. Each figure SHALL be the stored value the payload
carries. The page and the PDF SHALL NOT compute a points figure.

A bill whose payload carries no points SHALL say nothing about points.

#### Scenario: A bill that used and earned points

- **WHEN** a bill that used 18 points and earned 6, leaving 42, is served
- **THEN** its discount rows include *Points (18)*, *From your points*, *−₹18*, and
  beneath the payment it reads *Points used 18*, *Points earned 6*, *Points balance 42*,
  on the page and in the PDF alike

#### Scenario: A bill with no points

- **WHEN** a bill with no points is served
- **THEN** neither the page nor the PDF mentions points

#### Scenario: A voided bill

- **WHEN** a voided bill that had earned points is served
- **THEN** it reads as cancelled, and still shows the points figures it was sold with
