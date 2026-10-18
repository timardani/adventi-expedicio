// Web Audio hangmotor.
// Amíg az Envato-hangok (terv 6. pont) nincsenek meg, a hangokat szintetizáljuk.
// Ha egy hanghoz van fájl (pl. themes/amazonas/hangok/...), a `load()` betölti, és onnan a minta szól.
//
// A böngésző csak felhasználói érintés után enged hangot: az `unlock()`-ot érintéskezelőből kell hívni.
// iPhone-on a néma kapcsoló alapból elnémítja a Web Audiót (ez a rendszer viselkedése).

const STORE_KEY = 'ae-hang';

function readMuted() {
  try {
    return localStorage.getItem(STORE_KEY) === 'ki';
  } catch {
    return false;
  }
}

function writeMuted(m) {
  try {
    localStorage.setItem(STORE_KEY, m ? 'ki' : 'be');
  } catch {
    /* privát mód: nem jegyezzük meg */
  }
}

const rnd = (a, b) => a + Math.random() * (b - a);

export function createAudio({ volume = 0.9 } = {}) {
  let ctx = null;
  let master = null;
  let noise = null;
  let ambGain = null;
  let ambStarted = false;
  let birdTimer = 0;
  let muted = readMuted();
  const samples = {}; // név -> AudioBuffer[]
  const listeners = new Set();

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : volume;
      master.connect(ctx.destination);
      noise = makeNoise(ctx, 3);
    }
    if (ctx.state === 'suspended') ctx.resume().catch(() => {});
    return ctx;
  }

  function makeNoise(c, seconds) {
    const buf = c.createBuffer(1, c.sampleRate * seconds, c.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  function noiseSrc(loop = false) {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.loop = loop;
    return s;
  }

  function playSample(name, gain = 1) {
    const list = samples[name];
    if (!list || !list.length || !ensure()) return false;
    const s = ctx.createBufferSource();
    s.buffer = list[(Math.random() * list.length) | 0];
    const g = ctx.createGain();
    g.gain.value = gain;
    s.connect(g).connect(master);
    s.start();
    return true;
  }

  // ——— Szintetizált hangok ———

  function swoosh() {
    if (playSample('swoosh') || !ensure()) return;
    const t = ctx.currentTime;
    const dur = rnd(0.26, 0.42);
    const f0 = rnd(500, 800);
    const s = noiseSrc();
    const bp = ctx.createBiquadFilter();
    bp.type = 'bandpass';
    bp.Q.value = 0.9;
    bp.frequency.setValueAtTime(f0, t);
    bp.frequency.exponentialRampToValueAtTime(rnd(3000, 4600), t + dur * 0.45);
    bp.frequency.exponentialRampToValueAtTime(f0 * 1.6, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(0.75, t + 0.035);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(bp).connect(g).connect(master);
    s.start(t, rnd(0, 2));
    s.stop(t + dur + 0.05);
  }

  function rustle() {
    if (playSample('rustle', 0.8) || !ensure()) return;
    const t = ctx.currentTime + 0.03;
    const grains = 9 + ((Math.random() * 6) | 0);
    for (let i = 0; i < grains; i++) {
      const rel = Math.pow(Math.random(), 1.6) * 0.55;
      const t0 = t + rel;
      const d = rnd(0.02, 0.07);
      const s = noiseSrc();
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass';
      bp.frequency.value = rnd(1800, 5500);
      bp.Q.value = 2;
      const g = ctx.createGain();
      const peak = rnd(0.15, 0.4) * (1 - rel / 0.6);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(peak, t0 + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      s.connect(bp).connect(g).connect(master);
      s.start(t0, rnd(0, 2.5));
      s.stop(t0 + d + 0.02);
    }
  }

  /** Meleg „megérkeztél” hang: mély puffanás + lassú, fa-szerű hármashangzat (nem csilingelő). */
  function reward() {
    if (playSample('reward') || !ensure()) return;
    const t = ctx.currentTime + 0.02;
    const thump = ctx.createOscillator();
    const tg = ctx.createGain();
    thump.type = 'sine';
    thump.frequency.setValueAtTime(150, t);
    thump.frequency.exponentialRampToValueAtTime(65, t + 0.35);
    tg.gain.setValueAtTime(0.0001, t);
    tg.gain.linearRampToValueAtTime(0.45, t + 0.02);
    tg.gain.exponentialRampToValueAtTime(0.0001, t + 0.6);
    thump.connect(tg).connect(master);
    thump.start(t);
    thump.stop(t + 0.65);

    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 2200;
    const delay = ctx.createDelay(1);
    delay.delayTime.value = 0.23;
    const fb = ctx.createGain();
    fb.gain.value = 0.28;
    const wet = ctx.createGain();
    wet.gain.value = 0.3;
    lp.connect(master);
    lp.connect(delay);
    delay.connect(fb).connect(delay);
    delay.connect(wet).connect(master);
    [293.66, 440, 587.33, 739.99].forEach((f, i) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      const t0 = t + 0.08 + i * 0.1;
      o.type = 'triangle';
      o.frequency.value = f;
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(0.16, t0 + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + 1.5);
      o.connect(g).connect(lp);
      o.start(t0);
      o.stop(t0 + 1.6);
    });
  }

  /** Halk esőerdő-háttér: zúgás + tücsökciripelés + véletlenszerű madárhangok. */
  function startAmbience() {
    if (ambStarted || !ensure()) return;
    ambStarted = true;
    ambGain = ctx.createGain();
    ambGain.gain.setValueAtTime(0.0001, ctx.currentTime);
    ambGain.gain.linearRampToValueAtTime(1, ctx.currentTime + 3);
    ambGain.connect(master);

    if (samples.ambience && samples.ambience.length) {
      const s = ctx.createBufferSource();
      s.buffer = samples.ambience[0];
      s.loop = true;
      const g = ctx.createGain();
      g.gain.value = 0.35;
      s.connect(g).connect(ambGain);
      s.start();
      return;
    }

    const bed = noiseSrc(true);
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 800;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 120;
    const bg = ctx.createGain();
    bg.gain.value = 0.045;
    bed.connect(lp).connect(hp).connect(bg).connect(ambGain);
    bed.start();

    const ins = noiseSrc(true);
    const ibp = ctx.createBiquadFilter();
    ibp.type = 'bandpass';
    ibp.frequency.value = 4800;
    ibp.Q.value = 9;
    const ig = ctx.createGain();
    ig.gain.value = 0.012;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 13;
    const lfoAmt = ctx.createGain();
    lfoAmt.gain.value = 0.01;
    lfo.connect(lfoAmt).connect(ig.gain);
    ins.connect(ibp).connect(ig).connect(ambGain);
    ins.start(0, 1.3);
    lfo.start();

    scheduleBird();
  }

  function scheduleBird() {
    clearTimeout(birdTimer);
    birdTimer = setTimeout(() => {
      if (ctx && ctx.state === 'running' && !muted) bird();
      scheduleBird();
    }, rnd(2500, 7000));
  }

  function bird() {
    const t = ctx.currentTime + 0.02;
    const notes = 2 + ((Math.random() * 3) | 0);
    const base = rnd(2000, 3400);
    const pan = ctx.createStereoPanner ? ctx.createStereoPanner() : null;
    const out = ctx.createGain();
    out.gain.value = rnd(0.018, 0.04);
    if (pan) {
      pan.pan.value = rnd(-0.75, 0.75);
      out.connect(pan).connect(ambGain);
    } else {
      out.connect(ambGain);
    }
    for (let i = 0; i < notes; i++) {
      const t0 = t + i * rnd(0.12, 0.2);
      const d = rnd(0.07, 0.15);
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(base * rnd(0.9, 1.1), t0);
      o.frequency.exponentialRampToValueAtTime(base * rnd(1.15, 1.45), t0 + d * 0.5);
      o.frequency.exponentialRampToValueAtTime(base * rnd(0.8, 1), t0 + d);
      g.gain.setValueAtTime(0.0001, t0);
      g.gain.linearRampToValueAtTime(1, t0 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t0 + d);
      o.connect(g).connect(out);
      o.start(t0);
      o.stop(t0 + d + 0.02);
    }
  }

  function onVisibility() {
    if (!ctx) return;
    if (document.hidden) ctx.suspend().catch(() => {});
    else if (ambStarted) ctx.resume().catch(() => {});
  }
  document.addEventListener('visibilitychange', onVisibility);

  return {
    unlock: ensure,
    swoosh,
    rustle,
    reward,
    startAmbience,
    get muted() {
      return muted;
    },
    setMuted(m) {
      muted = !!m;
      writeMuted(muted);
      if (master) master.gain.setTargetAtTime(muted ? 0 : volume, ctx.currentTime, 0.05);
      listeners.forEach((fn) => fn(muted));
    },
    onChange(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
    /** Hangfájlok betöltése (Envato-hangok után): { swoosh: [url, url], rustle: [...], reward: [...], ambience: [url] } */
    async load(map) {
      if (!ensure()) return;
      await Promise.all(
        Object.entries(map).map(async ([name, urls]) => {
          const bufs = await Promise.all(
            urls.map((u) =>
              fetch(u)
                .then((r) => r.arrayBuffer())
                .then((b) => ctx.decodeAudioData(b))
                .catch(() => null),
            ),
          );
          samples[name] = bufs.filter(Boolean);
        }),
      );
    },
  };
}
