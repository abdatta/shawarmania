# hero-section — delta spec

## ADDED Requirements

### Requirement: Above-the-fold hook
The site SHALL open with a full-viewport hero composed from brand.json/stats.json: the claim
"Kalyani's Premium Shawarma" as giant display type with flame-gradient emphasis, the Bengali
name as an accent, the verified rating badge (4.4★ Google · 1,300+ Zomato ratings), a primary
"Order Now" CTA targeting `#outlets`, a "Franchise" secondary CTA targeting `#franchise`, and the
real neon-storefront photograph presented as a glowing tilted card. The composition MUST read as
a food brand (warm, appetizing, playful), not a tech keynote.

#### Scenario: Hero renders from data
- **WHEN** the page loads
- **THEN** claim, sub-line, badge values, and CTAs all come from the data gateway (no hardcoded copy)

#### Scenario: Entrance hook plays once
- **WHEN** a motion-enabled user first loads the page
- **THEN** title words pop in with a bouncy ease, the badge stamps in rotated, the photo card
  slides in tilted — all within ~1.5s, transform/opacity only

#### Scenario: Reduced motion composed
- **WHEN** prefers-reduced-motion is set
- **THEN** the hero renders fully composed with no entrance or parallax animation

### Requirement: Sticky header with exact brand logo
A sticky translucent header SHALL show the exact Instagram logo image, anchor links (Menu, Story,
Outlets, Franchise, Contact) and an "Order Now" pill. It SHALL hide on scroll-down beyond the hero
and reveal on scroll-up. Anchor navigation glides via Lenis with header offset.

#### Scenario: Header hides and reveals
- **WHEN** the user scrolls down past the hero then scrolls up slightly
- **THEN** the header translates out of view, then back in

### Requirement: Brand marquee strip
A marquee strip SHALL loop the brand mantra (including Bengali script) seamlessly and infinitely,
with scroll velocity subtly modulating its speed. Under reduced motion the strip is static.

#### Scenario: Seamless loop
- **WHEN** the marquee completes one content width
- **THEN** the loop continues with no visible jump

### Requirement: Floating action buttons
Call and WhatsApp floating buttons SHALL persist site-wide (bottom corner), using phoneDelivery
and the WhatsApp channel from brand.json, each with an aria-label.

#### Scenario: Floating CTAs actionable
- **WHEN** the floating buttons render
- **THEN** they link to `tel:` and the WhatsApp channel URL respectively

### Requirement: Branded loader that cannot trap
A brief branded loader SHALL cover initial font/asset settling, resolve on `document.fonts.ready`,
call `ScrollTrigger.refresh()` after exit, and be hard-capped at 2.5s. Under reduced motion no
loader shows.

#### Scenario: Loader resolves offline-slow fonts
- **WHEN** fonts hang beyond 2.5s
- **THEN** the loader exits anyway and the page is fully usable
