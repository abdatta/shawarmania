/**
 * Config-time content validation: every dev boot and every build parses all six
 * data files through the shared zod schemas, so bad content can never ship —
 * even before any section imports the runtime gateway. Because vite.config.ts
 * imports this module, Vite also restarts+revalidates when these files change.
 */
import { z } from 'zod'
import { schemas, type ContentName } from '../src/data/schema'
import brand from '../src/data/brand.json'
import menu from '../src/data/menu.json'
import outlets from '../src/data/outlets.json'
import stats from '../src/data/stats.json'
import testimonials from '../src/data/testimonials.json'
import franchise from '../src/data/franchise.json'

const files: Record<ContentName, unknown> = { brand, menu, outlets, stats, testimonials, franchise }

export function validateContent(): void {
  const failures: string[] = []
  for (const [name, raw] of Object.entries(files) as [ContentName, unknown][]) {
    const result = schemas[name].safeParse(raw)
    if (!result.success) {
      failures.push(`src/data/${name}.json:\n${z.prettifyError(result.error)}`)
    }
  }
  if (failures.length) {
    throw new Error(`Content validation failed\n\n${failures.join('\n\n')}`)
  }
}
