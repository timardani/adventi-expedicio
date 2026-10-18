// Parallaxis – soha nem kér engedélyt, és nem ugrik fel semmi.
// - Ahol a döntésérzékelő engedély nélkül elérhető (Android Chrome, HTTPS alatt), a telefon
//   döntésére mozdulnak a rétegek.
// - iPhone-on a döntéshez rendszer-engedélyablak kellene, ezt szándékosan nem kérjük. Ott (és
//   mindenhol, ahol nincs döntés) az ujj mozgása mozgatja a rétegeket húzás közben.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

export function createParallax() {
  let targets = [];
  let tx = 0, ty = 0, cx = 0, cy = 0;
  let base = null;
  let listening = false;
  let lastTilt = 0;
  let enabled = true;
  let raf = 0;

  // iOS 13+: a döntéshez engedély kellene → ott nem iratkozunk fel
  const tiltNeedsPermission =
    typeof window.DeviceOrientationEvent !== 'undefined' &&
    typeof window.DeviceOrientationEvent.requestPermission === 'function';

  function kick() {
    if (!raf && enabled) raf = requestAnimationFrame(loop);
  }

  function onOrientation(e) {
    if (e.beta == null || e.gamma == null) return;
    lastTilt = performance.now();
    if (!base) base = { b: e.beta, g: e.gamma };
    // lassú újraközépre állás, ha a felhasználó máshogy tartja a telefont
    base.b += (e.beta - base.b) * 0.01;
    base.g += (e.gamma - base.g) * 0.01;
    tx = clamp((e.gamma - base.g) / 20, -1, 1);
    ty = clamp((e.beta - base.b) / 20, -1, 1);
    kick();
  }

  function loop() {
    cx += (tx - cx) * 0.1;
    cy += (ty - cy) * 0.1;
    for (const t of targets) {
      t.el.style.transform = `translate3d(${(cx * t.depth).toFixed(2)}px, ${(cy * t.depth).toFixed(2)}px, 0)`;
    }
    const moving = Math.abs(tx - cx) > 0.002 || Math.abs(ty - cy) > 0.002;
    raf = moving && enabled ? requestAnimationFrame(loop) : 0;
  }

  return {
    start() {
      if (listening || !enabled || tiltNeedsPermission) return;
      window.addEventListener('deviceorientation', onOrientation);
      listening = true;
    },
    /**
     * Ujjpozíció (0–1) húzás közben. Ha éppen működik a döntésérzékelő, az elsőbbséget élvez.
     * Az ujjal ellentétes irányba mozdulnak a rétegek, mintha belelátnánk a sűrűbe.
     */
    pointer(nx, ny) {
      if (!enabled || performance.now() - lastTilt < 600) return;
      tx = clamp((0.5 - nx) * 2, -1, 1) * 0.8;
      ty = clamp((0.5 - ny) * 2, -1, 1) * 0.8;
      kick();
    },
    /** Elengedéskor lassan visszaáll középre (csak ujjas módban). */
    release() {
      if (performance.now() - lastTilt < 600) return;
      tx = 0; ty = 0;
      kick();
    },
    setTargets(list) {
      targets = list;
    },
    disable() {
      enabled = false;
      this.stop();
      for (const t of targets) t.el.style.transform = '';
    },
    stop() {
      window.removeEventListener('deviceorientation', onOrientation);
      listening = false;
      cancelAnimationFrame(raf);
      raf = 0;
    },
  };
}
