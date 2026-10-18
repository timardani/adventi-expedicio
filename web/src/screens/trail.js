// 2. képernyő: az ösvény (a naptár). A jóváhagyott 390 px széles terv koordinátáit használja,
// a lapot a képernyő szélességére skálázzuk. A háttér és a benőtt előtér napi kép
// (pipeline/trail_days.py), az állomások HTML-elemek a megnyitott napok listája alapján.
// Döntés (Dani, 2026-10-17): a korábbi napok nem nyithatók újra – sem a megnyitottak, sem a
// kimaradtak. Az ösvényen csak látszanak; egyedül a mai tisztás érhető el.

import { h, header, asset, decDate, MACHETE_SMALL_SVG } from '../ui.js';
import { loadImage } from '../engine/preload.js';

const PAGE_W = 390;

export async function mountTrail(root, ctx) {
  const { day, api, brand, onCut, onClearing } = ctx;
  const nn = String(day).padStart(2, '0');
  const [layout, trail] = await Promise.all([
    fetch(asset(`trail/layout-${nn}.json`)).then((r) => r.json()),
    api.getTrail(),
  ]);
  await Promise.all([loadImage(asset(`trail/bg-${nn}.webp`)), loadImage(asset(`trail/front-${nn}.webp`))]);

  const H = layout.height;
  const page = h('div', { class: 'trail-page', style: { width: PAGE_W + 'px', height: H + 'px' } });
  const sizer = h('div', { class: 'trail-sizer' }, page);
  const scroller = h('div', { class: 'trail-scroll' }, sizer);
  const screen = h('section', { class: 'screen trail' }, scroller);
  root.replaceChildren(screen);

  page.append(h('img', { class: 'trail-bg', src: asset(`trail/bg-${nn}.webp`), alt: '', 'aria-hidden': 'true', style: { height: H + 'px' } }));
  const top = header(brand, decDate(day));
  top.classList.add('trail-header');
  page.append(top);
  page.append(
    h('div', { class: 'trail-intro' },
      h('div', { class: 'kicker gold' }, 'Adventi expedíció'),
      h('h1', {}, 'Az ösvény'),
      h('p', {}, `Minden reggel egy újabb szakaszt vághatsz ki a dzsungelből. Eddig ${day} szakasz a 24-ből.`)),
  );

  const byDay = new Map(trail.days.map((d) => [d.day, d]));
  const list = h('ol', { class: 'stations', 'aria-label': 'Az ösvény szakaszai' });
  page.append(list);

  // megtett és kimaradt napok
  layout.stops.forEach(([x, y], i) => {
    const d = byDay.get(i + 1);
    const leftSide = x < PAGE_W / 2;
    const pos = { left: x - 38 + 'px', top: y - 38 + 'px' };
    if (d.status === 'missed') {
      list.append(
        h('li', { class: 'station missed', style: pos, 'aria-label': `${d.day}. szakasz, kimaradt, már benőtte a dzsungel` },
          h('div', { class: 'st-photo dashed' },
            h('img', { src: asset(d.image), alt: '', class: 'blurred' }),
            h('span', { class: 'st-num' }, String(d.day))),
          h('div', { class: 'st-label ' + (leftSide ? 'right' : 'left'), 'aria-hidden': 'true' },
            h('div', { class: 'st-kicker muted' }, 'Kimaradt'),
            h('div', { class: 'st-title' }, 'Ezt a szakaszt már benőtte a dzsungel'))),
      );
    } else {
      list.append(
        h('li', { class: 'station done', style: pos, 'aria-label': `${d.day}. szakasz: ${d.title}` },
          h('div', { class: 'st-photo' },
            h('img', { src: asset(d.image), alt: '' })),
          h('span', { class: 'st-badge', 'aria-hidden': 'true' }, String(d.day)),
          h('div', { class: 'st-label ' + (leftSide ? 'right' : 'left'), 'aria-hidden': 'true' },
            h('div', { class: 'st-kicker' }, `${d.day}. szakasz`),
            h('div', { class: 'st-title' }, d.title))),
      );
    }
  });

  // mai nap: izzó tisztás
  const today = byDay.get(day);
  const openedToday = today.status === 'today-opened';
  const [tx, ty] = layout.today;
  list.append(
    h('li', { class: 'station today', style: { left: tx - 90 + 'px', top: ty - 90 + 'px' } },
      h('div', { class: 'today-ring glowring' },
        h('img', { src: asset(openedToday ? today.image : today.clearing), alt: '', class: openedToday ? 'today-img' : 'today-img blurred' }),
        h('div', { class: 'today-shade' }),
        h('div', { class: 'today-text' },
          h('span', { class: 'today-ma' }, 'Ma'),
          h('span', { class: 'today-num' }, String(day)))),
      openedToday
        ? h('button', { type: 'button', class: 'btn-gold btn-cta', onclick: () => onClearing() }, 'Vissza a mai tisztásra')
        : h('button', { type: 'button', class: 'btn-gold btn-cta', onclick: () => onCut(), html: `${MACHETE_SMALL_SVG}<span>Vágj utat a mai ajándékig</span>` })),
  );

  // jövőbeli jelzőkövek a benőtt részben; a holnapi arany szegéllyel kandikál ki
  layout.over.forEach(([x, y], i) => {
    const d = day + 1 + i;
    list.append(
      h('li', {
        class: 'marker' + (i === 0 ? ' tomorrow' : ''),
        style: { left: x - 22 + 'px', top: y - 22 + 'px' },
        'aria-label': `${d}. szakasz, még benőtte a dzsungel`,
      }, String(d)),
    );
  });

  page.append(h('img', { class: 'trail-front', src: asset(`trail/front-${nn}.webp`), alt: '', 'aria-hidden': 'true', style: { height: H + 'px' } }));

  page.append(
    day < 24
      ? h('div', { class: 'dense-text', style: { top: layout.denseTextTop + 'px' } },
        h('div', { class: 'dense-title' }, 'Innen még sűrű a dzsungel'),
        h('p', {}, 'A következő szakasz holnap reggel nyílik. Szólunk e-mailben, amikor élesítheted a machetét.'))
      : h('div', { class: 'dense-text', style: { top: layout.denseTextTop + 'px' } },
        h('div', { class: 'dense-title' }, openedToday ? 'Célba értél!' : 'Az utolsó szakasz'),
        h('p', {}, openedToday
          ? 'Mind a 24 napot végigjártad. Köszönjük, hogy velünk tartottál az expedíción.'
          : 'Még egy vágás, és célba érsz. Ott vár a nagy zsákmány.')),
  );
  page.append(
    h('footer', { class: 'trail-footer', style: { top: H - 70 + 'px' } },
      h('a', { href: '#' }, 'Adatkezelés'),
      h('a', { href: '#' }, 'Játékszabályzat')),
  );

  // skálázás a képernyő szélességére
  function fit() {
    const w = scroller.clientWidth;
    const s = w / PAGE_W;
    page.style.transform = `scale(${s})`;
    sizer.style.height = H * s + 'px';
    return s;
  }
  const ro = new ResizeObserver(fit);
  ro.observe(scroller);
  const s = fit();
  // a mai nap legyen látható
  // a mai nap legyen látható; az első napokon a lap teteje (fejléc, cím) is
  scroller.scrollTop = ctx.scrollTop ?? (ty < 650 ? 0 : (ty - 260) * s);

  return () => ro.disconnect();
}
