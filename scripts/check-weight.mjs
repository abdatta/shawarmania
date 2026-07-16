/**
 * Page-weight budget gate, run after `vite build`.
 * Initial load = html + css + js + fonts + og image is NOT counted (social crawlers only).
 * Photographic assets are lazy below the fold, budgeted in the total.
 */
import { readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const DIST = 'dist'
const INITIAL_BUDGET = 1.5 * 1024 * 1024 // html+css+js+fonts
const TOTAL_BUDGET = 4 * 1024 * 1024

const rows = []
function walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name)
    const st = statSync(p)
    if (st.isDirectory()) walk(p)
    else rows.push({ path: p.replaceAll('\\', '/'), size: st.size })
  }
}
walk(DIST)

const kb = (n) => `${(n / 1024).toFixed(1)} kB`
const isInitial = (p) =>
  p.endsWith('.html') || p.endsWith('.css') || p.endsWith('.js') || p.endsWith('.woff2') || p.endsWith('.woff')

const initial = rows.filter((r) => isInitial(r.path)).reduce((s, r) => s + r.size, 0)
const total = rows.reduce((s, r) => s + r.size, 0)

console.log('\nPage-weight report (dist/):')
for (const r of rows.sort((a, b) => b.size - a.size).slice(0, 12)) {
  console.log(`  ${kb(r.size).padStart(10)}  ${r.path}`)
}
console.log(`\n  initial-load (html+css+js+fonts): ${kb(initial)} / budget ${kb(INITIAL_BUDGET)}`)
console.log(`  total dist:                       ${kb(total)} / budget ${kb(TOTAL_BUDGET)}\n`)

if (initial > INITIAL_BUDGET || total > TOTAL_BUDGET) {
  console.error('❌ page-weight budget exceeded')
  process.exit(1)
}
console.log('✓ within budget')
