// A mai ajándék a tisztáson – nem felugró ablak: a növényzet mögött ez várja a vágás végén.
// A tisztás képén az aznapi növény áll; alatta, a sötét részen az ajánlat, a kód és a gombok.

import { h } from '../ui.js';
import { vibrate } from '../engine/device.js';

export function giftContent(ctx, o) {
  const { day, api, onTrail } = ctx;

  const codeText = h('span', { class: 'code' }, o.code);
  const copyBtn = h('button', { type: 'button', class: 'btn-copy' }, 'Másolás');
  copyBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(o.code);
      copyBtn.textContent = 'Másolva ✓';
    } catch {
      // régi böngésző: jelöljük ki a kódot
      const r = document.createRange();
      r.selectNodeContents(codeText);
      getSelection().removeAllRanges();
      getSelection().addRange(r);
      copyBtn.textContent = 'Jelöld ki és másold';
    }
    vibrate(20);
    api.track('copy_code', { day });
  });

  return h('section', { class: 'clearing-text', 'aria-labelledby': 'gift-title', tabindex: '-1', hidden: true },
    h('span', { class: 'kicker' }, `${day}. nap · tisztás`),
    h('h1', {}, day === 24 ? 'Célba értél!' : 'Átvágtad magad!'),
    h('div', { class: 'gift' },
      h('div', { class: 'kicker gold' }, day === 24 ? 'A nagy zsákmány' : 'A mai zsákmány'),
      h('h2', { id: 'gift-title' }, o.title),
      h('p', { class: 'gift-text' }, o.text),
      h('div', { class: 'gift-plant' }, h('span', {}, 'A tisztás növénye: '), h('strong', {}, o.plant)),
      h('div', { class: 'code-box' },
        h('div', { class: 'code-label' }, 'Kuponkód · ', h('span', { class: 'validity-inline' }, 'ma éjfélig érvényes')),
        h('div', { class: 'code-row' }, codeText, copyBtn)),
      h('a', {
        class: 'btn-gold', href: o.url, target: '_blank', rel: 'noopener',
        onclick: () => api.track('shop_click', { day }),
      }, 'Irány a webshop'),
      h('button', { type: 'button', class: 'btn-link', onclick: () => onTrail() },
        day === 24 ? 'A teljes ösvény →' : 'Az expedíció ösvénye →'),
      h('p', { class: 'demo-note' }, 'Demó: kitalált ajánlat és kód.')));
}
