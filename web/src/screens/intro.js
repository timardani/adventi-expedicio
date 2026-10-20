// 1. képernyő: belépés machetével → tisztás a mai ajándékkal.
// Rétegek (alulról): tisztás kép (az aznapi növénnyel) → falak (hátsótól az elsőig) → effekt-canvas →
// villanás → felső sötétítés + fejléc → útmutató → érintési felület. Az utolsó vágás után a mai
// ajándék ott van a tisztáson (nem ugrik fel külön ablak).
// ctx.cleared = true: a mai nap már át van vágva → rögtön a tisztás látszik.

import { h, header, MACHETE_SVG, asset, article } from '../ui.js';
import { giftContent } from './gift.js';
import { splitRect, toClipPath, randomDiagonal, classifyGesture } from '../engine/geometry.js';
import { createFx } from '../engine/fx.js';
import { vibrate, measureFps } from '../engine/device.js';

const HINTS = {
  5: ['Vágj utat!', 'Még négy csapás', 'Még három csapás', 'Csak így tovább!', 'Már látszik a fény…'],
  4: ['Vágj utat!', 'Még három csapás', 'Csak így tovább!', 'Már látszik a fény…'],
  3: ['Vágj utat!', 'Még két csapás', 'Már látszik a fény…'],
  2: ['Vágj utat!', 'Már látszik a fény…'],
};
const REMAINING = ['', 'Még egy csapás', 'Még két csapás', 'Még három csapás', 'Még négy csapás'];
const COOLDOWN_MS = 160;
const PARALLAX_DEPTH = [3, 5, 9, 13, 18]; // px, wall0 (leghátsó) … wall4 (legelső)
const FRONT = 4; // a legelső fal száma
const PARTICLES = 10;

