// MOCK – 24 napi ajánlat a demóhoz. Kitalált szövegek és kódok, NEM a Moai valódi ajánlatai.
// Az 1., 2., 3., 5. és 6. nap címe a jóváhagyott látványról való.
// A növény (és vele a tisztás meg az állomáskép) a clients/moai-jungle/napok.json szerint;
// a képeket a pipeline/day_assets.py gyártja.
// A 2. fázisban ezek a szerverről jönnek (GET /api/today, GET /api/trail), és a jövőbeli napok
// sosem kerülnek a böngészőbe.

const SHOP = 'https://moaijungle.hu/';

const LIST = [
  ['Szívlevél ajándékba', 'Hoya kerrii', 'SZIVLEVEL', 'Minden 15 000 Ft feletti rendelés mellé egy szív alakú Hoya kerrii levelet csomagolunk.'],
  ['Ingyenes szállítás', 'Epipremnum Lemon Top', 'OSVENY-SZALLIT', 'Ma minden rendelést ingyen viszünk ki hozzád, összeghatár nélkül.'],
  ['1+1 Calathea', 'Calathea White Star', 'CALATHEA11', 'Két Calathea közül a kisebbik ma ajándék.'],
  ['−15% minden Alocasiára', 'Alocasia Dragon Scale', 'SARKANY15', 'A sárkánypikkelyes és minden más Alocasia ma 15%-kal olcsóbb.'],
  ['Futónövény-nap', 'Scindapsus Mint', 'FUTO20', '−20% minden futó- és csüngőnövényre: Scindapsus, Epipremnum, Hoya.'],
  ['Mikulás meglepetés', 'Ficus Tineke', 'MIKULAS', 'A mai rendelések mellé titkos Mikulás-csomag jár. Mi lesz benne? Kiderül, ha megjön.'],
  ['−20% Alocasia Frydekre', 'Alocasia Frydek Variegata', 'FRYDEK20', 'A tisztás mai lakója, a tarka bársonylevelű Frydek most 20%-kal olcsóbb.'],
  ['Kristálylevél-nap', 'Anthurium Brielle', 'KRISTALY', 'Minden Anthurium mellé ajándék orchideaföld-keverék.'],
  ['Duplán jár a pont', 'Monstera Electro Light', 'DUPLAPONT', 'Ma minden vásárlás után kétszeres hűségpontot írunk jóvá.'],
  ['Ezüstfolt-akció', 'Scindapsus Mayari', 'EZUST15', '−15% minden ezüstös levelű Scindapsusra.'],
  ['Piros erek napja', 'Aglaonema Lucky Red', 'LUCKYRED', 'A piros erezetű Aglaonemák ma 3 000 Ft-tal olcsóbbak.'],
  ['Ajándék tápoldat', 'Philodendron Fire Phoenix', 'TAPOLDAT', '10 000 Ft felett egy üveg tápoldat ajándékba, hogy télen is nőjön a dzsungel.'],
  ['Szerencse-nap', 'Calathea Black Rose', 'SZERENCSE13', '−13% mindenre a 13. napon. Mert a dzsungelben a 13 szerencseszám.'],
  ['Csüngőkosár ajándékba', 'Hoya Mathilde Splash', 'CSUNGO', 'Két futónövény mellé egy makramé csüngőkosarat adunk.'],
  ['Félúton: −25% egy kedvencre', 'Monstera White Monster', 'FELUT25', 'Félúton jársz az ösvényen! Bármelyik egy növény 25%-kal olcsóbb.'],
  ['Kezdő dzsungel csomag', 'Syngonium Pink Perfection', 'KEZDO', 'Három könnyen gondozható növény kedvező csomagárban, ajándékötletnek is.'],
  ['Ingyenes átültetés', 'Aglaonema Pinky Promise', 'ATULTET', 'A ma rendelt növényeket kérésre nagyobb cserépbe ültetve küldjük.'],
  ['Bársonylevél-nap', 'Alocasia Frydek Variegata', 'BARSONY', '−15% minden bársonyos levelű növényre.'],
  ['Ajándékkártya-bónusz', 'Anthurium Brielle', 'KARTYA19', '10 000 Ft-os ajándékkártya mellé 2 000 Ft bónusz jár.'],
  ['Tarka-nap', 'Monstera Electro Light', 'TARKA20', '−20% a tarka levelű ritkaságokra, amíg a készlet tart.'],
  ['Napforduló: fényt a dzsungelbe', 'Scindapsus Mayari', 'NAPFORDULO', 'Ma a növénylámpák 20%-kal olcsóbbak: a leghosszabb éjszakán is jut fény.'],
  ['Expressz szállítás karácsonyig', 'Epipremnum Lemon Top', 'EXPRESSZ', 'Ingyenes expressz szállítás, hogy a fa alá is odaérjen.'],
  ['Utolsó előtti csapás', 'Calathea White Star', 'CSAPAS23', '−23% bármelyik egy Calatheára.'],
  ['−24% mindenre', 'Monstera White Monster', 'ZSAKMANY24', 'Egész januárban beválthatod: az ünnepek után is jár a dzsungel.'],
];

// A kupon érvényessége: alapból a nap végéig (a felületen visszaszámlálóval),
// a 24. napé egész januárban (Dani ötlete, 2026-10-20).
const VALID_UNTIL = { 24: 'január 31-ig érvényes' };

export const OFFERS = LIST.map(([title, plant, code, text], i) => {
  const nn = String(i + 1).padStart(2, '0');
  return {
    day: i + 1, title, plant, code, text, url: SHOP,
    validUntil: VALID_UNTIL[i + 1] || null,
    image: `days/station-${nn}.webp`,
    clearing: `days/clearing-${nn}.webp`,
  };
});
