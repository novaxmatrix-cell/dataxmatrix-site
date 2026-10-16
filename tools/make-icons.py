"""Regenerate site icons from the full-size logo. Run: python3 tools/make-icons.py
Needs Pillow. The Open Graph card is rendered separately (see design/og-image.html)."""
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / 'design/iris-logo-986.png'
IMG = ROOT / 'src/assets/img'
BG = (247, 246, 242, 255)  # site background --bg

logo = Image.open(SRC).convert('RGBA')

def fit(im, size):
    return im.resize((size, size), Image.LANCZOS)

# Header logo (shown at 36px; 96px covers high-DPI screens).
fit(logo, 96).save(IMG / 'logo.png', optimize=True)

# Small icons use the centre (the iris) so they stay readable in a browser tab.
w = logo.width
c = int(w * 0.62)
o = (w - c) // 2
inner = fit(logo.crop((o, o, o + c, o + c)), 256)
mask = Image.new('L', inner.size, 0)
ImageDraw.Draw(mask).ellipse((0, 0, inner.width - 1, inner.height - 1), fill=255)
inner.putalpha(Image.composite(inner.getchannel('A'), mask, mask))
inner.save(ROOT / 'src/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
fit(inner, 32).save(IMG / 'favicon-32.png', optimize=True)

# Phone home-screen icon: full emblem on the site background (iOS ignores transparency).
touch = Image.new('RGBA', (180, 180), BG)
emblem = fit(logo, 160)
touch.paste(emblem, (10, 10), emblem)
touch.convert('RGB').save(IMG / 'apple-touch-icon.png', optimize=True)

print('icons written')
