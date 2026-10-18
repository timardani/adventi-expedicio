import test from 'node:test';
import assert from 'node:assert/strict';
import { splitRect, randomDiagonal, classifyGesture, toClipPath } from '../src/engine/geometry.js';
import { parseParams, defaultDay } from '../src/params.js';

function area(poly) {
  let s = 0;
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length];
    s += p.x * q.y - q.x * p.y;
  }
  return Math.abs(s) / 2;
}

test('vízszintes vágás két egyenlő félre bont', () => {
  const r = splitRect(400, 800, { x: 50, y: 400 }, { x: 350, y: 400 });
  assert.ok(r);
  assert.equal(Math.round(area(r.a)), 160000);
  assert.equal(Math.round(area(r.b)), 160000);
  assert.deepEqual(r.segment.map((p) => Math.round(p.x)), [0, 400]);
});

test('ferde vágásnál a két fél területe kiadja a téglalapot', () => {
  const r = splitRect(390, 844, { x: 10, y: 300 }, { x: 200, y: 520 });
  assert.ok(r);
  assert.ok(Math.abs(area(r.a) + area(r.b) - 390 * 844) < 1);
  // a normál felőli fél minden pontja a normál felé esik
  for (const p of r.a) {
    const v = (p.x - 10) * r.normal.x + (p.y - 300) * r.normal.y;
    assert.ok(v > -1e-6);
  }
});

test('a szakasz végpontjai a téglalap szélén vannak', () => {
  const r = splitRect(390, 844, { x: 100, y: 100 }, { x: 300, y: 700 });
  for (const p of r.segment) {
    const onEdge = Math.abs(p.x) < 1e-6 || Math.abs(p.x - 390) < 1e-6 || Math.abs(p.y) < 1e-6 || Math.abs(p.y - 844) < 1e-6;
    assert.ok(onEdge, JSON.stringify(p));
  }
});

test('nulla hosszú vonal nem vág', () => {
  assert.equal(splitRect(100, 100, { x: 5, y: 5 }, { x: 5, y: 5 }), null);
});

test('koppintásra átlós, a falat kettévágó vonal készül', () => {
  for (let i = 0; i < 200; i++) {
    const [a, b] = randomDiagonal(390, 844, { x: Math.random() * 390, y: Math.random() * 844 });
    const ang = Math.abs((Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI);
    const tilt = Math.min(ang, 180 - ang);
    assert.ok(tilt >= 17.9 && tilt <= 38.1, `dőlés: ${tilt}`);
    const r = splitRect(390, 844, a, b);
    assert.ok(r && area(r.a) > 1000 && area(r.b) > 1000);
  }
});

test('60 px alatti húzás koppintás', () => {
  assert.equal(classifyGesture({ x: 0, y: 0 }, { x: 30, y: 40 }), 'tap');
  assert.equal(classifyGesture({ x: 0, y: 0 }, { x: 36, y: 48 }), 'drag');
});

test('clip-path szöveg', () => {
  assert.equal(toClipPath([{ x: 0, y: 0 }, { x: 10.04, y: 0 }, { x: 0, y: 5 }]), 'polygon(0px 0px, 10px 0px, 0px 5px)');
});

test('?nap paraméter és alapértékek', () => {
  const oct = new Date('2026-10-17T12:00:00Z');
  assert.equal(parseParams('', oct).day, 7);
  assert.equal(parseParams('?nap=1', oct).day, 1);
  assert.equal(parseParams('?nap=99', oct).day, 24);
  assert.equal(parseParams('?nap=abc', oct).day, 7);
  assert.deepEqual(parseParams('?nap=7', oct).missed, [4]);
  assert.deepEqual(parseParams('?nap=3', oct).missed, []);
  assert.deepEqual(parseParams('?nap=10&kihagyott=2,9,12', oct).missed, [2, 9]);
  assert.equal(parseParams('?falak=3', oct).walls, 3);
  assert.equal(parseParams('?falak=5', oct).walls, 5);
  assert.equal(parseParams('?kepernyo=osveny', oct).screen, 'osveny');
  assert.equal(parseParams('', oct).gate, 'auto');
  assert.equal(parseParams('?kapu=0', oct).gate, 'skip');
  assert.equal(parseParams('?kapu=1', oct).gate, 'force');
});

test('a falak száma alapból véletlenszerű 3 és 5 között', () => {
  const oct = new Date('2026-10-17T12:00:00Z');
  assert.equal(parseParams('', oct, () => 0).walls, 3);
  assert.equal(parseParams('', oct, () => 0.5).walls, 4);
  assert.equal(parseParams('', oct, () => 0.999).walls, 5);
  // érvénytelen ?falak esetén is a véletlen szabály dönt
  assert.equal(parseParams('?falak=9', oct, () => 0).walls, 3);
  assert.equal(parseParams('?falak=2', oct, () => 0.999).walls, 5);
});

test('decemberben a budapesti dátum a mai nap', () => {
  // dec. 4. 23:30 UTC = dec. 5. 00:30 Budapesten
  assert.equal(defaultDay(new Date('2026-12-04T23:30:00Z')), 5);
  assert.equal(defaultDay(new Date('2026-12-25T10:00:00Z')), 7);
});
