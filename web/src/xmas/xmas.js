// Karácsonyi díszítés (2026-10-20, kísérleti). Minden ebben a mappában van, egyben kikapcsolható:
//   ?karacsony=0 az URL-ben, vagy params.js → XMAS_DEFAULT = false. Teljes eltávolítás: ez a mappa,
//   és a main.js-ben, intro.js-ben, audio.js-ben a „karácsony” jelölésű sorok.
// Elemek: meleg fényfüzér a lap tetején, szállingózó aranypor (dzsungeli „hó”), piros masni az
// ajándékon (xmas.css), csengő hang és fénykitörés a tisztás megnyílásakor, a 24. napon konfetti.

import './xmas.css';

const SVG_NS = 'http://www.w3.org/2000/svg';
const BULB_COLORS = ['#ffcf6b', '#e8483f', '#fff1c9', '#e8483f', '#ffcf6b', '#9be37f'];

function svg(tag, attrs) {
  const el = document.createElementNS(SVG_NS, tag);
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  return el;
}

/** Fényfüzér: három lógó ív a képernyő tetején, rajta pislákoló izzók. */
function makeLights() {
  const W = 400;
  const H = 46;
  const box = svg('svg', { viewBox: `0 0 ${W} ${H}`, preserveAspectRatio: 'none', 'aria-hidden': 'true' });
  const swags = 3;
  const sw = W / swags;
  let d = 'M -4 2';
  for (let i = 0; i < swags; i++) d += ` Q ${i * sw + sw / 2} 34 ${(i + 1) * sw + (i === swags - 1 ? 4 : 0)} 2`;
  box.append(svg('path', { d, class: 'xl-wire' }));
  const perSwag = 5;
  let n = 0;
  for (let i = 0; i < swags; i++) {
    for (let j = 1; j <= perSwag; j++) {
      const t = j / (perSwag + 1);
      const x0 = i * sw;
      const x = x0 + t * sw;
      const y = (1 - t) * (1 - t) * 2 + 2 * (1 - t) * t * 34 + t * t * 2; // a Bézier-ív pontja
      const color = BULB_COLORS[n % BULB_COLORS.length];
      const g = svg('g', { class: 'xl-bulb', style: `animation-delay:${((n * 0.37) % 2.4).toFixed(2)}s` });
      g.append(
        svg('circle', { cx: x, cy: y + 7, r: 9, fill: color, class: 'xl-glow' }),
        svg('rect', { x: x - 2, y: y - 0.5, width: 4, height: 3.2, fill: '#3a4a2c' }),
        svg('ellipse', { cx: x, cy: y + 7, rx: 3.4, ry: 5, fill: color }),
      );
      box.append(g);
      n++;
    }
  }
  const wrap = document.createElement('div');
  wrap.className = 'xmas-lights';
  wrap.append(box);
  return wrap;
}

const rnd = (a, b) => a + Math.random() * (b - a);

