/**
 * Typed content gateway. Every JSON file is parsed through its zod schema at
 * module load — invalid content fails the build/dev boot loudly instead of
 * rendering wrong data.
 */
import { z } from 'zod'
import { schemas } from './schema'
import brandJson from './brand.json'
import menuJson from './menu.json'
import outletsJson from './outlets.json'
import statsJson from './stats.json'
import testimonialsJson from './testimonials.json'
import franchiseJson from './franchise.json'

function parse<S extends z.ZodTypeAny>(name: string, schema: S, raw: unknown): z.infer<S> {
  const result = schema.safeParse(raw)
  if (!result.success) {
    throw new Error(`Invalid content in src/data/${name}.json:\n${z.prettifyError(result.error)}`)
  }
  return result.data
}

export const brand = parse('brand', schemas.brand, brandJson)
export const menu = parse('menu', schemas.menu, menuJson)
export const outlets = parse('outlets', schemas.outlets, outletsJson)
export const stats = parse('stats', schemas.stats, statsJson)
export const testimonials = parse('testimonials', schemas.testimonials, testimonialsJson)
export const franchise = parse('franchise', schemas.franchise, franchiseJson)

export type Brand = typeof brand
export type Menu = typeof menu
export type MenuItem = Menu['items'][number]
export type Outlet = typeof outlets.outlets[number]
export type Stats = typeof stats
export type Testimonials = typeof testimonials
export type Franchise = typeof franchise
