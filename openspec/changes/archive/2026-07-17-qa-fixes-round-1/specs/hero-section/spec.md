# hero-section — delta spec

## MODIFIED Requirements

### Requirement: Above-the-fold hook
The site SHALL open with a full-viewport hero composed from brand.json/stats.json: the claim
"Kalyani's Premium Shawarma" as giant display type with flame-gradient emphasis, the exact brand
logo displayed prominently in the right column above the neon-storefront photo card, the verified
rating badge (4.4★ Google · 1,300+ Zomato ratings), a primary "Order Now" CTA targeting
`#outlets`, and a "Franchise" secondary CTA targeting `#franchise`. The brand name SHALL appear in
English only — no Bengali rendering anywhere on the site or in metadata. The composition MUST
read as a food brand (warm, appetizing, playful), not a tech keynote.

#### Scenario: Hero renders from data
- **WHEN** the page loads
- **THEN** claim, sub-line, badge values, and CTAs all come from the data gateway (no hardcoded copy)

#### Scenario: Logo prominent
- **WHEN** the hero renders at any viewport
- **THEN** the exact Instagram logo is clearly visible in the hero (beyond the small header mark)

#### Scenario: English-only branding
- **WHEN** any section or metadata renders
- **THEN** no Bengali-script brand name appears

#### Scenario: Entrance hook plays once
- **WHEN** a motion-enabled user first loads the page
- **THEN** title words pop in with a bouncy ease, the badge stamps in rotated, the photo card
  slides in tilted — all within ~1.5s, transform/opacity only

#### Scenario: Reduced motion composed
- **WHEN** prefers-reduced-motion is set
- **THEN** the hero renders fully composed with no entrance or parallax animation

### Requirement: Brand marquee strip
A marquee strip SHALL loop the brand mantra (English only) seamlessly and infinitely, with scroll
velocity subtly modulating its speed. Under reduced motion the strip is static.

#### Scenario: Seamless loop
- **WHEN** the marquee completes one content width
- **THEN** the loop continues with no visible jump
