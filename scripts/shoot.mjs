/**
 * Visual self-review tool: headless screenshots of the site at phone/tablet/desktop.
 *
 *   node scripts/shoot.mjs <url> <outDir> [--static] [--steps=N]
 *
 * --static   emulate prefers-reduced-motion (site renders final states) and grab
 *            one full-page shot per viewport — best for layout review.
 * --steps=N  additionally scroll through the live (animated) page in N steps per
 *            viewport, screenshotting each stop — catches scrollytelling states.
 */
import { chromium } from 'playwright'
import { mkdirSync } from 'node:fs'

const url = process.argv[2] ?? 'http://localhost:5173/'
const outDir = process.argv[3] ?? '.shots'
const isStatic = process.argv.includes('--static')
const stepsArg = process.argv.find((a) => a.startsWith('--steps='))
const steps = stepsArg ? Number(stepsArg.split('=')[1]) : 0

const VIEWPORTS = [
  { name: 'phone', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 900 },
]

mkdirSync(outDir, { recursive: true })
const browser = await chromium.launch()

for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({
    viewport: { width: vp.width, height: vp.height },
    reducedMotion: isStatic ? 'reduce' : 'no-preference',
    deviceScaleFactor: 1,
  })
  const page = await ctx.newPage()
  const errors = []
  page.on('pageerror', (e) => errors.push(String(e)))
  page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))
  await page.goto(url, { waitUntil: 'networkidle' })
  await page.evaluate(() => document.fonts.ready)
  await page.waitForTimeout(600)

  if (isStatic) {
    await page.screenshot({ path: `${outDir}/${vp.name}-full.png`, fullPage: true })
  } else {
    const total = await page.evaluate(() => document.body.scrollHeight - innerHeight)
    const n = steps || 6
    for (let i = 0; i <= n; i++) {
      await page.evaluate((y) => window.scrollTo(0, y), Math.round((total * i) / n))
      await page.waitForTimeout(900)
      await page.screenshot({ path: `${outDir}/${vp.name}-s${String(i).padStart(2, '0')}.png` })
    }
  }
  if (errors.length) console.log(`[${vp.name}] page errors:\n  ${errors.join('\n  ')}`)
  await ctx.close()
}

await browser.close()
console.log(`shots written to ${outDir}`)
