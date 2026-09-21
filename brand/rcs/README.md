# RCS agent branding

The two images the RCS bot registration (Telinfy / GreenAds Global) asks for, and the script that
makes them. **Nothing here is part of the site build** — `brand/` is not a Vite entry, is not in
`public/`, and never enters `dist/`.

```bash
python brand/rcs/make-assets.py
```

Regenerate after any change to the logo, the palette in `src/styles/tokens.css`, or the brand name.
The script asserts both size caps and exits non-zero if either is breached.

## What to upload

| Field | File | Spec |
|---|---|---|
| **Choose Logo** | `logo-224.png` | 224×224, 25.6 kB of a 90 kB cap |
| **Choose Banner** | `banner-1440x448.jpg` | 1440×448, 38.4 kB of a 300 kB cap |

Telinfy warns that re-uploading after approval can take **up to 15 days** on the operator's side, so
these are worth looking at properly before submitting. `preview-card.jpg` is the thing to look at —
it composites both the way the profile card actually shows them.

## The two facts the specs don't tell you

Both drove the design more than the pixel dimensions did.

1. **The logo is cropped to a circle.** A circle inscribed in 224 px has radius 112, so artwork
   filling the square loses its corners. The mark is inset to 168 px, which keeps the flame tip and
   both ends of the roll inside the crop — `preview-logo-circle.png` is that check.
2. **The logo is dropped over the banner's bottom centre**, straddling the edge, covering roughly the
   lower 150 px of the banner's middle. Anything below y≈290 in the banner is going to be eaten, so
   the wordmark sits high and the bottom centre is deliberately just glow.

## Decisions

**The logo is `public/favicon.png`, not a new drawing.** It is already the brand mark on the brand
canvas at 512 px, and its backdrop is already exactly `#14100B`, so flattening it fills the rounded
corners with no seam. No transparency, which matters: a transparent logo goes illegible against RCS
dark mode. The wordmark is deliberately *not* in the logo — "Shawarmania" at 224 px inside a circle
is unreadable, and the card prints the name as text right underneath.

**The banner carries no photograph** [owner, 2026-09-21]. Two attempts with `storefront-neon.jpg`
failed the same way: the neon sign's wordmark sits exactly where the logo circle lands, so every crop
that included it got it sliced in half, and a crop tight enough to avoid it put the sign's *own*
flame right beside the logo's flame. A designed banner has no such accident available to it, stays
crisp at any size, and weighs 38 kB.

**The wordmark is the real artwork, lifted out of `src/assets/brand/logo.png`.** It is cropped from
rows 100–156 of that file — the upper swoosh, the word, the lower swoosh — and scaled up to 720 px,
alpha and all, so its cream glow composites over the ember field instead of sitting on a box.

This was reconstructed in Lilita One first, and that was wrong. Setting the word in the brand's
display face produced something crisp that was *not the logo*, in three ways:

| | the logo | the reconstruction |
|---|---|---|
| the two bars | shallow **curves** — lenses, thin at the ends, bowing away from the word | straight rules |
| the gradient | **vertical**: cream at each letter's top, down to red at its baseline | `--gradient-flame`, left to right |
| the letterforms | a rounded **italic** with a cream outline | Lilita One, upright, unoutlined |

The owner caught all three. The artwork therefore wins over the sharpness: `logo.png` is 226 px wide,
so this is roughly a 3× upscale and it is visibly soft if you open the 1440 px file and look closely.
That turned out not to matter — the profile card renders the banner at about 420 CSS px, so the asset
is being *downscaled* on every real phone, and at that size it is clean. Being slightly soft and
right beats being crisp and wrong.

A gentle unsharp mask (radius 2.2, 85%) recovers some edge definition. Pushed harder it rings around
the letters' cream outline and the glow starts to read as a halo artifact.

**The ember field is dim and low.** A brighter one was tried first and it cost the wordmark its
legibility: the lockup is filled with the same gold→orange→red gradient, so over a warm background
its middle letters — "warm", of all things — sank into the glow behind them. The canvas staying
near-black is what lets the gradient read.

## The other files

| File | |
|---|---|
| `preview-card.jpg` | banner + logo circle + the white sheet below, as the profile card lays them out |
| `preview-logo-circle.png` | the logo under its circular crop, on white |
| `banner-1440x448-plain.jpg` | no wordmark — the ember field alone, if the card's own name text is felt to be enough |
| `banner-1440x448-ribbed.jpg` | the wrap-line texture from the mark's shawarma, at 5% |
| `preview-card-plain.jpg`, `preview-card-ribbed.jpg` | those two, in the card |

The ribbed variant reads as diagonal streaks at phone size and was not chosen; it is kept because it
is one flag away and the judgement could go the other way on a real handset.
