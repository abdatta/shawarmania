import { contentStrings, receiptContent, type ContentAmount } from './content'
import type { Receipt } from './receipt'

/**
 * The receipt page: the one surface a customer of this business ever sees.
 *
 * It is a plain server-rendered document. No GSAP, no Lenis, no router, none of
 * the marketing site's motion runtime — those exist to sell and have no business
 * on a receipt somebody opened to check what they were charged. Fonts come from
 * the site's own origin with `font-display: swap`, so text paints immediately on
 * a slow connection instead of holding a blank screen.
 *
 * It names no customer. Not a name, not a phone number, not four masked digits,
 * and not the biller or the till either — see the ops repo's
 * `docs/SECURITY_AND_PRIVACY.md`. What a wrong reader learns is one order and
 * nothing about a person.
 *
 * **It decides nothing a reader can read.** Every label, subtext and amount comes
 * from `content.ts`, which the 80 mm PDF reads too, so the two cannot word a row
 * differently or carry a row the other lacks. What lives here is presentation:
 * typography, spacing, colour, and the print stylesheet.
 */

/**
 * Strip the stylesheet's comments before it is served.
 *
 * The comments below explain decisions and are worth keeping in the source, but
 * shipping them to a customer's phone is two kilobytes of design rationale on a
 * connection this page is deliberately trying to be light on. It also stops the
 * page's own prose from being mistaken for its content -- a test asserting the
 * receipt never says "tablet" was failing on a CSS comment about tablet widths.
 */
