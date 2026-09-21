/**
 * Business facts into the legal documents, at build time.
 *
 * `/privacy/`, `/terms/` and `/messages/` are hand-written HTML with no script
 * of any kind — a reviewer with JavaScript disabled has to be able to read them,
 * so nothing on them can be rendered by React. But they still state the FSSAI
 * licences, the outlet addresses, the entity name and the contact details, and
 * this repo has exactly one source of truth for those: `src/data/*.json`, guarded
 * by zod and edited through `/admin`.
 *
 * So the markup carries `{{brand.email}}` placeholders and this plugin resolves
 * them. Change an FSSAI number in the portal and every document that states it
 * states the new one, with no document edited.
 *
 * Read through `fs` and parsed through the shared schemas, **never imported** —
 * the same reason `validate-content.ts` gives: an import would make the data
 * files config dependencies, and a portal save would restart the dev server.
 * Reading per transform instead means a reload picks up the new value.
 *
 * `{{…}}` rather than Vite's own `%…%` so an unresolved placeholder can never be
 * mistaken for an env substitution, and so the two mechanisms — env for
 * `BASE_URL`, this for business facts — stay visibly distinct in the source.
 */
import fs from 'node:fs'
import path from 'node:path'
import type { Plugin } from 'vite'
import { schemas } from '../src/data/schema'

const PLACEHOLDER = /\{\{\s*([\w.]+)\s*\}\}/g

function read<K extends keyof typeof schemas>(dataDir: string, name: K) {
  const raw = fs.readFileSync(path.join(dataDir, `${name}.json`), 'utf-8')
  // `validateContent()` already ran at config time and threw on anything
  // invalid, so a parse here cannot be the first place a content error is seen.
  return schemas[name].parse(JSON.parse(raw)) as ReturnType<(typeof schemas)[K]['parse']>
}

/**
 * The facts the documents may name, flattened to dotted paths.
 *
 * Deliberately **not** the raw JSON tree. A legal document wants "both FSSAI
 * licences, joined for a sentence", not an array it has no way to loop over, and
 * the joining should happen once here rather than being retyped per page. What
 * a page cannot get from this object is a fact it should not be stating.
 */
function facts(root: string): Record<string, string> {
  const dataDir = path.resolve(root, 'src/data')
  const brand = read(dataDir, 'brand')
  const { outlets } = read(dataDir, 'outlets')

  const tel = (n: string) => n.replace(/[^\d+]/g, '')

  const out: Record<string, string> = {
    'brand.name': brand.name,
    'brand.tagline': brand.tagline,
    'brand.city': brand.city,
    'brand.region': brand.region,
    'brand.phonePrimary': brand.phonePrimary,
    'brand.phonePrimaryTel': tel(brand.phonePrimary),
    'brand.phoneDelivery': brand.phoneDelivery,
    'brand.phoneDeliveryTel': tel(brand.phoneDelivery),
    'brand.instagram': brand.social.instagram,
  }

  /*
    **No aggregates over the outlets.**

    There were two -- a joined FSSAI string and a count -- and they are gone
    [owner, 2026-09-21]. A legal document speaks for the outlet it is about, and
    these are the facts that quietly drag every other one into a sentence: the
    Kanchrapara licence appeared in three footers and a fact table purely
    because the joiner was the convenient thing to reach for. With them gone, a
    document naming a second outlet has to name it, by id, on purpose.

    Nothing here hardcodes which outlet that is. Filtering `kanchrapara` out of
    the loop below would have been the smaller edit and the worse one: it breaks
    silently the day the trading outlet changes or a third one opens.
  */


  /*
    A nullable fact resolves only when it has a value. A document naming one that
    is still null fails the build rather than printing "null" at a customer --
    which is the same bargain the rest of the site makes, except that a legal
    document cannot degrade to "Contact for details" and stay worth reading.
  */
  if (brand.legalEntityName) out['brand.legalEntityName'] = brand.legalEntityName
  if (brand.email) {
    out['brand.email'] = brand.email
    out['brand.emailHref'] = `mailto:${brand.email}`
  }

  /*
    One block per outlet, addressed by id, because a privacy notice names its
    places in prose and in a particular order rather than iterating them.
  */
  for (const o of outlets) {
    out[`outlet.${o.id}.name`] = o.name
    out[`outlet.${o.id}.address`] = [...o.addressLines, o.pincode].filter(Boolean).join(', ')
    out[`outlet.${o.id}.phone`] = o.phone
    out[`outlet.${o.id}.phoneTel`] = tel(o.phone)
    if (o.fssai) out[`outlet.${o.id}.fssai`] = o.fssai
  }

  return out
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')

/**
 * The plugin.
 *
 * `enforce: 'pre'` so the substitution happens before Vite's own HTML handling
 * builds asset graphs from the result.
 */
export function legalFacts(root = process.cwd()): Plugin {
  return {
    name: 'shawarmania:legal-facts',
    enforce: 'pre',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        // A document without placeholders -- index.html -- passes through
        // byte-identical. The regex is the whole gate.
        if (!html.includes('{{')) return html

        const table = facts(root)
        const missing: string[] = []

        const next = html.replace(PLACEHOLDER, (_match, key: string) => {
          const value = table[key]
          if (value === undefined) {
            missing.push(key)
            return ''
          }
          // Escaped on the way in: these are business facts, and `De & Datta
          // LLP` is an ampersand away from invalid markup.
          return escapeHtml(value)
        })

        /*
          **The failure this plugin exists to prevent** is a customer opening the
          privacy notice and reading `{{brand.email}}`. A typo'd path and a fact
          that is still null are the same event here, and both stop the build
          rather than reaching a page.
        */
        if (missing.length) {
          const where = ctx.filename ? path.relative(root, ctx.filename) : ctx.path
          throw new Error(
            `legal-facts: unresolved placeholder(s) in ${where}: ${[...new Set(missing)].join(
              ', ',
            )}\n` +
              `Either the path is misspelt or the fact is still null in src/data/. ` +
              `Known paths:\n  ${Object.keys(table).sort().join('\n  ')}`,
          )
        }

        return next
      },
    },
  }
}
