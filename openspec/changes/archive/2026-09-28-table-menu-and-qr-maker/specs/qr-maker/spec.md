## ADDED Requirements

### Requirement: Any link or text becomes a branded QR card, in the browser

The site SHALL offer a QR maker at `/qr/`: one field for a link or text and one
for an optional caption, each labelled by its placeholder, and a live preview of
a Shawarmania-branded card — logo, the code on a cream plate, the flame-roll
badge at its centre, the caption beneath. Text SHALL be encoded as UTF-8, and the
code SHALL use error correction level H. Nothing typed SHALL leave the browser.
The page SHALL be `noindex` and absent from the sitemap.

#### Scenario: The owner makes a code for a table

- **WHEN** they paste `https://shawarmania.in/menu/` and a caption
- **THEN** the card renders as they type, and a phone scanner reads the link from it

#### Scenario: Text that is not a link

- **WHEN** they enter Bengali text or a rupee sign
- **THEN** the code decodes to exactly that text

### Requirement: The card is copied or downloaded from beside it

Copy and download SHALL be icon buttons in the preview frame's corner, beside the
card and never drawn on it, shown only once there is a card. Copy SHALL put the
card on the clipboard as a PNG; download SHALL save the same PNG. Each SHALL
confirm with a tick; where the browser refuses the copy, the page SHALL say so and
point to download.

#### Scenario: Copying the card

- **WHEN** the owner taps copy
- **THEN** the clipboard holds the card as a PNG and the button shows a tick
