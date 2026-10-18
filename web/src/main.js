import '@fontsource/saira-stencil-one/400.css';
import '@fontsource/work-sans/400.css';
import '@fontsource/work-sans/500.css';
import '@fontsource/work-sans/600.css';
import './styles.css';

import { parseParams, urlForDay, DAYS } from './params.js';
import { createMockApi } from './api.js';
import { createAudio } from './engine/audio.js';
import { createParallax } from './engine/parallax.js';
import { prefersReducedMotion } from './engine/device.js';
import { preloadAll } from './engine/preload.js';
import { h, asset } from './ui.js';
import { mountIntro } from './screens/intro.js';
import { mountTrail } from './screens/trail.js';
import { mountGate } from './screens/gate.js';

const BRAND = 'Moai Jungle';
const WALL_SETS = 6;
const SPRITES = 8;
const FRONT_WALL = 4; // wall4 = legelső, wall0 = leghátsó

const params = parseParams(location.search);
const phone = document.getElementById('app');
const stage = h('div', { class: 'stage' });
phone.append(stage);

// Nincs külön „gyenge gép” mód (döntés: mindenhol ugyanaz az élmény). fewParticles csak akkor
// kapcsol be, ha a belépőn mért FPS 40 alatti: ilyenkor kevesebb levéldarab repül.
const device = {
  fewParticles: false,
  reduced: prefersReducedMotion(),
};
const audio = createAudio();
const parallax = createParallax();
const api = createMockApi(params);

// naponta más fal: 6 készlet forog, minden második körben tükrözve → 12 változat
const wallSet = ((params.day - 1) % WALL_SETS) + 1;
const mirror = Math.floor((params.day - 1) / WALL_SETS) % 2 === 1;
const wallCount = params.walls; // 3–5, alapból véletlenszerű

let unmount = null;
const ctx = {
  day: params.day,
  brand: BRAND,
  api,
  audio,
  parallax,
  device,
  wallSet,
  mirror,
  wallCount,
  sprites: [],
  onTrail: () => show('osveny'),
  onCut: () => show('belepo'),
  onClearing: () => show('belepo', { cleared: true }),
};

// ——— Hang némító (minden képernyőn ugyanott) ———
const muteBtn = h('button', { type: 'button', class: 'mute-btn' });
function renderMute() {
  const m = audio.muted;
  muteBtn.setAttribute('aria-pressed', String(m));
  muteBtn.setAttribute('aria-label', m ? 'Hang bekapcsolása' : 'Hang némítása');
  muteBtn.innerHTML = m
    ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16 9l5 6M21 9l-5 6" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>'
    : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9h4l5-4v14l-5-4H4z" fill="currentColor"/><path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/></svg>';
}
muteBtn.addEventListener('click', () => {
  audio.unlock();
  audio.setMuted(!audio.muted);
});
audio.onChange(renderMute);
renderMute();
phone.append(muteBtn);

// ——— Demó-napválasztó ———
if (params.demo) {
  const panel = h('div', { class: 'demo-panel', hidden: true },
    h('div', { class: 'demo-days' },
      Array.from({ length: DAYS }, (_, i) =>
        h('a', { href: urlForDay(location.href, i + 1), class: i + 1 === params.day ? 'on' : '' }, String(i + 1)))),
    h('button', {
      type: 'button', class: 'demo-reset',
      onclick: () => { api.forgetPlayer(); location.reload(); },
    }, 'E-mail kapu újra'),
    h('div', { class: 'demo-hint' }, 'Paraméterek: ?nap=N · ?kihagyott=4,9 · ?falak=3…5 · ?kepernyo=osveny|ajandek · ?kapu=0|1'));
  const toggle = h('button', { type: 'button', class: 'demo-toggle', 'aria-expanded': 'false' }, `Demó · ${params.day}. nap`);
  toggle.addEventListener('click', () => {
    panel.hidden = !panel.hidden;
    toggle.setAttribute('aria-expanded', String(!panel.hidden));
  });
  phone.append(h('div', { class: 'demo' }, panel, toggle));
}

async function show(name, opts = {}) {
  unmount?.();
  unmount = null;
  phone.dataset.screen = name;
  if (name === 'kapu') {
    unmount = mountGate(stage, ctx, { onDone: () => show('belepo') });
  } else if (name === 'osveny') {
    unmount = await mountTrail(stage, { ...ctx, scrollTop: opts.scrollTop });
  } else {
    const { offer, opened } = await api.getToday();
    unmount = mountIntro(stage, { ...ctx, offer, cleared: !!opts.cleared || opened });
  }
}

// ——— Előtöltés, majd indulás ———
async function boot() {
  const bar = h('div', { class: 'loader-bar' });
  const loader = h('div', { class: 'loader', role: 'status' },
    h('div', { class: 'loader-title' }, 'Élesítjük a machetét…'),
    h('div', { class: 'loader-track' }, bar));
  stage.replaceChildren(loader);

  const { offer } = await api.getToday();
  const first = FRONT_WALL - wallCount + 1;
  const wallSrcs = [];
  for (let i = first; i <= FRONT_WALL; i++) wallSrcs.push(asset(`walls/set-${wallSet}/wall${i}.webp`));
  const spriteSrcs = Array.from({ length: SPRITES }, (_, i) => asset(`particles/p${i}.webp`));
  const imgs = await preloadAll([asset(offer.clearing), ...wallSrcs, ...spriteSrcs], (p) => {
    bar.style.transform = `scaleX(${p})`;
  });
  ctx.sprites = imgs.slice(1 + wallSrcs.length).filter(Boolean);

  if (params.gate === 'force') api.forgetPlayer();
  const needsGate = params.gate !== 'skip' && !api.getPlayer();
  if (needsGate) await show('kapu');
  else if (params.screen === 'osveny') await show('osveny');
  else await show('belepo', { cleared: params.screen === 'ajandek' });

  // az ösvény képeit a háttérben előre letöltjük
  const nn = String(params.day).padStart(2, '0');
  const idle = window.requestIdleCallback || ((fn) => setTimeout(fn, 1200));
  idle(() => preloadAll([asset(`trail/bg-${nn}.webp`), asset(`trail/front-${nn}.webp`)]));
}

boot();
