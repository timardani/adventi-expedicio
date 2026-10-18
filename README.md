# Adventi expedíció

Dinamikus, mobilos adventi kalendárium („Amazonas” téma). Első ügyfél: Moai Jungle.
Terv: `/Users/danieltimar/Documents/tacitOS Artifacts/2026-10-17/adventi-expedicio-fejlesztesi-terv.md`

## Állapot: 1. fázis – dinamikus demó (csak frontend, mock adatok)

Folyamat: **e-mail kapu → belépő (3–5 levélfal) → tisztás a mai növénnyel és ajándékkal → ösvény**.

```
adventi-expedicio/
├── design-prototipus/   # jóváhagyott látványterv (referencia, nem módosítjuk)
├── clients/moai-jungle/ # ügyfélspecifikus: termékfotók + napok.json (melyik nap melyik növény)
├── web/                 # vásárlói oldal (Vite + vanilla JS)
│   ├── src/engine/      # geometry (vágásvonal), fx (pengecsík, villanás, levéldarabok),
│   │                    # audio (Web Audio), parallax, device (FPS, rezgés), preload
│   ├── src/screens/     # gate (e-mail kapu), intro (belépő + tisztás), gift (a mai ajándék a
│   │                    # tisztáson), trail (ösvény)
│   ├── src/data/offers.js  # MOCK: 24 kitalált ajánlat
│   ├── src/api.js       # MOCK API (2. fázisban valódi hívások)
│   ├── public/assets/   # a pipeline által generált képek
│   ├── Dockerfile, nginx.conf  # Coolify-telepítés (statikus, nginx)
│   └── test/            # node:test egységtesztek
└── pipeline/            # Python képgyártó (Pillow + numpy, saját .venv)
    ├── jlib.py          # levél-betöltő/elhelyező (a prototípusé, gyorsítva)
    ├── trail_days.py    # napi ösvény: bg-NN, front-NN, layout-NN (1–24)
    ├── day_assets.py    # napi tisztás + állomáskép az ügyfél termékfotóiból
    └── demo_assets.py   # 6 falkészlet (wall0–4), levéldarab-sprite-ok
```

## Futtatás

```bash
cd web
npm install
npm run dev        # http://localhost:5180/?nap=7  (a telefonról: a gép LAN-címe:5180)
npm test           # geometria + paraméterek
npm run build      # statikus kimenet: web/dist (relatív útvonalak, bárhová kitehető)
```

Képek újragenerálása:

```bash
python3 -m venv pipeline/.venv && pipeline/.venv/bin/pip install pillow numpy
pipeline/.venv/bin/python pipeline/day_assets.py               # 24 napi tisztás + állomáskép (~2 perc)
pipeline/.venv/bin/python pipeline/day_assets.py 7 8           # csak adott napok
pipeline/.venv/bin/python pipeline/demo_assets.py              # falak 1–4 (~10 perc), sprite-ok
pipeline/.venv/bin/python pipeline/demo_assets.py --hatso-falak  # wall0 (5 falas napokhoz)
pipeline/.venv/bin/python pipeline/trail_days.py               # 24 napi ösvény (~10 perc)
```

Napi növény cseréje: `clients/moai-jungle/napok.json` → `napok` (nap → fotó), a `fotok` alatt a növény
közepe és mérete a fotón (`fokusz: [x, y, méret]`, 720×720 px). Utána `day_assets.py <nap>`.

## Demó-paraméterek

| Paraméter | Jelentés |
|---|---|
| `?nap=N` | a mai nap (1–24). Alapból decemberben a budapesti dátum, máskor 7. |
| `?kihagyott=4,9` | kimaradt napok (alapból a 4., ha a mai nap > 4) |
| `?falak=3` … `5` | falak száma. Alapból minden betöltésnél véletlenszerű 3 és 5 között. |
| `?kepernyo=osveny` / `ajandek` | közvetlen indítás az ösvényről, vagy a már átvágott tisztásról |
| `?kapu=0` / `1` | e-mail kapu kihagyása / újra megjelenítése (a demópanelen is: „E-mail kapu újra”) |
| `?demo=0` | a jobb felső „Demó · N. nap” napválasztó elrejtése |

## Mit tud

- **E-mail kapu** a legelején: e-mail + kötelező szabályzat/adatkezelés elfogadás, külön, nem kötelező
  hírlevél-hozzájárulás (a GDPR szerint a marketing nem lehet a játék feltétele). A demóban a böngésző
  megjegyzi (`localStorage`), élesben a szerver (2. fázis, double opt-in).
- **Vágás:** húzás (≥ 60 px, a húzás vonalán hasad) és koppintás (véletlen átló). Billentyűzetről Enter vagy szóköz.
  A fal két példánya `clip-path` poligonnal, a vonalra merőlegesen repül szét, forogva, halványulva (csak `transform` és `opacity`).
- **3–5 fal naponta**, véletlenszerűen. 6 falkészlet forog, minden második körben tükrözve (12 változat).
- **Pengecsík, villanás, levéldarabok (10/csapás), rázkódás.**
- **A tisztás:** az utolsó vágás után ott áll az aznapi növény, alatta a mai ajándék (ajánlat, kuponkód másolással,
  webshop-gomb). Nincs felugró ablak.
- **Hang:** suhintás, levélzörgés, „megérkeztél” hang, halk esőerdő-háttér (szintetizált; az Envato-hangok
  `audio.load({...})`-dal cserélhetők). Némító jobb felül, a böngésző megjegyzi. iPhone néma módban a hang is néma (szándékos).
- **Rezgés:** Androidon csapásonként. iPhone-on nincs, hiba nélkül elmarad.
- **Parallaxis, engedélykérés nélkül:** Androidon a telefon döntésére (HTTPS kell), iPhone-on (és mindenhol húzás
  közben) az ujj mozgására. Soha nem ugrik fel rendszerablak.
- **Ugyanaz az élmény minden telefonon.** Nincs „gyenge gép” mód; ha a belépőn mért FPS 40 alatti, csak kevesebb
  levéldarab repül.
- **`prefers-reduced-motion`:** nincs rázkódás, repülés és részecske, a fal elhalványul.
- **Ösvény:** napi generált háttér és benőtt előtér. A megtett és a kimaradt napok csak látszanak (nem nyithatók
  újra); a mai napról a vágáshoz, vagy ha már átvágta, vissza a mai tisztásra lehet menni.

## Telepítés (Coolify)

Új erőforrás → Dockerfile build pack, Base Directory: `/web`, port 80. A `Dockerfile` lefuttatja a teszteket,
lefordít, és nginx-szel szolgálja ki (`noindex`, gyorsítótár-fejlécek). HTTPS kell a parallaxishoz és a vágólaphoz.
Build Variable: `PUBLIC_URL=https://<domain>/` – ettől kap teljes címet a linkelőnézet képe (`public/og-kep.jpg`).
Lépésről lépésre: `ATADAS.md`, 3. pont.

## Ismert korlátok (demó)

- Az ajánlatok, kódok kitaláltak. Mind a 24 a böngészőbe kerül. Élesben a szerver csak a már nyitható napokat adja ki.
- A napi növény helyét (`fokusz`) szemre állítottam be; néhány állomáskép kivágása finomítható.
- Az ösvény képei nagyobbak a tervezett 200 KB/réteg keretnél (bg 140–310 KB, front 440–575 KB). A belépő alatt a háttérben töltődnek.
- A termékfotók a moaijungle.hu nyilvános képei (a régi `moai-kalendarium` projektből másolva), csak belső demóhoz.
