import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { requireUser, assertCurrentUser } from '../firebase/session';
import { catalogEntries, strictPrices } from './catalogPrices';
import { validateSuggestedCatalog, resolveSuggestedCatalog } from './suggestedCatalog';

export async function loadCatalog() {
  const user = await requireUser();
  const snapshot = await getDoc(doc(db, 'costos', user.email));
  assertCurrentUser(user);
  if (!snapshot.exists() || !snapshot.data().catalog) throw new Error('No se pudo cargar el catálogo. Volvé a iniciar sesión.');
  return catalogEntries(snapshot.data());
}

export async function loadSuggestedCatalog() {
  const user = await requireUser();
  const snapshot = await getDoc(doc(db, 'costos', 'codigos'));
  assertCurrentUser(user);
  return resolveSuggestedCatalog(snapshot.data());
}

// Recheck both personal and shared prices inside a transaction to protect the reviewed preview.
export async function saveCatalogPrices(changes, expected, suggested = null) {
  const user = await requireUser();
  const prices = strictPrices(changes);
  if (!Object.keys(prices).length) return;
  const reviewed = suggested ? validateSuggestedCatalog(suggested) : null;
  if (reviewed && (Object.keys(prices).length !== Object.keys(reviewed.prices).length ||
      Object.entries(reviewed.prices).some(([id, price]) => prices[id] !== price))) {
    throw new Error('Revisá nuevamente el catálogo sugerido antes de guardarlo.');
  }
  const reference = doc(db, 'costos', user.email);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(reference);
    if (reviewed) {
      const source = await transaction.get(doc(db, 'costos', 'codigos'));
      const latest = resolveSuggestedCatalog(source.data());
      if (latest.version !== reviewed.version || latest.label !== reviewed.label ||
          Object.entries(latest.prices).some(([id, price]) => price !== reviewed.prices[id])) {
        throw new Error('Los precios sugeridos se actualizaron. Volvé a consultar y revisar los valores.');
      }
    }
    assertCurrentUser(user);
    const catalog = snapshot.data()?.catalog;
    if (!catalog) throw new Error('No se encontró el catálogo. Volvé a iniciar sesión.');
    for (const id of Object.keys(prices)) {
      if (!Object.hasOwn(catalog.prices, id) || catalog.prices[id] !== expected[id]) {
        throw new Error('Los precios cambiaron en otra pestaña. Recargá la configuración y revisá el ajuste.');
      }
    }
    transaction.update(reference, { catalog: { ...catalog, prices: { ...catalog.prices, ...prices },
      ...(reviewed ? { suggestedVersion: reviewed.version } : {}), revision: (catalog.revision ?? 0) + 1 } });
  });
  assertCurrentUser(user);
}
