# Change: story-and-proof

> Change 6 of 9 — depends on: hero-experience.

## Why

Franchisees and investors need a growth narrative; visitors need social proof. Shawarmania has a genuinely good story — founded ~2025 in Kalyani, viral within months (15.2K-like reel), second outlet inside a year, 4.4★ across platforms — told here with premium type choreography instead of claims we can't back.

## What Changes

- `sections/Story/` — "Our Story" narrative with SplitText staggered line reveals (lines rise from masks, one-shot triggers); timeline sub-component (founding → viral moment → Kanchrapara expansion) rendered from `stats.json.timeline`; consistency promise line ("same bold flavor, every outlet"); "Follow the story" → Instagram.
- `sections/Proof/` — stat band with animated counters (Google 4.4★/362, Zomato 4.3★/1,200+, 2 outlets, ₹139 starting price, 15.2K viral likes) counting up on entry; subtle multi-layer parallax texture background.
- `sections/Testimonials/` — vlogger/testimonial wall: thumbnail cards linking to Khana Pina, Sonali Majumder, Petuk TV coverage (`testimonials.json.vloggerVideos`) + pull-quote review snippets (`quotes`); staggered entrance.
- Bengali script "শাওয়ারমানী" as oversized background accent in the Story section.

## Capabilities

### New Capabilities
- `story-section`: narrative + timeline with type reveals.
- `proof-section`: animated stat counters and review/vlogger wall.

### Modified Capabilities
(none)

## Impact

- New: `src/sections/{Story,Proof,Testimonials}`, `src/components/{Counter,TimelineRail,VideoCard}`.
- Consumes `stats.json`, `testimonials.json`, `brand.json`.
- SplitText must run after `document.fonts.ready` (wired in change 4's loader).

## Manual QA checklist

- [ ] Story lines reveal once, cleanly, at ~75% viewport entry; re-scrolling doesn't re-trigger or flash.
- [ ] SplitText produces correct line breaks at 375/768/1440 (resize then reload each).
- [ ] Counters animate 0→value once, land on exact values, and are plain text for reduced-motion users.
- [ ] Vlogger cards open correct external URLs; thumbnails have width/height (no CLS).
- [ ] Bengali glyphs render correctly (font fallback chain covers Bengali script).
- [ ] Screen reader (NVDA quick pass): story text readable as normal paragraphs (SplitText aria handling intact).
