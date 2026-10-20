import { it, expect } from 'vitest';
import { normalizePrices } from '../src/services/costValidation';
it('normalizes money and preserves unset prices', () => {
  expect(normalizePrices({ a: '1.255', b: null, c: '', d: 0 })).toEqual({ a: 1.26, b: null, c: null, d: 0 });
});
it.each([-1, NaN, Infinity, undefined, false, {}, ' '])('rejects invalid cost %j', value => {
  expect(() => normalizePrices({ price: value })).toThrow();
});
