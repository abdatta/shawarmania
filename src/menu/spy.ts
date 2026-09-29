/**
 * Scroll-spy for the /menu/ section chips.
 *
 * - One highlight pill slides (and resizes) from chip to chip, rather than
 *   chips switching colour in place.
 * - The chip strip glides sideways to keep the highlighted chip centred.
 * - Tapping a chip glides the page to that section. While that glide runs the
 *   highlight goes straight to the tapped chip and stays there, instead of
 *   ticking through every section the page passes on the way.
 *
 * Pure enhancement: without this script the chips are still plain in-page
 * links and the whole menu is still in the HTML. With reduced motion asked for,
 * everything moves instantly.
 */
const nav = document.querySelector<HTMLElement>('.chips')
const strip = nav?.querySelector<HTMLElement>('ul')
const chips = [...(nav?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]') ?? [])]
const sections = chips
  .map((a) => document.getElementById(a.hash.slice(1)))
  .filter((s): s is HTMLElement => s !== null)

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
const behavior = (): ScrollBehavior => (reduceMotion.matches ? 'auto' : 'smooth')

// The sliding pill. It lives inside the strip, so it scrolls with the chips.
const pill = document.createElement('li')
pill.className = 'chip-pill'
pill.setAttribute('aria-hidden', 'true')
strip?.prepend(pill)

let current = -1

function placePill() {
  const chip = chips[current]
  if (!chip) return
  // offsetLeft is relative to the strip (it is the positioned ancestor) and
  // ignores its scroll, which is exactly the frame the pill lives in.
  pill.style.width = `${chip.offsetWidth}px`
  pill.style.transform = `translateX(${chip.offsetLeft}px)`
}

function activate(index: number) {
  if (index === current || !strip) return
  current = index
  chips.forEach((a, i) => {
    if (i === index) a.setAttribute('aria-current', 'location')
    else a.removeAttribute('aria-current')
  })
  placePill()

  // Centre the chip inside the strip. Not scrollIntoView(): that would also
  // scroll the page vertically, fighting the reader's own scrolling.
  const chip = chips[index]
  const left = chip.offsetLeft - (strip.clientWidth - chip.offsetWidth) / 2
  strip.scrollTo({ left, behavior: behavior() })
}

/* -- which section is being read ----------------------------------------- */

// Set while a chip-tap glide is running; the spy leaves the highlight alone.
let locked = false
let unlockTimer = 0

function unlockSoon() {
  // Unlock once scrolling has been quiet for a moment. `scrollend` would say
  // this directly, but older Safari does not fire it; silence works everywhere.
  clearTimeout(unlockTimer)
  unlockTimer = window.setTimeout(() => {
    locked = false
    update()
  }, 160)
}

function update() {
  if (!nav || !sections.length || locked) return
  // The reading line is just under the sticky strip.
  const line = nav.getBoundingClientRect().bottom + 24
  let index = 0
  for (let i = 0; i < sections.length; i++) {
    if (sections[i].getBoundingClientRect().top <= line) index = i
    else break
  }
  // At the very bottom a short last section can never reach the line; the
  // reader is plainly looking at it.
  const atBottom =
    window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4
  if (atBottom) index = sections.length - 1
  activate(index)
}

let queued = false
function onScroll() {
  if (locked) unlockSoon()
  if (queued) return
  queued = true
  requestAnimationFrame(() => {
    queued = false
    update()
  })
}

chips.forEach((a, i) => {
  a.addEventListener('click', (event) => {
    const section = sections[i]
    if (!section) return
    event.preventDefault()
    activate(i)
    locked = true
    unlockSoon() // in case the page is already there and never scrolls
    // Honours `scroll-padding-top`, so the heading lands under the strip.
    section.scrollIntoView({ behavior: behavior(), block: 'start' })
    // Keep the address shareable without triggering a native jump.
    history.replaceState(null, '', a.hash)
  })
})

window.addEventListener('scroll', onScroll, { passive: true })
window.addEventListener('resize', () => {
  placePill()
  onScroll()
})

// First paint: place the pill with no animation, then let it glide from then on.
update()
void document.fonts.ready.then(placePill) // chip widths change when the font lands
requestAnimationFrame(() => requestAnimationFrame(() => nav?.classList.add('spy-ready')))
