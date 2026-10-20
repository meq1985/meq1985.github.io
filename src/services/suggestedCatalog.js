import { LABOR_CATALOG, CATALOG_VERSION } from '../data/laborCatalog';
import { strictPrices } from './catalogPrices';

// The shared document is readable by verified users and writable only by an administrator.
export function validateSuggestedCatalog(value) {
  const invalid = () => { throw new Error('El catálogo sugerido no está disponible o está incompleto. Intentá más tarde.'); };
  if (typeof value === 'string') {
    if (value.length > 64000) invalid();
    try { value = JSON.parse(value); } catch { invalid(); }
  }
  if (!value || typeof value.version !== 'string' || !value.version.trim() || value.version.length > 80 ||
      typeof value.label !== 'string' || !value.label.trim() || value.label.length > 100 ||
      !value.prices || typeof value.prices !== 'object' || Array.isArray(value.prices)) invalid();
  const ids = LABOR_CATALOG.map(item => item.id);
  if (Object.keys(value.prices).length !== ids.length || ids.some(id => !Object.hasOwn(value.prices, id))) invalid();
  return { version: value.version.trim(), label: value.label.trim(), prices: strictPrices(value.prices) };
}

export function resolveSuggestedCatalog(data) {
  // The bundled catalog keeps the feature usable before the first administrator publication.
  if (data?.suggestedCatalog === undefined) return {
    version: CATALOG_VERSION, label: 'Catálogo inicial',
    prices: Object.fromEntries(LABOR_CATALOG.map(item => [item.id, item.price])),
  };
  return validateSuggestedCatalog(data.suggestedCatalog);
}