/** Aranypor-hó + kitörés + konfetti egyetlen canvason. */
function makeSky(app) {
  const canvas = document.createElement('canvas');
  canvas.className = 'xmas-sky';
  canvas.setAttribute('aria-hidden', 'true');
  const c = canvas.getContext('2d');
  let w = 0;
  let hgt = 0;
  let dpr = 1;
  const flakes = [];
  const sparks = [];
  const confetti = [];
  let raf = 0;
  let last = 0;

  function resize() {
    dpr = Math.min(2, window.devicePixelRatio || 1);
    w = app.clientWidth;
    hgt = app.clientHeight;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(hgt * dpr);
  }

  function newFlake(top) {
    return {
      x: rnd(0, w), y: top ? rnd(-40, -5) : rnd(0, hgt),
      r: rnd(0.8, 2.1), vy: rnd(10, 26), amp: rnd(6, 18), ph: rnd(0, 6.28), sp: rnd(0.4, 1.1),
      tw: rnd(0, 6.28),
    };
  }

  function frame(t) {
    const dt = Math.min(0.05, (t - (last || t)) / 1000);
    last = t;
    c.setTransform(dpr, 0, 0, dpr, 0, 0);
    c.clearRect(0, 0, w, hgt);
    c.globalCompositeOperation = 'lighter';

    for (const f of flakes) {
      f.y += f.vy * dt;
      f.ph += f.sp * dt;
      f.tw += dt * 2;
      if (f.y > hgt + 10) Object.assign(f, newFlake(true));
      const x = f.x + Math.sin(f.ph) * f.amp;
      const a = 0.45 + 0.35 * Math.sin(f.tw);
      c.fillStyle = `rgba(255, 205, 120, ${(a * 0.22).toFixed(3)})`;
      c.beginPath(); c.arc(x, f.y, f.r * 3.2, 0, 6.283); c.fill();
      c.fillStyle = `rgba(255, 236, 190, ${a.toFixed(3)})`;
      c.beginPath(); c.arc(x, f.y, f.r, 0, 6.283); c.fill();
    }

    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.life -= dt;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      s.vx *= 0.985; s.vy = s.vy * 0.985 + 30 * dt;
      s.x += s.vx * dt; s.y += s.vy * dt;
      const a = Math.min(1, s.life / s.max * 1.4);
      c.fillStyle = `rgba(255, 214, 140, ${(a * 0.25).toFixed(3)})`;
      c.beginPath(); c.arc(s.x, s.y, s.r * 3, 0, 6.283); c.fill();
      c.fillStyle = `rgba(255, 245, 215, ${a.toFixed(3)})`;
      c.beginPath(); c.arc(s.x, s.y, s.r, 0, 6.283); c.fill();
    }

    c.globalCompositeOperation = 'source-over';
    for (let i = confetti.length - 1; i >= 0; i--) {
      const p = confetti[i];
      p.y += p.vy * dt; p.x += Math.sin(p.ph += dt * p.sp) * 30 * dt; p.rot += p.vr * dt;
      if (p.y > hgt + 20) { confetti.splice(i, 1); continue; }
      c.save();
      c.translate(p.x, p.y); c.rotate(p.rot); c.scale(1, Math.cos(p.ph * 2));
      c.fillStyle = p.color;
      c.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      c.restore();
    }
    raf = requestAnimationFrame(frame);
  }

  function start() {
    if (raf || document.hidden) return;
    last = 0;
    raf = requestAnimationFrame(frame);
  }
  function stop() {
    cancelAnimationFrame(raf);
    raf = 0;
  }

  const ro = new ResizeObserver(resize);
  ro.observe(app);
  resize();
  for (let i = 0; i < 38; i++) flakes.push(newFlake(false));
  document.addEventListener('visibilitychange', () => (document.hidden ? stop() : start()));
  start();

  return {
    el: canvas,
    burst() {
      const cx = w / 2;
      const cy = hgt * 0.36;
      for (let i = 0; i < 70; i++) {
        const ang = rnd(0, 6.283);
        const v = rnd(60, 260);
        const max = rnd(1.4, 2.8);
        sparks.push({ x: cx + rnd(-30, 30), y: cy + rnd(-30, 30), vx: Math.cos(ang) * v, vy: Math.sin(ang) * v - 40, r: rnd(0.9, 2.2), life: max, max });
      }
    },
    confetti() {
      const colors = ['#f2c46b', '#ffd995', '#e8483f', '#f4efe2', '#7fc46a'];
      for (let i = 0; i < 150; i++) {
        confetti.push({
          x: rnd(0, w), y: rnd(-hgt * 0.6, -10), vy: rnd(90, 190), s: rnd(6, 11), rot: rnd(0, 6.28), vr: rnd(-6, 6),
          ph: rnd(0, 6.28), sp: rnd(2, 5), color: colors[i % colors.length],
        });
      }
    },
  };
}

/**
 * Bekapcsolja a karácsonyi díszítést az #app elemen.
 * @returns {{ celebrate(day: number): void }}
 */
export function mountXmas(app, { reduced = false } = {}) {
  app.classList.add('xmas');
  app.append(makeLights());
  if (reduced) return { celebrate() {} };
  const sky = makeSky(app);
  app.append(sky.el);
  return {
    celebrate(day) {
      sky.burst();
      if (day === 24) sky.confetti();
    },
  };
}
