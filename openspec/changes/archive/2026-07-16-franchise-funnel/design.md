# Design — franchise-funnel

## Context

Investor/franchisee funnel between Outlets and Footer. All economics are null (nothing public) —
the section must convert on momentum + honesty, never on invented numbers.

## Goals / Non-Goals

**Goals:** momentum framing, three tier cards with "Contact for details" fallbacks, support row,
4-step process with drawn connector, FAQ accordion, enquiry CTAs that degrade honestly.
**Non-Goals:** ROI claims, fee estimates, Web3Forms activation (owner supplies key via portal).

## Decisions

1. **Layout (dark, maroon glow):** header (kicker + momentumLine as display type + intro), tier
   cards grid (3), "What you get" support row (icon chips — emoji keyed by `icon`), process rail
   (reuses the Story rail pattern: gradient line scaleX scrub + numbered steps), FAQ accordion,
   enquiry banner.
2. **Tier cards:** name, menuScope, notes; area/fee/investment rows render values or
   "Contact for details" (styled as a chip, not an error). Middle card visually promoted
   ("Most popular" only if data says so — it doesn't, so no fake popularity flags).
3. **FAQ:** native `<details>/<summary>` — keyboard-accessible for free, styled with plus/minus
   indicator. No JS state.
4. **Enquiry:** primary CTA logic — if `enquiry.whatsappNumber` exists: wa.me deep link with
   prefilled text; else fall back to `tel:` on brand.phonePrimary labeled "Call about franchising"
   (never a dead button). Form: if `formEndpoint+formAccessKey` exist render active Web3Forms
   POST (name/phone/city/budget + honeypot); else render the four fields disabled with an honest
   note ("Form goes live soon — call or WhatsApp meanwhile"). Success/error states inline.
5. **Anchor:** `#franchise` goes live (hero ghost CTA + header link).

## Risks / Trade-offs

- [Disabled form looks broken] → explicit note + working alternatives adjacent; portal checklist
  already tracks the key.
- [details/summary animation jank] → no height animation; simple reveal, indicator rotates.

## Migration Plan

Additive. Rollback = revert commit.

## Open Questions

None — all gaps are owner-input items already in the portal checklist.
