/**
 * Config-time content validation: every dev boot and every build parses all six
 * data files through the shared zod schemas, so bad content can never ship.
 * Reads via fs (not imports) so the data files are NOT config dependencies —
 * portal saves must not restart the dev server.
 */
import fs from 'node:fs'
import path from 'node:path'
import { z } from 'zod'
import { schemas, type ContentName } from '../src/data/schema'

export function validateContent(root = process.cwd()): void {
  const dataDir = path.resolve(root, 'src/data')
  const failures: string[] = []
  for (const name of Object.keys(schemas) as ContentName[]) {
    const raw = fs.readFileSync(path.join(dataDir, `${name}.json`), 'utf-8')
    const result = schemas[name].safeParse(JSON.parse(raw))
    if (!result.success) {
      failures.push(`src/data/${name}.json:\n${z.prettifyError(result.error)}`)
    }
  }
  if (failures.length) {
    throw new Error(`Content validation failed\n\n${failures.join('\n\n')}`)
  }
}
