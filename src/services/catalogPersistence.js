import { doc, getDoc, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { requireUser, assertCurrentUser } from '../firebase/session';
import { catalogEntries, strictPrices } from './catalogPrices';

export async function loadCatalog() {
  const user = await requireUser();
  const snapshot = await getDoc(doc(db, 'costos', user.email));
  assertCurrentUser(user);
  if (!snapshot.exists() || !snapshot.data().catalog) throw new Error('No se pudo cargar el catálogo. Volvé a iniciar sesión.');
  return catalogEntries(snapshot.data());
}

// Compare the reviewed values inside a transaction: another tab cannot be silently
// overwritten, and retries never apply a percentage a second time.
export async function saveCatalogPrices(changes, expected) {
  const user = await requireUser();
  const prices = strictPrices(changes);
  if (!Object.keys(prices).length) return;
  const reference = doc(db, 'costos', user.email);
  await runTransaction(db, async transaction => {
    const snapshot = await transaction.get(reference);
    assertCurrentUser(user);
    const catalog = snapshot.data()?.catalog;
    if (!catalog) throw new Error('No se encontró el catálogo. Volvé a iniciar sesión.');
    for (const id of Object.keys(prices)) {
      if (!Object.hasOwn(catalog.prices, id) || catalog.prices[id] !== expected[id]) {
        throw new Error('Los precios cambiaron en otra pestaña. Recargá la configuración y revisá el ajuste.');
      }
    }
    transaction.update(reference, { catalog: { ...catalog, prices: { ...catalog.prices, ...prices }, revision: (catalog.revision ?? 0) + 1 } });
  });
  assertCurrentUser(user);
}
