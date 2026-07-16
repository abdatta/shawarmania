# Replicating Apple's Premium Scroll Experience on a React/Vite Static Site

Research summary for building Apple-style scroll-driven product pages (e.g. [apple.com/iphone-17-pro](https://www.apple.com/iphone-17-pro/)) on a React + Vite site hosted on GitHub Pages. Everything below works on a fully static host — no server rendering or backend required.

---

## 1. How Apple actually does it

Apple's product pages are a choreographed sequence of **pinned ("sticky") scenes**: the page is mostly a series of full-viewport sections that lock in place while scroll progress drives an animation timeline inside them. The key patterns observed:

| Pattern | What Apple does |
|---|---|
| **Scroll-scrubbed product rotation/exploding views** | Historically a `<canvas>` painted with a pre-rendered image sequence, the frame index mapped to scroll progress. DevTools "can't see past" the canvas, which is why these pages look mysterious. More recently Apple has shifted to **scrubbing a compressed video's `currentTime`** against scroll — same visual, ~80% smaller payload ([CSS-Tricks](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/), [Brad Holmes](https://www.brad-holmes.co.uk/web-performance-ux/why-most-scroll-animations-miss-what-apple-gets-right/)) |
| **Pinned/sticky sections** | A tall scroll container (300–500vh) with a `position: sticky`/pinned inner viewport; scroll distance = animation timeline length |
| **Huge typography transitions** | Giant headlines that scale, fade, or get masked/clipped as the section scrubs; text often reveals line-by-line |
| **Staggered fade/blur-in** | Copy blocks and feature cards fade up with slight y-offset and blur as they enter the viewport — lightweight, triggered once |
| **Parallax layers** | Foreground device vs. background gradient/text moving at different rates within a pinned scene |
| **Horizontal galleries** | Vertically-scrolled sections that translate a row of cards horizontally (fake horizontal scroll) |
| **Two motion tiers** | Apple separates *lightweight content motion* (transform/opacity on text) from *heavy graphical motion* (canvas/video scrub), and only key moments get the cinematic treatment — this discipline is most of why it feels premium ([Brad Holmes](https://www.brad-holmes.co.uk/web-performance-ux/why-most-scroll-animations-miss-what-apple-gets-right/)) |

---

## 2. Tech stack recommendation

### Core verdict: **GSAP + ScrollTrigger as the scroll engine, Lenis for smooth scroll, CSS/IntersectionObserver for cheap effects**

**GSAP is now 100% free including all formerly-paid Club plugins** (SplitText, ScrollSmoother, MorphSVG, DrawSVG, Inertia) since Webflow acquired GreenSock (fall 2024) and open-sourced everything on April 30, 2025 — commercial use included ([Webflow blog](https://webflow.com/blog/gsap-becomes-free), [gsap.com/pricing](https://gsap.com/pricing/)). There is no longer any licensing reason to avoid it.

**GSAP ScrollTrigger vs Framer Motion (now "Motion", `motion/react`):**

- **ScrollTrigger** is the most capable scroll engine available: pinning, scrub (timeline progress locked to scroll), snapping, precise start/end triggers, `containerAnimation` for nested triggers inside horizontal sections, `matchMedia()` for responsive animation variants. This is exactly the Apple feature set ([Hon Tran comparison](https://www.hontran.dev/blog/gsap-vs-framer-motion), [motion.dev's own comparison](https://motion.dev/docs/gsap-vs-motion)).
- **Motion/Framer Motion** (`useScroll` + `useTransform`) is great for declarative React work — layout animations, `AnimatePresence`, gestures, simple parallax and progress-driven transforms — and can ship as little as ~4.6 KB with `LazyMotion`. But it has **no native pinning**; you hand-roll it with `position: sticky` + a tall wrapper, and it has no scrub-timeline/snap/containerAnimation equivalents.
- **Rule of thumb from multiple 2025/2026 comparisons**: if motion *is the product identity* (scroll-driven brand/marketing pages — your case), GSAP wins; if motion just supports UX in an app (page transitions, micro-interactions), Motion is the more natural React fit ([Good Fella Lab](https://lab.good-fella.com/blog/gsap-vs-framer-motion-vs-react-spring), [Codolve](https://codolve.com/blog/gsap-vs-framer-motion)).
- They coexist fine: you can use GSAP for the pinned cinematic scenes and Motion for UI micro-interactions, though for a marketing page GSAP alone keeps the bundle simpler.

**Lenis** (`lenis` on npm, from darkroom.engineering) provides the buttery inertia-smoothed scroll feel of award sites. Critical integration detail — run Lenis on GSAP's ticker or ScrollTrigger reads stale values (1–2 frame lag/jitter) ([Lenis GitHub](https://github.com/darkroomengineering/lenis), [DevDreaming guide](https://devdreaming.com/blogs/nextjs-smooth-scrolling-with-lenis-gsap)):

```js
// once, at app root
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);
const lenis = new Lenis({ autoRaf: false });
lenis.on('scroll', ScrollTrigger.update);
gsap.ticker.add((time) => lenis.raf(time * 1000));
gsap.ticker.lagSmoothing(0);
```

There's also a first-class React wrapper: `lenis/react` (`<ReactLenis root options={{ autoRaf: false }}>`). Note: Apple itself uses *native* scroll feel — Lenis is optional taste, and skipping it removes a whole class of mobile edge cases. Prefer Lenis over GSAP's ScrollSmoother; Lenis uses real scroll position (better accessibility/find-in-page) while ScrollSmoother transforms the body.

**React integration**: use the official `@gsap/react` package's **`useGSAP()`** hook — a drop-in `useEffect` replacement that wraps everything in `gsap.context()` and **auto-reverts all tweens/ScrollTriggers/SplitText on unmount** (this is the #1 source of GSAP-in-React bugs otherwise). Pass a `scope` ref so selector text is component-scoped; use the returned `contextSafe` for event handlers ([GSAP React docs](https://gsap.com/resources/React/)):

```jsx
const container = useRef(null);
useGSAP(() => {
  gsap.to('.panel', { /* ... */, scrollTrigger: { trigger: '.panel', /* ... */ } });
}, { scope: container });
```

Register plugins once at module level, not inside components. Call `ScrollTrigger.refresh()` after images/fonts load (or set explicit dimensions) so trigger positions are correct.

**CSS scroll-driven animations** (`animation-timeline: view()` / `scroll()`) are now supported in Chrome 115+, Edge, and Safari 18+, with Firefox still behind a flag — roughly 90%+ support in 2026 ([MDN](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations), [Chrome dev blog](https://developer.chrome.com/blog/scroll-triggered-animations)). Use them as **progressive enhancement for simple effects** (parallax, progress bars, fade-ins) inside `@supports (animation-timeline: view())`, but don't build the core experience on them yet — Firefox gap plus no pinning/stagger orchestration. They run off-main-thread, which is their killer advantage where they do apply.

**IntersectionObserver** remains the right tool for cheap one-shot "reveal on enter" effects and for lazy-mounting heavy scenes (don't even create the canvas scrubber until its section approaches).

### GitHub Pages / Vite specifics

- Everything above is 100% client-side — nothing needs a server. Set `base: '/<repo-name>/'` in `vite.config.js` (project pages) and reference sequence frames/videos via `import.meta.env.BASE_URL` or put them in `public/`.
- For image sequences, either drop frames in `public/sequence/` and build URLs by index, or use `import.meta.glob('./frames/*.avif', { eager: true, query: '?url' })` to get hashed URLs at build time.
- GitHub Pages serves gzip and sets long cache headers on hashed assets; it does **not** do range-request quirks that break video scrubbing (video `currentTime` scrubbing works fine from static hosts). Keep total page weight in check — Pages has a soft 1 GB site / 100 MB file limit, irrelevant if you compress properly.
- Add a `404.html` fallback only if you use client-side routing; a single marketing page doesn't need it.

---

## 3. Performance rules (non-negotiable for the "premium" feel)

1. **Animate only `transform` and `opacity`** (compositor-friendly). Never animate `top/left/width/height/margin`, and avoid animating `filter: blur()` over long scrub ranges — blur is GPU-expensive; use it only for short entrance reveals ([cr0x performance rules](https://cr0x.net/en/css-animations-performance-rules/), [Motion tier list](https://motion.dev/magazine/web-animation-performance-tier-list)).
2. **`will-change` sparingly and temporarily** — apply just before a heavy scene animates, remove after. Blanket `will-change` blows GPU memory budgets, especially on mobile.
3. **`prefers-reduced-motion`**: honor it via GSAP's `gsap.matchMedia()` — serve static frames/no pinning to those users. It doubles as a performance escape hatch on weak devices.
4. **All scrub work on rAF, never raw scroll handlers.** ScrollTrigger and Lenis already do this; if hand-rolling, throttle with `requestAnimationFrame` and only redraw when the computed frame index changes.
5. **Images**: AVIF is ~20–25% smaller than WebP at equal quality, but WebP decodes faster on low-end mobile — for canvas sequences that decode 100+ frames, **WebP is the safer default; use AVIF for static hero imagery** with `<picture>` fallbacks ([SpeedVitals](https://speedvitals.com/blog/webp-vs-avif/), [Gumlet](https://www.gumlet.com/learn/avif-vs-webp/)). Decode frames ahead of time (`img.decode()` or `createImageBitmap()`) so scrubbing never hits a decode stall.
6. **Serve responsive sequences**: a mobile sequence at ~750–900px wide and desktop at ~1500px; pick one at runtime. Apple does exactly this. Lazy-load each scene's assets when the section is one viewport away (IntersectionObserver with `rootMargin: '100% 0px'`).
7. **Test on mid-tier Android, not your dev machine**; watch INP and dropped frames in the Performance panel. Map animations to viewport-relative distances (e.g. `end: '+=300%'`) so pacing is consistent across screen sizes.
8. **Delete any animation that doesn't strengthen the message** — Apple's restraint is the technique.

---

## 4. Recipes: eight named effects

### 4.1 Pinned scene with scroll-scrubbed timeline (the backbone)
GSAP ScrollTrigger with `pin: true` and `scrub: 1` (the `1` adds ~1s of smoothing lag, which reads as "premium"; use `scrub: true` for hard lock). Make the trigger a normal section, set `end: '+=300%'` to give the scene three viewports of scroll runway, and build a single `gsap.timeline()` holding every sub-animation of the scene so one scrub drives everything in choreographed order. This one pattern is 70% of the Apple feel ([ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)).

```js
const tl = gsap.timeline({
  scrollTrigger: { trigger: sectionRef.current, start: 'top top', end: '+=300%', pin: true, scrub: 1 }
});
tl.fromTo('.headline', { scale: 3, opacity: 0 }, { scale: 1, opacity: 1 })
  .to('.device', { rotateY: 90 }, '<0.2');
```

### 4.2 Canvas image-sequence scrub (product rotation / exploding view)
Export 60–150 frames (from Blender/AE or a video via ffmpeg), preload and pre-decode them, then tween a frame-index object with `scrub` and paint to `<canvas>` on update — the canonical [CSS-Tricks technique](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/). Size the canvas to its rendered size × `devicePixelRatio` (cap at 2) and only redraw when the rounded index changes. Serve WebP frames at two resolutions; ~80–120 frames at q70 WebP typically lands at 3–8 MB — lazy-load per scene.

```js
const seq = { frame: 0 };
gsap.to(seq, {
  frame: frameCount - 1, snap: 'frame', ease: 'none',
  scrollTrigger: { trigger: section, start: 'top top', end: '+=400%', pin: true, scrub: 0.5 },
  onUpdate: () => ctx.drawImage(images[seq.frame], 0, 0, canvas.width, canvas.height)
});
```

### 4.3 Video scrubbed by scroll (lighter alternative to 4.2)
Bind `video.currentTime = progress * video.duration` inside a scrubbed ScrollTrigger (`onUpdate`), with the `<video>` muted, `playsinline`, `preload="auto"`. **The make-or-break detail is encoding: keyframe interval.** Re-encode so nearly every frame is a keyframe, otherwise seeking stutters — e.g. `ffmpeg -i in.mp4 -g 5 -crf 24 -movflags +faststart out.mp4` (keyframe every ~5 frames for Chrome/Safari; Firefox wants ~2) ([Muffin Man](https://muffinman.io/blog/scrubbing-videos-using-javascript/), [ghosh.dev](https://www.ghosh.dev/posts/playing-with-video-scrubbing-animations-on-the-web/)). File grows 2–4× vs normal encoding but stays far smaller than an image sequence. Caveats: high-res scrubbing can drop frames on weak mobile GPUs, and older iOS Safari is flaky — feature-test and fall back to the canvas sequence or a static poster. For production-critical scenes, pre-computed frames on canvas (4.2) remains the most reliable cross-device option.

### 4.4 Text mask / clip reveal (giant headline wipes)
Animate `clip-path: inset(...)` or a `linear-gradient` mask on the headline inside a scrubbed timeline: start `clip-path: inset(0 100% 0 0)`, end `inset(0 0% 0 0)` for a wipe; or put the text in an `overflow: hidden` wrapper and tween `yPercent: 100 → 0` on the inner span for the classic line-mask rise. `clip-path` animates on the compositor in modern browsers and pairs beautifully with `scrub` ([The Magic of Clip Path](https://emilkowal.ski/ui/the-magic-of-clip-path)). For Apple's "text fills with gradient as you scroll," use `background-clip: text` plus a `background-position` tween.

### 4.5 Staggered fade/blur-in of copy blocks (SplitText)
Use GSAP **SplitText** (now free) to split headlines into lines, wrap with masks, then a triggered (not scrubbed) timeline: `gsap.from(split.lines, { yPercent: 100, opacity: 0, filter: 'blur(8px)', duration: 0.9, stagger: 0.12, ease: 'power3.out' })` fired once via `scrollTrigger: { start: 'top 75%' }`. Keep blur to entrance-only (short duration, small radius) for GPU sanity; stagger guidance: chars 20–40ms, words 60–100ms, lines 100–200ms ([Good Fella Lab SplitText guide](https://lab.good-fella.com/blog/gsap-text-animation-splittext-guide)). For non-text cards, the same `y + opacity` stagger via a plain `gsap.from` — or pure CSS `animation-timeline: view()` as progressive enhancement.

### 4.6 Parallax layers
Within a pinned scene, give each layer a scrubbed `yPercent` tween of differing magnitude (background `-10`, midground `-25`, foreground `-45`) on the same ScrollTrigger with `ease: 'none'`. For simple full-page parallax outside pinned scenes, CSS scroll-driven animation (`animation-timeline: view()` animating `translateY`) does it with zero JS in Chrome/Safari and degrades gracefully in Firefox ([Josh Comeau](https://www.joshwcomeau.com/animation/scroll-driven-animations/)). Keep offsets subtle (10–50px equivalent) — Apple's parallax is felt, not seen.

### 4.7 Horizontal scroll gallery (fake horizontal scroll)
Pin a section and tween the card row `xPercent: -100 * (panels - 1)` with `ease: 'none'`, `scrub: 1`, and `end: () => '+=' + track.scrollWidth`. To animate items *within* the horizontal movement (captions fading as each card centers), pass the horizontal tween as `containerAnimation` to nested ScrollTriggers — note pinning/snapping aren't available inside `containerAnimation`, and the container tween must be linear ([Envato Tuts+ tutorial](https://webdesign.tutsplus.com/create-horizontal-scroll-animations-with-gsap-scrolltrigger--cms-108881t), [GSAP skills instructions](https://github.com/greensock/gsap-skills/blob/main/.github/instructions/scrolltrigger.instructions.md)). Add `snap: 1 / (panels - 1)` on the outer trigger for card-to-card settling.

### 4.8 Huge typography transitions (scale-down hero, crossfading numbers)
The iPhone-page signature: a viewport-filling word/number that scales from ~300% to 100% while fading from clipped to solid as the scene scrubs, often handing off to the next headline. Implement as a scrubbed timeline on a pinned section animating `scale` + `opacity` (+ optional `letter-spacing` via `transform`-based SplitText chars, never the CSS property directly). Use `transform-origin: center` and `force3D: true`; sequence two headlines in one timeline with overlapping position parameters (`'<0.3'`) for the crossfade. Because it's pure transform/opacity it stays 60fps even on mobile — this is the cheapest high-impact effect on the list.

---

## 5. Suggested package set

```
npm i gsap @gsap/react lenis
```

- `gsap` + `ScrollTrigger` + `SplitText` (all free) — scroll engine, pinning, scrubbing, text splitting
- `@gsap/react` — `useGSAP()` lifecycle-safe hook
- `lenis` — smooth scroll (optional but on-brand), wired into `gsap.ticker`
- No Framer Motion needed unless you want declarative micro-interactions elsewhere; CSS `animation-timeline` + IntersectionObserver cover the cheap effects natively.

Build order recommendation: (1) Lenis + ticker wiring, (2) one pinned scrub scene (4.1), (3) typography transitions (4.8) and staggered reveals (4.5) — these three deliver most of the perceived quality — then (4) the expensive canvas/video scrub scene (4.2/4.3) for the single hero moment, (5) parallax and horizontal gallery.

Sources:
- [CSS-Tricks — Fancy Scrolling Animations Used on Apple Product Pages](https://css-tricks.com/lets-make-one-of-those-fancy-scrolling-animations-used-on-apple-product-pages/)
- [Brad Holmes — Why Most Scroll Animations Miss What Apple Gets Right](https://www.brad-holmes.co.uk/web-performance-ux/why-most-scroll-animations-miss-what-apple-gets-right/)
- [Webflow — GSAP becomes 100% free](https://webflow.com/blog/gsap-becomes-free) / [GSAP Pricing](https://gsap.com/pricing/)
- [GSAP ScrollTrigger docs](https://gsap.com/docs/v3/Plugins/ScrollTrigger/) / [GSAP React docs](https://gsap.com/resources/React/) / [GSAP official skills — ScrollTrigger instructions](https://github.com/greensock/gsap-skills/blob/main/.github/instructions/scrolltrigger.instructions.md)
- [Motion.dev — GSAP vs Motion](https://motion.dev/docs/gsap-vs-motion) / [Hon Tran — GSAP vs Framer Motion](https://www.hontran.dev/blog/gsap-vs-framer-motion) / [Good Fella Lab comparison](https://lab.good-fella.com/blog/gsap-vs-framer-motion-vs-react-spring) / [Codolve comparison](https://codolve.com/blog/gsap-vs-framer-motion)
- [Lenis GitHub](https://github.com/darkroomengineering/lenis) / [DevDreaming — Lenis + GSAP guide](https://devdreaming.com/blogs/nextjs-smooth-scrolling-with-lenis-gsap)
- [MDN — CSS scroll-driven animations](https://developer.mozilla.org/en-US/docs/Web/CSS/Guides/Scroll-driven_animations) / [Chrome Developers — scroll-triggered animations](https://developer.chrome.com/blog/scroll-triggered-animations) / [Josh Comeau — Scroll-Driven Animations](https://www.joshwcomeau.com/animation/scroll-driven-animations/)
- [Muffin Man — Scrubbing videos using JavaScript](https://muffinman.io/blog/scrubbing-videos-using-javascript/) / [ghosh.dev — Video scrubbing animations on the web](https://www.ghosh.dev/posts/playing-with-video-scrubbing-animations-on-the-web/)
- [Emil Kowalski — The Magic of Clip Path](https://emilkowal.ski/ui/the-magic-of-clip-path) / [Good Fella Lab — SplitText guide](https://lab.good-fella.com/blog/gsap-text-animation-splittext-guide)
- [Envato Tuts+ — Horizontal scroll with GSAP ScrollTrigger](https://webdesign.tutsplus.com/create-horizontal-scroll-animations-with-gsap-scrolltrigger--cms-108881t)
- [cr0x — CSS animation performance rules](https://cr0x.net/en/css-animations-performance-rules/) / [Motion Magazine — Web Animation Performance Tier List](https://motion.dev/magazine/web-animation-performance-tier-list)
- [SpeedVitals — WebP vs AVIF](https://speedvitals.com/blog/webp-vs-avif/) / [Gumlet — AVIF vs WebP](https://www.gumlet.com/learn/avif-vs-webp/)