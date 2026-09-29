# table-menu Specification

## Purpose
The dine-in menu a customer reads after scanning the QR code on a table: every dish, its price and whether it is vegetarian, readable on a phone on restaurant Wi-Fi.
## Requirements
### Requirement: The table menu is a phone-first page at /menu/

The site SHALL serve the dine-in menu at `/menu/`, the address the QR codes on
the tables open. It SHALL be one column that reads at 375 px with no horizontal
page scroll, with every dish's price flush right on the dish's own line, and it
SHALL be complete in the HTML the first response brings: sections, dishes,
descriptions and prices SHALL NOT depend on script.

#### Scenario: A customer scans the table's code on a slow connection

- **WHEN** the page is opened on a phone with script unavailable or not yet loaded
- **THEN** every section and dish with its price is readable, and the section chips work as plain in-page links

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

