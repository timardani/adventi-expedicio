"""Demóképek a webes felülethez (falkészletek, levéldarab-sprite-ok, állomásképek, tisztás).

    web/public/assets/walls/set-K/wall0..4.webp   K = 1..6; set-1 1–4 = a jóváhagyott prototípus falai,
                                                  wall0 = leghátsó réteg (--hatso-falak)
    web/public/assets/clearing.webp               tisztás (prototípus; minden napra ugyanaz, lásd README)
    web/public/assets/particles/p0..N.webp        kis levéldarabok a vágás részecskéihez
    web/public/assets/stations/s0..N.webp         állomásképek (növénykivágás meleg okker alapon)

Futtatás:  pipeline/.venv/bin/python pipeline/demo_assets.py
"""
import os, random, shutil, glob
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance
from jlib import prep, put, coverage, ROOT, J, G, trim, L

OUT = os.path.join(ROOT, 'web', 'public', 'assets')
PROTO = os.path.join(ROOT, 'design-prototipus', 'generalt-kepek')
W, H = 780, 1688
POOL = ['leaf', 'aloc', 'monst', 'ficus', 'mint', 'hoya', 'aloc', 'leaf', 'anth', 'mint']
SETS = 6


def wall(n, scale, dim, blur, target, seed):
    random.seed(seed); R = random.uniform
    lay = Image.new('RGBA', (W, H), (0, 0, 0, 0)); i = 0
    while coverage(lay) < target and i < 400:
        k = random.choice(POOL); s = R(*scale) * (1.6 if k == 'leaf' else 1)
        rot = R(-40, 40) if random.random() < .7 else 180 + R(-35, 35)
        put(lay, prep(k, s, rot, random.random() < .5, False, R(*dim), blur), R(-80, W + 80), R(-80, H + 80)); i += 1
    for _ in range(n):
        im = prep(random.choice(['strandL', 'strandR']), R(1.2, 1.8), R(-8, 8), random.random() < .5, False, R(*dim), blur)
        put(lay, im, R(0, W), R(-40, H * .5), 't')
    return lay


def walls():
    d1 = f'{OUT}/walls/set-1'; os.makedirs(d1, exist_ok=True)
    for i in range(1, 5):
        shutil.copy(f'{PROTO}/wall{i}.webp', f'{d1}/wall{i}.webp')
    vig = Image.new('L', (W, H), 0)
    ImageDraw.Draw(vig).ellipse((-W * .2, -H * .1, W * 1.2, H * 1.1), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(120))
    for k in range(2, SETS + 1):
        d = f'{OUT}/walls/set-{k}'; os.makedirs(d, exist_ok=True)
        base = k * 100
        layers = [wall(3, (1.1, 1.7), (.30, .42), 3.0, .80, base + 1),
                  wall(3, (1.3, 2.0), (.42, .55), 1.5, .90, base + 2),
                  wall(2, (1.5, 2.3), (.42, .6), 0.6, .96, base + 3),
                  wall(2, (1.9, 2.8), (.48, .72), 0, .985, base + 4)]
        for i, l in enumerate(layers):
            r, g, b, a = l.split()
            rgb = Image.composite(Image.merge('RGB', (r, g, b)),
                                  ImageEnhance.Brightness(Image.merge('RGB', (r, g, b))).enhance(.45), vig)
            Image.merge('RGBA', (*rgb.split(), a)).save(f'{d}/wall{i + 1}.webp', quality=78, method=6)
        print('falkészlet', k, 'kész', flush=True)


def back_walls():
    """wall0: a leghátsó, legelmosottabb réteg minden készlethez (3–5 fal/nap: 5 falnál ez is látszik)."""
    vig = Image.new('L', (W, H), 0)
    ImageDraw.Draw(vig).ellipse((-W * .2, -H * .1, W * 1.2, H * 1.1), fill=255)
    vig = vig.filter(ImageFilter.GaussianBlur(120))
    for k in range(1, SETS + 1):
        l = wall(3, (1.0, 1.5), (.24, .34), 4.5, .78, k * 100)
        r, g, b, a = l.split()
        rgb = Image.composite(Image.merge('RGB', (r, g, b)),
                              ImageEnhance.Brightness(Image.merge('RGB', (r, g, b))).enhance(.45), vig)
        Image.merge('RGBA', (*rgb.split(), a)).save(f'{OUT}/walls/set-{k}/wall0.webp', quality=74, method=6)
        print('hátsó fal', k, 'kész', flush=True)


def particles():
    d = f'{OUT}/particles'; os.makedirs(d, exist_ok=True)
    keys = ['leaf', 'aloc', 'monst', 'ficus', 'mint', 'hoya', 'anth', 'dragon']
    for i, k in enumerate(keys):
        im = prep(k, 1, 0, False, False, .75, 0)
        im.thumbnail((96, 96), Image.LANCZOS)
        im.save(f'{d}/p{i}.webp', quality=80)
    return len(keys)


def stations():
    d = f'{OUT}/stations'; os.makedirs(d, exist_ok=True)
    files = sorted(glob.glob(G + '*.png'))
    files = [f for f in files if min(Image.open(f).size) >= 160]
    S = 160
    for i, f in enumerate(files):
        bg = Image.new('RGBA', (S, S), (0, 0, 0, 255))
        grad = Image.new('L', (S, S), 0)
        ImageDraw.Draw(grad).ellipse((-S * .2, -S * .3, S * 1.2, S * 1.1), fill=255)
        grad = grad.filter(ImageFilter.GaussianBlur(30))
        bg = Image.composite(Image.new('RGBA', (S, S), (214, 150, 74, 255)), Image.new('RGBA', (S, S), (118, 72, 30, 255)), grad)
        p = L(f)
        # a színkulcsolt kivágásban halvány alfa-zaj marad: a körülvágás csak az érdemi pixelekre
        p = p.crop(p.split()[3].point(lambda v: 255 if v > 90 else 0).getbbox())
        sc = (S * .88) / max(p.size); p = p.resize((max(1, int(p.width * sc)), max(1, int(p.height * sc))), Image.LANCZOS)
        bg.alpha_composite(p, ((S - p.width) // 2, S - p.height - 6))
        bg.convert('RGB').save(f'{d}/s{i}.webp', quality=80)
    return len(files)


if __name__ == '__main__':
    import sys
    os.makedirs(OUT, exist_ok=True)
    if '--hatso-falak' in sys.argv:
        back_walls(); sys.exit(0)
    shutil.copy(f'{PROTO}/clearing.webp', f'{OUT}/clearing.webp')
    print('részecske-sprite:', particles())
    print('állomáskép:', stations())
    if '--falak-nelkul' not in sys.argv:
        walls()
