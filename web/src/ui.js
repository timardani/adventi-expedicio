// Kis DOM-segédek és közös elemek.

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === 'class') el.className = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
    else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
    else if (k === 'html') el.innerHTML = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  for (const c of children.flat()) {
    if (c == null || c === false) continue;
    el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  }
  return el;
}

export const MACHETE_SVG = `<svg viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M10 50 L44 16 C50 10 58 8 60 10 C58 14 54 22 48 28 L18 58 Z" fill="#E9E4D6" stroke="#0C130E" stroke-width="2" stroke-linejoin="round"/><path d="M14 54 L18 58 L8 62 C4 63 2 61 3 57 L6 47 L10 50 Z" fill="#6B4A2A" stroke="#0C130E" stroke-width="2" stroke-linejoin="round"/><path d="M22 46 L46 22" stroke="#9AA39A" stroke-width="1.5"/></svg>`;

export const MACHETE_SMALL_SVG = `<svg width="20" height="20" viewBox="0 0 64 64" fill="none" aria-hidden="true"><path d="M10 50 L44 16 C50 10 58 8 60 10 C58 14 54 22 48 28 L18 58 Z" fill="#1E1405"/><path d="M14 54 L18 58 L8 62 C4 63 2 61 3 57 L6 47 L10 50 Z" fill="#6B4A2A"/></svg>`;

export function header(brand, pill) {
  return h('header', { class: 'top-bar' },
    h('span', { class: 'brand' }, brand),
    h('span', { class: 'pill' }, pill));
}

export const asset = (p) => `${import.meta.env.BASE_URL}assets/${p}`;

export function decDate(day) {
  return `dec. ${day}.`;
}

/** Magyar névelő a számok elé: a(z) – 1, 5, 50… elé „az”. */
export function article(n) {
  const s = String(n);
  return s === '1' || s.startsWith('5') ? 'az' : 'a';
}
