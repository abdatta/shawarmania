# Design — outlets-and-contact

## Context

Consumer conversion (find/order/call) + verifiable footprint. Hours are unconfirmed (conflicting
sources) → honest notes until the owner fills them via the portal.

## Goals / Non-Goals

**Goals:** outlet ticket-cards with every verifiable fact + working actions; footer with contact,
socials, FSSAI, legal modals; #outlets and #contact anchors go live.
**Non-Goals:** live "open now" computation (hours are null; the code path renders hoursNote —
computation lands automatically once hours exist), maps embeds (links only, keeps page light).

## Decisions

1. **Outlets (`#outlets`, dark):** two large "ticket" cards (cream) — outlet photo strip on top,
   dashed ticket divider, address block, landmark, chips (delivery-only / takeaway, FSSAI number),
   hoursNote line, actions: Get Directions, Call, Swiggy/Zomato order buttons. Staggered rise-in;
   subtle hover lift. Home-delivery banner strip under the cards with big tel link.
2. **Footer (`#contact`):** dark, three columns — brand (logo, tagline, socials, WhatsApp channel),
   outlets (addresses+phones), "the fine print" (FSSAI licences, provenance note, Privacy/Terms
   buttons opening modals). Bottom bar: © year Shawarmania · Made in Kalyani. Logo mask-rise
   reveal on approach (skipped under reduced motion).
3. **Legal modals:** native `<dialog showModal>` (built-in focus trap + Esc). Honest minimal copy:
   static informational site, no cookies/tracking, data shown from public listings, owner contact
   for corrections; marked "pending owner legal review" — no fabricated legal claims.
4. **Hours honesty:** when `hours` is null, cards show `hoursNote` ("call to confirm") with the
   tel link — never invented times.

## Risks / Trade-offs

- [dialog element styling cross-browser] → simple styles, ::backdrop supported everywhere current.
- [Outlet photos are scene shots, not storefronts for Kanchrapara] → interior-counter photo is
  authentic brand material; caption keeps it truthful.

## Migration Plan

Additive; removes the temporary spacer div. Rollback = revert commit.

## Open Questions

None — legal text flagged for owner review in the portal checklist (already listed).
