# Átadás – Adventi expedíció (állapot: 2026-10-18)

Ezt olvassa el először minden új chat. Utána: `README.md` (futtatás, paraméterek) és a terv:
`/Users/danieltimar/Documents/tacitOS Artifacts/2026-10-17/adventi-expedicio-fejlesztesi-terv.md`
(a 0/b és 0/c pont a legfrissebb döntések).

---

## 1. Szabályok (Dani)

- Fejlesztés **csak** a `/Users/danieltimar/Documents/Vibecode/` alatt; ez a projekt: `.../Vibecode/adventi-expedicio`.
- A `/Users/danieltimar/Documents/Vibecode/moai-kalendarium` **csak olvasható**, semmit nem módosítunk benne.
- Fájlt/mappát törölni csak Dani kifejezett engedélyével, és akkor is a Kukába.
- Commit és push csak Dani kérésére. Deploy és élesadat-módosítás csak külön kérésre.
- **Fejlesztési szünet:** a Moai bemutatójáig nem fejlesztünk újat. A bemutató után az ügyfél ötleteit fésüljük bele.

## 2. Hol tartunk

Az **1. fázis (dinamikus mobilos demó) kész**, helyben fut. Egyetlen hiányzó lépés: **a megosztható HTTPS-link (Coolify)**.

Folyamat a demóban: e-mail kapu → belépő (3–5 levélfal, vágás húzással/koppintással) → tisztás az aznapi
növénnyel és a mai ajándékkal (nem felugró) → ösvény (24 nap; régi napok csak látszanak).

Ellenőrizve (2026-10-17/18): `npm test` 10/10, `npm run build` ok, böngészőben a kapu (hibás cím, elfogadás
nélkül), 3 és 5 fal, az 1., 4., 7., 12., 24. nap teljes útja, 150 kép elérhető, nincs JS-hiba.
**Nincs még kipróbálva valódi telefonon** (iPhone Safari, Android Chrome) – ez a bemutató előtti teendő.

## 3. Következő lépés: demólink (Dani teszi meg holnap)

1. **Dani:** github.com/new → **üres, privát** tároló `adventi-expedicio` néven a `timardani` fiókban
   (README, .gitignore, licenc nélkül).
2. **Agent, Dani jóváhagyásával:** a projekt gyökerében
   ```bash
   git init -b main
   git add .            # a .gitignore kizárja: node_modules, dist, pipeline/.venv, __pycache__
   git commit -m "Adventi expedíció – 1. fázis demó"
   git remote add origin git@github.com:timardani/adventi-expedicio.git
   git push -u origin main
   ```
   (A Lupix CRM ugyanígy SSH-val pusholt a `timardani` fiókba. A csomag kb. 80 MB, főleg képek.)
3. **Coolify** (Dani, vagy az agent API-kulccsal – a kulcsot csak a tacitOS biztonságos űrlapján!):
   - New Resource → Private Repository → `timardani/adventi-expedicio`, ág: `main`
   - Build Pack: **Dockerfile**, Base Directory: **`/web`**, Port: **80**
   - Domain: pl. `https://adventi-demo.lupix.hu` (DNS: A/CNAME a Coolify-szerverre)
   - Build Variable: **`PUBLIC_URL=https://adventi-demo.lupix.hu/`** (ettől lesz jó a linkelőnézet képe)
   - Deploy, majd ellenőrzés: a főoldal, `/og-kep.jpg`, `/favicon.svg`, és a telefonon a teljes folyamat.
4. Linkek az ügyfélnek:
   - Bemutatóhoz (napválasztóval): `https://<domain>/?nap=7`
   - Ügyfél saját kipróbálásához: `https://<domain>/?nap=7&demo=0`

Helyben, ugyanazon a wifin: `http://192.168.0.25:5180/?nap=7` (a Mac IP-je változhat; `npm run dev` a `web/`-ben).
HTTP alatt nincs döntéses parallaxis Androidon, és a „Másolás” kijelöléssel működik.

## 4. Bemutató forgatókönyv (Moai, kb. 10 perc)

1. **Link elküldése** Messengeren: a linkelőnézet (kép + cím) már a márkát mutatja.
2. **E-mail kapu:** „Itt gyűjtjük a címet. Aki bepipálja a hírlevelet, az a tiétek marad; mindenkit
   naponta értesítünk, hogy nyissa ki.” (lásd terv 0/c)
3. **Vágás:** egyszer húzással, egyszer koppintással. Hang (némító jobb felül), Androidon rezgés.
4. **Tisztás:** az aznapi növény a saját fotótokból, alatta az ajánlat és a kuponkód (Másolás), webshop-gomb.
5. **Ösvény:** megtett napok a termékfotókkal, egy kimaradt nap, a holnapi arany szegéllyel kandikál ki.
6. **Napváltás** a demópanelen (jobb felül): 1. nap (kezdés), 24. nap („Célba értél!”).
7. Kérdések, amiket érdemes feltenni nekik: milyen 24 ajánlat lesz (és mely termékek), melyik növény melyik
   napon, legyen-e saját fotózás, milyen domain, ki küldi a leveleket (feladó), milyen a hírlevél-rendszerük.

