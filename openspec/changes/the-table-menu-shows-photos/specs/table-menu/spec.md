## ADDED Requirements

### Requirement: A dish's photo is shown beside it, with its price kept in place

The table menu SHALL show a dish's photo wherever ops sends one, read through
`public_menu_v2(slug)`, falling back to `public_menu(slug)` while the newer
function is not published. A photographed dish SHALL show its photo on the
left; its name and price SHALL stay on one line beside it with the price in the
page's right-hand price column; its description SHALL wrap beside the photo and
continue beneath it. A sold-out dish SHALL keep its photo, greyed. A dish with
no photo, and a menu with no photos, SHALL render exactly as before this
change.

The photo SHALL carry a subtle expand mark, and tapping it SHALL open a large
view of the photo with the dish's name, price and description, closed by a
close button, a tap outside, Escape or Back, animated from and to the
thumbnail except under a reduced-motion preference.

#### Scenario: A mixed section at 375 px
- **WHEN** a section holds dishes with and without photos
- **THEN** every price sits in one right-hand column and the dishes without photos read as before

#### Scenario: A menu with no photos
- **WHEN** no dish on a menu has a photo
- **THEN** the page's HTML is what it was before this change

### Requirement: Photos are served from this site's cache, never from Supabase

The Worker SHALL serve a dish photo at `/menu/<slug>/photo/<key>.<format>` and
its thumbnail at `<key>-sm.<format>`. It SHALL answer 404 without calling ops
for a malformed key or format, SHALL ask `public_menu_photo(slug, key)` on an
edge-cache miss and answer 404 when it is null, and otherwise SHALL fetch the
file from ops storage with the service-role credential and serve it as
immutable for a year from the edge cache. No browser SHALL be sent to Supabase
for a photo.

#### Scenario: The second customer
- **WHEN** a photo already served at an edge is requested again there
- **THEN** it is served from the cache and ops is not asked

#### Scenario: A photo the gate has hidden
- **WHEN** `dish-photos` is off in ops and an uncached photo address is requested
- **THEN** the Worker answers 404
