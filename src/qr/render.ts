/**
 * Draws a Shawarmania-branded QR card onto a canvas.
 *
 * The card is dark like the site; the code itself sits on a cream plate,
 * because scanners want dark modules on a light ground and the brand's own
 * dark background would invert that. Everything "fancy" — rounded modules,
 * the maroon-to-ember gradient, flame-coloured finder eyes, the centre badge —
 * stays dark enough against the cream that phone cameras read it first time;
 * `scripts/qr-check.mjs` decodes the output to prove it.
 *
 * Error correction is H (30%), which is what pays for the badge in the middle.
 */
import qrcode from 'qrcode-generator'

// The library's default encoder is Latin-1 and mangles ₹ or Bengali; UTF-8
// is what every phone scanner assumes.
qrcode.stringToBytes = (s: string) => Array.from(new TextEncoder().encode(s))

export type CardOptions = {
  text: string
  caption: string
  logo: HTMLImageElement
  badge: HTMLImageElement
}

const W = 1000 // export width in px; the preview scales it down with CSS
const PAD = 64
const QUIET = 4 // modules of cream around the code — the spec's quiet zone

const C = {
  bg: '#14100b',
  plate: '#fdf3de',
  cream: '#f5e4c7',
  faint: 'rgba(245, 228, 199, 0.45)',
  moduleA: '#6b1414', // maroon
  moduleB: '#a63a0c', // deep ember — still ~4:1 against the plate
  eyeRing: '#2b1d12',
  eyeA: '#dc2626',
  eyeB: '#c2410c',
  flame: ['#ffc53d', '#f97316', '#dc2626'],
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, r)
}

/** Greedy word wrap, at most `max` lines, ellipsis on the last if it overflows. */
function wrap(ctx: CanvasRenderingContext2D, text: string, width: number, max: number): string[] {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const lines: string[] = []
  let line = ''
  for (const word of words) {
    const next = line ? `${line} ${word}` : word
    if (ctx.measureText(next).width <= width || !line) line = next
    else {
      lines.push(line)
      line = word
    }
  }
  if (line) lines.push(line)
  if (lines.length > max) {
    const kept = lines.slice(0, max)
    let last = kept[max - 1]
    while (last && ctx.measureText(`${last}…`).width > width) last = last.slice(0, -1)
    kept[max - 1] = `${last.trimEnd()}…`
    return kept
  }
  return lines
}

