import { it, expect } from 'vitest';
import { emptySketch, validateSketch, encodeSketch, decodeSketch, sketchSummary, overlapsRoom } from '../src/services/sketch';
const drawing = () => ({ ...emptySketch(), rooms: [{ id: 'kitchen', levelId: 'planta-baja', name: 'Cocina', x: 0, y: 0, width: 4, depth: 3, points: [{ id: 'light', type: 'luminaria', x: 0.5, y: 0.5 }] }] });
it('round trips geometry and point counts without changing original data', () => {
  const input = drawing(), decoded = decodeSketch(encodeSketch(input));
  expect(decoded).toEqual(input); expect(decoded).not.toBe(input);
  expect(sketchSummary(decoded)).toEqual({ area: 12, luminaria: 1, toma: 0, llave: 0 });
  expect(decodeSketch(undefined)).toBeNull(); expect(encodeSketch(null)).toBeNull();
});
it('rejects broken references, duplicate identities and unknown point types', () => {
  for (const edit of [s => s.rooms[0].levelId = 'missing', s => s.rooms[0].id = 'planta-baja', s => s.rooms[0].points[0].type = 'toString', s => s.rooms[0].points[0].id = 'kitchen']) {
    const input = drawing(); edit(input); expect(() => validateSketch(input)).toThrow('croquis');
  }
  expect(() => decodeSketch('{invalid')).toThrow('croquis');
  expect(() => decodeSketch(' '.repeat(80001))).toThrow('croquis');
});
it('bounds room dimensions, placement and document complexity', () => {
  for (const value of [0, 51, Infinity, NaN, '4']) { const s = drawing(); s.rooms[0].width = value; expect(() => validateSketch(s)).toThrow(); }
  const outside = drawing(); outside.rooms[0].points[0].x = 1.01; expect(() => validateSketch(outside)).toThrow();
  const many = drawing(); many.rooms[0].points = Array.from({ length: 301 }, (_, i) => ({ id: `p-${i}`, type: 'toma', x: 0, y: 1 }));
  expect(() => encodeSketch(many)).toThrow();
  expect(() => validateSketch({ ...emptySketch(), levels: [] })).toThrow();
});
it('detects overlap within the same level but permits adjacent rooms and other levels', () => {
  const a = drawing().rooms[0], b = { ...a, id: 'b', x: 3 };
  expect(overlapsRoom(a, b)).toBe(true);
  expect(overlapsRoom(a, { ...b, x: 4 })).toBe(false);
  expect(overlapsRoom(a, { ...b, levelId: 'upper' })).toBe(false);
});
