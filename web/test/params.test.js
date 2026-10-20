import test from 'node:test';
import assert from 'node:assert/strict';
import { parseParams, msUntilBudapestMidnight, formatCountdown, XMAS_DEFAULT } from '../src/params.js';

test('éjfélig hátralévő idő Budapesten (téli idő, UTC+1)', () => {
  // 2026-12-07 11:30:00 UTC = 12:30 budapesti idő → 11,5 óra van hátra
  const ms = msUntilBudapestMidnight(new Date(Date.UTC(2026, 11, 7, 11, 30, 0)));
  assert.equal(ms, 11.5 * 3600 * 1000);
});

test('éjfélig hátralévő idő nyári időben (UTC+2)', () => {
  // 2026-10-20 20:00 UTC = 22:00 Budapest → 2 óra
  const ms = msUntilBudapestMidnight(new Date(Date.UTC(2026, 9, 20, 20, 0, 0)));
  assert.equal(ms, 2 * 3600 * 1000);
});

test('visszaszámláló formázása', () => {
  assert.equal(formatCountdown(11.5 * 3600 * 1000), '11 ó 30 p');
  assert.equal(formatCountdown(23 * 60 * 1000), '23 p');
  assert.equal(formatCountdown(5000), '1 p');
  assert.equal(formatCountdown(2 * 3600 * 1000), '2 ó 0 p');
});

test('napválasztó: ?panel=0 és a régi ?demo=0 is elrejti', () => {
  assert.equal(parseParams('?nap=7').panel, true);
  assert.equal(parseParams('?nap=7&panel=0').panel, false);
  assert.equal(parseParams('?nap=7&demo=0').panel, false);
});

test('karácsonyi díszítés: alapérték, ?karacsony=0 és =1', () => {
  assert.equal(parseParams('?nap=7').xmas, XMAS_DEFAULT);
  assert.equal(parseParams('?karacsony=0').xmas, false);
  assert.equal(parseParams('?karacsony=1').xmas, true);
});
