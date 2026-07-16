# outlets-section Specification

## Purpose
TBD - created by archiving change outlets-and-contact. Update Purpose after archive.
## Requirements
### Requirement: Data-driven outlet cards
A `#outlets` section SHALL render one card per outlet from outlets.json showing name, landmark,
full address, FSSAI number, delivery/takeaway status, honest hours line (hoursNote while hours is
null), and working actions: Get Directions (mapsUrl), Call (tel:), and Swiggy/Zomato order links
where present. A home-delivery strip SHALL show the delivery phone as a large tel: link.

#### Scenario: Cards carry verified facts
- **WHEN** the outlets section renders
- **THEN** both outlets show researched addresses, FSSAI 22825123001193/12826013000341, and their
  respective order links

#### Scenario: Honest hours
- **WHEN** an outlet has hours: null
- **THEN** the card shows its hoursNote with a call link and no fabricated times

