// A háttér hívásai. A demóban MOCK: a ?nap=N és ?kihagyott=... paraméterekből számol.
// A 2. fázisban ugyanezek a függvények a valódi API-t hívják:
//   getToday   -> GET  /api/today
//   getTrail   -> GET  /api/trail
//   openDay    -> POST /api/open/:day
//   track      -> statisztika (vágások, nyitások, kódmásolások, kattintások)
//   subscribe  -> POST /api/subscribe (e-mail kapu; élesben double opt-in megerősítő levéllel)
//   getPlayer  -> ki játszik ezen az eszközön (élesben: belépő süti / belépőlink)
// A napi zárolás (Europe/Budapest) éles rendszerben szerveroldalon történik.

import { OFFERS } from './data/offers.js';
import { DAYS } from './params.js';

const PLAYER_KEY = 'ae-jatekos';

export function createMockApi({ day, missed }) {
  const opened = new Set();
  for (let d = 1; d < day; d++) if (!missed.includes(d)) opened.add(d);

  function offer(d) {
    if (d < 1 || d > day) throw new Error('Ez a nap még nem nyílt ki.');
    return OFFERS[d - 1];
  }

  function status(d) {
    if (d > day) return 'future';
    if (d === day) return opened.has(d) ? 'today-opened' : 'today';
    return opened.has(d) ? 'opened' : 'missed';
  }

  return {
    async getToday() {
      return { day, offer: offer(day), opened: opened.has(day) };
    },
    async getTrail() {
      const days = [];
      for (let d = 1; d <= DAYS; d++) {
        const s = status(d);
        days.push(s === 'future' ? { day: d, status: s } : { day: d, status: s, ...pick(offer(d)) });
      }
      return { today: day, total: DAYS, openedCount: opened.size, days };
    },
    async openDay(d) {
      const o = offer(d);
      opened.add(d);
      return o;
    },
    async getOffer(d) {
      return { ...offer(d), status: status(d) };
    },
    getPlayer() {
      try {
        return JSON.parse(localStorage.getItem(PLAYER_KEY) || 'null');
      } catch {
        return null;
      }
    },
    forgetPlayer() {
      try { localStorage.removeItem(PLAYER_KEY); } catch { /* privát mód */ }
    },
    async subscribe({ email, rules, newsletter }) {
      // MOCK: élesben a szerver menti a hozzájárulásokat (időbélyeg, szövegverzió) és megerősítő
      // levelet küld. A játék a megerősítésig is mehet; a napi e-mail csak megerősítés után indul.
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw new Error('email');
      if (!rules) throw new Error('rules');
      const player = { email, newsletter: !!newsletter, at: new Date().toISOString() };
      try { localStorage.setItem(PLAYER_KEY, JSON.stringify(player)); } catch { /* privát mód */ }
      return player;
    },
    track(event, data = {}) {
      if (import.meta.env?.DEV) console.debug('[track]', event, data);
    },
  };
}

function pick(o) {
  return { title: o.title, image: o.image, clearing: o.clearing, plant: o.plant };
}
