import { LABOR_CATALOG, CATALOG_VERSION } from '../data/laborCatalog';
import { LEGACY_CATALOG } from '../data/legacyCatalog';
import { normalizePrices } from './costValidation';

export function createCatalog(data = {}) {
  const saved = data.catalog?.prices ?? {};
  const prices = Object.fromEntries(LABOR_CATALOG.map(item => [item.id, saved[item.id] ?? item.price]));
  for (const item of LEGACY_CATALOG) {
    const previous = data[item.legacyCategory]?.[item.legacyKey] ??
      (item.legacyKey === 'canalizacionALaVistaPVC' ? data.canalizacion?.canalizacionALaVistaPvc : undefined);
    const value = saved[item.id] ?? previous;
    if (value !== null && value !== undefined && value !== '' && String(value).trim() &&
        ['number', 'string'].includes(typeof value) && Number.isFinite(Number(value)) && Number(value) >= 0) {
      prices[item.id] = normalizePrices({ price: value }).price;
    }
  }
  return { version: CATALOG_VERSION, revision: data.catalog?.revision ?? 0, prices };
}

export function catalogNeedsUpdate(data) {
  return !data.catalog || LABOR_CATALOG.some(item => data.catalog.prices?.[item.id] == null);
}

export function catalogEntries(data) {
  const prices = data.catalog?.prices ?? {};
  return [...LABOR_CATALOG, ...LEGACY_CATALOG.filter(item => prices[item.id] != null)]
    .map(item => ({ ...item, price: prices[item.id] ?? item.price }));
}

export function strictPrices(values) {
  const prices = normalizePrices(values);
  if (Object.values(prices).some(value => value === null)) throw new Error('Completá todos los precios; podés ingresar cero.');
  return prices;
}

export function adjustPrices(prices, percentage, direction) {
  if (!['increase', 'decrease'].includes(direction) ||
      !['number', 'string'].includes(typeof percentage) || !String(percentage).trim() ||
      !Number.isFinite(Number(percentage)) || Number(percentage) <= 0 ||
      (direction === 'decrease' && Number(percentage) > 100)) {
    throw new Error('Ingresá un porcentaje mayor a cero. La disminución no puede superar el 100 %.');
  }
  const factor = 1 + Number(percentage) / 100 * (direction === 'increase' ? 1 : -1);
  return strictPrices(Object.fromEntries(Object.entries(strictPrices(prices)).map(([id, price]) => [id, price * factor])));
}
