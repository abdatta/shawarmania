# Design — hero-experience

## Context

First real section set. Direction locked by the owner: fast-food outlet energy — bold, warm,
appetizing, playful — explicitly NOT a tech/iPhone look. We have a killer authentic asset: the
real neon storefront sign at night.

## Goals / Non-Goals

**Goals:** instant hook above the fold; exact Instagram logo in the header; punchy bouncy motion
(fast-food) instead of slow cinematic scrubs; marquee brand strip; persistent order/WhatsApp CTAs;
loader that hides font settling.
**Non-Goals:** menu/story/outlet sections (changes 5–7); canvas image-sequence scenes (the
Apple-style scrub was re-scoped in the fast-food rework — punchy beats > long pins).

## Decisions

1. **Hero composition — "night poster", type-led:** left column giant two-line display type
   ("KALYANI'S PREMIUM" / "SHAWARMANIA" with flame gradient), Bengali শাওয়ারমানী echo, sub-line,
   rating badge as a rotated sticker chip, two CTAs. Right column: the real neon-sign photo as a
   glowing tilted card (border-radius, flame glow shadow, slight rotate) — used at native-ish size
   to avoid upscaling the 720px source; NOT full-bleed. Dark canvas + radial ember glow + subtle
   noise vignette via CSS only.
2. **Motion grammar — bounce-in, light scrub:** load-time entrance (staggered `back.out` pops for
   title words, sticker badge stamps in with rotation, photo card slides+tilts in) — this is the
   hook; then a light scroll parallax (photo y/rotate, title y) WITHOUT pinning. Pinned scenes
   deferred to the menu gallery where they earn their weight. Reduced-motion: everything composed,
   no entrance, no parallax.
3. **Header:** sticky translucent (blur), exact `logo.png`, anchor nav (Menu, Story, Outlets,
   Franchise, Contact), gradient "Order Now" pill → `#outlets`. Hides on scroll-down past the
   hero, reveals on scroll-up (ScrollTrigger direction watcher toggling a class).
4. **Marquee:** display-font strip "SPICY · CHEESY · LEBANESE · DESI TWIST · শাওয়ারমানী ·
   EAT HEALTHY STAY HAPPY", duplicated content, seamless `xPercent: -50` loop; timeScale nudged by
   Lenis velocity; slight -2° rotation, flame gradient background — sticker energy.
5. **Loader:** fixed overlay, logo scales/pops, resolves on `document.fonts.ready` (+300ms max
   settle) then fades and calls `ScrollTrigger.refresh()`. Hard cap 2.5s via timeout so it can
   never trap. Skipped entirely under reduced motion (plain instant page).
6. **Foundation section retires** (token-proof page served its QA purpose; content QA lives in
   the portal now). App composes: Loader → Header → Hero → Marquee → FloatingCtas.
7. **Anchors** to future sections stay in the header now; they become live as changes 5–7 land.

## Risks / Trade-offs

- [720px source photos on large screens] → contained card layout, capped display size, subtle
  overlay grain; never full-bleed upscale.
- [Entrance animation delaying LCP] → animate only transform/opacity from visible-ish states;
  text is present in DOM immediately; loader capped.
- [Header hide/show fighting Lenis] → single ScrollTrigger direction watcher, CSS transform
  transition, no per-frame React state.

## Migration Plan

Purely additive UI; Foundation deletion is internal. Rollback = revert commit.

## Open Questions

None — hero copy uses verified brand lines from brand.json.
