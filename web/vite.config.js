import { defineConfig } from 'vite';

// A linkelőnézet képének teljes URL kell (Messenger, e-mail). Build közben: PUBLIC_URL=https://demo.pelda.hu/
// Ha nincs megadva, relatív marad (helyben ez is jó).
const publicUrl = (() => {
  const u = (process.env.PUBLIC_URL || '').trim();
  if (!u) return './';
  return u.endsWith('/') ? u : u + '/';
})();

// Relatív base: a demó bármilyen statikus tárhelyre vagy almappába kitehető.
export default defineConfig({
  base: './',
  server: { host: true, port: 5180 },
  preview: { host: true, port: 5181 },
  // a Vite saját fájljai külön mappába, hogy ne keveredjenek a public/assets képeivel
  build: { target: 'es2020', assetsInlineLimit: 0, assetsDir: '_app' },
  plugins: [
    {
      name: 'public-url',
      transformIndexHtml: (html) => html.replaceAll('__PUBLIC_URL__', publicUrl),
    },
  ],
});
