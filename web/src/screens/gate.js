// E-mail kapu – a legelső képernyő (döntés: Dani, 2026-10-17). Csak a megadott cím után lehet vágni.
// A játékszabályzat + adatkezelés elfogadása kötelező (enélkül nem tudunk napi e-mailt küldeni),
// a hírlevél KÜLÖN, nem kötelező jelölőnégyzet: a GDPR szerint a marketing-hozzájárulás nem lehet
// a játék feltétele.

import { h, header, asset, MACHETE_SMALL_SVG } from '../ui.js';

export function mountGate(root, ctx, { onDone }) {
  const { brand, api, audio, wallSet } = ctx;

  const email = h('input', {
    type: 'email', id: 'gate-email', name: 'email', required: true, autocomplete: 'email',
    inputmode: 'email', placeholder: 'te@pelda.hu', class: 'gate-input', 'aria-describedby': 'gate-error',
  });
  const rules = h('input', { type: 'checkbox', id: 'gate-rules', required: true });
  const news = h('input', { type: 'checkbox', id: 'gate-news' });
  const error = h('p', { class: 'gate-error', id: 'gate-error', 'aria-live': 'polite' });
  const submit = h('button', { type: 'submit', class: 'btn-gold', html: `${MACHETE_SMALL_SVG}<span>Indulhat az expedíció</span>` });

  const form = h('form', { class: 'gate-form', novalidate: true },
    h('label', { class: 'gate-label', for: 'gate-email' }, 'E-mail címed'),
    email,
    h('label', { class: 'gate-check' }, rules,
      h('span', {}, 'Elfogadom a ', h('a', { href: '#', target: '_blank' }, 'játékszabályzatot'),
        ' és az ', h('a', { href: '#', target: '_blank' }, 'adatkezelési tájékoztatót'), '.')),
    h('label', { class: 'gate-check' }, news,
      h('span', {}, 'Kérem a hírlevelet is.')),
    error,
    submit);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    // a gombnyomás felhasználói gesztus: itt már engedélyezhető a hang
    audio.unlock();
    error.textContent = '';
    try {
      await api.subscribe({ email: email.value.trim(), rules: rules.checked, newsletter: news.checked });
      api.track('subscribe', { newsletter: news.checked });
      onDone();
    } catch (err) {
      if (err.message === 'rules') {
        error.textContent = 'A játékhoz fogadd el a játékszabályzatot és az adatkezelési tájékoztatót.';
        rules.focus();
      } else {
        error.textContent = 'Ez nem tűnik érvényes e-mail címnek.';
        email.focus();
      }
    }
  });

  const screen = h('section', { class: 'screen gate' },
    h('img', { class: 'gate-bg', src: asset(`walls/set-${wallSet}/wall4.webp`), alt: '', 'aria-hidden': 'true' }),
    h('div', { class: 'gate-shade', 'aria-hidden': 'true' }),
    header(brand, 'Adventi expedíció'),
    h('div', { class: 'gate-body' },
      h('div', { class: 'kicker gold' }, 'December 1–24.'),
      h('h1', {}, 'Indul az adventi expedíció'),
      h('p', { class: 'gate-lead' }, '24 nap, 24 ajándék. Vágj utat a machetével!'),
      form));
  root.replaceChildren(screen);
  return () => {};
}
