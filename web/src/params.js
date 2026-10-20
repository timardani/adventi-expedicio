// URL-paraméterek a demóhoz.
//   ?nap=N          a mai nap (1–24). Alapból: decemberben a budapesti dátum, máskor 7.
//   ?kihagyott=4,9  kimaradt napok (alapból: 4, ha a mai nap > 4 – mint a jóváhagyott látványon)
//   ?falak=4        falak száma (3–5). Alapból minden betöltésnél véletlenszerű 3 és 5 között.
//   ?kepernyo=osveny | ajandek   közvetlen indítás (ajandek = a már átvágott tisztás a mai ajándékkal)
//   ?kapu=0 | 1     e-mail kapu: 0 = kihagyás, 1 = mindenképp megjelenik (a megadott címet elfelejti)
//   ?panel=0        a napválasztó elrejtése (a régi ?demo=0 is működik)

export const DAYS = 24;

export function budapestDate(now = new Date()) {
  const s = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Europe/Budapest', year: 'numeric', month: '2-digit', day: '2-digit',
  }).format(now);
  const [y, m, d] = s.split('-').map(Number);
  return { y, m, d };
}

export function defaultDay(now = new Date()) {
  const { m, d } = budapestDate(now);
  return m === 12 && d >= 1 && d <= DAYS ? d : 7;
}

/** Hány ezredmásodperc van hátra a budapesti éjfélig (napváltás, kuponlejárat). */
export function msUntilBudapestMidnight(now = new Date()) {
  const s = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/Budapest', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).format(now);
  const [hh, mm, ss] = s.split(':').map(Number);
  const left = 86400 - (hh * 3600 + mm * 60 + ss);
  return left * 1000 - now.getMilliseconds();
}

/** Rövid visszaszámláló: „11 ó 23 p”, egy óra alatt „23 p”, egy perc alatt „1 p”. */
export function formatCountdown(ms) {
  const min = Math.max(1, Math.ceil(ms / 60000));
  const hh = Math.floor(min / 60);
  const mm = min % 60;
  return hh > 0 ? `${hh} ó ${mm} p` : `${mm} p`;
}

function toDay(v) {
  if (v == null || v === '') return null;
  const n = Number.parseInt(String(v), 10);
  if (!Number.isFinite(n)) return null;
  return Math.min(DAYS, Math.max(1, n));
}

export const WALLS_MIN = 3;
export const WALLS_MAX = 5;

export function parseParams(search, now = new Date(), rnd = Math.random) {
  const q = new URLSearchParams(search);
  const day = toDay(q.get('nap')) ?? defaultDay(now);
  let missed;
  if (q.has('kihagyott')) {
    missed = (q.get('kihagyott') || '')
      .split(',')
      .map(toDay)
      .filter((d) => d != null && d < day);
  } else {
    missed = day > 4 ? [4] : [];
  }
  const fal = Number.parseInt(q.get('falak') || '', 10);
  const walls = fal >= WALLS_MIN && fal <= WALLS_MAX
    ? fal
    : WALLS_MIN + Math.floor(rnd() * (WALLS_MAX - WALLS_MIN + 1));
  const scr = q.get('kepernyo');
  const kapu = q.get('kapu');
  const screen = ['osveny', 'ajandek'].includes(scr) ? scr : 'belepo';
  return {
    day,
    missed: [...new Set(missed)].sort((a, b) => a - b),
    walls,
    screen,
    gate: kapu === '0' ? 'skip' : kapu === '1' ? 'force' : 'auto',
    panel: q.get('panel') !== '0' && q.get('demo') !== '0',
  };
}

/** Ugyanaz a URL, más nappal (a többi paraméter marad). */
export function urlForDay(href, day) {
  const u = new URL(href);
  u.searchParams.set('nap', String(day));
  u.searchParams.delete('kepernyo');
  return u.toString();
}
