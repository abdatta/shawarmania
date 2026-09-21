"""
The RCS agent's logo and banner, generated rather than hand-pushed in an editor.

Telinfy / Google's RCS profile wants a **224x224 logo** (<=90 KB) and a
**1440x448 banner** (<=300 KB), and the profile card lays them out in a
particular way that the specs do not mention: the logo is cropped to a circle,
and it is dropped over the banner's bottom centre, straddling the edge. Both
facts drive everything here.

    python brand/rcs/make-assets.py

Outputs beside this file. Nothing here is part of the site build -- `brand/` is
not a Vite entry, is not in `public/`, and never enters `dist/`.

**The logo is the existing favicon, not a new drawing.** `public/favicon.png` is
already the brand mark on the brand canvas at 512px, and its backdrop is exactly
`#14100B`, so flattening it loses nothing and the rounded corners fill in
seamlessly. The wordmark is deliberately absent: "Shawarmania" at 224px inside a
circle is unreadable, and the profile card prints the name in text directly
underneath anyway.

**The banner carries no photograph** [owner, 2026-09-21]. Two attempts with the
neon storefront shot failed for the same reason: the sign's wordmark sits exactly
where the logo circle lands, so every crop that included it got it sliced in
half, and a crop tight enough to avoid it put the sign's *own* flame next to the
logo's flame. What it carries instead is a designed ember field plus the brand's
own wordmark lockup, cropped out of the logo file -- see `_wordmark_lockup`,
which records why that is the artwork rather than type set in Lilita One.

The previews are the point of this script as much as the assets are: the card
composites the two images in a way neither spec mentions, and `preview-card.jpg`
is the only way to see it before uploading -- which Telinfy warns can take up to
15 days to redo once the agent is approved.
"""
import os
from PIL import Image, ImageDraw, ImageFilter

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.abspath(os.path.join(HERE, "..", ".."))

# Straight from src/styles/tokens.css.
BG = (20, 16, 11)        # --bg
GOLD = (255, 197, 61)    # --flame-gold
ORANGE = (249, 115, 22)  # --flame-orange
RED = (220, 38, 38)      # --flame-red
CREAM = (245, 228, 199)  # --cream

W, H = 1440, 448


# --------------------------------------------------------------- the logo
def make_logo(art_px=168):
    """The mark, inset so a circular crop cannot clip it.

    A circle inscribed in 224px has radius 112, so artwork in a centred square
    of side S keeps its corners inside the circle only while S/2*sqrt(2) <= 112,
    i.e. S <= 158. The mark's ink stops short of its own bounding box, so 168
    clears the circle with room, and the flame tip and both ends of the roll
    survive -- which `preview-logo-circle.png` is the check on.
    """
    src = Image.open(os.path.join(REPO, "public/favicon.png")).convert("RGBA")
    flat = Image.new("RGB", src.size, BG)
    flat.paste(src, (0, 0), src)

    art = flat.resize((art_px, art_px), Image.LANCZOS)
    canvas = Image.new("RGB", (224, 224), BG)
    off = (224 - art_px) // 2
    canvas.paste(art, (off, off))
    return canvas


