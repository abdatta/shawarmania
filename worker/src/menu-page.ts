import { OPERATOR_LINE } from './content'
import type { PublicMenu, PublicMenuItem, PublicMenuReview } from './menu'

/**
 * The table menu: what a customer reads after scanning a table's QR code.
 *
 * Server-rendered from the ops menu on every cache miss, so a price changed or
 * an item marked unavailable in ops reaches the table within the Worker's
 * cache minute, with no deploy. The whole menu is in the HTML the first byte
 * brings; the one script only moves the section chips, and the page works
 * without it (the chips are plain in-page links).
 *
 * Its look is the brand site's `/menu/` page as it was when it was built from a
 * JSON file: the same tokens, the same FSSAI veg marks, the same sliding chip
 * pill. What is new is **Unavailable**: an item the kitchen has run out of stays
 * on the page, greyed out, with the word where its price would be — the same
 * word the ops Menu screen and the counter use.
 */

/** Strip the stylesheet's comments before it is served, as the receipt does. */
function css(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/** Where the Worker serves its own assets for this page. `_` is never in a slug. */
export const MENU_ASSET_PREFIX = '/menu/_/'

/** ₹145, or ₹145.50 for a price that is not whole rupees. */
export function formatRupees(paise: number): string {
  const rupees = paise / 100
  return Number.isInteger(rupees) ? String(rupees) : rupees.toFixed(2)
}

/** A section's in-page anchor: its name as a slug, unique on the page. */
export function sectionIds(names: string[]): string[] {
  const seen = new Map<string, number>()
  return names.map((name) => {
    const base =
      name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '') || 'section'
    const n = (seen.get(base) ?? 0) + 1
    seen.set(base, n)
    return n === 1 ? base : `${base}-${n}`
  })
}

const FACES = `
@font-face {
  font-family: 'Lilita One';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('${MENU_ASSET_PREFIX}fonts/lilita-one.woff2') format('woff2');
}
@font-face {
  font-family: 'Nunito Sans Variable';
  font-style: normal;
  font-weight: 400 800;
  font-display: swap;
  src: url('${MENU_ASSET_PREFIX}fonts/nunito-sans.woff2') format('woff2');
}
`

