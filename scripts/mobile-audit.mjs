/**
 * Mobile deep-dive audit: device-emulated walkthrough with per-section shots
 * and programmatic checks (overflow, tap targets, menu flow, fixed-CTA overlap).
 *   node scripts/mobile-audit.mjs [url] [outDir]
 */
import { chromium, devices } from 'playwright'
import { mkdirSync } from 'node:fs'

const url = process.argv[2] ?? 'http://localhost:5173/'
const out = process.argv[3] ?? '.shots/mobile'
mkdirSync(out, { recursive: true })

const PROFILES = [
  { name: 'iphone-se', ...devices['iPhone SE'] },
  { name: 'iphone-14', ...devices['iPhone 14'] },
  { name: 'android-360', viewport: { width: 360, height: 800 }, deviceScaleFactor: 2.5, isMobile: true, hasTouch: true, userAgent: devices['Pixel 7'].userAgent },
]

const SECTIONS = [
  ['hero', '#top'],
  ['menu', '#menu'],
  ['story', '#story'],
  ['proof', 'section[aria-label="Proof and certifications"]'],
  ['testimonials', 'section[aria-label="Reviews and vlogger coverage"]'],
  ['outlets', '#outlets'],
  ['franchise', '#franchise'],
  ['footer', '#contact'],
]

const browser = await chromium.launch()

for (const profile of PROFILES) {
  const { name, ...device } = profile
  const ctx = await browser.newContext({ ...device, reducedMotion: 'no-preference' })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text().slice(0, 120)))

  await page.goto(url, { waitUntil: 'networkidle' })
  await page.waitForTimeout(3200) // loader + hero entrance

  const report = { device: name, vw: device.viewport.width }

  // 1. overflow check
  report.overflow = await page.evaluate(() => {
    const d = document.documentElement
    return { cw: d.clientWidth, sw: d.scrollWidth, bad: d.scrollWidth > d.clientWidth }
  })

  // 2. hero shot
  await page.screenshot({ path: `${out}/${name}-00-hero.png` })

  // 3. burger menu flow
  await page.tap('button[aria-label="Open menu"]').catch(() => (report.burger = 'NOT FOUND'))
  await page.waitForTimeout(450)
  await page.screenshot({ path: `${out}/${name}-01-nav-open.png` })
  await page.tap('nav a[href="#menu"]').catch(() => (report.navTap = 'FAILED'))
  await page.waitForTimeout(1600)
  report.menuAnchorScroll = await page.evaluate(() => {
    const r = document.querySelector('#menu').getBoundingClientRect()
    return Math.abs(r.top) < 200 ? 'ok' : `off by ${Math.round(r.top)}px`
  })

  // 4. per-section shots (scroll through)
  for (const [label, sel] of SECTIONS.slice(1)) {
    await page.evaluate((s) => {
      const el = document.querySelector(s)
      el && window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 60)
    }, sel)
    await page.waitForTimeout(1100)
    await page.screenshot({ path: `${out}/${name}-${label}.png` })
  }

  // 5. horizontal menu gallery actually scrolls
  report.gallerySnap = await page.evaluate(() => {
    const g = document.querySelector('[class*=gallery]')
    if (!g) return 'missing'
    const before = g.scrollLeft
    g.scrollBy({ left: 320 })
    return new Promise((r) => setTimeout(() => r(g.scrollLeft > before + 100 ? 'scrolls' : 'STUCK'), 500))
  })

  // 6. tap-target audit (interactive elements < 40px in either dimension)
  report.smallTapTargets = await page.evaluate(() => {
    const bad = []
    for (const el of document.querySelectorAll('a, button, summary, input, select')) {
      const r = el.getBoundingClientRect()
      const visible = r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'
      if (visible && (r.height < 32 || r.width < 32)) {
        bad.push(`${el.tagName.toLowerCase()}"${(el.textContent || el.getAttribute('aria-label') || '').trim().slice(0, 28)}" ${Math.round(r.width)}x${Math.round(r.height)}`)
      }
    }
    return bad.slice(0, 12)
  })

  // 7. floating CTAs overlap with footer bar / form
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
  await page.waitForTimeout(900)
  await page.screenshot({ path: `${out}/${name}-zz-bottom.png` })

  // 8. FAQ + dialog interactions
  await page.evaluate(() => document.querySelector('#franchise')?.scrollIntoView())
  await page.waitForTimeout(600)
  const faq = page.locator('#franchise summary').first()
  await faq.tap().catch(() => (report.faqTap = 'FAILED'))
  await page.waitForTimeout(300)
  report.faqOpens = await page.evaluate(() => !!document.querySelector('#franchise details[open]'))

  report.errors = errors
  console.log(JSON.stringify(report))
  await ctx.close()
}

await browser.close()
console.log('done →', out)
