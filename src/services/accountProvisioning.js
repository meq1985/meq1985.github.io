import { doc, runTransaction } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { assertCurrentUser } from '../firebase/session';
import { defaultProfile, defaultCosts } from './accountDefaults';
import { createCatalog, catalogNeedsUpdate } from './catalogPrices';

// Auth and Firestore cannot share a transaction. Provision only verified accounts,
// atomically create both documents, and retry safely on every login/navigation.
export async function ensureAccountReady(user = auth.currentUser) {
  if (!user?.email || !user.emailVerified) throw new Error('Verificá tu correo para completar el registro.');
  assertCurrentUser(user);
  const profile = doc(db, 'usuarios', user.email);
  const costs = doc(db, 'costos', user.email);
  await runTransaction(db, async transaction => {
    const [profileSnapshot, costsSnapshot] = await Promise.all([
      transaction.get(profile), transaction.get(costs)
    ]);
    assertCurrentUser(user);
    if (!profileSnapshot.exists()) transaction.set(profile, defaultProfile());
    if (!costsSnapshot.exists()) transaction.set(costs, defaultCosts());
    else if (catalogNeedsUpdate(costsSnapshot.data())) {
      transaction.update(costs, { catalog: createCatalog(costsSnapshot.data()) });
    }
  });
}
