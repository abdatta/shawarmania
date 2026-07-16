# proof-section — delta spec

## ADDED Requirements

### Requirement: Animated stat counters
A proof band SHALL render every stats.counters entry as a large number with label, counting from
0 to the exact value once on entry (Indian digit grouping, decimals per data). Reduced motion
renders final values immediately.

#### Scenario: Counters land exactly
- **WHEN** the counter tween completes
- **THEN** displayed values equal the data values exactly (4.4★, 1,300+, 2, ₹100, 15,200, 25.8g)

### Requirement: Lab-certified nutrition module
When stats.labReport is present, the proof band SHALL include a "lab-tested" module showing the
nutrition-label card (protein, energy, fat, trans fat per 100g), the safety checklist, the lab
name/report number/date, and the certificate photograph. When labReport is null the module SHALL
not render.

#### Scenario: Lab values match certificate
- **WHEN** the module renders
- **THEN** it shows 25.8g protein, 205 kcal, 10g fat, 0.0g trans fat and the Prodcontrol
  report number PCL/NN/2026-27/K0683

### Requirement: Vlogger and quote wall
A testimonial wall SHALL render vlogger video cards (thumbnail, creator, metric, external link
opening in a new tab) and pull-quote cards from testimonials.json, entering with a stagger.

#### Scenario: Cards link out
- **WHEN** a vlogger card is clicked
- **THEN** the source video URL opens in a new tab