Visszaállítás bemutató közben: demópanel → „E-mail kapu újra”, vagy `?kapu=1`.

## 5. Eldöntött dolgok röviden (részletek: terv 0/b, 0/c)

Ajándék beágyazva a tisztáson · e-mail kapu a legelején, a hírlevél külön, nem kötelező jelölőnégyzet ·
3–5 fal véletlenszerűen · régi napok nem nyithatók újra · nincs „gyenge gép” mód (csak FPS < 40 esetén kevesebb
levéldarab) · semmi nem ugrik fel (iPhone-on nincs mozgásengedély-kérés, ott az ujj mozgatja a parallaxist) ·
iPhone néma módban néma · a szintetizált hangok jók · termékfotók a `clients/moai-jungle/termekfotok/` mappában.

**Felírva, később beépítendő (nem a demóba):** előnyt ígérő hírlevél-szöveg, második feliratkozási esély a
24. napon, feliratkozói arány az adminban, DPA (terv 0/c).

## 6. Utána jövő fázisok (a terv szerint)

- **2. fázis – háttér:** API (`/api/today`, `/api/subscribe`, `/api/confirm`, `/api/trail`, `/api/open/:day`),
  szerveroldali napi zárolás (Europe/Budapest), double opt-in (javaslat: a játék a megerősítés előtt is mehet,
  a napi levél csak utána), napi e-mail (Brevo, cserélhető adapter), admin. Node (Hono/Fastify) + SQLite,
  ügyfelenként egy konténer. A `web/src/api.js` mock függvényei pontosan ezekre képeződnek le.
- **3. fázis – témarendszer:** `themes/amazonas/theme.json`, `clients/<bolt>/client.json`; a mostani
  `clients/moai-jungle/napok.json` ennek az előfutára. `pipeline/make_assets.py <bolt>` a meglévő
  szkriptekből (`day_assets.py`, `trail_days.py`, `demo_assets.py`).
- **4. fázis – élesítés:** valódi készülékek, terhelés, jog (DPA, tájékoztató), Moai írásos fotóengedély.

## 7. Technikai tudnivalók (hogy ne kelljen újra kitalálni)

- **Python:** a tacitOS terminál örököl egy hibás `PYTHONHOME`-ot → mindig így:
  `env -u PYTHONHOME -u PYTHONPATH pipeline/.venv/bin/python pipeline/<szkript>.py`
- **Vite pontosan 8.3.4** (a biztonsági szűrő a 7-es sorozatot sebezhetőnek jelezte). Ne `^`-os tartományt adj meg.
- **Böngészőeszköz:** hosszú (≈ 20 mp feletti) szkriptnél vagy várakozásnál újraindul („Cannot verify the
  current browser URL”). Hosszú ellenőrzést a háttérben indíts (`window.__res`), és 5 mp-es várakozásokkal olvasd ki.
- **Fontok a képgyártóhoz:** a `@fontsource` `latin` `.woff` fájlja jó Pillow-hoz (a `latin-ext` csak a
  kiegészítő betűket tartalmazza). Az `ő`/`ű` csak a `latin-ext`-ben van – ha kell, a kettőt kombinálni kell.
- **Napi növény cseréje:** `clients/moai-jungle/napok.json` → `napok`; a növény helye a fotón: `fotok.<név>.fokusz`
  `[x, y, méret]` (720×720). Utána `day_assets.py <nap>`. A kivágás a fotó szélén túlra is mehet (elmosott háttér).
- **Linkelőnézet:** `web/public/og-kep.jpg` (1200×630), `web/public/favicon.svg`; a teljes képcím a
  `PUBLIC_URL` build-változóból (`vite.config.js`).
- **Docker** helyben nincs elindítva, így a `web/Dockerfile` csak Coolify-on fut majd először (benne `npm test` is).
- **vibe-coding-guide napló:** projekt `project_38e4f59143d3e915` (már látszik az azonosító). A `--metadata-json`
  mező üresen rögzül, ezért minden lényeges a `--message`-be kerüljön.
- Üres, fölösleges mappa maradt: `pipeline/assets-src/` (Dani engedélyével a Kukába tehető).

## 8. Indító prompt a holnapi új chathez

> Olvasd el: `/Users/danieltimar/Documents/Vibecode/adventi-expedicio/ATADAS.md`. Létrehoztam az üres privát
> GitHub-tárolót (`timardani/adventi-expedicio`): tedd Gitbe a projektet, és pushold. Utána segíts a Coolify
> beállításában a 3. pont szerint. Új funkciót ne fejlessz, a `moai-kalendarium` mappához ne nyúlj.