const STYLES = `
:root {
  color-scheme: dark;
  --bg: #14100b;
  --bg-raised: #1e1710;
  --bg-overlay: rgb(20 16 11 / 0.82);
  --cream: #f5e4c7;
  --cream-dim: #c9b795;
  --cream-faint: rgb(245 228 199 / 0.45);
  --flame-gold: #ffc53d;
  --flame-orange: #f97316;
  --flame-red: #dc2626;
  --gradient-flame: linear-gradient(100deg, #ffc53d 0%, #f97316 52%, #dc2626 100%);
  --color-veg: #16a34a;
  --color-nonveg: #b91c1c;
  --font-display: 'Lilita One', 'Arial Rounded MT Bold', system-ui, sans-serif;
  --font-text: 'Nunito Sans Variable', 'Nunito Sans', system-ui, sans-serif;
}

*, *::before, *::after { box-sizing: border-box; }

html {
  -webkit-text-size-adjust: 100%;
  /* The sticky chip strip covers the top of whatever a chip jumps to. */
  scroll-padding-top: 4.5rem;
}

body {
  margin: 0;
  background: var(--bg);
  color: var(--cream);
  font-family: var(--font-text);
  font-size: clamp(1rem, 0.95rem + 0.25vw, 1.125rem);
  line-height: 1.45;
  padding: 0 16px;
}

main, .masthead, .docfoot { max-width: 40rem; margin: 0 auto; }

.masthead { display: flex; justify-content: center; padding: 1.625rem 0 0; }
.masthead a { display: inline-flex; }
.masthead img { display: block; width: auto; height: 5.5rem; }

h1 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(2.75rem, 2rem + 4vw, 4rem);
  line-height: 1;
  letter-spacing: 0.005em;
  text-align: center;
  margin: 1rem 0 0;
}

h1::after {
  content: '';
  display: block;
  width: 4.5rem;
  height: 4px;
  margin: 1rem auto 0;
  border-radius: 999px;
  background: var(--gradient-flame);
}

/* Which outlet this is: a menu is per outlet, and prices differ between them. */
.outlet {
  margin: 0.625rem 0 0;
  text-align: center;
  color: var(--cream-dim);
  font-weight: 700;
  font-size: 0.9375rem;
  letter-spacing: 0.04em;
}

/* -- section chips: sticky, and scrolling sideways inside themselves -- */
.chips {
  position: sticky;
  top: 0;
  z-index: 1;
  margin: 1.625rem -16px 0;
  padding: 0.625rem 16px;
  background: var(--bg-overlay);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border-bottom: 1px solid rgb(245 228 199 / 0.1);
}

.chips ul {
  position: relative;
  display: flex;
  gap: 0.375rem;
  margin: 0;
  padding: 0;
  list-style: none;
  overflow-x: auto;
  scrollbar-width: none;
}

.chips ul::-webkit-scrollbar { display: none; }

.chips a {
  position: relative;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  padding: 0 1rem;
  border: 1px solid rgb(245 228 199 / 0.2);
  border-radius: 999px;
  background: rgb(245 228 199 / 0.05);
  color: var(--cream);
  font-size: 0.875rem;
  font-weight: 700;
  white-space: nowrap;
  text-decoration: none;
  transition: color 260ms cubic-bezier(0.22, 1, 0.36, 1), border-color 260ms cubic-bezier(0.22, 1, 0.36, 1);
}

.chips a:hover { border-color: var(--flame-gold); color: var(--flame-gold); }
.chips a[aria-current], .chips a[aria-current]:hover { border-color: transparent; color: #201404; }

.chip-pill {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  width: 0;
  border-radius: 999px;
  background: var(--gradient-flame);
  pointer-events: none;
}

.spy-ready .chip-pill {
  transition: transform 420ms cubic-bezier(0.22, 1, 0.36, 1), width 420ms cubic-bezier(0.22, 1, 0.36, 1);
}

/* -- a section -------------------------------------------------------- */
.course h2 {
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(1.75rem, 1.4rem + 1.6vw, 2.25rem);
  line-height: 1.08;
  letter-spacing: 0.005em;
  color: var(--flame-gold);
  margin: 2.625rem 0 0.375rem;
}

.dishes { margin: 0; padding: 0; list-style: none; }
.dish { padding: 1rem 0; border-bottom: 1px solid rgb(245 228 199 / 0.08); }
.dish:last-child { border-bottom: 0; }
.line { display: flex; align-items: baseline; gap: 1rem; }

.dish h3 {
  flex: 1;
  margin: 0;
  font-size: 1.0625rem;
  font-weight: 800;
  line-height: 1.3;
}

.price {
  flex: none;
  font-family: var(--font-display);
  font-size: 1.25rem;
  color: var(--flame-gold);
  font-variant-numeric: tabular-nums;
}

.rupee { margin-right: 0.08em; font-family: var(--font-text); font-weight: 700; font-size: 0.85em; }

.desc {
  margin: 0.375rem 0 0;
  color: var(--cream-dim);
  font-size: 0.9375rem;
  padding-right: 3.5rem;
}

/* -- unavailable: greyed out, the word where the price was ------------ */
.dish.off h3, .dish.off .desc { color: var(--cream-faint); }
.dish.off .diet { opacity: 0.5; }

.unavailable {
  flex: none;
  padding: 0.1em 0.6em;
  border: 1px solid rgb(245 228 199 / 0.25);
  border-radius: 999px;
  color: var(--cream-dim);
  font-size: 0.75rem;
  font-weight: 800;
  letter-spacing: 0.04em;
  white-space: nowrap;
}

/* -- veg / non-veg: the FSSAI mark, on a white tile ------------------- */
.diet {
  display: inline-block;
  position: relative;
  width: 0.95rem;
  height: 0.95rem;
  margin-right: 0.5rem;
  vertical-align: -0.1rem;
  border: 1.5px solid currentColor;
  border-radius: 2px;
  background: #fff;
}

.diet::after {
  content: '';
  position: absolute;
  inset: 0;
  margin: auto;
  background: currentColor;
}

.diet.veg { color: var(--color-veg); }
.diet.veg::after { width: 0.45rem; height: 0.45rem; border-radius: 50%; }
.diet.nonveg { color: var(--color-nonveg); }
.diet.nonveg::after { width: 0.55rem; height: 0.48rem; clip-path: polygon(50% 0, 100% 100%, 0 100%); }

/* -- footer ------------------------------------------------------------ */
.docfoot {
  margin-top: 4.25rem;
  padding: 1.625rem 0 2.625rem;
  border-top: 1px solid rgb(245 228 199 / 0.12);
  color: var(--cream-faint);
  font-size: 0.75rem;
}

.docfoot a { color: var(--cream-dim); text-underline-offset: 0.2em; }

a:focus-visible { outline: 2px solid var(--flame-gold); outline-offset: 3px; border-radius: 0.375rem; }

/* -- the not-found and unavailable pages ------------------------------ */
.sheet { text-align: center; padding: 2rem 0; }
.sheet h1 { font-size: clamp(1.75rem, 1.4rem + 2vw, 2.5rem); }
.sheet p { color: var(--cream-dim); margin: 1.625rem 0 0; }

@media (prefers-reduced-motion: reduce) {
  .chips a, .spy-ready .chip-pill { transition: none; }
}
`

