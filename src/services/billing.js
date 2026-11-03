import { doc, getDocFromServer, runTransaction, serverTimestamp, collection, query, orderBy, limit, startAfter, getDocsFromServer } from 'firebase/firestore';
import { db } from '../firebase';
import { requireUser, assertCurrentUser } from '../firebase/session';
import { isAdministrator, PLANS } from './billingPolicy';
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
  if (admin) return { enabled, admin, trialStartedAt: null, subscription: null, checkoutAvailable: false };
  await runTransaction(db, async transaction => {
    const allowance = await transaction.get(allowanceRef(user.uid));
    assertCurrentUser(user);
    if (!allowance.exists()) transaction.set(allowanceRef(user.uid), { claimedAt: serverTimestamp() });
  });
  const [allowance, subscription] = await Promise.all([getDocFromServer(allowanceRef(user.uid)), getDocFromServer(subscriptionRef(user.uid))]);
  assertCurrentUser(user);
  const stored = subscription.data();
  return { enabled, admin: false, trialStartedAt: allowance.data()?.claimedAt?.toMillis?.() ?? null,
    subscription: stored ? { planId: stored.planId, status: stored.status, paidThrough: stored.paidThrough?.toMillis?.() ?? null,
      contractedAt:stored.contractedAt?.toMillis?.() ?? null,nextPaymentAt:stored.nextPaymentAt?.toMillis?.() ?? null,
      updatedAt:stored.updatedAt?.toMillis?.() ?? null,lastPayment:stored.lastPayment ?? null,lastPaymentStatus:stored.lastPaymentStatus ?? null,
      amount: stored.amount ?? (stored.planId === 'croquis' ? 25000 : 12000), pendingAmount: stored.pendingAmount ?? ((stored.pendingPlanId ?? stored.planId) === 'croquis' ? 25000 : 12000), pendingPlanId: stored.pendingPlanId, providerStatus: stored.providerStatus, manageable: stored.manageable === true } : null,
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
export async function startSubscription(planId) {
  if (!['presupuestos', 'croquis'].includes(planId)) throw new Error('Elegí un plan válido.');
  const result = await billingCall('createSubscription', { planId, consent: true, acceptedAmount: PLANS.find(plan => plan.id === planId).amount });
  const url = new URL(result.url);
  if (url.protocol !== 'https:' || url.hostname !== 'www.mercadopago.com.ar' || url.username || url.password) throw new Error('La dirección de pago no es válida.');
  return url.href;
}
export const refreshSubscription = () => billingCall('refreshSubscription', {});
export const cancelSubscription = () => billingCall('cancelSubscription', { confirm: true });

export async function loadPaymentHistory(cursor=null) {
  const user=await requireUser();
  const constraints=[orderBy('scheduledAt','desc'),limit(20)];if(cursor)constraints.push(startAfter(cursor));
  const result=await getDocsFromServer(query(collection(db,'suscripciones',user.uid,'pagos'),...constraints));
  assertCurrentUser(user);
  return {rows:result.docs.map(d=>({id:d.id,...d.data()})),cursor:result.docs.at(-1) ?? null,hasMore:result.size===20};
}
