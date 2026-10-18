"""Az ösvény képei napokra bontva (a design-prototipus/szkriptek/trail.py általánosítása).

A prototípus a 7. napra volt „beégetve” (a kitaposott út és a benőtt rész határa fix).
Ez a szkript minden N napra (1–24) külön hátteret, előteret és elrendezést készít:

    web/public/assets/trail/bg-NN.webp      háttér (kitaposott út a mai napig)
    web/public/assets/trail/front-NN.webp   benőtt előtér a jövőbeli jelzőkövek fölött
    web/public/assets/trail/layout-NN.json  állomások koordinátái (CSS px) + oldalmagasság

Futtatás:  pipeline/.venv/bin/python pipeline/trail_days.py [nap ...]
"""
import json, math, os, sys, random
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops
from jlib import SRC, prep, put, coverage, ROOT

OUT = os.path.join(ROOT, 'web', 'public', 'assets', 'trail')
X = 2          # 2× felbontás
WC = 390       # CSS szélesség
DAYS = 24
XS = [112, 272, 124, 262, 118, 256]                     # megtett állomások x-e (váltakozó)
OX = [96, 290, 150, 250, 110, 300, 180, 270, 90, 230, 140, 300, 110, 260, 170, 300, 120]
POOL = ['leaf', 'aloc', 'monst', 'ficus', 'mint', 'hoya', 'aloc', 'anth', 'mint', 'ficus']


def layout(n):
    stops = [[XS[(k - 1) % len(XS)], 300 + (k - 1) * 140] for k in range(1, n)]
    # a 180 px-es mai kör az 1. napon ne lógjon bele a bevezető szövegbe
    today = [195, max(360, 300 + (n - 1) * 140)]
    ty = today[1]
    over = [[OX[i % len(OX)], ty + 310 + i * 76] for i in range(DAYS - n)]
    height = (over[-1][1] + 94) if over else ty + 440
    return {'day': n, 'width': WC, 'height': height, 'stops': stops, 'today': today, 'over': over,
            'denseTextTop': ty + 190}


def cat(p, n=16):
    P = [p[0]] + p + [p[-1]]
    out = []
    for i in range(1, len(P) - 2):
        a, b, c, d = P[i - 1], P[i], P[i + 1], P[i + 2]
        for k in range(n):
            t = k / n; t2 = t * t; t3 = t2 * t
            out.append(tuple(0.5 * ((2 * b[j]) + (-a[j] + c[j]) * t + (2 * a[j] - 5 * b[j] + 4 * c[j] - d[j]) * t2
                                    + (-a[j] + 3 * b[j] - 3 * c[j] + d[j]) * t3) for j in (0, 1)))
    return out


def row_mask(H, fn):
    """Soronkénti 0–255 maszk numpy-val (a prototípus soronkénti rajzolása helyett)."""
    ys = np.arange(H, dtype=np.float32) / X
    col = np.clip(fn(ys), 0, 255).astype(np.uint8)
    return Image.fromarray(np.repeat(col[:, None], WC * X, axis=1))


def deepen(im, today_y):
    d = row_mask(im.height, lambda yy: 255 * (1 - .68 * np.clip((yy - (today_y + 200)) / 1100, 0, 1)))
    r, g, b, a = im.split()
    rgb = ImageChops.multiply(Image.merge('RGB', (r, g, b)), Image.merge('RGB', (d, d, d)))
    return Image.merge('RGBA', (*rgb.split(), a))


