# Design — qa-fixes-round-1

## Context
Direct owner QA feedback on the completed site; seven targeted fixes.

## Goals / Non-Goals
**Goals:** apply the feedback exactly; keep all previous spec guarantees intact.
**Non-Goals:** new features.

## Decisions
1. Bengali removal is total (UI, data, schema, fonts, JSON-LD) — brand is marketed in English only.
   Story background accent becomes the English wordmark in the display face.
2. Hero logo: large mark centered above the neon photo card in the right column (stacked above
   the badge), pop-in entrance matching the existing timeline; sized clamp(9rem–13rem).
3. Dish art from the brand's own festive collage (marketing renders): wraps duo → Double Chicken,
   salad bowl → Salad; the gooey close-up moves Mayo → Mozzarella (cheese-pull match). Items
   without art remain type cards by design.
4. "spit" → "grill"/"slow-roasted"/"fires up" per owner instruction; full string proofread pass.
5. Proof stats: centered, even `repeat(auto-fit, minmax(10.5rem, 1fr))` with text-align center.
6. Testimonials: two explicit groups (videos grid, quotes grid) instead of one auto-fit masonry.
7. Franchise: enquiry block before FAQ block (FAQ closes the section).

## Risks / Trade-offs
- [Collage renders are stylized marketing art, not photos] → they are the brand's own published
  creative; acceptable until the owner supplies a real shoot (portal note stands).

## Migration Plan
In-place edits; rollback = revert commit.

## Open Questions
None.