export function drawCard(canvas: HTMLCanvasElement, opts: CardOptions): void {
  const qr = qrcode(0, 'H')
  qr.addData(opts.text)
  qr.make()
  const n = qr.getModuleCount()

  const ctx = canvas.getContext('2d')!

  // -- measure -------------------------------------------------------------
  const logoH = 150
  const logoW = (opts.logo.naturalWidth / opts.logo.naturalHeight) * logoH
  const plate = W - PAD * 2
  const captionFont = '64px "Lilita One", sans-serif'
  ctx.font = captionFont
  const captionLines = opts.caption.trim() ? wrap(ctx, opts.caption, plate, 2) : []
  const captionLineH = 72
  const footerH = 40

  const H =
    PAD +
    logoH +
    40 +
    plate +
    (captionLines.length ? 48 + captionLines.length * captionLineH : 0) +
    36 +
    footerH +
    PAD

  canvas.width = W
  canvas.height = H

  // -- card ----------------------------------------------------------------
  ctx.fillStyle = C.bg
  ctx.fillRect(0, 0, W, H)

  // A soft ember glow behind the plate, the site's hero light in miniature.
  const glowY = PAD + logoH + 40 + plate / 2
  const glow = ctx.createRadialGradient(W / 2, glowY, plate * 0.2, W / 2, glowY, plate * 0.85)
  glow.addColorStop(0, 'rgba(249, 115, 22, 0.28)')
  glow.addColorStop(1, 'rgba(249, 115, 22, 0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, W, H)

  // Flame bar across the top edge.
  const bar = ctx.createLinearGradient(0, 0, W, 0)
  C.flame.forEach((c, i) => bar.addColorStop(i / (C.flame.length - 1), c))
  ctx.fillStyle = bar
  ctx.fillRect(0, 0, W, 10)

  let y = PAD
  ctx.drawImage(opts.logo, (W - logoW) / 2, y, logoW, logoH)
  y += logoH + 40

  // -- plate ---------------------------------------------------------------
  const px = PAD
  const py = y
  // Flame ring round the plate.
  const ring = ctx.createLinearGradient(px, py, px + plate, py + plate)
  C.flame.forEach((c, i) => ring.addColorStop(i / (C.flame.length - 1), c))
  roundRect(ctx, px - 6, py - 6, plate + 12, plate + 12, 46)
  ctx.fillStyle = ring
  ctx.fill()
  roundRect(ctx, px, py, plate, plate, 40)
  ctx.fillStyle = C.plate
  ctx.fill()

  // -- modules -------------------------------------------------------------
  const cell = plate / (n + QUIET * 2)
  const ox = px + QUIET * cell
  const oy = py + QUIET * cell

  // Centre badge footprint, in modules: ~22% of the width, odd so it centres.
  let badgeMods = Math.round(n * 0.22)
  if (badgeMods % 2 === 0) badgeMods += 1
  const b0 = (n - badgeMods) / 2
  const inBadge = (r: number, c: number) =>
    r >= b0 - 1 && r < b0 + badgeMods + 1 && c >= b0 - 1 && c < b0 + badgeMods + 1

  const inEye = (r: number, c: number) =>
    (r < 7 && c < 7) || (r < 7 && c >= n - 7) || (r >= n - 7 && c < 7)

  const grad = ctx.createLinearGradient(ox, oy, ox + n * cell, oy + n * cell)
  grad.addColorStop(0, C.moduleA)
  grad.addColorStop(1, C.moduleB)
  ctx.fillStyle = grad
  ctx.beginPath()
  const inset = cell * 0.06
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (!qr.isDark(r, c) || inEye(r, c) || inBadge(r, c)) continue
      ctx.roundRect(ox + c * cell + inset, oy + r * cell + inset, cell - inset * 2, cell - inset * 2, cell * 0.3)
    }
  }
  ctx.fill()

  // -- finder eyes: rounded ring + flame pupil ------------------------------
  const eyes: [number, number][] = [
    [0, 0],
    [0, n - 7],
    [n - 7, 0],
  ]
  for (const [r, c] of eyes) {
    const ex = ox + c * cell
    const ey = oy + r * cell
    ctx.beginPath()
    ctx.roundRect(ex, ey, cell * 7, cell * 7, cell * 0.9)
    ctx.roundRect(ex + cell, ey + cell, cell * 5, cell * 5, cell * 0.4)
    ctx.fillStyle = C.eyeRing
    ctx.fill('evenodd')

    const pupil = ctx.createLinearGradient(ex + cell * 2, ey + cell * 2, ex + cell * 5, ey + cell * 5)
    pupil.addColorStop(0, C.eyeA)
    pupil.addColorStop(1, C.eyeB)
    roundRect(ctx, ex + cell * 2, ey + cell * 2, cell * 3, cell * 3, cell * 0.5)
    ctx.fillStyle = pupil
    ctx.fill()
  }

  // -- centre badge ----------------------------------------------------------
  const bs = badgeMods * cell
  const bx = ox + b0 * cell
  const by = oy + b0 * cell
  ctx.save()
  roundRect(ctx, bx, by, bs, bs, bs * 0.22)
  ctx.clip()
  ctx.drawImage(opts.badge, bx, by, bs, bs)
  ctx.restore()

  y += plate

  // -- caption + footer -------------------------------------------------------
  ctx.textAlign = 'center'
  ctx.textBaseline = 'alphabetic'
  if (captionLines.length) {
    y += 48
    ctx.font = captionFont
    ctx.fillStyle = C.cream
    for (const line of captionLines) {
      y += captionLineH - 10
      ctx.fillText(line, W / 2, y)
      y += 10
    }
  }

  y += 36 + footerH - 8
  ctx.font = '700 30px "Nunito Sans Variable", system-ui, sans-serif'
  ctx.fillStyle = C.faint
  ctx.fillText('shawarmania.in', W / 2, y)
}
