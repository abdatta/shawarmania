# content-schema — delta spec

## ADDED Requirements

### Requirement: Zod-validated content contract
The project SHALL define zod schemas for six content files — `brand`, `menu`, `outlets`, `stats`,
`testimonials`, `franchise` — in `src/data/schema.ts`, exported as a record keyed by file name so
the site build and the content portal validate against the identical contract. Fields whose real
values are unknown SHALL be nullable rather than fabricated.

#### Scenario: Build fails on invalid content
- **WHEN** a data file violates its schema (e.g. price as string) and `npm run build` runs
- **THEN** the build fails with a zod error naming the file and field

#### Scenario: Null economics allowed
- **WHEN** `franchise.json` has `franchiseFee: null` on a model
- **THEN** schema validation passes (unknowns are representable without fake numbers)

### Requirement: Typed data gateway
`src/data/index.ts` SHALL parse every JSON file through its schema at module load and export
typed constants (`brand`, `menu`, …) plus inferred TypeScript types for section components.

#### Scenario: Sections get typed data
- **WHEN** a component imports `menu` from `src/data`
- **THEN** items are fully typed (name, price, isVeg, featured…) with no `any`

### Requirement: Image catalog indirection
Content JSON SHALL reference images by catalog key; `src/assets/img/index.ts` SHALL map keys to
bundler-imported assets. Unknown keys SHALL fail the build via an exhaustive type check.

#### Scenario: JSON stays portable
- **WHEN** `menu.json` sets `"image": "burger-loaded"`
- **THEN** the resolved asset is the hashed bundle URL of `src/assets/img/burger-loaded.jpg`
