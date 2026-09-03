#!/usr/bin/env node
// The service-role credential must never reach the browser.
//
// It is a Worker secret: server-side, set with `wrangler secret put`, held by the
// Worker runtime and nowhere else. But the Worker and the marketing site now live
// in one repo with one `node_modules`, and the site's bundle is world-readable on
// GitHub Pages — so "the key is not in the bundle" stops being obvious and
// becomes something to check.
//
// This runs over `dist/` after a build and fails on anything that looks like the
// credential or the variable that carries it. It is deliberately blunt: a false
// positive costs a minute, and the thing it guards against costs the whole
// database.

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const dist = path.join(root, 'dist')

if (!fs.existsSync(dist)) {
  console.error('✗ dist/ does not exist. Run `npm run build` first.')
  process.exit(1)
}

const patterns = [
  // The variable name, so a stray `import.meta.env` reference is caught even
  // before a value exists to leak.
  { name: 'OPS_SERVICE_ROLE_KEY', test: (text) => text.includes('OPS_SERVICE_ROLE_KEY') },
  { name: 'the literal "service_role"', test: (text) => text.includes('service_role') },
  // A Supabase service-role key is a JWT whose payload decodes to that role.
  // Catch the shape rather than any particular key.
  {
    name: 'a JWT carrying the service_role claim',
    test: (text) => {
      for (const token of text.match(/eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{20,}/g) ?? []) {
        const payload = token.split('.')[1]
        if (!payload) continue
        try {
          if (Buffer.from(payload, 'base64url').toString('utf8').includes('service_role')) {
            return true
          }
        } catch {
          // Not base64url; not a JWT we care about.
        }
      }
      return false
    },
  },
]

const files = []
const walk = (dir) => {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) walk(full)
    else files.push(full)
  }
}
walk(dist)

// Text-ish files only: an image cannot carry a key, and decoding every webp
// would make this slow enough that somebody removes it from the build.
const readable = files.filter((file) =>
  ['.html', '.js', '.mjs', '.css', '.json', '.txt', '.xml', '.map', '.webmanifest'].includes(
    path.extname(file).toLowerCase(),
  ),
)

let failed = false
for (const file of readable) {
  const text = fs.readFileSync(file, 'utf8')
  for (const pattern of patterns) {
    if (pattern.test(text)) {
      console.error(`✗ ${path.relative(root, file)} contains ${pattern.name}.`)
      failed = true
    }
  }
}

if (failed) {
  console.error('\nThe service-role credential belongs in a Worker secret and nowhere else.')
  console.error('See worker/README.md.')
  process.exit(1)
}

console.log(
  `The site bundle carries no service-role credential (${readable.length} text files checked).`,
)
