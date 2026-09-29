/**
 * The table menu into `/menu/`, at build time.
 *
 * `/menu/` is what the QR codes on the tables open, so it is read on a phone,
 * in a restaurant, often on bad Wi-Fi. Like the legal documents it carries no
 * script: the whole menu is in the HTML the first byte brings, and the section
 * chips are plain in-page anchors.
 *
 * The dishes live in `src/data/dinein.json` (editable at `/admin` → Table menu)
 * and this plugin turns them into markup where the page says `<!-- dinein -->`.
 * Same contract as `legal-facts.ts`: read through `fs` and the shared schema,
 * never imported, so a portal save reloads the page instead of restarting Vite.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { schemas } from '../src/data/schema'

const MARKER_NAV = '<!-- dinein:nav -->'
const MARKER_SECTIONS = '<!-- dinein:sections -->'

const esc = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function render(root: string) {
  const raw = fs.readFileSync(path.resolve(root, 'src/data/dinein.json'), 'utf-8')
  const { sections } = schemas.dinein.parse(JSON.parse(raw))

  const nav = sections
    .map((s) => `<li><a href="#${esc(s.id)}">${esc(s.name)}</a></li>`)
    .join('\n')

  const body = sections
    .map((s) => {
      const items = s.items
        .map((i) => {
          // The FSSAI mark: a square with a dot for veg, a triangle for
          // non-veg. Shape as well as colour, so it reads without colour too.
          const label = i.isVeg ? 'Vegetarian' : 'Non-vegetarian'
          const mark = `<span class="diet ${i.isVeg ? 'veg' : 'nonveg'}" role="img" aria-label="${label}" title="${label}"></span>`
          const price = `<span class="price"><span class="rupee">₹</span>${i.price}</span>`
          const desc = i.description ? `\n<p class="desc">${esc(i.description)}</p>` : ''
          return `<li class="dish">\n<div class="line"><h3>${mark}${esc(i.name)}</h3>${price}</div>${desc}\n</li>`
        })
        .join('\n')

      return `<section class="course" id="${esc(s.id)}" aria-labelledby="${esc(s.id)}-h">
<h2 id="${esc(s.id)}-h">${esc(s.name)}</h2>
<ul class="dishes">
${items}
</ul>
</section>`
    })
    .join('\n')

  return { nav, body }
}

export function dineInMenu(root = process.cwd()): Plugin {
  return {
    name: 'shawarmania:dinein-menu',
    enforce: 'pre',
    transformIndexHtml: {
      order: 'pre',
      handler(html) {
        if (!html.includes(MARKER_SECTIONS)) return html
        const { nav, body } = render(root)
        return html.replace(MARKER_NAV, nav).replace(MARKER_SECTIONS, body)
      },
    },
  }
}
