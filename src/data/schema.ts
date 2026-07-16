/**
 * Content contract for the whole site. The same schemas validate:
 *  - the committed JSON at build/boot (src/data/index.ts)
 *  - portal writes (plugins/content-portal.ts, change 3)
 *
 * Rule: facts we could not verify are nullable and seeded null — components
 * must render honest fallbacks, never invented numbers.
 */
import { z } from 'zod'

/* ---------- shared ---------- */

const imageKey = z.string().min(1) // validated against the image catalog at render time
const url = z.string().url()
const nonEmpty = z.string().min(1)

/* ---------- brand ---------- */

export const brandSchema = z.object({
  name: nonEmpty,
  nameBengali: nonEmpty,
  tagline: nonEmpty,
  heroClaim: nonEmpty,
  heroSub: nonEmpty,
  positioning: nonEmpty,
  foundedYear: z.number().int().nullable(),
  founderNote: z.string().nullable(),
  city: nonEmpty,
  region: nonEmpty,
  phonePrimary: nonEmpty,
  phoneDelivery: nonEmpty,
  whatsappNumber: z.string().nullable(),
  whatsappChannelUrl: url.nullable(),
  email: z.string().email().nullable(),
  social: z.object({
    instagram: url,
    facebook: url.nullable(),
    youtube: url.nullable(),
  }),
  legalEntityName: z.string().nullable(),
  ogDescription: nonEmpty,
})

/* ---------- menu ---------- */

export const menuItemSchema = z.object({
  id: nonEmpty,
  name: nonEmpty,
  category: nonEmpty,
  description: z.string().nullable(),
  price: z.number().positive().nullable(), // delivery-platform price, ₹
  counterPrice: z.number().positive().nullable(), // in-store price where known
  priceAsOf: z.string().nullable(),
  isVeg: z.boolean(),
  spiceLevel: z.number().int().min(0).max(3).nullable(),
  rating: z.number().min(0).max(5).nullable(),
  ratingCount: z.number().int().nonnegative().nullable(),
  badge: z.enum(['Bestseller', 'New', 'Viral', 'Top rated']).nullable(),
  image: imageKey.nullable(),
  orderUrl: url.nullable(),
  availableAt: z.array(nonEmpty),
  featured: z.boolean(),
})

export const menuSchema = z.object({
  categories: z.array(
    z.object({ id: nonEmpty, name: nonEmpty, blurb: z.string().nullable(), order: z.number().int() }),
  ),
  items: z.array(menuItemSchema),
})

/* ---------- outlets ---------- */

export const outletSchema = z.object({
  id: nonEmpty,
  name: nonEmpty,
  landmark: nonEmpty,
  addressLines: z.array(nonEmpty).min(1),
  city: nonEmpty,
  pincode: z.string().nullable(),
  plusCode: z.string().nullable(),
  mapsUrl: url.nullable(),
  phone: nonEmpty,
  hours: z
    .array(z.object({ days: nonEmpty, open: nonEmpty, close: nonEmpty }))
    .nullable(), // null until owner confirms (sources conflict)
  hoursNote: z.string().nullable(),
  deliveryOnly: z.boolean(),
  seating: z.boolean(),
  fssai: z.string().nullable(),
  swiggyUrl: url.nullable(),
  zomatoUrl: url.nullable(),
  image: imageKey.nullable(),
})

export const outletsSchema = z.object({ outlets: z.array(outletSchema).min(1) })

/* ---------- stats ---------- */

export const statsSchema = z.object({
  counters: z.array(
    z.object({
      id: nonEmpty,
      label: nonEmpty,
      value: z.number(),
      decimals: z.number().int().min(0).max(1),
      prefix: z.string().nullable(),
      suffix: z.string().nullable(),
      source: nonEmpty,
    }),
  ),
  timeline: z.array(
    z.object({
      year: z.number().int(),
      month: z.string().nullable(),
      title: nonEmpty,
      description: nonEmpty,
    }),
  ),
  labReport: z
    .object({
      lab: nonEmpty,
      sampleDescription: nonEmpty,
      sampledOn: nonEmpty,
      reportNo: nonEmpty,
      fssaiOnCert: z.string().nullable(),
      per100g: z.object({
        proteinG: z.number(),
        fatG: z.number(),
        sugarG: z.number(),
        carbsG: z.number(),
        energyKcal: z.number(),
        transFatG: z.number(),
      }),
      safety: z.array(nonEmpty),
      image: imageKey.nullable(),
    })
    .nullable(),
})

/* ---------- testimonials ---------- */

export const testimonialsSchema = z.object({
  vloggerVideos: z.array(
    z.object({
      id: nonEmpty,
      creator: nonEmpty,
      platform: z.enum(['facebook', 'instagram', 'youtube']),
      title: nonEmpty,
      url: url,
      image: imageKey.nullable(),
      metric: z.string().nullable(),
    }),
  ),
  quotes: z.array(
    z.object({
      id: nonEmpty,
      text: nonEmpty,
      author: z.string().nullable(),
      source: nonEmpty,
      url: url.nullable(),
    }),
  ),
})

/* ---------- franchise ---------- */

export const franchiseSchema = z.object({
  intro: nonEmpty,
  momentumLine: nonEmpty,
  models: z.array(
    z.object({
      id: nonEmpty,
      name: nonEmpty,
      areaSqft: z.string().nullable(),
      franchiseFee: z.string().nullable(),
      totalInvestment: z.string().nullable(),
      menuScope: z.string().nullable(),
      notes: z.string().nullable(),
    }),
  ),
  support: z.array(z.object({ icon: nonEmpty, title: nonEmpty, description: nonEmpty })),
  process: z.array(z.object({ step: z.number().int(), title: nonEmpty, description: nonEmpty })),
  faqs: z.array(z.object({ q: nonEmpty, a: nonEmpty })),
  enquiry: z.object({
    whatsappNumber: z.string().nullable(),
    whatsappPrefill: nonEmpty,
    formEndpoint: url.nullable(), // Web3Forms; null until owner supplies a key
    formAccessKey: z.string().nullable(),
  }),
  roiNote: z.string().nullable(),
})

/* ---------- registry ---------- */

export const schemas = {
  brand: brandSchema,
  menu: menuSchema,
  outlets: outletsSchema,
  stats: statsSchema,
  testimonials: testimonialsSchema,
  franchise: franchiseSchema,
} as const

export type ContentName = keyof typeof schemas
