// Canvas 2D effektréteg: ujjat követő pengecsík, csapásvillanás, levéldarab-részecskék.
// Csak akkor fut animációs ciklus, ha van mit rajzolni.

const TRAIL_MS = 250;
const SWEEP_MS = 110;
const FLASH_MS = 380;
const GRAVITY = 1600; // px/s²

export function createFx(canvas, { sprites = [], particleScale = 1 } = {}) {
  const ctx = canvas.getContext('2d');
  let dpr = 1, w = 0, h = 0;
  let trail = [];
  let flashes = [];
  let parts = [];
  let raf = 0;
  let last = 0;
  let enabledParticles = true;

  function resize() {
    const r = canvas.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = r.width; h = r.height;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  const ro = new ResizeObserver(resize);
  ro.observe(canvas);
  resize();

  function kick() {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  }

  function frame(now) {
    const dt = Math.min(0.05, (now - last) / 1000);
    last = now;
    ctx.clearRect(0, 0, w, h);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    const alive = drawTrail(now) | drawFlashes(now) | drawParts(dt);
    raf = alive ? requestAnimationFrame(frame) : 0;
    if (!alive) ctx.clearRect(0, 0, w, h);
  }

  function drawTrail(now) {
    trail = trail.filter((p) => now - p.t < TRAIL_MS);
    if (trail.length < 2) return trail.length > 0;
    for (let pass = 0; pass < 2; pass++) {
      for (let i = 1; i < trail.length; i++) {
        const p = trail[i - 1], q = trail[i];
        const life = 1 - (now - q.t) / TRAIL_MS;
        if (life <= 0) continue;
        const taper = i / trail.length;
        const width = 1.5 + 7 * life * taper;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(q.x, q.y);
        if (pass === 0) {
          ctx.strokeStyle = `rgba(255,226,160,${0.28 * life})`;
          ctx.lineWidth = width * 3.2;
        } else {
          ctx.strokeStyle = `rgba(255,252,240,${0.95 * life})`;
          ctx.lineWidth = width;
        }
        ctx.stroke();
      }
    }
    return true;
  }

  function drawFlashes(now) {
    flashes = flashes.filter((f) => now - f.t0 < FLASH_MS);
    for (const f of flashes) {
      const age = now - f.t0;
      const prog = Math.min(1, age / SWEEP_MS);
      const alpha = age < SWEEP_MS ? 1 : 1 - (age - SWEEP_MS) / (FLASH_MS - SWEEP_MS);
      const x2 = f.a.x + (f.b.x - f.a.x) * prog;
      const y2 = f.a.y + (f.b.y - f.a.y) * prog;
      const strokes = [
        [24, `rgba(255,230,170,${0.22 * alpha})`],
        [9, `rgba(255,246,216,${0.55 * alpha})`],
        [2.5, `rgba(255,255,255,${alpha})`],
      ];
      for (const [lw, col] of strokes) {
        ctx.beginPath();
        ctx.moveTo(f.a.x, f.a.y);
        ctx.lineTo(x2, y2);
        ctx.strokeStyle = col;
        ctx.lineWidth = lw;
        ctx.stroke();
      }
    }
    return flashes.length > 0;
  }

  function drawParts(dt) {
    parts = parts.filter((p) => p.age < p.life);
    for (const p of parts) {
      p.age += dt;
      p.vy += GRAVITY * dt;
      p.vx *= 0.985;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.rot += p.vr * dt;
      const k = p.age / p.life;
      const alpha = k < 0.6 ? 1 : Math.max(0, 1 - (k - 0.6) / 0.4);
      const img = p.img;
      const s = p.size / Math.max(img.naturalWidth, img.naturalHeight);
      const iw = img.naturalWidth * s, ih = img.naturalHeight * s;
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.scale(p.flip, 1);
      ctx.drawImage(img, -iw / 2, -ih / 2, iw, ih);
      ctx.restore();
    }
    return parts.length > 0;
  }

  return {
    trailStart(p) {
      trail = [{ x: p.x, y: p.y, t: performance.now() }];
      kick();
    },
    trailAdd(p) {
      trail.push({ x: p.x, y: p.y, t: performance.now() });
      if (trail.length > 48) trail.shift();
      kick();
    },
    flash(a, b) {
      flashes.push({ a, b, t0: performance.now() });
      kick();
    },
    /** Levéldarabok a vágás mentén; a darabok a vágásra merőlegesen, két irányba repülnek. */
    burst(a, b, normal, count) {
      if (!enabledParticles || !sprites.length) return;
      const n = Math.round(count * particleScale);
      for (let i = 0; i < n; i++) {
        const t = 0.15 + Math.random() * 0.7;
        const side = Math.random() < 0.5 ? -1 : 1;
        const sp = 160 + Math.random() * 380;
        parts.push({
          img: sprites[(Math.random() * sprites.length) | 0],
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
          vx: normal.x * sp * side + (Math.random() - 0.5) * 220,
          vy: normal.y * sp * side - 260 - Math.random() * 320,
          rot: Math.random() * Math.PI * 2,
          vr: (Math.random() - 0.5) * 12,
          size: 26 + Math.random() * 34,
          flip: Math.random() < 0.5 ? -1 : 1,
          age: 0,
          life: 0.9 + Math.random() * 0.6,
        });
      }
      kick();
    },
    setParticles(on, scale) {
      enabledParticles = on;
      if (scale != null) particleScale = scale;
    },
    destroy() {
      ro.disconnect();
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}
