// Képek előtöltése és dekódolása, hogy a belépő megjelenésekor ne akadjon.

const cache = new Map();

export function loadImage(src) {
  if (cache.has(src)) return cache.get(src);
  const p = new Promise((resolve) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => {
      (img.decode ? img.decode() : Promise.resolve()).catch(() => {}).then(() => resolve(img));
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
  cache.set(src, p);
  return p;
}

export async function preloadAll(srcs, onProgress) {
  let done = 0;
  const out = await Promise.all(
    srcs.map((s) =>
      loadImage(s).then((img) => {
        done++;
        onProgress?.(done / srcs.length);
        return img;
      }),
    ),
  );
  return out;
}