/**
 * The Google review ask: a popup on every visit, docking into a banner.
 *
 * Every open of the menu — by URL or by the table's QR code — first shows a
 * popup asking for a Google review. Its close button is
 * ringed by a five-second countdown; when the ring runs out, or the button is
 * pressed, the popup does not vanish but flies down into a banner fixed to the
 * bottom of the screen, over the menu, which has its own small close. Closing
 * either is for this visit only: nothing is remembered, so a reload or the next
 * scan asks again [owner, 2026-10-07].
 *
 * The motion is the brand site's hero: things pop in on an overshooting ease
 * with a little rotation (`back.out`), the copy rises in a stagger, the line
 * that matters is in the flame gradient. Here it is CSS keyframes, not GSAP —
 * this page carries no library.
 *
 * **Few words, read in one line** [owner, 2026-10-07]: "Review us / get 5% off",
 * "Leave a Google review", "Then show it at the counter". The offer is said once,
 * in the headline; the rest is implicit.
 * The copy never asks for stars or a good word; the stars it draws are
 * decoration.
 *
 * Whether an outlet asks at all, its listing's review link and the discount
 * percentage are set by its manager on the ops outlet page and arrive with the
 * menu (`public_menu`'s `review`). Off, or anything this page could not show
 * honestly, and there is no popup.
 */
