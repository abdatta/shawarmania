## MODIFIED Requirements

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

The receipt runtime SHALL intercept `/bill` and the `/bill/` path prefix only.
Every other path on the domain, including any other path beginning with `/bill`,
SHALL continue to be served by the existing static deployment, unchanged.

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
