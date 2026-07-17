import { brand, franchise } from '../data'

/**
 * Best-available WhatsApp destination. Prefers a direct chat with prefilled
 * text once the owner sets enquiry.whatsappNumber (via the portal); until
 * then falls back to the public WhatsApp channel.
 */
export function whatsappHref(prefill?: string): string | null {
  const num = franchise.enquiry.whatsappNumber
  if (num) {
    const digits = num.replace(/\D/g, '')
    return `https://wa.me/${digits}${prefill ? `?text=${encodeURIComponent(prefill)}` : ''}`
  }
  return brand.whatsappChannelUrl
}
