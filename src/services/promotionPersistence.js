import { doc, getDocFromServer, runTransaction } from 'firebase/firestore';
import { db } from '../firebase';
import { requireUser, assertCurrentUser } from '../firebase/session';
import { validatePromotionSettings } from './promotions';
export async function loadPromotionSettings() {
  const user = await requireUser(), snapshot = await getDocFromServer(doc(db, 'costos', user.email));
  assertCurrentUser(user); return validatePromotionSettings(snapshot.data()?.promotions);
}
export async function savePromotionSettings(input, expected) {
  const user = await requireUser(), value = validatePromotionSettings(input), baseline = validatePromotionSettings(expected);
  const reference = doc(db, 'costos', user.email);
  await runTransaction(db, async tx => {
    const snapshot = await tx.get(reference); assertCurrentUser(user);
    if (!snapshot.exists()) throw new Error('No se encontró la configuración de tu cuenta. Volvé a ingresar.');
    if (JSON.stringify(validatePromotionSettings(snapshot.data().promotions)) !== JSON.stringify(baseline)) throw new Error('Las promociones cambiaron en otra pestaña. Recargá antes de guardar.');
    tx.update(reference, { promotions: value });
  });
  assertCurrentUser(user); return value;
}
