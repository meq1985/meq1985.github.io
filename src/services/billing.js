import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import { requireUser, assertCurrentUser } from '../firebase/session';
import { isAdministrator } from './billingPolicy';
export const billingConfigRef = () => doc(db, 'configuracion', 'facturacion');
export const allowanceRef = uid => doc(db, 'accesos', uid);
export const subscriptionRef = uid => doc(db, 'suscripciones', uid);
export async function loadBillingAccess() {
  const user = await requireUser();
  const [config, administrator] = await Promise.all([getDocFromServer(billingConfigRef()), getDocFromServer(doc(db, 'administradores', user.uid))]);
  const admin = isAdministrator(user, administrator.data());
  const enabled = config.data()?.enabled === true;
  assertCurrentUser(user);
  if (!enabled || admin) return { enabled, admin, freeProjectId: null, subscription: null, checkoutAvailable: false };
  const [allowance, subscription] = await Promise.all([getDocFromServer(allowanceRef(user.uid)), getDocFromServer(subscriptionRef(user.uid))]);
  assertCurrentUser(user);
  const stored = subscription.data();
  return { enabled, admin: false, freeProjectId: allowance.data()?.freeProjectId ?? null,
    subscription: stored ? { planId: stored.planId, status: stored.status, paidThrough: stored.paidThrough?.toMillis?.() ?? null } : null,
    checkoutAvailable: false };
}
