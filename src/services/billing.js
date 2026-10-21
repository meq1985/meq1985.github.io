import { doc, getDocFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import { requireUser, assertCurrentUser } from '../firebase/session';
import { isAdministrator } from './billingPolicy';
export const billingConfigRef = () => doc(db, 'configuracion', 'facturacion');
export const allowanceRef = uid => doc(db, 'accesos', uid);
export const subscriptionRef = uid => doc(db, 'suscripciones', uid);
let functionsEmulatorConnected = false;
export async function loadBillingAccess() {
  const user = await requireUser();
  const [config, administrator] = await Promise.all([getDocFromServer(billingConfigRef()), getDocFromServer(doc(db, 'administradores', user.uid))]);
  const admin = isAdministrator(user, administrator.data());
  const enabled = config.data()?.enabled === true;
  assertCurrentUser(user);
  if (admin) return { enabled, admin, freeProjectId: null, subscription: null, checkoutAvailable: false };
  const [allowance, subscription] = await Promise.all([getDocFromServer(allowanceRef(user.uid)), getDocFromServer(subscriptionRef(user.uid))]);
  assertCurrentUser(user);
  const stored = subscription.data();
  return { enabled, admin: false, freeProjectId: allowance.data()?.freeProjectId ?? null,
    subscription: stored ? { planId: stored.planId, status: stored.status, paidThrough: stored.paidThrough?.toMillis?.() ?? null,
      providerStatus: stored.providerStatus, manageable: stored.manageable === true } : null,
    checkoutAvailable: enabled && config.data()?.checkoutAvailable === true };
}
async function billingCall(name, data) {
  const user = await requireUser();
  const { getFunctions, httpsCallable, connectFunctionsEmulator } = await import('firebase/functions');
  const { auth } = await import('../firebase');
  const functions = getFunctions(auth.app, 'us-central1');
  if (import.meta.env.VITE_USE_EMULATORS === 'true' && !functionsEmulatorConnected) {
    connectFunctionsEmulator(functions, '127.0.0.1', 5001); functionsEmulatorConnected = true;
  }
  assertCurrentUser(user);
  const response = await httpsCallable(functions, name)(data);
  assertCurrentUser(user);
  return response.data;
}
export async function startSubscription() {
  const result = await billingCall('createSubscription', { planId: 'presupuestos', consent: true });
  const url = new URL(result.url);
  if (url.protocol !== 'https:' || url.hostname !== 'www.mercadopago.com.ar' || url.username || url.password) throw new Error('La dirección de pago no es válida.');
  return url.href;
}
export const refreshSubscription = () => billingCall('refreshSubscription', {});
export const cancelSubscription = () => billingCall('cancelSubscription', { confirm: true });
