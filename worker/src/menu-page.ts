import type { PublicMenu, PublicMenuItem } from './menu'

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

function head(title: string, description: string, canonical: string | null): string {
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
<style>${css(FACES)}${css(STYLES)}</style>`
}

const MASTHEAD = `<header class="masthead">
  <a href="/"><img src="${MENU_ASSET_PREFIX}logo.png" alt="Shawarmania — home" width="226" height="162"></a>
</header>`

const FOOTER = `<footer class="docfoot">
  <p><a href="/">Shawarmania</a> · <a href="/privacy/">Privacy</a></p>
</footer>`

export function renderMenuPage(menu: PublicMenu, origin = 'https://shawarmania.in'): string {
  const ids = sectionIds(menu.sections.map((s) => s.name))
  const outletName = escapeHtml(menu.outlet.name)

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
)}
</head>
<body>
${MASTHEAD}
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
