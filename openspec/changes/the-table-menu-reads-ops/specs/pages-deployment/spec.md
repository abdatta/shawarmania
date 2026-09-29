## ADDED Requirements

### Requirement: The Worker answers the menu as well as the receipt

The Worker SHALL be routed on `shawarmania.in/menu*` as well as
`shawarmania.in/bill/*`, and GitHub Pages SHALL keep serving every other path.
The menu SHALL be read with the same deployment-secret credential as the
receipt, through `public_menu(slug)` alone. The site's own build SHALL NOT carry
a copy of any outlet's menu once the route is live.

#### Scenario: The route is live

- **WHEN** a customer opens `/menu/kalyani-cafe/`
- **THEN** the Worker answers it from ops, and the home page, `/qr/` and the legal pages are served by Pages exactly as before

#### Scenario: The receipt is untouched

- **WHEN** a receipt link is opened after this change
- **THEN** it behaves exactly as it did before
