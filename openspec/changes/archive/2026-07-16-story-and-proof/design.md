# Design — story-and-proof

## Context

Trust layer: growth narrative for franchise prospects, social proof for everyone. Unique asset:
the June-2026 independent lab report — perfect fit for the "Eat Healthy, Stay Happy" tagline.

## Goals / Non-Goals

**Goals:** story with timeline (verified milestones only); animated counters; a "lab-certified"
nutrition module; vlogger/testimonial wall with real links.
**Non-Goals:** founder biography (null until owner supplies), embedded video players (thumbnail
cards + external links keep the page static and light).

## Decisions

1. **Story (`#story`, dark):** headline + narrative with **SplitText line reveals** (masked lines
   rise once, stagger 0.1); timeline rail of stats.timeline entries — vertical on mobile,
   horizontal 4-column on desktop — with a scroll-drawn connector (scaleX scrub) and year chips;
   giant faint শাওয়ারমানী as background accent (aria-hidden). SplitText registered in lib/gsap.
2. **Proof band:** maroon-tinted band with 6 stat counters (gsap number tween with snap, one-shot
   on enter, `toLocaleString('en-IN')` formatting, decimals from data). Below: **"Lab-tested,
   certified fresh" module** — left: nutrition-label-styled card (protein/energy/fat/trans-fat
   per 100g) + safety checklist with ✓ rows; right: the actual certificate photo as a tilted
   polaroid linking nowhere (it's proof, not nav), with lab name + report number caption.
3. **Testimonials:** heading "Kalyani can't stop talking", grid of vlogger cards (thumbnail,
   creator, metric chip, title, external link) + pull-quote cards (large quotation marks, source
   line). Staggered fade-up. All URLs from testimonials.json.
4. Counters respect reduced motion (render final values, no tween).

## Risks / Trade-offs

- [SplitText re-splitting on resize] → SplitText.create with autoSplit; revert via useGSAP scope.
- [Timeline connector overflow] → contained in section, scaleX from transform-origin left.
- [Faces on testimonial cards] → brand-published marketing images only, each linking to source.

## Migration Plan

Additive sections after Menu. Rollback = revert commit.

## Open Questions

None.
