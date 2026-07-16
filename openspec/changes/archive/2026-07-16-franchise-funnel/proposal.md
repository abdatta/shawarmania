# Change: franchise-funnel

> Change 8 of 9 — depends on: outlets-and-contact (footer/contact infrastructure), content-portal (owner fills economics).

## Why

Franchisees and investors are a primary audience for this page, and third-party signals show Shawarmania already courts branch inquiries. We adopt Absolute Shawarma's proven funnel skeleton (tier cards → support → process → enquiry) while fixing its gaps (no FAQ, no process, fabricated-feeling stats).

## What Changes

- `sections/Franchise/` with:
  - Momentum framing header — "2 outlets in under a year. Viral demand. Now expanding." (verifiable claims only).
  - Model tier cards (Kiosk / Café / Dine-in) from `franchise.json.models` — area, fee, investment; **null fields render "Contact for details"** until the owner fills real numbers via the portal. No invented economics, ever.
  - "Support we provide" icon row (training, supply chain, site selection, marketing, launch) from `franchise.json.support`.
  - 4-step "How it works" process (enquire → meet & taste → sign & fit-out → launch) connected by a scroll-drawn SVG line (DrawSVG scrub).
  - FAQ accordion (5 Q&A) from `franchise.json.faqs`.
  - Primary CTA: WhatsApp deep link with pre-filled franchise message. Secondary: 4-field enquiry form (Name/Phone/City/Budget) POSTing to Web3Forms with honeypot spam protection — endpoint key supplied by owner via portal; form renders disabled with a WhatsApp fallback note until the key exists.
- Tier cards fade-up staggered; process line draws with scroll.

## Capabilities

### New Capabilities
- `franchise-section`: the full investor/franchisee funnel — tiers, support, process, FAQ, enquiry.

### Modified Capabilities
(none — `content-schema` already includes franchise fields)

## Impact

- New: `src/sections/Franchise`, `src/components/{TierCard,ProcessRail,Faq,EnquiryForm}`.
- Consumes `franchise.json`, `brand.json`.
- External: Web3Forms (only active once owner provides access key); WhatsApp deep links.

## Manual QA checklist

- [ ] With economics null: tier cards show "Contact for details" — no fabricated numbers anywhere.
- [ ] After filling test numbers via the portal: cards render them; revert afterwards.
- [ ] WhatsApp CTA opens chat with the pre-filled message on mobile emulation.
- [ ] Enquiry form: required-field validation, honeypot hidden, disabled state without key; with a test key, submission succeeds and shows confirmation.
- [ ] Process line draws in sync with scroll; static under reduced-motion.
- [ ] FAQ accordion keyboard-accessible (Enter/Space toggle, arrow navigation).
