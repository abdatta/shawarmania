/**
 * Hero cluster regression check — the photo card + ratings badge must keep the
 * same geometry relative to each other and to the CTAs at EVERY scroll position,
 * and must never touch the floating call/WhatsApp buttons.
 *
 *   node hero-scroll-check.mjs [url]
 */
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:5173/'
const WIDTHS = [320, 360, 375, 390, 414, 440, 540, 768, 899, 900, 1024, 1280, 1440]
const SCROLLS = [0, 60, 150, 300, 500, 700]

const browser = await chromium.launch()
let issues = 0

const probe = () => {
  const hero = document.querySelector('#top')
  const inner = hero.children[1]
  const copy = inner.children[0]
  const wrap = inner.children[1]
  const card = wrap.querySelector('figure')
  const badge = wrap.querySelector('p')
  const ctas = copy.querySelector('a').parentElement
  const fab = [...document.querySelectorAll('*')]
    .map((e) => ({ e, r: e.getBoundingClientRect() }))
    .filter((o) => getComputedStyle(o.e).position === 'fixed' && o.r.width > 0 && o.r.width < 120)[0]
  const R = (e) => e.getBoundingClientRect()
  const hit = (a, b) => b && !(a.right < b.left || a.left > b.right || a.bottom < b.top || a.top > b.bottom)
  const cb = R(card)
  const bb = R(badge)
  const fb = fab ? R(fab.e) : null
  const stacked = getComputedStyle(inner).gridTemplateColumns.split(' ').length === 1
  return {
    stacked,
    // distances that must not change with scroll, whatever the layout
    cardToBadge: Math.round(bb.top - cb.bottom),
    cardTilt: getComputedStyle(card).transform,
    badgeW: Math.round(badge.offsetWidth),
    // stacked only: the card sits below the CTAs, so the gap is real
    ctaToCard: stacked ? Math.round(cb.top - R(ctas).bottom) : null,
    cardHitsCtas: stacked && cb.top < R(ctas).bottom - 4,
    badgeOverCaption: stacked && bb.top < cb.bottom - 12,
    // side-by-side only: the two columns must never meet
    colGap: stacked ? null : Math.round(wrap.getBoundingClientRect().left - R(copy).right),
    colsOverlap: !stacked && R(copy).right > wrap.getBoundingClientRect().left,
    badgeHitsFab: !!hit(bb, fb),
  }
}

for (const width of WIDTHS) {
  const page = await browser.newPage({
    viewport: { width, height: Math.max(700, Math.round(width * 1.9)) },
    hasTouch: width < 900,
    isMobile: width < 900,
  })
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(2500) // intro timeline

  const samples = []
  for (const y of SCROLLS) {
    await page.evaluate((yy) => window.scrollTo(0, yy), y)
    await page.waitForTimeout(900) // scrub 0.6 + slack
    samples.push({ y, ...(await page.evaluate(probe)) })
  }

  const base = samples[0]
  const bad = []
  for (const s of samples) {
    if (s.ctaToCard !== base.ctaToCard) bad.push(`y=${s.y} ctaToCard ${base.ctaToCard}→${s.ctaToCard}`)
    if (s.cardToBadge !== base.cardToBadge)
      bad.push(`y=${s.y} cardToBadge ${base.cardToBadge}→${s.cardToBadge}`)
    if (s.cardTilt !== base.cardTilt) bad.push(`y=${s.y} card re-tilted`)
    if (s.badgeOverCaption) bad.push(`y=${s.y} badge covers the photo caption`)
    if (s.badgeHitsFab) bad.push(`y=${s.y} badge under floating buttons`)
    if (s.cardHitsCtas) bad.push(`y=${s.y} card overlaps CTAs`)
    if (s.colsOverlap) bad.push(`y=${s.y} hero columns overlap`)
  }

  if (bad.length) {
    issues += bad.length
    console.log(`\n${width}px — ${bad.length} issue(s)`)
    bad.forEach((b) => console.log('   ✗ ' + b))
  } else {
    const layout = base.stacked
      ? `stacked   gap(cta→card)=${base.ctaToCard}`
      : `2-column  gap(col↔col)=${base.colGap}`
    console.log(
      `${String(width).padStart(4)}px  ok   ${layout}  gap(card→badge)=${base.cardToBadge}  badgeW=${base.badgeW}`,
    )
  }
  await page.close()
}

await browser.close()
console.log(issues ? `\n${issues} issue(s)` : '\nAll widths clean — hero geometry is scroll-invariant.')
process.exit(issues ? 1 : 0)
