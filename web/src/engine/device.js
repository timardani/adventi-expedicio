// Készülék-képességek: csökkentett mozgás, iOS, FPS-mérés, rezgés.
// Nincs külön „gyenge gép” mód: ugyanaz az élmény fut minden telefonon (a régebbi iPhone-okon is).
// Biztonsági háló: ha a mért FPS mégis alacsony, csak a repülő levéldarabok száma csökken.

export function isIOS(nav = navigator) {
  const ua = nav.userAgent || '';
  return /iPad|iPhone|iPod/.test(ua) || (nav.platform === 'MacIntel' && nav.maxTouchPoints > 1);
}

export function prefersReducedMotion() {
  return window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
}

/** Átlagos FPS mérése rövid ideig (a belépő tétlen állapotában). */
export function measureFps(ms = 700) {
  return new Promise((resolve) => {
    let frames = 0;
    let start = 0;
    function tick(t) {
      if (!start) start = t;
      frames++;
      if (t - start < ms) requestAnimationFrame(tick);
      else resolve((frames - 1) / ((t - start) / 1000));
    }
    requestAnimationFrame(tick);
  });
}

/** Rezgés csapásonként. iPhone Safari nem támogatja: ott csendben elmarad. */
export function vibrate(ms = 30) {
  try {
    if (typeof navigator.vibrate === 'function') navigator.vibrate(ms);
  } catch {
    /* nem támogatott */
  }
}