function css(text: string): string {
  return text
    .replace(/\/\*[\s\S]*?\*\//g, '')
    .replace(/\n{2,}/g, '\n')
    .trim()
}

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')


/*
  The faces, served by the Worker from its own route rather than by a font CDN.
  A receipt opened on a slow phone inside an in-app browser should make one
  request to one origin, and `swap` means the text paints immediately in the
  fallback rather than holding a blank screen while a face arrives.
*/
const FACES = `
@font-face {
  font-family: 'Lilita One';
  font-style: normal;
  font-weight: 400;
  font-display: swap;
  src: url('/bill/fonts/lilita-one.woff2') format('woff2');
}
@font-face {
  font-family: 'Nunito Sans Variable';
  font-style: normal;
  font-weight: 400 800;
  font-display: swap;
  src: url('/bill/fonts/nunito-sans.woff2') format('woff2');
}
`

const STYLES = `
:root {
  --bg: #14100b;
  --bg-raised: #1e1710;
  --cream: #f5e4c7;
  --cream-dim: #c9b795;
  --hairline: rgb(245 228 199 / 0.16);
  --flame-gold: #ffc53d;
  --flame-orange: #f97316;
  --flame-red: #dc2626;
  --danger: #fca5a5;
  --font-display: 'Lilita One', 'Arial Rounded MT Bold', system-ui, sans-serif;
  --font-text: 'Nunito Sans Variable', 'Nunito Sans', system-ui, sans-serif;
}

/*
  The page commits to the brand's near-black canvas in both schemes rather than
  inverting. A receipt is a small document a customer glances at once, and the
  cream-on-dark lockup *is* the brand; a light variant would be a second design
  to keep correct for no gain. The scheme is declared so form controls and the
  browser's own chrome match rather than fighting it.
*/
:root { color-scheme: dark; }

* { box-sizing: border-box; }

body {
  margin: 0;
  padding: 20px 16px 48px;
  background: var(--bg);
  color: var(--cream);
  font-family: var(--font-text);
  font-size: 16px;
  line-height: 1.5;
  -webkit-text-size-adjust: 100%;
}

.sheet {
  max-width: 30rem;
  margin: 0 auto;
  background: var(--bg-raised);
  border: 1px solid var(--hairline);
  border-radius: 18px;
  overflow: hidden;
}

.crest { padding: 22px 20px 18px; text-align: center; border-bottom: 1px solid var(--hairline); }
.crest img { width: 108px; height: auto; display: block; margin: 0 auto 12px; }
.crest .outlet {
  font-family: var(--font-display);
  font-size: 22px;
  letter-spacing: 0.01em;
  margin: 0;
}
.crest .when { margin: 4px 0 0; color: var(--cream-dim); font-size: 14px; }
.crest .bill-no {
  display: inline-block;
  margin-top: 12px;
  padding: 4px 12px;
  border-radius: 999px;
  border: 1px solid var(--hairline);
  font-size: 13px;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--cream-dim);
}

.cancelled {
  margin: 0;
  padding: 14px 20px;
  background: rgb(220 38 38 / 0.14);
  border-bottom: 1px solid rgb(220 38 38 / 0.4);
  color: var(--danger);
  font-weight: 800;
  text-align: center;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.cancelled span { display: block; margin-top: 4px; font-weight: 600; letter-spacing: 0; text-transform: none; color: var(--cream-dim); }

.rows { padding: 6px 20px; }
.row { display: flex; gap: 12px; align-items: baseline; padding: 11px 0; border-bottom: 1px solid var(--hairline); }
.row:last-child { border-bottom: 0; }
.row .what { flex: 1 1 auto; min-width: 0; }
.row .name { display: block; font-weight: 700; }
.row .sub { display: block; margin-top: 2px; font-size: 13px; color: var(--cream-dim); }
.row .amount { flex: 0 0 auto; font-variant-numeric: tabular-nums; font-weight: 700; }
.row.give .amount { color: var(--flame-gold); }

.totals { padding: 6px 20px 18px; border-top: 1px solid var(--hairline); }
.totals .row { border-bottom: 0; padding: 7px 0; }
.totals .row .name { font-weight: 600; color: var(--cream-dim); }
/*
  Two rules, each with a job, and only one of them belongs on a bill with
  nothing between them.

  .totals draws the band separator, edge to edge, because it separates the items
  from the money. The total row draws a second, inset one to separate itself from
  the discount and round-up rows above it -- so it applies only when there *are*
  rows above it, which is what the adjacent-sibling selector says. Without that,
  a plain undiscounted bill got both: a full-width line with an inset line twelve
  pixels under it.

  No backticks in this comment: the stylesheet lives in a template literal, and
  one would end it.
*/
.totals .grand { padding-top: 8px; }
.totals .row + .grand {
  margin-top: 6px;
  padding-top: 14px;
  border-top: 1px solid var(--hairline);
}
.totals .grand .name { font-family: var(--font-display); font-size: 20px; color: var(--cream); font-weight: 400; }
/* Amounts stay in the text face: Lilita One ships no rupee sign, so a
   display-face figure would render its currency in a fallback face. */
.totals .grand .amount { font-size: 24px; font-weight: 800; }

.paid { margin: 0 20px 20px; padding: 12px 14px; border: 1px solid var(--hairline); border-radius: 12px; font-size: 14px; color: var(--cream-dim); }
.paid strong { color: var(--cream); }

.download { padding: 0 20px 24px; }
.download a {
  display: block;
  padding: 14px 16px;
  border-radius: 12px;
  background: linear-gradient(100deg, var(--flame-gold) 0%, var(--flame-orange) 52%, var(--flame-red) 100%);
  color: #1a1208;
  font-family: var(--font-display);
  font-size: 17px;
  text-align: center;
  text-decoration: none;
  -webkit-tap-highlight-color: transparent;
}

footer { max-width: 30rem; margin: 18px auto 0; text-align: center; color: rgb(245 228 199 / 0.42); font-size: 12.5px; line-height: 1.6; }
footer a { color: inherit; }

/* Wide enough to be a tablet: the sheet stays a sheet rather than stretching. */
@media (min-width: 720px) { body { padding-top: 44px; } }

/*
  Printing the page directly.

  The Download control is the intended path -- an ordinary navigation to a real
  PDF, which is the only download that behaves inside WhatsApp's in-app browser.
  But somebody with the page open may simply reach for Print, and there is no
  reason for that to produce an A4 sheet with a browser header on it. So the same
  80 mm roll the generated PDF uses is declared here, the download control and
  the footer drop out, and the ink-heavy canvas inverts to something a printer
  will not empty a cartridge over.
*/
@page { size: 80mm auto; margin: 0; }

@media print {
  :root { color-scheme: light; }
  body { padding: 6mm 5mm; background: #fff; color: #000; }
  .sheet { max-width: none; border: 0; border-radius: 0; background: #fff; }
  .crest, .row, .totals, .totals .grand { border-color: #bbb; }
  .crest .outlet, .row .name, .totals .grand .name, .totals .grand .amount { color: #000; }
  .crest .when, .row .sub, .totals .row .name { color: #444; }
  .crest .bill-no { color: #444; border-color: #bbb; }
  .row.give .amount { color: #000; }
  .paid { color: #000; border-color: #bbb; }
  .cancelled { background: #fff; color: #000; border-bottom: 1px solid #000; }
  .cancelled span { color: #444; }
  .download, footer { display: none; }
}
`

/** One row of the bill: a name, a subtext, an amount. */
function row(entry: ContentAmount, extraClass = ''): string {
  return `
        <li class="row${extraClass ? ` ${extraClass}` : ''}">
          <span class="what">
            <span class="name">${escapeHtml(entry.label)}</span>
            ${entry.detail ? `<span class="sub">${escapeHtml(entry.detail)}</span>` : ''}
          </span>
          <span class="amount">${escapeHtml(entry.amount)}</span>
        </li>`
}

export function renderReceiptPage(receipt: Receipt, token: string): string {
  const content = receiptContent(receipt)

  const lines = content.lines.map((line) => row(line)).join('')
  const subtotalRow = content.subtotal ? row(content.subtotal) : ''
  const adjustments = content.adjustments
    .map((entry) => row(entry, entry.giveaway ? 'give' : ''))
    .join('')

  const cancelledBanner = content.cancelled
    ? `<p class="cancelled">${escapeHtml(content.cancelled.label)}${
        content.cancelled.reason ? `<span>${escapeHtml(content.cancelled.reason)}</span>` : ''
      }</p>`
    : ''

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Your receipt · Shawarmania</title>

<!--
  The preview card a chat app builds is deliberately generic: the logo and "Your
  receipt", with no amount, no item and no bill number. A card carrying the
  contents would spill them into every group a link is forwarded to before
  anybody opened it.
-->
<meta property="og:title" content="Your receipt">
<meta property="og:site_name" content="Shawarmania">
<meta property="og:description" content="Your Shawarmania receipt.">
<meta property="og:image" content="/bill/logo.png">
<meta name="twitter:card" content="summary">
<meta name="robots" content="noindex, nofollow">

<link rel="icon" href="/favicon.ico">
<style>${css(FACES)}${css(STYLES)}</style>
</head>
<body>
<main class="sheet">
  <header class="crest">
    <img src="/bill/logo.png" alt="Shawarmania" width="108">
    <p class="outlet">${escapeHtml(content.outletName)}</p>
    <p class="when">${escapeHtml(content.when)}</p>
    <span class="bill-no">${escapeHtml(content.billLabel)}</span>
  </header>

  ${cancelledBanner}

  <ul class="rows">${lines}</ul>

  <div class="totals">
    <ul style="list-style:none;margin:0;padding:0">
      ${subtotalRow}${adjustments}
      <li class="row grand">
        <span class="what"><span class="name">${escapeHtml(content.total.label)}</span></span>
        <span class="amount">${escapeHtml(content.total.amount)}</span>
      </li>
    </ul>
  </div>

  <p class="paid">${escapeHtml(content.tender)}</p>

  <div class="download">
    <a href="/bill/${encodeURIComponent(token)}.pdf" download>Download PDF</a>
  </div>
</main>

<footer>
  <p>${content.notes.map(escapeHtml).join('<br>')}</p>
</footer>
</body>
</html>`
}

/**
 * One refusal, for every reason.
 *
 * Unknown, malformed, revoked and switched-off all land here, in the same words
 * and with the same status, so a caller learns nothing about which case occurred
 * and nothing about whether any bill exists. Rate-limited requests get it too.
 */
export function renderRefusal(): string {
  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Receipt not available · Shawarmania</title>
<meta name="robots" content="noindex, nofollow">
<link rel="icon" href="/favicon.ico">
<style>${css(FACES)}${css(STYLES)}
.sheet { padding: 34px 24px; text-align: center; }
.sheet img { width: 96px; height: auto; margin: 0 auto 18px; display: block; }
.sheet h1 { font-family: var(--font-display); font-size: 24px; margin: 0 0 10px; font-weight: 400; }
.sheet p { margin: 0; color: var(--cream-dim); }
</style>
</head>
<body>
<main class="sheet">
  <img src="/bill/logo.png" alt="Shawarmania" width="96">
  <h1>This receipt is not available</h1>
  <p>The link may be incomplete, or it may have been turned off. Please ask the outlet for a new one.</p>
</main>
<footer><p>Shawarmania · Kalyani</p></footer>
</body>
</html>`
}