# ------------------------------------------------------------- the banner
def _ember(intensity=0.30, lift=0.34):
    """Brand canvas with an ember glow blooming from below the bottom centre.

    The glow's origin sits *under* the frame (`lift`) so the hot core is hidden
    behind the logo circle and only the falloff is visible. That is what keeps
    it reading as embers behind a mark rather than as a sunrise.

    Dim, and low. A brighter field was tried first and it cost the wordmark its
    legibility: the lockup is filled with the same gold-orange-red gradient, so
    over a warm background its middle letters -- "warm", of all things -- sank
    into the glow behind them. The canvas staying near-black is what lets the
    gradient read.
    """
    glow = Image.new("RGB", (W, H), BG)
    gd = ImageDraw.Draw(glow)
    cy = H + int(H * lift)
    for i, col in enumerate([RED, ORANGE, GOLD]):
        r = 560 - i * 165
        gd.ellipse((W // 2 - r, cy - r, W // 2 + r, cy + r), fill=col)
    glow = glow.filter(ImageFilter.GaussianBlur(130))
    return Image.blend(Image.new("RGB", (W, H), BG), glow, intensity)


def _vignette(img):
    """Corners back to canvas, so the strip reads as a designed band and not as
    a crop of something larger."""
    vig = Image.new("L", (W, H), 0)
    ImageDraw.Draw(vig).ellipse((-360, -440, W + 360, H + 440), fill=255)
    return Image.composite(img, Image.new("RGB", (W, H), BG), vig.filter(ImageFilter.GaussianBlur(120)))


def _ribs(base):
    """The roll's wrap lines, echoed as texture.

    Held at 5% -- at 10% they stopped being texture and started looking like a
    moire artifact on a phone.
    """
    rib = Image.new("L", (W, H), 0)
    rd = ImageDraw.Draw(rib)
    for x in range(-H, W + H, 64):
        rd.line([(x, H), (x + H, 0)], fill=255, width=14)
    rib = rib.filter(ImageFilter.GaussianBlur(4)).point(lambda v: int(v * 0.05))
    return Image.composite(Image.new("RGB", (W, H), CREAM), base, rib)


# The lockup's rows inside src/assets/brand/logo.png, found from the file's own
# alpha profile: the mark occupies y 4..98, then the upper swoosh sits at
# y 106..109, the word at y 112..140, and the lower swoosh at y 144..152.
LOCKUP_BOX = (0, 100, 226, 156)


def _wordmark_lockup(target_w=720, sharpen=True):
    """The real lockup, lifted straight out of the logo file.

    **This was reconstructed in Lilita One first, and that was wrong.** Setting
    the word in the brand's display face produced something crisp that was not
    the logo: the logo's two bars are *curved* -- shallow lenses, thin at the
    ends, bowing away from the word -- where drawn rules are straight; the
    logo's gradient runs *vertically*, cream at each letter's top down to red at
    its baseline, where `--gradient-flame` runs left to right; and the logo's
    letterforms are a rounded italic with a cream outline, where Lilita One is
    upright and unoutlined. Three differences, and the owner caught all of them.

    So the artwork wins over the sharpness. `logo.png` is 226 px wide, which
    makes this roughly a 3x upscale, and it is visibly soft at full size -- but
    the source is a soft, glowing raster to begin with, and being slightly soft
    and *right* beats being crisp and wrong. The alpha channel comes along, so
    the glow composites over the ember field instead of sitting on a box.
    """
    src = Image.open(os.path.join(REPO, "src/assets/brand/logo.png")).convert("RGBA")
    lock = src.crop(LOCKUP_BOX)

    scale = target_w / lock.width
    layer = lock.resize((target_w, round(lock.height * scale)), Image.LANCZOS)

    if sharpen:
        # Recovers some edge definition the upscale costs. Gentle on purpose:
        # pushed harder it rings around the letters' cream outline and the glow
        # starts to look like a halo artifact.
        layer = layer.filter(ImageFilter.UnsharpMask(radius=2.2, percent=85, threshold=3))
    return layer


def make_banner(ribs=False, wordmark=True):
    """The ember field, the wrap texture, and the wordmark lockup.

    The lockup sits high in the frame on purpose: the profile card drops the
    logo circle over the bottom centre, covering roughly the lower 150px of the
    banner at its middle, so anything below y=290 is going to be eaten.
    """
    base = _ember()
    if ribs:
        base = _ribs(base)
    base = _vignette(base)

    if not wordmark:
        return base

    lock = _wordmark_lockup()
    # High in the frame, clear of the logo circle's ring at ~y=290.
    pos = ((W - lock.width) // 2, 74)

    # A faint bloom behind the word so it sits in the field rather than on top
    # of it. Kept light: the artwork carries its own cream glow in its alpha,
    # and doubling it turned the lockup into a smear.
    halo = Image.new("RGBA", (W, H))
    halo.paste(lock, pos, lock)
    halo = halo.filter(ImageFilter.GaussianBlur(30))
    base = Image.alpha_composite(base.convert("RGBA"), Image.blend(
        Image.new("RGBA", (W, H)), halo, 0.28))

    out = base.copy()
    out.paste(lock, pos, lock)
    return out.convert("RGB")


# ------------------------------------------------------------- previews
def circle_preview(logo):
    """The logo as the card shows it: circular crop, on white."""
    w, h = logo.size
    card = Image.new("RGB", (w + 40, h + 40), (255, 255, 255))
    mask = Image.new("L", (w, h), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, w - 1, h - 1), fill=255)
    card.paste(logo, (20, 20), mask)
    return card


def card_preview(banner, logo, d=300):
    """Banner plus the logo circle where the card puts it, over the white sheet
    -- the only way to see what the overlap actually costs."""
    card = Image.new("RGB", (W, H + 220), (255, 255, 255))
    card.paste(banner, (0, 0))

    art = logo.resize((d, d), Image.LANCZOS)
    mask = Image.new("L", (d, d), 0)
    ImageDraw.Draw(mask).ellipse((0, 0, d - 1, d - 1), fill=255)
    pos = ((W - d) // 2, H - d // 2)

    ring = Image.new("L", (d + 16, d + 16), 0)
    ImageDraw.Draw(ring).ellipse((0, 0, d + 15, d + 15), fill=255)
    card.paste(Image.new("RGB", (d + 16, d + 16), (255, 255, 255)), (pos[0] - 8, pos[1] - 8), ring)
    card.paste(art, pos, mask)
    return card


LIMITS = {
    "logo-224.png": 90,
    "banner-1440x448.jpg": 300,
    "banner-1440x448-plain.jpg": 300,
    "banner-1440x448-ribbed.jpg": 300,
}


def main():
    logo = make_logo()
    logo.save(os.path.join(HERE, "logo-224.png"), optimize=True)

    make_banner().save(os.path.join(HERE, "banner-1440x448.jpg"), quality=92, optimize=True)
    make_banner(wordmark=False).save(
        os.path.join(HERE, "banner-1440x448-plain.jpg"), quality=92, optimize=True)
    make_banner(ribs=True).save(
        os.path.join(HERE, "banner-1440x448-ribbed.jpg"), quality=92, optimize=True)

    circle_preview(logo).save(os.path.join(HERE, "preview-logo-circle.png"))
    card_preview(make_banner(), logo).save(os.path.join(HERE, "preview-card.jpg"), quality=88)
    card_preview(make_banner(wordmark=False), logo).save(
        os.path.join(HERE, "preview-card-plain.jpg"), quality=88)
    card_preview(make_banner(ribs=True), logo).save(
        os.path.join(HERE, "preview-card-ribbed.jpg"), quality=88)

    ok = True
    for name in sorted(os.listdir(HERE)):
        if not name.lower().endswith((".png", ".jpg")):
            continue
        path = os.path.join(HERE, name)
        kb = os.path.getsize(path) / 1024
        im = Image.open(path)
        cap = LIMITS.get(name)
        verdict = ""
        if cap:
            verdict = "  <= %d KB OK" % cap if kb <= cap else "  OVER %d KB LIMIT" % cap
            ok = ok and kb <= cap
        print("%-30s %4dx%-4d %6.1f KB%s" % (name, im.size[0], im.size[1], kb, verdict))
    raise SystemExit(0 if ok else 1)


if __name__ == "__main__":
    main()
