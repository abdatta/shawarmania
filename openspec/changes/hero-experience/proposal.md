# Change: hero-experience

> Change 4 of 9 — depends on: content-data-layer.

## Why

The hero is the hook — the user's stated goal is that "landers immediately get hooked" with Apple-grade motion. This change delivers the above-the-fold experience: sticky header, cinematic pinned hero type scene, brand marquee, floating order/WhatsApp CTAs, and the branded loader that hides font/asset settling.

## What Changes

- `sections/Hero/` — pinned scroll scene: "SHAWARMANIA" display type starts at viewport-filling scale and scrubs down to lockup size while the macro food shot parallax-reveals behind it; sub-line "Kalyani's Premium Shawarma" + rating badge (4.4★ · 2,000+ ratings) fade in; primary CTA "Order Now" (→ `#outlets`), ghost CTA "Franchise" (→ `#franchise`).
- `components/Header/` — sticky translucent header (blur backdrop), anchor nav (Menu, Story, Outlets, Franchise, Contact), logo, "Order Now" button; hides on scroll-down / reveals on scroll-up.
- `sections/Marquee/` — infinite "SPICY · CHEESY · LEBANESE · DESI TWIST · শাওয়ারমানী" strip, speed modulated by Lenis scroll velocity.
- `components/FloatingCtas/` — persistent call + WhatsApp buttons (bottom corner, mobile-first).
- `components/Loader/` — brief branded loader (logo mask reveal) that resolves on `document.fonts.ready`, then `ScrollTrigger.refresh()`.
- Anchor navigation via `lenis.scrollTo()` with header offset.
- All motion wrapped in `gsap.matchMedia()`: reduced-motion users get a static composed hero; pinned scene gated to ≥768px (mobile gets a lighter fade/parallax variant).

## Capabilities

### New Capabilities
- `hero-section`: the pinned hero type scene, header, marquee, loader, and floating CTAs.

### Modified Capabilities
(none)

## Impact

- New: `src/sections/Hero`, `src/sections/Marquee`, `src/components/{Header,FloatingCtas,Loader}`.
- Consumes `brand.json`, `stats.json` via the data gateway; hero photo from `src/assets`.
- `App.tsx` starts composing real sections (placeholder page retired).

## Manual QA checklist

- [ ] Hero type scene scrubs smoothly at 60fps on desktop (Chrome devtools performance check — no layout thrash, transform/opacity only).
- [ ] Scroll up/down repeatedly around the pin — no jumps, no double-scrollbar, no pin flicker.
- [ ] Mobile (375px): lighter variant plays, no pinning bugs; marquee loops seamlessly.
- [ ] OS reduce-motion: hero renders composed and static; page fully usable.
- [ ] Header hides/reveals on scroll direction; anchors glide with correct offset.
- [ ] Loader never traps: hard-refresh with cache disabled still resolves.
- [ ] `npm run build && npm run preview` — identical behavior from the bundle.
