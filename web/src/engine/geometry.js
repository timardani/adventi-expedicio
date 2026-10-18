// A vágás geometriája: egy egyenes két félre bontja a fal téglalapját.
// Tiszta függvények, böngésző nélkül is tesztelhetők (web/test/geometry.test.js).

export const MIN_DRAG = 60; // ennél rövidebb húzás koppintásnak számít (CSS px)

/** Az a→b egyenes melyik oldalán van p (>0: a normálvektor felé). */
function side(a, d, p) {
  return d.x * (p.y - a.y) - d.y * (p.x - a.x);
}

function clipHalfPlane(poly, a, d, sign) {
  const out = [];
  for (let i = 0; i < poly.length; i++) {
    const cur = poly[i];
    const prev = poly[(i + poly.length - 1) % poly.length];
    const sc = side(a, d, cur) * sign;
    const sp = side(a, d, prev) * sign;
    if (sc >= 0) {
      if (sp < 0) out.push(intersect(prev, cur, a, d));
      out.push(cur);
    } else if (sp >= 0) {
      out.push(intersect(prev, cur, a, d));
    }
  }
  return out;
}

function intersect(p, q, a, d) {
  const sp = side(a, d, p);
  const sq = side(a, d, q);
  const t = sp / (sp - sq);
  return { x: p.x + (q.x - p.x) * t, y: p.y + (q.y - p.y) * t };
}

/**
 * A (w×h) téglalap kettévágása az a→b pontokon átmenő (végtelen) egyenessel.
 * @returns {{a: {x,y}[], b: {x,y}[], normal: {x,y}, dir: {x,y}, segment: [{x,y},{x,y}]} | null}
 *   a: a normál felőli fél, b: a túloldali fél, segment: az egyenes téglalapon belüli szakasza.
 */
export function splitRect(w, h, a, b) {
  const len = Math.hypot(b.x - a.x, b.y - a.y);
  if (!(len > 0.5)) return null;
  const d = { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
  const rect = [{ x: 0, y: 0 }, { x: w, y: 0 }, { x: w, y: h }, { x: 0, y: h }];
  const A = clipHalfPlane(rect, a, d, 1);
  const B = clipHalfPlane(rect, a, d, -1);
  if (A.length < 3 || B.length < 3) return null;
  // a szakasz: azok a pontok, amelyek mindkét félben szerepelnek (a metszéspontok)
  const pts = A.filter((p) => Math.abs(side(a, d, p)) < 1e-6);
  let segment;
  if (pts.length >= 2) {
    // irány szerint rendezve
    pts.sort((p, q) => (p.x - q.x) * d.x + (p.y - q.y) * d.y);
    segment = [pts[0], pts[pts.length - 1]];
  } else {
    segment = [a, b];
  }
  return { a: A, b: B, normal: { x: -d.y, y: d.x }, dir: d, segment };
}

/** CSS clip-path poligon px-ben. */
export function toClipPath(poly) {
  return 'polygon(' + poly.map((p) => `${round(p.x)}px ${round(p.y)}px`).join(', ') + ')';
}

function round(v) {
  return Math.round(v * 10) / 10;
}

/**
 * Koppintáshoz véletlenszerű átlós vonal a koppintás közelében.
 * 18–38°-os dőlés, véletlen irányban; a középpont függőlegesen a fal középső felében marad.
 */
export function randomDiagonal(w, h, at, rnd = Math.random) {
  const deg = 18 + rnd() * 20;
  const sign = rnd() < 0.5 ? -1 : 1;
  const ang = (sign * deg * Math.PI) / 180;
  const cx = at ? clamp(at.x, w * 0.2, w * 0.8) : w / 2;
  const cy = at ? clamp(at.y, h * 0.25, h * 0.75) : h * (0.35 + rnd() * 0.3);
  const d = { x: Math.cos(ang), y: Math.sin(ang) };
  const r = Math.max(w, h);
  return [
    { x: cx - d.x * r, y: cy - d.y * r },
    { x: cx + d.x * r, y: cy + d.y * r },
  ];
}

export function clamp(v, lo, hi) {
  return Math.min(hi, Math.max(lo, v));
}

/** Húzás vagy koppintás? */
export function classifyGesture(start, end) {
  return Math.hypot(end.x - start.x, end.y - start.y) >= MIN_DRAG ? 'drag' : 'tap';
}
