# Placeholder mark for Argent, the native DEX on LitVM. No real logo exists yet: replace public/assets/logos/argent.png when it does.
# Argent = silver. Drawn by hand as flat polygons, in two silvers, like the other flat marks in the crystals.
#   python work/argent_logo.py            writes the chosen mark
#   python work/argent_logo.py <folder>   also writes every candidate on the vault colour for comparing
import os, sys
from PIL import Image, ImageDraw
SS = 4; C = 1024
LIGHT = (236, 239, 244, 255); DARK = (178, 188, 204, 255)

def render(shapes):
    im = Image.new('RGBA', (C * SS, C * SS), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    for col, pts in shapes: d.polygon([(x * SS, y * SS) for x, y in pts], fill=col)
    return im.resize((C, C), Image.LANCZOS)

def trim(im, pad=.06):
    x0, y0, x1, y1 = im.getbbox(); side = int(max(x1 - x0, y1 - y0) * (1 + pad * 2))
    o = Image.new('RGBA', (side, side), (0, 0, 0, 0)); o.paste(im.crop((x0, y0, x1, y1)), ((side - x1 + x0) // 2, (side - y1 + y0) // 2))
    return o.resize((768, 768), Image.LANCZOS)

# two legs of an A, one rising and one falling, offset like the two sides of a trade
# every edge runs at the same slope (0.4) and the gap between the legs is constant, so it stays clean at crystal size
split = [(LIGHT, [(60, 860), (340, 860), (668, 40), (388, 40)]),
         (DARK,  [(684, 984), (964, 984), (650.2, 199.5), (510.2, 549.5)])]
# the same legs with a crossbar that is the token passing between them
token = [(LIGHT, [(80, 930), (290, 930), (512, 400), (512, 90), (440, 90)]),
         (DARK,  [(734, 930), (944, 930), (584, 90), (512, 90), (512, 400)]),
         (LIGHT, [(512, 560), (592, 650), (512, 740), (432, 650)])]
# an A cut out of a hexagonal coin: silver, and the shape of the page's panel
hexa = [(LIGHT, [(512, 40), (920, 276), (512, 512)]), (LIGHT, [(512, 40), (104, 276), (512, 512)]),
        (LIGHT, [(104, 276), (104, 748), (512, 512)]), (DARK, [(920, 276), (920, 748), (512, 512)]),
        (DARK, [(104, 748), (512, 984), (512, 512)]), (DARK, [(920, 748), (512, 984), (512, 512)])]
CANDIDATES = {'split': split, 'token': token, 'hex': hexa}
CHOSEN = 'split'

trim(render(CANDIDATES[CHOSEN])).save('public/assets/logos/argent.png')
if len(sys.argv) > 1:
    for n, s in CANDIDATES.items():
        bg = Image.new('RGBA', (768, 768), (10, 10, 14, 255)); m = trim(render(s)); bg.alpha_composite(m); bg.convert('RGB').save(os.path.join(sys.argv[1], f'argent-{n}.png'))
    sheet = Image.new('RGB', (768 * 3, 768))
    for i, n in enumerate(CANDIDATES): sheet.paste(Image.open(os.path.join(sys.argv[1], f'argent-{n}.png')), (768 * i, 0))
    sheet.resize((1152, 384), Image.LANCZOS).save(os.path.join(sys.argv[1], 'argent-sheet.png'))
