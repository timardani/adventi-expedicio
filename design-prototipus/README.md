# Design-prototípus – Adventi expedíció (Amazonas téma)

Claude Code-ban készült látványterv, 2026-10-17. A vászon (Design artifact): https://claude.ai/artifact/MSeTUA1aX3ZND6Pas4EbuY („Amazonas: adventi expedíció” sor).

Ez **referencia**, nem éles kód. A fejlesztés a `../` mappában indul, a terv itt van: `/Users/danieltimar/Documents/tacitOS Artifacts/2026-10-17/adventi-expedicio-fejlesztesi-terv.md`.

## Mappák
- `kepernyok/` – a két mobilképernyő a vászonról (`Machete.dc.html` = machetés belépő, `Trail.dc.html` = ösvény). A Design-vászon saját formátuma (`<x-dc>`, `{{...}}` lyukak, `renderVals()`), a `/_blob/...` képek a vászon tárhelyére mutatnak. A működést és a pontos méreteket mutatja, nem futtatható önmagában.
- `generalt-kepek/` – a képernyők képei: `wall1-4.webp` (levélfalak, 4 = legelső), `clearing.webp` (tisztás a mai növénnyel), `trail_bg.webp` + `trail_front.webp` (ösvény háttere és a benőtt rész előtere), `trail.json` (állomások koordinátái, CSS px), `drops.png` (páracsepp-textúra, a korábbi irányokból).
- `kivagott-levelek/` – átlátszó hátterű levél-kivágások a Moai termékfotóiból (színkulcsolással). `g/` = az összes fotó zöld kivágása.
- `szkriptek/` – Python (Pillow + numpy) generálók. `jlib.py` a közös levél-betöltő és -elhelyező, `intro.py` a falakat és a tisztást, `trail.py` az ösvényt készíti. A szkriptek relatív `jungle/` és `amaz/` mappákat várnak: futtatás előtt a mappanevekhez igazítandók.
- `kepernyokepek/` – renderelt képernyőképek a jóváhagyott állapotról.

## Licenc
A növényfotók a moaijungle.hu nyilvános termékfotói, **csak belső demóhoz** (Dani jóváhagyásával, 2026-10-16). Élesítés előtt a Moai írásos engedélye vagy saját fotók kellenek.
