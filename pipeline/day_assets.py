"""Napi képek az ügyfél termékfotóiból (clients/<bolt>/napok.json alapján).

    web/public/assets/days/clearing-NN.webp   tisztás: az aznapi növény napfényben, levelekkel keretezve.
                                              Az alsó ~45% sötét: ott áll a mai ajándék szövege és kódja.
    web/public/assets/days/station-NN.webp    kerek állomáskép az ösvényre (a növényre vágva)

Futtatás:  pipeline/.venv/bin/python pipeline/day_assets.py [bolt] [nap ...]
           (alapból: moai-jungle, mind a 24 nap)
"""
import json, os, random, sys
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
from jlib import prep, put, ROOT

W, H = 780, 1688
POOL = ['leaf', 'aloc', 'monst', 'ficus', 'mint', 'hoya', 'aloc', 'leaf', 'anth', 'mint']
FOCUS_Y = 0.27          # a növény közepe a képernyő magasságának ennyiedénél
PLANT_W = 520           # a növény célmérete a 780 px széles képen
STATION = 360           # állomáskép mérete (a 180 px-es mai kör 2× felbontásban)


def vgrad(y0, y1, alpha):
    """Függőleges átmenet: y0 alatt 0, y1 alatt `alpha` (0–1) erősségű."""
    m = Image.new('L', (W, H), 0); d = ImageDraw.Draw(m)
    for y in range(H):
        t = min(1, max(0, (y - H * y0) / (H * (y1 - y0))))
        d.line((0, y, W, y), fill=int(255 * alpha * t))
    return m


def clearing(photo, focus, seed):
    cx, cy, size = focus
    sc = min(2.0, max(1.1, PLANT_W / size))
    ph = photo.resize((int(photo.width * sc), int(photo.height * sc)), Image.LANCZOS)
    ox, oy = int(W / 2 - cx * sc), int(H * FOCUS_Y - cy * sc)

    bg = Image.new('RGBA', (W, H), (30, 22, 10, 255))
    bg.paste(photo.resize((W, H)).filter(ImageFilter.GaussianBlur(40)), (0, 0))
    # a fotó széleit lágyan beleolvasztjuk a háttérbe
    edge = Image.new('L', ph.size, 0)
    ImageDraw.Draw(edge).rectangle((30, 30, ph.width - 30, ph.height - 30), fill=255)
    edge = edge.filter(ImageFilter.GaussianBlur(28))
    bg.paste(ph, (ox, oy), edge)

    dark = Image.new('RGBA', (W, H), (6, 12, 8, 255))
    dark.putalpha(vgrad(.36, .60, .94)); bg.alpha_composite(dark)

    rays = Image.new('L', (W, H), 0); rd = ImageDraw.Draw(rays)
    for x0, w, a in ((300, 80, 110), (420, 40, 80), (220, 34, 60), (520, 60, 70)):
        rd.polygon([(x0, -20), (x0 + w, -20), (x0 + w * 2.2 + 160, H * .7), (x0 + w + 90, H * .7)], fill=a)
    rays = rays.filter(ImageFilter.GaussianBlur(30))
    ray = Image.new('RGBA', (W, H), (255, 232, 170, 255)); ray.putalpha(rays.point(lambda v: int(v * .45)))
    bg.alpha_composite(ray)

    random.seed(seed); R = random.uniform
    frame = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for _ in range(18):
        k = random.choice(POOL); left = random.random() < .5
        # a középső sávot (a növényt) szabadon hagyjuk
        x = R(-200, -40) if left else R(W + 40, W + 200); y = R(-60, H * .75)
        rot = R(-40, 40) if random.random() < .6 else 180 + R(-35, 35)
        put(frame, prep(k, R(.45, .75) * (1.3 if k == 'leaf' else 1), rot, not left, False, R(.28, .5), R(0, 3)), x, y)
    for _ in range(6):
        k = random.choice(['mint', 'hoya', 'strandL', 'strandR'])
        put(frame, prep(k, R(.5, .8), 180 + R(-20, 20), random.random() < .5, False, R(.25, .4), 2), R(0, W), R(-200, -90), 't')
    bg.alpha_composite(frame)

    vig = Image.new('L', (W, H), 0)
    ImageDraw.Draw(vig).ellipse((-W * .25, -H * .15, W * 1.25, H * 1.05), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(110))
    blk = Image.new('RGBA', (W, H), (4, 8, 6, 255)); blk.putalpha(vig.point(lambda v: int((255 - v) * .8)))
    bg.alpha_composite(blk)
    return bg.convert('RGB')


def station(photo, focus):
    cx, cy, size = focus
    # a fotó köré elmosott, kinyújtott hátteret teszünk, hogy a szélén álló növény is középre kerülhessen
    pad = photo.width // 2
    canvas = photo.resize((photo.width + 2 * pad, photo.height + 2 * pad)).filter(ImageFilter.GaussianBlur(24))
    edge = Image.new('L', photo.size, 0)
    ImageDraw.Draw(edge).rectangle((16, 16, photo.width - 16, photo.height - 16), fill=255)
    canvas.paste(photo, (pad, pad), edge.filter(ImageFilter.GaussianBlur(12)))
    cx, cy = cx + pad, cy + pad
    r = size * 0.6
    box = [int(cx - r), int(cy - r), int(cx + r), int(cy + r)]
    dx = max(0, -box[0]) - max(0, box[2] - canvas.width)
    dy = max(0, -box[1]) - max(0, box[3] - canvas.height)
    box = [box[0] + dx, box[1] + dy, box[2] + dx, box[3] + dy]
    im = canvas.crop(box).resize((STATION, STATION), Image.LANCZOS)
    return ImageEnhance.Contrast(im).enhance(1.06)


def main():
    args = sys.argv[1:]
    shop = args.pop(0) if args and not args[0].isdigit() else 'moai-jungle'
    cdir = os.path.join(ROOT, 'clients', shop)
    cfg = json.load(open(os.path.join(cdir, 'napok.json'), encoding='utf-8'))
    days = [int(a) for a in args] or list(range(1, 25))
    out = os.path.join(ROOT, 'web', 'public', 'assets', 'days'); os.makedirs(out, exist_ok=True)
    for n in days:
        name = cfg['napok'][str(n)]
        photo = Image.open(os.path.join(cdir, 'termekfotok', name + '.webp')).convert('RGB')
        focus = cfg['fotok'][name]['fokusz']
        nn = f'{n:02d}'
        clearing(photo, focus, 1000 + n).save(f'{out}/clearing-{nn}.webp', quality=76, method=6)
        station(photo, focus).save(f'{out}/station-{nn}.webp', quality=78, method=6)
        print(f'nap {n:2d}: {name}  tisztás {os.path.getsize(f"{out}/clearing-{nn}.webp") // 1024} KB, '
              f'állomás {os.path.getsize(f"{out}/station-{nn}.webp") // 1024} KB', flush=True)


if __name__ == '__main__':
    main()