export function reviewAskFor(menu: PublicMenu): PublicMenuReview | null {
  const review = menu.review
  if (!review || typeof review !== 'object') return null
  const { url, percent } = review
  if (typeof url !== 'string' || !/^https:\/\/[^\s"<>]+$/.test(url)) return null
  if (!Number.isInteger(percent) || percent < 1 || percent > 50) return null
  return { url, percent, popup: review.popup !== false }
}

/** How long the popup stays before it docks itself, in seconds. */
export const REVIEW_POPUP_SECONDS = 5

const REVIEW_STYLES = `
.rv [hidden], .rv[hidden] { display: none !important; }

html.rv-lock { overflow: hidden; }

/* The banner covers the bottom of the page; the footer must still clear it. */
body.rv-docked { padding-bottom: calc(5.5rem + env(safe-area-inset-bottom)); }

/* -- the popup ---------------------------------------------------------- */
.rv-pop {
  position: fixed;
  inset: 0;
  z-index: 50;
  display: grid;
  place-items: center;
  padding: 16px;
}

.rv-backdrop {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(30rem 22rem at 70% 25%, rgb(249 115 22 / 0.22), transparent 70%),
    radial-gradient(26rem 20rem at 15% 85%, rgb(127 29 29 / 0.4), transparent 70%),
    rgb(10 8 5 / 0.72);
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
  animation: rv-fade 360ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

/* A flame border that turns: a spinning conic gradient behind a 2 px gap. */
.rv-frame {
  position: relative;
  width: min(23rem, 100%);
  padding: 2px;
  border-radius: 1.5rem;
  overflow: hidden;
  isolation: isolate;
  box-shadow: 0 30px 80px rgb(0 0 0 / 0.6), 0 0 60px rgb(249 115 22 / 0.25);
  animation: rv-pop 700ms cubic-bezier(0.34, 1.56, 0.64, 1) 80ms both;
}

.rv-frame::before {
  content: '';
  position: absolute;
  inset: -60%;
  z-index: -1;
  background: conic-gradient(from 0deg, #ffc53d, #f97316, #dc2626, #7f1d1d, #dc2626, #f97316, #ffc53d);
  animation: rv-spin 4s linear infinite;
}

.rv-card {
  position: relative;
  overflow: hidden;
  padding: 2.25rem 1.5rem 1.5rem;
  border-radius: calc(1.5rem - 2px);
  background:
    radial-gradient(18rem 12rem at 80% 0%, rgb(249 115 22 / 0.28), transparent 70%),
    radial-gradient(14rem 10rem at 0% 100%, rgb(127 29 29 / 0.45), transparent 70%),
    var(--bg-raised);
  text-align: center;
}

/* Embers drifting up behind the copy. */
.rv-embers { position: absolute; inset: 0; pointer-events: none; }
.rv-embers i {
  position: absolute;
  bottom: -10px;
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #ffc53d;
  box-shadow: 0 0 10px 2px rgb(249 115 22 / 0.8);
  opacity: 0;
  animation: rv-ember 3.2s ease-in infinite;
}
.rv-embers i:nth-child(1) { left: 8%;  animation-delay: 0.2s; }
.rv-embers i:nth-child(2) { left: 22%; animation-delay: 1.4s; width: 4px; height: 4px; }
.rv-embers i:nth-child(3) { left: 38%; animation-delay: 0.8s; background: #f97316; }
.rv-embers i:nth-child(4) { left: 55%; animation-delay: 2.1s; width: 4px; height: 4px; }
.rv-embers i:nth-child(5) { left: 70%; animation-delay: 0.5s; background: #f97316; }
.rv-embers i:nth-child(6) { left: 84%; animation-delay: 1.7s; }
.rv-embers i:nth-child(7) { left: 94%; animation-delay: 2.6s; width: 4px; height: 4px; background: #dc2626; }

/* The close button, ringed by the countdown. */
.rv-close {
  position: absolute;
  top: 0.625rem;
  right: 0.625rem;
  z-index: 2;
  display: grid;
  place-items: center;
  width: 44px;
  height: 44px;
  padding: 0;
  border: 0;
  border-radius: 50%;
  background: rgb(20 16 11 / 0.6);
  color: var(--cream);
  cursor: pointer;
  transition: transform 180ms cubic-bezier(0.34, 1.3, 0.64, 1), color 180ms;
}
.rv-close:hover { transform: scale(1.08); color: var(--flame-gold); }
.rv-close svg { position: absolute; inset: 0; width: 100%; height: 100%; transform: rotate(-90deg); }
.rv-ring-track { fill: none; stroke: rgb(245 228 199 / 0.15); stroke-width: 2.5; }
.rv-ring-arc {
  fill: none;
  stroke: url(#rv-flame);
  stroke-width: 2.5;
  stroke-linecap: round;
  stroke-dasharray: 113.1;
  animation: rv-count ${REVIEW_POPUP_SECONDS}s linear 600ms both;
}
.rv-paused .rv-ring-arc { animation-play-state: paused; }
.rv-close b { position: relative; font-size: 1.25rem; line-height: 1; font-weight: 400; }


.rv-stars { display: flex; justify-content: center; gap: 0.25rem; margin: 0.5rem 0 0.875rem; }
.rv-stars svg {
  width: 1.875rem;
  height: 1.875rem;
  fill: #ffc53d;
  filter: drop-shadow(0 0 8px rgb(255 197 61 / 0.55));
  animation: rv-star 550ms cubic-bezier(0.34, 1.9, 0.64, 1) both;
}
.rv-stars svg:nth-child(1) { animation-delay: 380ms; }
.rv-stars svg:nth-child(2) { animation-delay: 450ms; }
.rv-stars svg:nth-child(3) { animation-delay: 520ms; }
.rv-stars svg:nth-child(4) { animation-delay: 590ms; }
.rv-stars svg:nth-child(5) { animation-delay: 660ms; }

.rv-rise { animation: rv-rise 600ms cubic-bezier(0.34, 1.4, 0.64, 1) both; }

.rv-kicker {
  margin: 0;
  color: var(--flame-gold);
  font-size: 0.8125rem;
  font-weight: 800;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  animation-delay: 300ms;
}

.rv-title {
  margin: 0.375rem 0 0;
  font-family: var(--font-display);
  font-weight: 400;
  font-size: clamp(2.25rem, 1.8rem + 2.5vw, 2.75rem);
  line-height: 0.98;
  text-transform: uppercase;
}
.rv-title span { display: block; animation: rv-rise 700ms cubic-bezier(0.34, 1.6, 0.64, 1) both; }
.rv-title span:nth-child(1) { animation-delay: 380ms; }
.rv-title span:nth-child(2) {
  animation-delay: 500ms;
  width: fit-content;
  margin: 0 auto;
  background: var(--gradient-flame);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
}

.rv-text { margin: 0.875rem 0 0; color: var(--cream-dim); font-size: 0.9375rem; animation-delay: 620ms; }
.rv-text strong { color: var(--cream); }

.rv-cta {
  position: relative;
  overflow: hidden;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  min-height: 3.25rem;
  margin-top: 1.375rem;
  padding: 0 1rem;
  white-space: nowrap;
  border-radius: 999px;
  background: var(--gradient-flame);
  color: #201404;
  font-weight: 800;
  font-size: 1.0625rem;
  text-decoration: none;
  box-shadow: 0 10px 28px rgb(249 115 22 / 0.45);
  animation: rv-rise 600ms cubic-bezier(0.34, 1.4, 0.64, 1) 740ms both, rv-throb 2.4s ease-in-out 1.6s infinite;
}
.rv-cta::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgb(255 255 255 / 0.55) 50%, transparent 65%);
  transform: translateX(-120%);
  animation: rv-shine 2.4s ease-in-out 1.2s infinite;
}
.rv-g {
  display: grid;
  place-items: center;
  width: 1.75rem;
  height: 1.75rem;
  border-radius: 50%;
  background: #fff;
  flex: none;
}
.rv-g svg { width: 1.05rem; height: 1.05rem; }

.rv-fine { margin: 0.875rem 0 0; color: var(--cream-dim); font-size: 0.9375rem; font-weight: 600; text-wrap: balance; animation-delay: 820ms; }
.rv-fine strong { color: var(--flame-gold); font-weight: 800; }

/* Closing: the card shrinks and drops toward where the banner will be. */
.rv-out .rv-backdrop { animation: rv-fade 380ms cubic-bezier(0.22, 1, 0.36, 1) reverse both; }
.rv-out .rv-frame { animation: rv-dock 420ms cubic-bezier(0.55, 0, 0.75, 0) both; }

/* -- the banner ---------------------------------------------------------
   The popup's own button, docked: the same flame pill, the same G, the same
   arrow, so it reads as the link it is. It stays: it takes little room, and
   there is nothing to close [owner, 2026-10-08]. */
.rv-bar {
  position: fixed;
  left: 50%;
  bottom: max(12px, env(safe-area-inset-bottom));
  z-index: 40;
  display: flex;
  align-items: center;
  width: min(23rem, calc(100% - 32px));
  min-height: 3.25rem;
  border-radius: 999px;
  overflow: hidden;
  background: var(--gradient-flame);
  color: #201404;
  box-shadow: 0 10px 28px rgb(249 115 22 / 0.45), 0 14px 34px rgb(0 0 0 / 0.5);
  transform: translateX(-50%);
  animation: rv-bar-in 600ms cubic-bezier(0.34, 1.56, 0.64, 1) both;
}
.rv-bar::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(105deg, transparent 35%, rgb(255 255 255 / 0.55) 50%, transparent 65%);
  transform: translateX(-120%);
  animation: rv-shine 2.4s ease-in-out 1.2s infinite;
  pointer-events: none;
}
.rv-bar-link {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.625rem;
  min-width: 0;
  min-height: 3.25rem;
  padding: 0 1.25rem;
  color: inherit;
  font-weight: 800;
  font-size: 1.0625rem;
  white-space: nowrap;
  text-decoration: none;
}
/* Drawn at the weight of the words, and swaying a few pixels at the popup
   button's own slow pulse, so it reads as "this goes somewhere". */
.rv-go {
  flex: none;
  display: grid;
  place-items: center;
  animation: rv-sway 2.4s ease-in-out infinite;
}
.rv-go svg { width: 1.375rem; height: 1.375rem; }
/* Phones narrower than 375 px: smaller type and mark, so the popup's button
   and the banner each stay on one line. */
@media (max-width: 374px) {
  .rv-cta { gap: 0.4rem; padding: 0 0.75rem; font-size: 0.9375rem; }
  .rv-cta .rv-g, .rv-bar-link .rv-g { width: 1.5rem; height: 1.5rem; }
  .rv-bar-link .rv-g svg { width: 0.9rem; height: 0.9rem; }
  .rv-cta .rv-go svg, .rv-bar-link .rv-go svg { width: 1.125rem; height: 1.125rem; }
  .rv-bar-link { gap: 0.4rem; padding: 0 0.875rem 0 0.75rem; font-size: 0.875rem; }
}
@media (max-width: 339px) {
  .rv-cta { font-size: 0.875rem; padding: 0 0.625rem; }
}

.rv button:focus-visible, .rv a:focus-visible { outline: 2px solid var(--flame-gold); outline-offset: 3px; }
/* Gold on a gold pill would vanish: the banner focuses in its own ink. */
.rv-bar a:focus-visible { outline-color: #201404; outline-offset: -4px; border-radius: 999px; }

@keyframes rv-fade { from { opacity: 0; } }
@keyframes rv-pop { from { opacity: 0; transform: scale(0.55) rotate(8deg) translateY(40px); } }
@keyframes rv-spin { to { transform: rotate(1turn); } }
@keyframes rv-count { from { stroke-dashoffset: 0; } to { stroke-dashoffset: 113.1; } }
@keyframes rv-star { from { opacity: 0; transform: scale(0) rotate(-40deg); } }
@keyframes rv-rise { from { opacity: 0; transform: translateY(26px); } }
@keyframes rv-sway { 0%, 100% { transform: translateX(-1px); } 50% { transform: translateX(3px); } }
@keyframes rv-throb { 50% { transform: scale(1.035); box-shadow: 0 14px 36px rgb(249 115 22 / 0.65); } }
@keyframes rv-shine { 0% { transform: translateX(-120%); } 55%, 100% { transform: translateX(120%); } }
@keyframes rv-ember {
  0% { opacity: 0; transform: translateY(0) scale(1); }
  15% { opacity: 0.9; }
  100% { opacity: 0; transform: translateY(-26rem) translateX(12px) scale(0.3); }
}
@keyframes rv-dock { to { opacity: 0; transform: translateY(42vh) scale(0.25); } }
@keyframes rv-bar-in { from { opacity: 0; transform: translateX(-50%) translateY(120%) scale(0.9); } }

/* Under reduced motion it still appears, counts down and docks — without
   the pops, the embers, the spinning border or the shine. The ring stays: it
   is a progress bar, and the docking hangs off its end. */
@media (prefers-reduced-motion: reduce) {
  .rv-backdrop, .rv-frame, .rv-stars svg, .rv-rise, .rv-title span,
  .rv-cta, .rv-cta::after, .rv-bar, .rv-bar::after, .rv-go, .rv-embers i,
  .rv-frame::before, .rv-out .rv-backdrop, .rv-out .rv-frame { animation: none; }
  .rv-embers { display: none; }
}
`

const STAR = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.6l2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5l-5.9 3.1 1.2-6.5L2.5 9.5l6.6-.9z"/></svg>'

const GOOGLE_G = `<span class="rv-g" aria-hidden="true"><svg viewBox="0 0 48 48"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.6 5.4 2.7 13.3l7.9 6.1C12.5 13.6 17.8 9.5 24 9.5z"/><path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.2 5.3-4.6 6.9l7.4 5.8c4.3-4 6.9-9.9 6.9-17.2z"/><path fill="#FBBC05" d="M10.5 28.6c-.5-1.4-.8-3-.8-4.6s.3-3.2.8-4.6l-7.9-6.1C1 16.6 0 20.2 0 24s.9 7.4 2.6 10.6l7.9-6z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.4-5.8c-2.2 1.5-5 2.3-8.5 2.3-6.2 0-11.5-4.2-13.4-9.8l-7.9 6C6.6 42.6 14.6 48 24 48z"/></svg></span>`

/*
  The popup's behaviour. A plain string for the same reason as the chip script.
  Without script none of it shows: the root starts `hidden`, and a popup that
  could never close would be worse than no popup.
*/
const REVIEW_SCRIPT = `(function () {
  var root = document.getElementById('rv');
  if (!root) return;
  var html = document.documentElement;
  var pop = root.querySelector('.rv-pop');
  var bar = root.querySelector('.rv-bar');
  var ring = root.querySelector('.rv-ring-arc');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var state = 'pop';
  function dock() {
    if (state !== 'pop') return;
    state = 'bar';
    pop.classList.add('rv-out');
    html.classList.remove('rv-lock');
    setTimeout(function () {
      pop.hidden = true;
      bar.hidden = false;
      document.body.classList.add('rv-docked');
    }, reduce ? 0 : 400);
  }
  root.hidden = false;
  // The outlet keeps only the banner: no popup, no countdown.
  if (!pop) {
    state = 'bar';
    bar.hidden = false;
    document.body.classList.add('rv-docked');
    return;
  }
  html.classList.add('rv-lock');
  ring.addEventListener('animationend', dock);
  root.querySelector('.rv-close').addEventListener('click', dock);
  root.querySelector('.rv-backdrop').addEventListener('click', dock);
  root.querySelector('.rv-cta').addEventListener('click', function () { setTimeout(dock, 200); });
  document.addEventListener('keydown', function (event) { if (event.key === 'Escape') dock(); });
  // A menu opened in a background tab should still get its five seconds.
  function onVisibility() { root.classList.toggle('rv-paused', document.hidden); }
  document.addEventListener('visibilitychange', onVisibility);
  onVisibility();
})();`

/** The popup that opens the menu, docking into the banner. */
/**
 * The arrow on the popup's button and on the banner, the same on both: drawn at
 * the words' weight, so it does not look timid beside them [owner, 2026-10-08].
 */
const GO_ARROW = '<span class="rv-go" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>'

function reviewPopup(href: string, percent: number): string {
  return `
  <div class="rv-pop" role="dialog" aria-modal="true" aria-labelledby="rv-title">
    <div class="rv-backdrop"></div>
    <div class="rv-frame">
      <div class="rv-card">
        <div class="rv-embers" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i><i></i><i></i></div>
        <button type="button" class="rv-close" aria-label="Close">
          <svg viewBox="0 0 44 44" aria-hidden="true">
            <defs><linearGradient id="rv-flame" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffc53d"/><stop offset="0.52" stop-color="#f97316"/><stop offset="1" stop-color="#dc2626"/></linearGradient></defs>
            <circle class="rv-ring-track" cx="22" cy="22" r="18"/>
            <circle class="rv-ring-arc" cx="22" cy="22" r="18"/>
          </svg>
          <b aria-hidden="true">×</b>
        </button>
        <div class="rv-stars" aria-hidden="true">${STAR.repeat(5)}</div>
        <p class="rv-kicker rv-rise">Love Shawarmania?</p>
        <h2 class="rv-title" id="rv-title"><span>Review us</span><span>get ${percent}% off</span></h2>
        <p class="rv-text rv-rise">Takes less than a minute.</p>
        <a class="rv-cta" href="${href}" target="_blank" rel="noopener">${GOOGLE_G}<span>Leave a Google review</span>${GO_ARROW}</a>
        <p class="rv-fine rv-rise">Then show it at the counter</p>
      </div>
    </div>
  </div>`
}

/**
 * The review ask's markup: the popup, unless the outlet keeps only the banner,
 * and the banner it docks into. `popup` absent — an ops that predates the
 * switch — means the popup.
 */
function reviewAsk({ url, percent, popup }: PublicMenuReview): string {
  const href = escapeHtml(url)
  return `<div class="rv" id="rv" hidden>${popup === false ? '' : reviewPopup(href, percent)}
  <div class="rv-bar" role="complementary" aria-label="Leave a Google review" hidden>
    <a class="rv-bar-link" href="${href}" target="_blank" rel="noopener">${GOOGLE_G}<span>Leave a review. Get ${percent}% off!</span>${GO_ARROW}</a>
  </div>
</div>`
}


/*
  The chip scroll-spy, as the brand site's src/menu/spy.ts had it: one flame
  pill slides to the chip of the section being read, the strip keeps that chip
  centred, and a tapped chip glides the page there with the highlight going
  straight to it rather than ticking through every section on the way.

  A plain string, not a function's source: the Worker's bundler may inject
  helpers into a function body (esbuild's keepNames adds `__name(...)` calls)
  that would not exist in the customer's browser.
*/
const SPY = `(function () {
  var nav = document.querySelector('.chips');
  var strip = nav && nav.querySelector('ul');
  if (!nav || !strip) return;
  var chips = Array.prototype.slice.call(nav.querySelectorAll('a[href^="#"]'));
  var sections = chips.map(function (a) { return document.getElementById(a.hash.slice(1)); });
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)');
  var behavior = function () { return reduce.matches ? 'auto' : 'smooth'; };
  var pill = document.createElement('li');
  pill.className = 'chip-pill';
  pill.setAttribute('aria-hidden', 'true');
  strip.insertBefore(pill, strip.firstChild);
  var current = -1, locked = false, unlockTimer = 0, queued = false;
  function place() {
    var chip = chips[current];
    if (!chip) return;
    pill.style.width = chip.offsetWidth + 'px';
    pill.style.transform = 'translateX(' + chip.offsetLeft + 'px)';
  }
  function activate(i) {
    if (i === current) return;
    current = i;
    chips.forEach(function (a, j) {
      if (j === i) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current');
    });
    place();
    var chip = chips[i];
    strip.scrollTo({ left: chip.offsetLeft - (strip.clientWidth - chip.offsetWidth) / 2, behavior: behavior() });
  }
  function update() {
    if (locked) return;
    var line = nav.getBoundingClientRect().bottom + 24, index = 0;
    for (var i = 0; i < sections.length; i++) {
      if (sections[i] && sections[i].getBoundingClientRect().top <= line) index = i; else break;
    }
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) index = sections.length - 1;
    activate(index);
  }
  function unlockSoon() {
    clearTimeout(unlockTimer);
    unlockTimer = setTimeout(function () { locked = false; update(); }, 160);
  }
  function onScroll() {
    if (locked) unlockSoon();
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; update(); });
  }
  chips.forEach(function (a, i) {
    a.addEventListener('click', function (event) {
      var section = sections[i];
      if (!section) return;
      event.preventDefault();
      activate(i);
      locked = true;
      unlockSoon();
      section.scrollIntoView({ behavior: behavior(), block: 'start' });
      history.replaceState(null, '', a.hash);
    });
  });
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', function () { place(); onScroll(); });
  update();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  requestAnimationFrame(function () { requestAnimationFrame(function () { nav.classList.add('spy-ready'); }); });
})();`

function dish(item: PublicMenuItem): string {
  // The FSSAI mark: a square with a dot for veg, a triangle for non-veg —
  // shape as well as colour, so it reads without colour vision too.
  const label = item.is_veg ? 'Vegetarian' : 'Non-vegetarian'
  const mark = `<span class="diet ${item.is_veg ? 'veg' : 'nonveg'}" role="img" aria-label="${label}" title="${label}"></span>`
  const price = item.is_available
    ? `<span class="price"><span class="rupee">₹</span>${formatRupees(item.price_paise)}</span>`
    : '<span class="unavailable">Unavailable</span>'
  const desc = item.description ? `\n<p class="desc">${escapeHtml(item.description)}</p>` : ''
  return `<li class="dish${item.is_available ? '' : ' off'}">
<div class="line"><h3>${mark}${escapeHtml(item.name)}</h3>${price}</div>${desc}
</li>`
}

function head(title: string, description: string, canonical: string | null, extraCss = ''): string {
  return `<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="dark">
<meta name="theme-color" content="#14100B">
<title>${escapeHtml(title)}</title>
<meta name="description" content="${escapeHtml(description)}">
${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">\n` : ''}<link rel="icon" href="/favicon.ico" sizes="48x48">
<link rel="icon" type="image/png" sizes="512x512" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="preload" href="${MENU_ASSET_PREFIX}fonts/lilita-one.woff2" as="font" type="font/woff2" crossorigin>
<style>${css(FACES)}${css(STYLES)}${extraCss ? css(extraCss) : ''}</style>`
}

const MASTHEAD = `<header class="masthead">
  <a href="/"><img src="${MENU_ASSET_PREFIX}logo.png" alt="Shawarmania — home" width="226" height="162"></a>
</header>`

// The LLP line is the receipt's own, so the two pages a table customer can
// reach say it in the same words (ops #66). `&` is escaped by hand: this
// footer is a constant, not run through the page's escaper.
const FOOTER = `<footer class="docfoot">
  <p><a href="/">Shawarmania</a> · <a href="/privacy/">Privacy</a></p>
  <p>${OPERATOR_LINE.replace(/&/g, '&amp;')}</p>
</footer>`

export function renderMenuPage(menu: PublicMenu, origin = 'https://shawarmania.in'): string {
  const ids = sectionIds(menu.sections.map((s) => s.name))
  const outletName = escapeHtml(menu.outlet.name)
  const review = reviewAskFor(menu)

  const nav = menu.sections
    .map((s, i) => `<li><a href="#${ids[i]}">${escapeHtml(s.name)}</a></li>`)
    .join('\n')

  const body = menu.sections
    .map(
      (s, i) => `<section class="course" id="${ids[i]}" aria-labelledby="${ids[i]}-h">
<h2 id="${ids[i]}-h">${escapeHtml(s.name)}</h2>
<ul class="dishes">
${s.items.map(dish).join('\n')}
</ul>
</section>`,
    )
    .join('\n')

  return `<!doctype html>
<html lang="en">
<head>
${head(
  `Menu — ${menu.outlet.name} · Shawarmania`,
  `The ${menu.outlet.name} menu, with today's prices and what is available right now.`,
  `${origin}/menu/${menu.outlet.slug}/`,
  review ? REVIEW_STYLES : '',
)}
</head>
<body>
${review ? `${reviewAsk(review)}\n<script>${REVIEW_SCRIPT}</script>\n` : ''}${MASTHEAD}
<main>
  <h1>Menu</h1>
  <p class="outlet">${outletName}</p>
  <nav class="chips" aria-label="Menu sections">
    <ul>
${nav}
    </ul>
  </nav>
${body}
</main>
${FOOTER}
<script>${SPY}</script>
</body>
</html>`
}

/**
 * No such address, a closed outlet, or an empty menu — one page for all three,
 * so nothing can be learned about which outlets exist.
 */
export function renderMenuNotFound(): string {
  return `<!doctype html>
<html lang="en">
<head>
${head('Menu not found · Shawarmania', 'This menu could not be found.', null)}
<meta name="robots" content="noindex">
</head>
<body>
${MASTHEAD}
<main class="sheet">
  <h1>We couldn’t find that menu</h1>
  <p>The address may be incomplete. Please ask our staff, or <a href="/">visit shawarmania.in</a>.</p>
</main>
${FOOTER}
</body>
</html>`
}

/** Ops could not be reached and there is no recent copy to show instead. */
export function renderMenuUnavailable(): string {
  return `<!doctype html>
<html lang="en">
<head>
${head('Menu unavailable · Shawarmania', 'The menu is briefly unavailable.', null)}
<meta name="robots" content="noindex">
</head>
<body>
${MASTHEAD}
<main class="sheet">
  <h1>The menu is taking a break</h1>
  <p>We couldn’t load it just now. Please try again in a minute, or ask our staff.</p>
</main>
${FOOTER}
</body>
</html>`
}
