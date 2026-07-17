/**
 * Geometry invariant sweep: loads the page at many widths (including the
 * in-between bands simple device lists miss), scrolls through with motion on,
 * and ASSERTS element geometry instead of relying on eyeballs.
 *
 *   node scripts/geometry-sweep.mjs [url]
 *
 * Invariants per width:
 *  1. No horizontal document overflow.
 *  2. No "pill/chip" element (fully rounded) taller than 120px — catches
 *     absolute-position stretch bugs like top+bottom both set.
 *  3. No absolutely-positioned element with BOTH top and bottom non-auto
 *     (unless it also sets height) — the root-cause pattern itself.
 *  4. All in-viewport images loaded (naturalWidth > 0) and non-degenerate
 *     (rendered area > 0) after full scroll-through.
 *  5. Fixed UI (header, floating buttons) fully inside the viewport.
 *  6. Interactive elements (a/button/summary/input) don't visually clip
 *     their own text horizontally (scrollWidth > clientWidth + 2).
 */
import { chromium } from 'playwright'

const url = process.argv[2] ?? 'http://localhost:5173/'
const WIDTHS = [320, 360, 375, 390, 414, 440, 487, 540, 600, 660, 720, 768, 820, 899, 900, 1024, 1200, 1440]

const browser = await chromium.launch()
let totalIssues = 0

for (const width of WIDTHS) {
  const page = await browser.newPage({
    viewport: { width, height: Math.max(700, Math.round(width * 1.8)) },
    hasTouch: width < 900,
    isMobile: width < 900,
  })
  const consoleErrors = []
  page.on('pageerror', (e) => consoleErrors.push(String(e).slice(0, 100)))
  page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text().slice(0, 100)))

  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3000)
  // full scroll-through so every trigger fires and lazy images load
  await page.evaluate(async () => {
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
    for (let y = 0; y <= document.body.scrollHeight; y += 500) {
      window.scrollTo(0, y)
      await sleep(90)
    }
    window.scrollTo(0, 0)
    await sleep(300)
  })
  await page.waitForTimeout(600)

  const issues = await page.evaluate(() => {
    const out = []
    const cw = document.documentElement.clientWidth
    const label = (el) => {
      const cls = String(el.className?.baseVal ?? el.className).split(' ')[0]
      const txt = (el.textContent || '').trim().slice(0, 30)
      return `<${el.tagName.toLowerCase()} .${cls}> "${txt}"`
    }

    // 1. horizontal overflow
    if (document.documentElement.scrollWidth > cw) {
      out.push(`OVERFLOW: scrollWidth ${document.documentElement.scrollWidth} > ${cw}`)
    }

    for (const el of document.querySelectorAll('body *')) {
      const cs = getComputedStyle(el)
      if (cs.display === 'none' || cs.visibility === 'hidden') continue
      const r = el.getBoundingClientRect()

      // 2. giant pills
      const radius = parseFloat(cs.borderRadius)
      if (radius >= 100 && r.height > 120 && r.width > 40 && el.children.length < 4) {
        out.push(`GIANT PILL (${Math.round(r.width)}x${Math.round(r.height)}): ${label(el)}`)
      }

      // 3. absolute stretch pattern
      if (
        cs.position === 'absolute' &&
        cs.top !== 'auto' &&
        cs.bottom !== 'auto' &&
        cs.height === 'auto' &&
        r.height > 200
      ) {
        out.push(`ABS TOP+BOTTOM STRETCH (${Math.round(r.height)}px): ${label(el)}`)
      }

      // 6. clipped interactive text
      if (el.matches('a, button, summary') && el.scrollWidth > el.clientWidth + 2 && r.width > 0) {
        out.push(`CLIPPED TEXT: ${label(el)} (${el.clientWidth} < ${el.scrollWidth})`)
      }
    }

    // 4. images
    for (const img of document.querySelectorAll('img')) {
      const r = img.getBoundingClientRect()
      const cs = getComputedStyle(img)
      if (cs.display === 'none') continue
      if (img.complete && img.naturalWidth === 0) out.push(`BROKEN IMG: ${img.src.slice(-40)}`)
      if ((r.width === 0 || r.height === 0) && cs.visibility !== 'hidden') {
        out.push(`ZERO-SIZE IMG: ${img.src.slice(-40)}`)
      }
    }

    // 5. fixed UI in bounds
    for (const el of document.querySelectorAll('header, [class*=wrap]')) {
      const cs = getComputedStyle(el)
      if (cs.position !== 'fixed') continue
      const r = el.getBoundingClientRect()
      if (r.right > cw + 1 || r.left < -1) out.push(`FIXED OUT OF BOUNDS: ${label(el)} L${Math.round(r.left)} R${Math.round(r.right)}`)
    }
    return out
  })

  const all = [...issues, ...consoleErrors.map((e) => `CONSOLE: ${e}`)]
  totalIssues += all.length
  console.log(`[${width}px] ${all.length === 0 ? 'clean' : all.length + ' issue(s)'}`)
  for (const i of all) console.log(`   ${i}`)
  await page.close()
}

await browser.close()
console.log(totalIssues === 0 ? '\n✓ all widths clean' : `\n❌ ${totalIssues} total issues`)
process.exit(totalIssues === 0 ? 0 : 1)
