# seed-content Specification

## Purpose
TBD - created by archiving change content-data-layer. Update Purpose after archive.
## Requirements
### Requirement: Verified seed data only
The six data files SHALL be seeded exclusively with facts verified in
`research/build-brief.md` §4 and `research/instagram/findings.md`, with per-file provenance
documented in `src/data/SOURCES.md`. No invented business numbers SHALL appear anywhere.

#### Scenario: Menu prices match Swiggy research
- **WHEN** `menu.json` is inspected
- **THEN** the six shawarma SKUs carry the Swiggy-verified prices (₹139/159/179/199/219/238) and
  the in-store Chicken Shawarma counter price ₹100 from the neon-sign photo

#### Scenario: Outlets carry verifiable identity
- **WHEN** `outlets.json` is inspected
- **THEN** both outlets have researched addresses, phones, FSSAI numbers, and order links —
  and fields with conflicting sources (exact hours) are null with an `hoursNote`

#### Scenario: Lab report captured
- **WHEN** `stats.json` is inspected
- **THEN** `labReport` holds the Prodcontrol certificate values (25.8g protein, 205 kcal,
  0.0g trans fat, heavy-metals-not-detected, June 2026) for the trust module

### Requirement: Curated brand imagery
`src/assets/img/` SHALL contain curated, descriptively-named copies (and text-overlay-free crops
where needed) of the Instagram photography: storefront neon, shawarma plate, loaded burger,
interior counter, lab certificate, customer/testimonial shots.

#### Scenario: Hero-grade storefront asset exists
- **WHEN** the assets folder is listed
- **THEN** `storefront-neon.jpg` (night neon sign crop) is present and referenced by the catalog

