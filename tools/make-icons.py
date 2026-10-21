"""Regenerate site icons. Run: python3 tools/make-icons.py
The Iris logo (logo.png) comes from design/iris-logo-986.png. The favicons and the phone icon are the
DataX Matrix mark (design/marks/datax-favicon.svg; the published copy is src/assets/img/favicon.svg).
Needs Pillow and Inkscape. The Open Graph card is rendered separately (see design/og-image.html)."""
import re
import subprocess
import tempfile
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

# Favicons and phone icon: the DataX Matrix mark, rendered from its SVG.
MARK = ROOT / 'design/marks/datax-favicon.svg'
tmp = Path(tempfile.mkdtemp())

def render(svg_text, size, name):
    src = tmp / f'{name}.svg'
    src.write_text(svg_text)
    out = tmp / f'{name}-{size}.png'
    subprocess.run(['inkscape', str(src), '--export-type=png', f'--export-filename={out}', '-w', str(size), '-h', str(size)],
                   check=True, capture_output=True)
    return Image.open(out).convert('RGBA')

mark = re.sub(r'<metadata>.*?</metadata>', '', MARK.read_text(), flags=re.S)
render(mark, 256, 'favicon').save(ROOT / 'src/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48)])
render(mark, 32, 'favicon').save(IMG / 'favicon-32.png', optimize=True)

# Phone home-screen icon: the dark tile edge to edge (iOS rounds the corners and ignores transparency).
render(mark.replace('rx="22"', 'rx="0"'), 180, 'touch').convert('RGB').save(IMG / 'apple-touch-icon.png', optimize=True)

print('icons written')
