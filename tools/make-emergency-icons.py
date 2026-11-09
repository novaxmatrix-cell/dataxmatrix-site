"""Icons for the emergency timetable PWA (/ar/emergency/). Run: python3 tools/make-emergency-icons.py
Source: design/iris-logo-986.png (round, transparent corners). Needs Pillow."""
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'src/standalone/ar/emergency'
BLUE = (0x1E, 0x4F, 0xC2, 255)  # manifest theme_color
def small(im):  # 256-colour palette keeps the files light for the first (cached) visit
    return im.quantize(256, method=Image.Quantize.FASTOCTREE, dither=Image.Dither.NONE)

logo = Image.open(ROOT / 'design/iris-logo-986.png').convert('RGBA')

def plain(size):  # "any" purpose: the round logo, transparent corners
    return logo.resize((size, size), Image.LANCZOS)

def on_blue(size, scale):  # logo centred on a solid tile
    tile = Image.new('RGBA', (size, size), BLUE)
    s = round(size * scale)
    tile.alpha_composite(logo.resize((s, s), Image.LANCZOS), ((size - s) // 2, (size - s) // 2))
    return tile

small(plain(192)).save(OUT / 'icon-192.png', optimize=True)
small(plain(512)).save(OUT / 'icon-512.png', optimize=True)
# Maskable: the logo circle fits the 80% safe zone.
small(on_blue(192, 0.78)).save(OUT / 'icon-maskable-192.png', optimize=True)
small(on_blue(512, 0.78)).save(OUT / 'icon-maskable-512.png', optimize=True)
# iOS home screen: no transparency, corners rounded by the OS.
small(on_blue(180, 0.9)).save(OUT / 'apple-touch-icon.png', optimize=True)
