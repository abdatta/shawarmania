/**
 * /qr/ — the in-house QR maker.
 *
 * Paste a link or any text, get a branded QR card, copy it to the clipboard
 * (or download it). Everything happens in the browser; nothing typed here is
 * sent anywhere.
 */
import logoUrl from '../assets/brand/logo.png'
import { drawCard } from './render'

const $ = <T extends HTMLElement>(id: string) => document.getElementById(id) as T

const text = $<HTMLInputElement>('qr-text')
const caption = $<HTMLInputElement>('qr-caption')
const card = $<HTMLElement>('qr-card')
const tools = $<HTMLElement>('qr-tools')
const canvas = $<HTMLCanvasElement>('qr-canvas')
const empty = $<HTMLElement>('qr-empty')
const copyBtn = $<HTMLButtonElement>('qr-copy')
const downloadBtn = $<HTMLButtonElement>('qr-download')
const status = $<HTMLElement>('qr-status')

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

const assets = Promise.all([
  loadImage(logoUrl),
  loadImage(`${import.meta.env.BASE_URL}favicon.png`),
  // The card draws in the brand fonts; a canvas silently falls back if they
  // are not loaded yet, so wait for them once.
  document.fonts.load('64px "Lilita One"'),
  document.fonts.load('700 30px "Nunito Sans Variable"'),
])

let ready = false

function say(message: string) {
  status.textContent = message
}

/** Swap a tool's icon for a tick for a moment, so the tap visibly landed. */
function flash(button: HTMLButtonElement) {
  button.classList.add('done')
  window.setTimeout(() => button.classList.remove('done'), 1600)
}

async function render() {
  const value = text.value.trim()
  ready = false
  copyBtn.disabled = downloadBtn.disabled = true
  if (!value) {
    card.hidden = tools.hidden = true
    empty.hidden = false
    say('')
    return
  }
  const [logo, badge] = await assets
  try {
    drawCard(canvas, { text: value, caption: caption.value, logo, badge })
  } catch {
    // The only thing that throws is data longer than a QR code can hold.
    card.hidden = tools.hidden = true
    empty.hidden = false
    say('That is too long to fit in a QR code. Try a shorter link.')
    return
  }
  card.hidden = tools.hidden = false
  empty.hidden = true
  ready = true
  copyBtn.disabled = downloadBtn.disabled = false
  say('')
}

let timer = 0
const schedule = () => {
  clearTimeout(timer)
  timer = window.setTimeout(render, 120)
}
// Enter in the caption field must not submit the form and reload the page.
text.form?.addEventListener('submit', (e) => e.preventDefault())
text.addEventListener('input', schedule)
caption.addEventListener('input', schedule)

const toBlob = () =>
  new Promise<Blob>((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('toBlob failed'))), 'image/png'),
  )

copyBtn.addEventListener('click', async () => {
  if (!ready) return
  try {
    // The promise goes straight into the ClipboardItem, still inside the click:
    // Safari refuses a clipboard write that happens after an await.
    await navigator.clipboard.write([new ClipboardItem({ 'image/png': toBlob() })])
    say('Copied — paste it anywhere.')
    flash(copyBtn)
  } catch {
    say('This browser would not copy an image. Use the download button instead.')
  }
})

downloadBtn.addEventListener('click', async () => {
  if (!ready) return
  const url = URL.createObjectURL(await toBlob())
  const a = document.createElement('a')
  const slug =
    (caption.value || text.value)
      .toLowerCase()
      .replace(/^https?:\/\//, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 40) || 'code'
  a.href = url
  a.download = `shawarmania-qr-${slug}.png`
  a.click()
  say('Downloaded.')
  flash(downloadBtn)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
})

// Allow /qr/?text=…&caption=… so a link can open the maker pre-filled.
const params = new URLSearchParams(location.search)
if (params.get('text')) text.value = params.get('text')!
if (params.get('caption')) caption.value = params.get('caption')!
void render()
