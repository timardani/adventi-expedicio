"""Közös levél-betöltő és -elhelyező (a design-prototipus/szkriptek/jlib.py továbbfejlesztése).

Különbség a prototípushoz képest:
- a forrásmappa paraméterezhető (alapból design-prototipus/kivagott-levelek),
- a `put` csak az érintett téglalapot komponálja (nem a teljes vásznat), így hosszú
  ösvényképeknél is gyors.
"""
import os, random, math
from PIL import Image, ImageFilter, ImageOps, ImageEnhance, ImageChops, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
J = os.environ.get('LEVEL_FORRAS', os.path.join(ROOT, 'design-prototipus', 'kivagott-levelek')) + '/'
G = J + 'g/'


def L(p):
    return Image.open(p).convert('RGBA')


def trim(im):
    return im.crop(im.getbbox())


vine = L(J + 'vine.png')
ficus = L(G + 'ficus-tineke-17cm-1.png')
ficus = trim(ficus.crop((0, 0, ficus.width, int(ficus.height * .74))))
SRC = {
    'aloc': L(J + 'aloc.png'), 'dragon': L(J + 'dragon.png'),
    'anth': L(G + 'anthurium-brielle-12cm-1.png'), 'hoya': L(G + 'hoya-kerrii-12cm.png'),
    'ficus': ficus, 'mint': L(J + 'scind.png'), 'monst': L(G + 'monstera-electro-light-8cm-2.png'),
    'vine': vine, 'leaf': trim(L(J + 'leaf.png')),
    'strandL': trim(vine.crop((0, 110, 380, 606))), 'strandR': trim(vine.crop((580, 140, 940, 606))),
}
SAT = {'anth': .6, 'hoya': .85, 'mint': .8, 'monst': .75, 'dragon': .55}


def prep(k, scale, rot=0, flip=False, vflip=False, dim=.8, blur=0, tint=(205, 232, 200)):
    im = SRC[k]
    im = im.resize((max(1, int(im.width * scale)), max(1, int(im.height * scale))), Image.LANCZOS)
    if SAT.get(k):
        im = Image.merge('RGBA', (*ImageEnhance.Color(im.convert('RGB')).enhance(SAT[k]).split(), im.split()[3]))
    if flip:
        im = ImageOps.mirror(im)
    if vflip:
        im = ImageOps.flip(im)
    if rot:
        im = im.rotate(rot, expand=True, resample=Image.BICUBIC)
    r, g, b, a = im.split()
    rgb = ImageEnhance.Contrast(Image.merge('RGB', (r, g, b))).enhance(1.25)
    rgb = ImageEnhance.Brightness(rgb).enhance(dim)
    rgb = ImageChops.multiply(rgb, Image.new('RGB', rgb.size, tint))
    im = Image.merge('RGBA', (*rgb.split(), a))
    return im.filter(ImageFilter.GaussianBlur(blur)) if blur else im


def put(layer, im, cx, cy, anchor='c'):
    x = int(cx - im.width / 2)
    y = int(cy - im.height / 2) if anchor == 'c' else (int(cy) if anchor == 't' else int(cy - im.height))
    # csak a vászonba eső részt komponáljuk
    sx0, sy0 = max(0, -x), max(0, -y)
    dx0, dy0 = max(0, x), max(0, y)
    w = min(im.width - sx0, layer.width - dx0)
    h = min(im.height - sy0, layer.height - dy0)
    if w <= 0 or h <= 0:
        return
    layer.alpha_composite(im.crop((sx0, sy0, sx0 + w, sy0 + h)), (dx0, dy0))


def coverage(layer):
    a = layer.split()[3].point(lambda v: 255 if v > 40 else 0)
    return sum(a.histogram()[255:]) / (layer.width * layer.height)
