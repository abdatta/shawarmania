# receipt-messaging Specification

## Purpose

What the site's messaging, terms and privacy pages promise about the messages
ops sends: a customer opts in by giving a valid number at billing, receives one
receipt SMS per paid bill, and may be sent occasional offers and news on WhatsApp
from the business's own number until they ask to stop.

## Requirements

### Requirement: Published messaging matches automatic receipt SMS
The messaging, terms and privacy pages SHALL explain that supplying a valid
number at billing opts into one receipt SMS per paid bill, containing its receipt
link and earned/balance points. Skipping the number SHALL skip SMS. Pages SHALL
offer help through the published call/email contacts, SHALL NOT promise a
separate consent question or SMS suppression preference, and SHALL distinguish
privacy data-removal requests from skipping receipt SMS for a purchase.

#### Scenario: Customer reads the message programme
- **WHEN** a customer visits messaging, terms or privacy
- **THEN** the pages consistently describe number-as-opt-in, one service receipt
  per bill and no marketing by SMS, and do not promise a STOP keyword or a
  separate SMS stop setting.

### Requirement: Published messaging describes WhatsApp offers and how to stop them
The messaging, terms and privacy pages SHALL say that a customer who gave their
number at the counter may be sent occasional offers and news on WhatsApp from
the business's own number, never by SMS. They SHALL say how to stop: reply on
that chat asking us to stop, tell the counter, or contact us by the published
call/email contacts, after which the number goes on a stopped list that is sent
no offer or news again. They SHALL say that stopping offers does not affect the
receipt SMS or points, and SHALL NOT promise an automatic STOP keyword.

#### Scenario: Customer wants offers to stop
- **WHEN** a customer reads messaging, terms or privacy to stop WhatsApp offers
- **THEN** each page gives the same three ways to ask, says the number goes on
  a stopped list, and says receipts and points carry on.

