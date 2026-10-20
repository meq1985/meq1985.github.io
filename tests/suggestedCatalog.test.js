// @vitest-environment jsdom
import { describe, it, expect } from 'vitest';
import { validateSuggestedCatalog, resolveSuggestedCatalog } from '../src/services/suggestedCatalog';
import { LABOR_CATALOG } from '../src/data/laborCatalog';
const source = () => ({ version: '2026-11-v1', label: 'Noviembre 2026', prices: Object.fromEntries(LABOR_CATALOG.map(item => [item.id, item.price])) });
describe('shared monthly suggestions', () => {
  it('accepts all catalog prices including zero and rounds cents', () => {
    const value = source(); value.prices.visita = 0; value.prices.losa_metal = 12.345;
    expect(validateSuggestedCatalog(value)).toMatchObject({ version: '2026-11-v1', prices: { visita: 0, losa_metal: 12.35 } });
  });
  it.each([null, {}, { version: 'x', label: 'x', prices: {} }])('rejects absent or incomplete catalogs', value => {
    expect(() => validateSuggestedCatalog(value)).toThrow();
  });
  it('rejects unknown IDs, legacy IDs and invalid prices instead of partially applying a month', () => {
    const extra = source(); extra.prices.legacy_canalizacionLosa = 12;
    expect(() => validateSuggestedCatalog(extra)).toThrow();
    for (const price of [null, '', -1, Infinity, 'abc']) {
      const value = source(); value.prices.visita = price;
      expect(() => validateSuggestedCatalog(value)).toThrow();
    }
  });
});

it('uses the bundled catalog only before the first shared publication', () => {
  expect(Object.keys(resolveSuggestedCatalog({}).prices)).toHaveLength(98);
  expect(() => resolveSuggestedCatalog({ suggestedCatalog: {} })).toThrow();
  const current = source(); current.prices.visita = 999;
  expect(resolveSuggestedCatalog({ suggestedCatalog: current }).prices.visita).toBe(999);
});

it('supports a complete JSON publication from the console and rejects malformed JSON', () => {
  expect(validateSuggestedCatalog(JSON.stringify(source()))).toEqual(source());
  expect(() => validateSuggestedCatalog('{invalid')).toThrow();
});
