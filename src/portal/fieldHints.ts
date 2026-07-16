/**
 * UI hints for the value-driven form renderer. Server-side zod is the real
 * gate; these only shape input affordances (what a null becomes when toggled
 * on, which fields are enums/images/long text).
 */
import { imageCatalog } from '../assets/img'

/** What a null field turns into when the owner toggles it on. */
export const NULL_TYPE_HINTS: Record<string, 'number' | 'string' | 'url'> = {
  price: 'number',
  counterPrice: 'number',
  priceAsOf: 'string',
  rating: 'number',
  ratingCount: 'number',
  spiceLevel: 'number',
  foundedYear: 'number',
  founderNote: 'string',
  whatsappNumber: 'string',
  whatsappChannelUrl: 'url',
  email: 'string',
  legalEntityName: 'string',
  facebook: 'url',
  youtube: 'url',
  description: 'string',
  badge: 'string',
  image: 'string',
  orderUrl: 'url',
  pincode: 'string',
  plusCode: 'string',
  mapsUrl: 'url',
  fssai: 'string',
  swiggyUrl: 'url',
  zomatoUrl: 'url',
  hoursNote: 'string',
  areaSqft: 'string',
  franchiseFee: 'string',
  totalInvestment: 'string',
  menuScope: 'string',
  notes: 'string',
  formEndpoint: 'url',
  formAccessKey: 'string',
  roiNote: 'string',
  month: 'string',
  metric: 'string',
  author: 'string',
  blurb: 'string',
  prefix: 'string',
  suffix: 'string',
  fssaiOnCert: 'string',
}

export const ENUM_HINTS: Record<string, readonly string[]> = {
  badge: ['Bestseller', 'New', 'Viral', 'Top rated'],
  platform: ['facebook', 'instagram', 'youtube'],
}

export const IMAGE_KEYS = Object.keys(imageCatalog)

export const LONG_TEXT_FIELDS = new Set([
  'description', 'positioning', 'ogDescription', 'heroSub', 'intro', 'momentumLine',
  'text', 'a', 'hoursNote', 'founderNote', 'notes', 'whatsappPrefill', 'roiNote', 'blurb',
])

/** Template rows for "add entry" on the known array fields (keyed by JSON pointer tail). */
export const ARRAY_TEMPLATES: Record<string, unknown> = {
  items: {
    id: 'new-item', name: 'New item', category: 'shawarma', description: null, price: null,
    counterPrice: null, priceAsOf: null, isVeg: false, spiceLevel: null, rating: null,
    ratingCount: null, badge: null, image: null, orderUrl: null,
    availableAt: ['kalyani', 'kanchrapara'], featured: false,
  },
  categories: { id: 'new-category', name: 'New category', blurb: null, order: 99 },
  outlets: {
    id: 'new-outlet', name: 'New outlet', landmark: '', addressLines: [''], city: '',
    pincode: null, plusCode: null, mapsUrl: null, phone: '', hours: null, hoursNote: null,
    deliveryOnly: false, seating: false, fssai: null, swiggyUrl: null, zomatoUrl: null, image: null,
  },
  counters: { id: 'new-counter', label: '', value: 0, decimals: 0, prefix: null, suffix: null, source: '' },
  timeline: { year: 2026, month: null, title: '', description: '' },
  vloggerVideos: { id: 'new-video', creator: '', platform: 'instagram', title: '', url: 'https://', image: null, metric: null },
  quotes: { id: 'new-quote', text: '', author: null, source: '', url: null },
  models: { id: 'new-model', name: '', areaSqft: null, franchiseFee: null, totalInvestment: null, menuScope: null, notes: null },
  support: { icon: 'star', title: '', description: '' },
  process: { step: 5, title: '', description: '' },
  faqs: { q: '', a: '' },
  hours: { days: 'Mon–Sun', open: '12:00', close: '22:30' },
  addressLines: '',
  availableAt: 'kalyani',
  safety: '',
}
