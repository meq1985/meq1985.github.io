import { describe, it, expect } from 'vitest';
import { LABOR_CATALOG, CATALOG_VERSION } from '../src/data/laborCatalog';
import { createCatalog, catalogNeedsUpdate, catalogEntries, adjustPrices } from '../src/services/catalogPrices';
import { defaultCosts } from '../src/services/accountDefaults';
import { validateBudget } from '../src/services/budgetValidation';

describe('AAIERIC September 2026 defaults and legacy migration', () => {
  it('provides every priced variant with unique codes and units on new accounts', () => {
    const defaults = defaultCosts();
    expect(LABOR_CATALOG).toHaveLength(98);
    expect(defaults.catalog.version).toBe(CATALOG_VERSION);
    expect(Object.keys(defaults.catalog.prices)).toHaveLength(LABOR_CATALOG.length);
    expect(new Set(LABOR_CATALOG.map(item => item.id)).size).toBe(LABOR_CATALOG.length);
    expect(new Set(LABOR_CATALOG.map(item => item.code)).size).toBe(LABOR_CATALOG.length);
    expect(LABOR_CATALOG.every(item => item.description && item.unit && item.price > 0)).toBe(true);
    expect(catalogNeedsUpdate(defaults)).toBe(false);
    expect(catalogEntries(defaults)).toHaveLength(LABOR_CATALOG.length);
  });
  it('distinguishes source units, alternatives, minimums and unusual printed values', () => {
    const find = id => LABOR_CATALOG.find(item => item.id === id);
    expect(find('subterraneo_tierra')).toMatchObject({ unit: 'tramo de 5 m', price: 56341 });
    expect(find('subterraneo_piso').price).toBe(60119);
    expect(find('mamposteria_comun_boca')).toMatchObject({ unit: 'boca', price: 64775 });
    expect(find('mamposteria_comun_metro')).toMatchObject({ unit: 'm', price: 15481 });
    expect(find('b300_m_alta').price).toBe(17545);
    expect(find('b600_m_alta').price).toBe(24482);
    expect(find('proyecto_minimo').price).toBe(573357);
    expect(find('plano_minimo').price).toBe(684122);
    expect(find('oficial').unit).toBe('jornada de 8 h');
  });
  it('preserves custom prices, including zero, and never guesses old/new equivalences', () => {
    const previous = { canalizacion: { canalizacionLosa: 999, canalizacionALaVistaPvc: '0' }, cableado: { cableadoSubterraneoXmetro: 15 } };
    const copy = structuredClone(previous);
    const migrated = createCatalog(previous);
    expect(previous).toEqual(copy);
    expect(migrated.prices.legacy_canalizacionLosa).toBe(999);
    expect(migrated.prices.legacy_canalizacionALaVistaPVC).toBe(0);
    expect(migrated.prices.legacy_cableadoSubterraneoXmetro).toBe(15);
    expect(migrated.prices.losa_metal).toBe(57000);
    expect(catalogEntries({ catalog: migrated }).filter(item => item.category === 'anteriores')).toHaveLength(3);
    expect(createCatalog({ ...previous, catalog: migrated })).toEqual(migrated);
    const custom = { catalog: { ...migrated, prices: { ...migrated.prices, losa_metal: 0, visita: 80.5 } } };
    expect(createCatalog(custom).prices).toEqual(custom.catalog.prices);
    expect(catalogNeedsUpdate(custom)).toBe(false);
  });
  it('repairs missing defaults while keeping edited prices', () => {
    const old = { catalog: { prices: { visita: 0 }, revision: 4 } };
    expect(catalogNeedsUpdate(old)).toBe(true);
    expect(createCatalog(old)).toMatchObject({ revision: 4, prices: { visita: 0, losa_metal: 57000 } });
  });
});

describe('bulk adjustments', () => {
  it('increases or decreases current amounts and rounds to cents without mutating them', () => {
    const prices = { a: 57000, b: 10.13, free: 0 };
    expect(adjustPrices(prices, 20, 'increase')).toEqual({ a: 68400, b: 12.16, free: 0 });
    expect(adjustPrices(prices, '20', 'decrease')).toEqual({ a: 45600, b: 8.1, free: 0 });
    expect(adjustPrices(prices, 100, 'decrease')).toEqual({ a: 0, b: 0, free: 0 });
    expect(prices).toEqual({ a: 57000, b: 10.13, free: 0 });
  });
  it.each(['', ' ', null, undefined, false, -20, 0, NaN, Infinity, 101])('rejects invalid decrease %j', value => {
    expect(() => adjustPrices({ a: 100 }, value, 'decrease')).toThrow();
  });
  it('rejects unsafe overflow and missing prices', () => {
    expect(() => adjustPrices({ a: 1e14 }, 100, 'increase')).toThrow();
    expect(() => adjustPrices({ a: null }, 20, 'increase')).toThrow();
  });
  it('preserves units and quoted prices independently of future adjustments', () => {
    const budget = validateBudget('Cliente', [{ codigo: 'A26-001', descripcion: 'Cable subterráneo', unidad: 'tramo de 5 m', cantidad: 2, precioUnitario: 56341 }]);
    adjustPrices({ subterraneo_tierra: 56341 }, 20, 'increase');
    expect(budget.items[0]).toMatchObject({ unidad: 'tramo de 5 m', precioUnitario: 56341, precioTotal: 112682 });
    expect(() => validateBudget('Cliente', [{ ...budget.items[0], unidad: ' ' }])).toThrow('unidad');
  });
});