export function mountIntro(root, ctx) {
  const { day, offer, wallCount, wallSet, mirror, audio, parallax, device, api, brand } = ctx;
  const cleared = !!ctx.cleared;
  const total = cleared ? 0 : wallCount;
  let cuts = 0;
  let lastCut = 0;
  let firstCutDone = false;
  let active = null; // aktuális húzás

  const clearingImg = h('img', { class: 'clearing-img', src: asset(offer.clearing), alt: '', 'aria-hidden': 'true' });
  const clearingLayer = h('div', { class: 'layer clearing-layer' }, clearingImg);
  const wallsBox = h('div', { class: 'walls' + (mirror ? ' mirror' : '') });
  const shaker = h('div', { class: 'shaker' }, wallsBox);
  const canvas = h('canvas', { class: 'fx', 'aria-hidden': 'true' });
  const flash = h('div', { class: 'flash', 'aria-hidden': 'true' });

  // falak: a 4-es a legelső (a prototípus elnevezése szerint), a 0-s a leghátsó;
  // kevesebb falnál a hátsók maradnak el
  const first = FRONT - total + 1;
  const walls = [];
  for (let i = first; i <= FRONT; i++) {
    const img = h('img', { class: 'wall-img', src: asset(`walls/set-${wallSet}/wall${i}.webp`), alt: '', draggable: 'false' });
    const el = h('div', { class: 'wall', 'aria-hidden': 'true' }, img);
    wallsBox.append(el);
    walls.push({ el, img, depth: PARALLAX_DEPTH[i - 1] });
  }

  const hintText = h('div', { class: 'hint-title' });
  const live = h('div', { class: 'sr-only', 'aria-live': 'polite' });
  const dots = h('div', { class: 'dots' });
  const hint = h('div', { class: 'hint' },
    h('span', { class: 'machete pulse', html: MACHETE_SVG }),
    hintText,
    h('div', { class: 'hint-sub' }, 'Húzd végig az ujjad, vagy koppints.'),
    dots);

  const surface = h('div', {
    class: 'cut-surface',
    role: 'button',
    tabindex: '0',
    'aria-label': `Levélfal ${article(day)} ${day}. napi ajándék előtt. Vágj a machetével: húzd végig az ujjad, koppints, vagy nyomj Entert.`,
  });

  const clearingText = giftContent(ctx, offer);

  const screen = h('section', { class: 'screen intro' + (cleared ? ' is-cleared' : '') },
    clearingLayer, shaker, canvas, flash,
    h('div', { class: 'top-fade', 'aria-hidden': 'true' }),
    header(brand, 'Adventi expedíció'),
    cleared ? null : hint, live, clearingText, cleared ? null : surface);
  root.replaceChildren(screen);

  const fx = createFx(canvas, { sprites: ctx.sprites, particleScale: device.fewParticles ? 0.45 : 1 });
  if (device.reduced) fx.setParticles(false);

  // parallaxis: engedélykérés nélkül (Android: döntés, iPhone: az ujj mozgása)
  if (device.reduced) {
    parallax.setTargets([]);
  } else {
    parallax.setTargets([
      { el: clearingLayer, depth: -4 },
      ...walls.map((w) => ({ el: w.el, depth: w.depth })),
    ]);
    parallax.start();
  }

  if (cleared) {
    clearingText.hidden = false;
    return () => {
      fx.destroy();
      parallax.setTargets([]);
    };
  }

  function renderHint() {
    const list = HINTS[total] || HINTS[4];
    hintText.textContent = list[Math.min(cuts, total - 1)];
    dots.replaceChildren(...Array.from({ length: total }, (_, i) => h('span', { class: i < cuts ? 'on' : '' })));
  }
  renderHint();

  // biztonsági háló: ha a mért FPS mégis alacsony, csak kevesebb levéldarab repül –
  // a falak száma, a parallaxis és minden más ugyanaz marad
  if (!device.fewParticles) {
    measureFps(700).then((fps) => {
      api.track('fps', { fps: Math.round(fps) });
      if (fps >= 40 || screen.isConnected === false) return;
      device.fewParticles = true;
      fx.setParticles(!device.reduced, 0.45);
    });
  }

  // ——— Gesztusok ———
  const local = (e) => {
    const r = surface.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  surface.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || cuts >= total) return;
    surface.setPointerCapture?.(e.pointerId);
    const p = local(e);
    active = { start: p, last: p };
    fx.trailStart(p);
    audio.unlock();
  });
  surface.addEventListener('pointermove', (e) => {
    if (!active || !e.isPrimary) return;
    const p = local(e);
    active.last = p;
    fx.trailAdd(p);
    const r = surface.getBoundingClientRect();
    parallax.pointer(p.x / r.width, p.y / r.height);
  });
  surface.addEventListener('pointerup', (e) => {
    if (!active || !e.isPrimary) return;
    const p = local(e);
    const { start } = active;
    active = null;
    parallax.release();
    gestureHooks();
    if (classifyGesture(start, p) === 'drag') {
      cut(start, p);
    } else {
      const r = surface.getBoundingClientRect();
      const [a, b] = randomDiagonal(r.width, r.height, p);
      cut(a, b);
    }
  });
  surface.addEventListener('pointercancel', () => {
    active = null;
    parallax.release();
  });
  surface.addEventListener('keydown', (e) => {
    if (e.key !== 'Enter' && e.key !== ' ') return;
    e.preventDefault();
    if (e.repeat) return;
    gestureHooks();
    const r = surface.getBoundingClientRect();
    const [a, b] = randomDiagonal(r.width, r.height, null);
    cut(a, b);
  });

  /** Felhasználói gesztusból indítandó dolgok (a böngésző csak érintés után enged hangot). */
  function gestureHooks() {
    audio.unlock();
    if (!firstCutDone) {
      firstCutDone = true;
      audio.startAmbience();
    }
  }

  // ——— Vágás ———
  function cut(a, b) {
    const now = performance.now();
    if (cuts >= total || now - lastCut < COOLDOWN_MS) return;
    lastCut = now;
    const wall = walls[walls.length - 1 - cuts];
    cuts++;

    const sr = surface.getBoundingClientRect();
    const wr = wall.img.getBoundingClientRect();
    // a fal saját koordinátarendszere (parallaxis-eltolással, tükrözéssel együtt)
    const toWall = (p) => {
      let x = p.x + sr.left - wr.left;
      const y = p.y + sr.top - wr.top;
      if (mirror) x = wr.width - x;
      return { x, y };
    };
    const split = splitRect(wr.width, wr.height, toWall(a), toWall(b));
    // a szakasz a képernyő koordinátáiban (villanáshoz, részecskékhez)
    const toScreen = (p) => {
      const x = mirror ? wr.width - p.x : p.x;
      return { x: x + wr.left - sr.left, y: p.y + wr.top - sr.top };
    };

    if (split) {
      const [s0, s1] = split.segment.map(toScreen);
      const n = { x: (s1.y - s0.y), y: -(s1.x - s0.x) };
      const nl = Math.hypot(n.x, n.y) || 1;
      fx.flash(s0, s1);
      fx.burst(s0, s1, { x: n.x / nl, y: n.y / nl }, PARTICLES);
    }

    if (device.reduced || !split) {
      wall.el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 450, easing: 'ease-out', fill: 'forwards' })
        .finished.then(() => wall.el.remove()).catch(() => {});
    } else {
      flyApart(wall, split);
      shake();
      flash.animate([{ opacity: 0 }, { opacity: 0.32 }, { opacity: 0 }], { duration: 170, easing: 'ease-out' });
    }

    audio.swoosh();
    setTimeout(() => audio.rustle(), 40);
    vibrate(30);
    api.track('cut', { day, n: cuts });

    renderHint();
    live.textContent = cuts < total ? REMAINING[total - cuts] || '' : `Átvágtad magad! A mai zsákmány: ${offer.title}.`;
    if (cuts >= total) setTimeout(reveal, device.reduced ? 250 : 520);
  }

  function flyApart(wall, split) {
    const src = wall.img.getAttribute('src');
    const mid = {
      x: (split.segment[0].x + split.segment[1].x) / 2,
      y: (split.segment[0].y + split.segment[1].y) / 2,
    };
    const dist = 300 + Math.random() * 120;
    const rot = 6 + Math.random() * 5;
    const halves = [
      { poly: split.a, dir: 1 },
      { poly: split.b, dir: -1 },
    ].map(({ poly, dir }) => {
      const img = h('img', { class: 'wall-img half', src, alt: '', draggable: 'false' });
      img.style.clipPath = toClipPath(poly);
      img.style.webkitClipPath = img.style.clipPath;
      img.style.transformOrigin = `${mid.x}px ${mid.y}px`;
      const tx = split.normal.x * dist * dir;
      const ty = split.normal.y * dist * dir;
      return { img, to: `translate3d(${tx.toFixed(1)}px, ${ty.toFixed(1)}px, 0) rotate(${(rot * dir).toFixed(1)}deg) scale(1.12)` };
    });
    wall.img.replaceWith(...halves.map((x) => x.img));
    const anims = halves.map(({ img, to }) =>
      img.animate(
        [
          { offset: 0, transform: 'translate3d(0,0,0) rotate(0deg) scale(1)', opacity: 1 },
          { offset: 0.3, opacity: 1 },
          { offset: 1, transform: to, opacity: 0 },
        ],
        { duration: 950, easing: 'cubic-bezier(.25,.1,.15,1)', fill: 'forwards' },
      ),
    );
    Promise.all(anims.map((a) => a.finished)).then(() => wall.el.remove()).catch(() => {});
  }

  let shakeFlip = false;
  function shake() {
    shakeFlip = !shakeFlip;
    const s = shakeFlip ? 1 : -1;
    shaker.animate(
      [
        { transform: 'translate3d(0,0,0)' },
        { transform: `translate3d(${-6 * s}px, ${3 * s}px, 0)`, offset: 0.2 },
        { transform: `translate3d(${5 * s}px, ${-3 * s}px, 0)`, offset: 0.45 },
        { transform: `translate3d(${-2 * s}px, ${1 * s}px, 0)`, offset: 0.7 },
        { transform: 'translate3d(0,0,0)' },
      ],
      { duration: 380, easing: 'ease-out' },
    );
  }

  async function reveal() {
    surface.remove();
    hint.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 300, fill: 'forwards' });
    clearingText.hidden = false;
    if (!device.reduced) {
      clearingImg.animate(
        [{ transform: 'scale(1.08)', opacity: 0.75 }, { transform: 'scale(1)', opacity: 1 }],
        { duration: 1400, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'forwards' },
      );
      clearingText.animate(
        [{ opacity: 0, transform: 'translateY(24px)' }, { opacity: 1, transform: 'translateY(0)' }],
        { duration: 1000, delay: 250, easing: 'cubic-bezier(.2,.8,.2,1)', fill: 'backwards' },
      );
    }
    audio.reward();
    // karácsony: csengő + fénykitörés (24. napon konfetti)
    if (ctx.xmas) {
      setTimeout(() => audio.jingle(), 260);
      ctx.xmas.celebrate(day);
    }
    await api.openDay(day);
    api.track('open', { day });
    // a vágófelület eltűnt: a fókusz a tisztás szövegére kerül (billentyűzet, képernyőolvasó)
    clearingText.focus({ preventScroll: true });
  }

  return () => {
    fx.destroy();
    parallax.setTargets([]);
  };
}
