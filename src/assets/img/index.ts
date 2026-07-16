/**
 * Image catalog: content JSON references images by key; sections resolve keys
 * here so JSON stays portable and the portal can offer a dropdown of keys.
 * All photography is Shawarmania's own published Instagram material
 * (see research/instagram/findings.md for provenance).
 */
import storefrontNeon from './storefront-neon.jpg?format=webp&quality=82&imagetools'
import storefrontNightFull from './storefront-night-full.jpg?format=webp&quality=82&imagetools'
import shawarmaPlate from './shawarma-plate.jpg?format=webp&quality=82&imagetools'
import shawarmaGlow from './shawarma-glow.jpg?format=webp&quality=82&imagetools'
import burgerLoaded from './burger-loaded.jpg?format=webp&quality=82&imagetools'
import burgerCheesePull from './burger-cheese-pull.jpg?format=webp&quality=82&imagetools'
import interiorCounter from './interior-counter.jpg?format=webp&quality=82&imagetools'
import labReport from './lab-report.jpg?format=webp&quality=82&imagetools'
import customerShawarma from './customer-shawarma.jpg?format=webp&quality=82&imagetools'
import customersNeon from './customers-neon.jpg?format=webp&quality=82&imagetools'

export const imageCatalog = {
  'storefront-neon': storefrontNeon,
  'storefront-night-full': storefrontNightFull,
  'shawarma-plate': shawarmaPlate,
  'shawarma-glow': shawarmaGlow,
  'burger-loaded': burgerLoaded,
  'burger-cheese-pull': burgerCheesePull,
  'interior-counter': interiorCounter,
  'lab-report': labReport,
  'customer-shawarma': customerShawarma,
  'customers-neon': customersNeon,
} as const

export type ImageKey = keyof typeof imageCatalog

export function imageFor(key: string | null): string | null {
  if (!key) return null
  const src = (imageCatalog as Record<string, string>)[key]
  if (!src && import.meta.env.DEV) {
    console.warn(`imageCatalog: unknown image key "${key}"`)
  }
  return src ?? null
}
