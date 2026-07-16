# content-editing Specification

## Purpose
TBD - created by archiving change content-portal. Update Purpose after archive.
## Requirements
### Requirement: Dev-only content write API
Under `vite serve` only, the server SHALL expose `GET /api/content/:name` returning the JSON file
and `PUT /api/content/:name` that validates the payload against the shared zod schema and writes
the file atomically (tmp + rename, pretty-printed, newline-terminated). Names outside the fixed
allowlist SHALL 404; invalid payloads SHALL 422 with a readable error and MUST NOT modify the file.
The production build SHALL contain neither the API nor any portal code.

#### Scenario: Valid save persists
- **WHEN** the portal PUTs a menu payload with a changed price
- **THEN** `src/data/menu.json` on disk reflects the change and the site tab hot-reloads

#### Scenario: Invalid save rejected
- **WHEN** the portal PUTs a payload with `price: "abc"`
- **THEN** the response is 422 naming the field and the file is unchanged

#### Scenario: Production is portal-free
- **WHEN** `npm run build` output is inspected
- **THEN** no portal chunk, `/api/content` reference, or admin route exists in `dist/`

### Requirement: Owner-facing form UI
In dev, `/admin` SHALL render a form portal covering all six content files: editable fields for
strings/numbers/booleans, add/remove for array entries, null toggles for nullable fields, image
pickers restricted to catalog keys, and inline display of server validation errors. A home panel
SHALL list the outstanding owner questions with fill-state derived from the data.

#### Scenario: Owner edits a price
- **WHEN** the owner changes Classic Chicken Shawarma to ₹149 and clicks Save
- **THEN** the save succeeds, the form shows success, and menu.json carries 149

#### Scenario: Owner sees what is missing
- **WHEN** the portal home renders while franchise fees are null
- **THEN** the checklist shows "franchise economics" as outstanding