def build(n):
    lay = layout(n)
    random.seed(7700 + n)
    R = random.uniform
    HC = lay['height']; W, H = WC * X, HC * X
    stops, today_y = lay['stops'], lay['today'][1]
    path_pts = [(195, 150)] + [tuple(s) for s in stops] + [tuple(lay['today'])] + \
               [(o[0], o[1]) for o in lay['over']] + [(200, HC - 20)]
    path = cat(path_pts)

    bg = Image.new('RGBA', (W, H), (7, 15, 10, 255))

    def glow(cx, cy, rx, ry, col, a, blur):
        m = Image.new('L', (W, H), 0)
        ImageDraw.Draw(m).ellipse(((cx - rx) * X, (cy - ry) * X, (cx + rx) * X, (cy + ry) * X), fill=255)
        m = m.filter(ImageFilter.GaussianBlur(blur * X))
        c = Image.new('RGBA', (W, H), col + (255,))
        c.putalpha(m.point(lambda v: int(v * a)))
        bg.alpha_composite(c)

    glow(195, 40, 260, 200, (255, 200, 110), .35, 60)
    glow(195, today_y, 190, 170, (255, 196, 96), .55, 50)

    # kitaposott út a mai napig
    trail = Image.new('L', (W, H), 0); td = ImageDraw.Draw(trail)
    for (x, y) in path:
        if y > today_y + 40:
            break
        r = 30 + R(-3, 3)
        td.ellipse(((x - r) * X, (y - r) * X, (x + r) * X, (y + r) * X), fill=255)
    trail = trail.filter(ImageFilter.GaussianBlur(10 * X))
    dirt = Image.new('RGBA', (W, H), (74, 56, 34, 255))
    noise = Image.effect_noise((W, H), 40).convert('L')
    dirt = Image.composite(Image.new('RGBA', (W, H), (96, 74, 46, 255)), dirt,
                           noise.point(lambda v: 255 if v > 150 else 0).filter(ImageFilter.GaussianBlur(1.2)))
    dirt.putalpha(trail.point(lambda v: int(v * .75)))
    bg.alpha_composite(dirt)

    # folyosó, ahová nem kerülhet levél
    corr = Image.new('L', (WC, HC), 0); cd = ImageDraw.Draw(corr)
    for (x, y) in path:
        if y > today_y + 30:
            break
        cd.ellipse((x - 50, y - 50, x + 50, y + 50), fill=255)
    cd.ellipse((195 - 110, today_y - 105, 195 + 110, today_y + 105), fill=255)
    cd.rectangle((0, 0, WC, 250), fill=255)

    # a prototípus 5 mintapontja helyett 17: a nagy levelek ne lógjanak bele a kitaposott útba
    OFFS = [(0, 0)] + [(k * math.cos(a * math.pi / 4), k * math.sin(a * math.pi / 4))
                       for k in (.4, .75) for a in range(8)]

    def free(cx, cy, r):
        for ox, oy in OFFS:
            dx, dy = ox * r, oy * r
            x, y = int(cx + dx), int(cy + dy)
            if 0 <= x < WC and 0 <= y < HC and corr.getpixel((x, y)) > 0:
                return False
        return True

    back = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    for _ in range(int(520 * HC / 2760)):
        cx, cy = R(-40, WC + 40), R(200, HC + 40)
        k = random.choice(POOL); s = R(.32, .62) * (1.3 if k == 'leaf' else 1)
        r = max(SRC[k].size) * s / 2 * 0.55
        if cy < today_y + 60 and not free(cx, cy, r):
            continue
        rot = R(-40, 40) if random.random() < .7 else 180 + R(-35, 35)
        put(back, prep(k, s * X, rot, random.random() < .5, False, R(.3, .62), R(0, 1.5)), cx * X, cy * X)
    bg.alpha_composite(back)

    # napsugarak
    rays = Image.new('L', (W, H), 0); rd = ImageDraw.Draw(rays)
    for x0, w in ((150, 40), (230, 26), (90, 20), (300, 30)):
        rd.polygon([(x0 * X, 0), ((x0 + w) * X, 0), ((x0 + w * 2 + 140) * X, 1300 * X), ((x0 + w + 90) * X, 1300 * X)], fill=90)
    rays = rays.filter(ImageFilter.GaussianBlur(24 * X))
    ray = Image.new('RGBA', (W, H), (255, 230, 170, 255)); ray.putalpha(rays.point(lambda v: int(v * .45)))
    bg.alpha_composite(ray)
    bg = deepen(bg, today_y)

    # benőtt előtér a jövőbeli jelzőkövek fölött
    front = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    future_h = HC - (today_y + 150)
    if future_h > 100:
        for i in range(int(260 * max(future_h, 300) / 1460) + 40):
            cx, cy = R(-40, WC + 40), R(today_y + 150, HC + 60)
            k = random.choice(POOL); s = R(.3, .6) * (1.3 if k == 'leaf' else 1)
            rot = R(-40, 40) if random.random() < .7 else 180 + R(-35, 35)
            put(front, prep(k, s * X, rot, random.random() < .5, False, R(.3, .58), 0), cx * X, cy * X)
            if i % 10 == 0 and coverage(front.crop((0, int((today_y + 250) * X), W, H))) > .68:
                break
    for _ in range(int(40 * (today_y + 100) / 1240)):
        cx, cy = random.choice([R(-30, 40), R(WC - 40, WC + 30)]), R(260, today_y + 100)
        k = random.choice(POOL)
        put(front, prep(k, R(.35, .6) * X, R(-40, 40), cx > WC / 2, False, R(.5, .75), 0), cx * X, cy * X)

    fm = row_mask(H, lambda yy: np.where(yy > today_y + 230, 255,
                                         np.where(yy > today_y + 120, 255 * (yy - (today_y + 120)) / 110, 0)))
    side = Image.new('L', (W, H), 0); sd = ImageDraw.Draw(side)
    sd.rectangle((0, 0, 44 * X, H), fill=255); sd.rectangle(((WC - 44) * X, 0, W, H), fill=255)
    side = side.filter(ImageFilter.GaussianBlur(10 * X))
    fm = ImageChops.lighter(fm, side)
    hdr = Image.new('L', (W, H), 255); ImageDraw.Draw(hdr).rectangle((0, 0, W, 250 * X), fill=0)
    hdr = hdr.filter(ImageFilter.GaussianBlur(20 * X))
    fm = ImageChops.multiply(fm, hdr)
    front.putalpha(ImageChops.multiply(front.split()[3], fm))
    front = deepen(front, today_y)

    os.makedirs(OUT, exist_ok=True)
    nn = f'{n:02d}'
    bg.convert('RGB').save(f'{OUT}/bg-{nn}.webp', quality=70, method=6)
    front.save(f'{OUT}/front-{nn}.webp', quality=60, method=6)
    with open(f'{OUT}/layout-{nn}.json', 'w') as f:
        json.dump(lay, f)
    return (os.path.getsize(f'{OUT}/bg-{nn}.webp') // 1024, os.path.getsize(f'{OUT}/front-{nn}.webp') // 1024, HC)


if __name__ == '__main__':
    days = [int(a) for a in sys.argv[1:]] or list(range(1, DAYS + 1))
    for d in days:
        bgk, frk, h = build(d)
        print(f'nap {d:2d}: bg {bgk} KB, front {frk} KB, magasság {h}px', flush=True)
