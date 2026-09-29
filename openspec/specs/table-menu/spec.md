# table-menu Specification

## Purpose
The dine-in menu a customer reads after scanning the QR code on a table: each trading outlet's menu, read live from ops — every dish, its price, whether it is vegetarian and whether it is available today — readable on a phone on restaurant Wi-Fi.
## Requirements
### Requirement: Section chips follow the reader

The page SHALL carry a sticky strip of section chips. With script, the chip of the
section being read SHALL be highlighted by one pill that slides between chips, the
strip SHALL scroll sideways to keep that chip centred, and tapping a chip SHALL
glide the page to its section while highlighting only the tapped chip. Under a
reduced-motion preference every one of these moves SHALL be instant.

#### Scenario: A customer taps a far chip

- **WHEN** the reader is on the first section and taps the chip of a later one
- **THEN** the page glides to it and the pill goes straight to the tapped chip without passing through the sections in between

### Requirement: Every dish says whether it is vegetarian

Every dish SHALL carry the FSSAI mark — a square with a green dot for vegetarian,
a triangle for non-vegetarian — with an accessible label, on a white tile so it
reads on the dark page. A portion SHALL be stated in the description, in
brackets, as "(4 pieces)".

#### Scenario: A vegetarian customer scans the menu

- **WHEN** they read any section
- **THEN** every dish shows the veg or non-veg mark by shape as well as colour

### Requirement: Every trading outlet's menu is a phone-first page, read live from ops

The site SHALL serve each outlet's menu at `/menu/<slug>/`, where the slug is the
outlet's public address in ops, for every outlet that is trading on ops and has
something on its menu — with no setup in this repo. The page SHALL be read from
ops through `public_menu(slug)` by the Worker, SHALL name the outlet, and SHALL
reflect a change made in ops within a minute. It SHALL be one column that reads at
375 px with no horizontal page scroll, prices flush right, and complete in the
HTML the first response brings.

`/menu/` SHALL redirect temporarily to Kalyani Cafe's menu, so QR codes printed
for `/menu/` keep working. A menu SHALL have one address — lowercase, with a
trailing slash — and any other spelling of a valid one SHALL redirect there.

#### Scenario: A customer scans an old /menu/ code

- **WHEN** they open `/menu/`
- **THEN** they are sent to `/menu/kalyani-cafe/` and read Kalyani Cafe's current menu

#### Scenario: A price changes in ops

- **WHEN** a manager changes a price on the ops Menu screen
- **THEN** the table menu shows the new price within a minute, with no deploy

#### Scenario: An outlet opens

- **WHEN** a new outlet on ops is trading and has items on its menu
- **THEN** its menu is served at its address without any change to this repo

### Requirement: An unavailable dish is greyed out, not hidden

A dish marked unavailable in ops SHALL stay on the page in its place, greyed
out, with **Unavailable** where its price would be. A dish removed in ops SHALL
not appear.

#### Scenario: The kitchen runs out

- **WHEN** an item is marked unavailable in ops
- **THEN** the customer sees it greyed out with Unavailable and no price

### Requirement: A missing menu reads the same whatever the reason

An address nobody holds, a closed outlet and an outlet with an empty menu SHALL
all get the same "not found" page, naming no outlet. If ops cannot be reached,
the last menu ops answered for that address SHALL be served for up to a week, and
only without one SHALL the page say the menu is briefly unavailable.

#### Scenario: An invented address

- **WHEN** someone opens `/menu/nonsense/`
- **THEN** they get the not-found page, identical to a closed outlet's

#### Scenario: Ops is down

- **WHEN** ops cannot be reached and the address was served in the past week
- **THEN** the customer gets that menu rather than an error

