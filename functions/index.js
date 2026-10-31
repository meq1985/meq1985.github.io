import { getAuth } from 'firebase-admin/auth';
import { registerProtected } from './registration.js';
import { randomUUID } from 'node:crypto';
import { initializeApp } from 'firebase-admin/app';
import { getFirestore, Timestamp, FieldValue } from 'firebase-admin/firestore';
import { onCall, onRequest, HttpsError } from 'firebase-functions/v2/https';
import { defineSecret, defineString } from 'firebase-functions/params';
import { createProvider, safeId, verifySignature, checkoutUrl, subscriptionBody, validSubscription, validMerchant, paidPeriod, BILLING_PLANS, billingPlan } from './mercadopago.js';

initializeApp();
const db = getFirestore();
const accessToken = defineSecret('MP_ACCESS_TOKEN');
const webhookSecret = defineSecret('MP_WEBHOOK_SECRET');
const mode = defineString('MP_MODE', { default: 'disabled' });
const returnOrigin = defineString('APP_ORIGIN', { default: 'https://electricistaxpress.com.ar' });
const webhookUrl = defineString('MP_WEBHOOK_URL', { default: 'https://us-central1-presupuesto-electrico.cloudfunctions.net/mercadoPagoWebhook' });
const collectorId = defineString('MP_COLLECTOR_ID', { default: '' });
const options = { region: 'us-central1', minInstances: 0, maxInstances: 2, concurrency: 10, timeoutSeconds: 120, memory: '256MiB', secrets: [accessToken] };
const checkoutRef = uid => db.doc(`billingCheckouts/${uid}`);
const subscriptionRef = uid => db.doc(`suscripciones/${uid}`);
async function provider() {
  const api = createProvider(accessToken.value());
  if (!validMerchant(await api('/users/me'), collectorId.value(), mode.value())) {
    throw new HttpsError('failed-precondition', 'Las credenciales no corresponden al vendedor y entorno configurados.');
  }
  return api;
}
function identity(request) {
  if (!request.auth || request.auth.token.email_verified !== true || !request.auth.token.email) throw new HttpsError('unauthenticated', 'Ingresá con un correo verificado.');
  return { uid: request.auth.uid, email: request.auth.token.email };
}
async function permitted(uid, { purchase = false } = {}) {
  const [admin, tester, config] = await Promise.all([
    db.doc(`administradores/${uid}`).get(), db.doc(`billingTesters/${uid}`).get(), db.doc('configuracion/facturacion').get(),
  ]);
  if (!['test', 'live'].includes(mode.value()) || !collectorId.value()) throw new HttpsError('failed-precondition', 'La contratación está en preparación.');
  if (mode.value() === 'test' && tester.data()?.enabled !== true) throw new HttpsError('permission-denied', 'El circuito de prueba es privado.');
  if (purchase && (admin.data()?.enabled === true || (mode.value() === 'live' && !(config.data()?.enabled === true && config.data()?.checkoutAvailable === true)))) {
    throw new HttpsError('failed-precondition', 'La contratación no está habilitada para esta cuenta.');
  }
  // Firebase QA identities need not have an email belonging to a Mercado Pago test account.
  // This override is server-only and is never accepted from the callable request.
  const payerEmail = mode.value() === 'test' ? tester.data()?.payerEmail : undefined;
  if (purchase && mode.value() === 'test' && !/^[^\s@]+@testuser\.com$/i.test(payerEmail ?? '')) {
    throw new HttpsError('failed-precondition', 'Falta configurar el comprador ficticio de Mercado Pago para esta prueba.');
  }
  return { payerEmail };
}
// All provider operations for one account are serialized. The lease outlives the function.
async function withAccountLock(uid, operation) {
  const ref = db.doc(`billingLocks/${uid}`), owner = randomUUID();
  await db.runTransaction(async tx => {
    const current = await tx.get(ref);
    if (current.data()?.until?.toMillis() > Date.now()) throw new HttpsError('aborted', 'Hay otra operación en curso. Volvé a intentar.');
    tx.set(ref, { owner, until: Timestamp.fromMillis(Date.now() + 180000) });
  });
  try { return await operation(); }
  finally {
    await db.runTransaction(async tx => {
      if ((await tx.get(ref)).data()?.owner === owner) tx.delete(ref);
    });
  }
}
function validateRemote(remote, stored) {
  if (!validSubscription(remote, stored.reference, collectorId.value(), stored.planId)) throw new HttpsError('failed-precondition', 'La suscripción requiere revisión.');
}
async function bindCheckout(uid, stored, remote) {
  validateRemote(remote, stored);
  const id = safeId(remote.id), url = checkoutUrl(remote.init_point);
  const batch = db.batch();
  batch.set(checkoutRef(uid), { ...stored, providerId: id, url, state: 'ready' });
  batch.set(db.doc(`billingBindings/${id}`), { uid, reference: stored.reference, planId: stored.planId ?? 'presupuestos' });
  batch.set(subscriptionRef(uid), { pendingPlanId: stored.planId ?? 'presupuestos', providerStatus: remote.status, manageable: true }, { merge: true });
  await batch.commit();
  return { url };
}
export const createSubscription = onCall(options, async request => {
  const { uid, email } = identity(request);
  const planId = request.data?.planId;
  if (!Object.hasOwn(BILLING_PLANS, planId ?? '') || request.data?.consent !== true) throw new HttpsError('invalid-argument', 'Confirmá la mensualidad del plan elegido.');
  const { payerEmail } = await permitted(uid, { purchase: true });
  return withAccountLock(uid, async () => {
    const api = await provider(), existing = (await checkoutRef(uid).get()).data();
    const entitlement = (await subscriptionRef(uid).get()).data();
    if (entitlement?.paidThrough?.toMillis() > Date.now() && entitlement.status === 'active') throw new HttpsError('already-exists', 'Conservás un período abonado. Esperá su vencimiento antes de contratar otro plan.');
    if (existing && existing.mode !== mode.value()) throw new HttpsError('failed-precondition', 'Revisá la configuración de pruebas antes de continuar.');
    if (existing && (existing.planId ?? 'presupuestos') !== planId) {
      if (!existing.providerId) throw new HttpsError('failed-precondition', 'La contratación anterior requiere revisión.');
      const prior = await api(`/preapproval/${safeId(existing.providerId)}`); validateRemote(prior, existing);
      if (prior.status !== 'cancelled') throw new HttpsError('already-exists', 'Cancelá la contratación anterior antes de elegir otro plan.');
    }
    if (existing?.providerId) {
      const remote = await api(`/preapproval/${safeId(existing.providerId)}`);
      validateRemote(remote, existing);
      if (remote.status === 'pending') return { url: checkoutUrl(remote.init_point) };
      if (remote.status !== 'cancelled') throw new HttpsError('already-exists', 'Ya tenés una suscripción. Consultá o cancelá su renovación.');
      // An approved payment may precede its webhook. Query the provider before
      // replacing a cancelled subscription, so missing notifications cannot cause overlap.
      if ((await reconcile(uid, existing, api)).status === 'active') {
        throw new HttpsError('already-exists', 'Conservás un período abonado. Esperá su vencimiento antes de contratar otro plan.');
      }
    } else if (existing) {
      // A POST timeout may have created a subscription. Never issue a second POST blindly.
      const found = await api(`/preapproval/search?external_reference=${encodeURIComponent(existing.reference)}`);
      if (found.results?.length === 1) return bindCheckout(uid, existing, await api(`/preapproval/${safeId(found.results[0].id)}`));
      throw new HttpsError('failed-precondition', 'La contratación anterior requiere revisión para evitar cobros duplicados.');
    }
    const stored = { planId, consent: { amount: billingPlan(planId).amount, currency: 'ARS', frequency: 'monthly', termsVersion: '2026-10-30', acceptedAt: FieldValue.serverTimestamp() }, reference: randomUUID(), mode: mode.value(), state: 'creating', createdAt: FieldValue.serverTimestamp() };
    await checkoutRef(uid).set(stored);
    const remote = await api('/preapproval', { method: 'POST', key: stored.reference,
      body: subscriptionBody({ planId, email: payerEmail ?? email, reference: stored.reference, returnOrigin: returnOrigin.value(), webhook: webhookUrl.value() }) });
    return bindCheckout(uid, stored, remote);
  });
});

async function updateInvoice(uid, invoice, api) {
  const binding = (await db.doc(`billingBindings/${safeId(invoice.preapproval_id)}`).get()).data();
  if (!binding || binding.uid !== uid) throw new Error('unbound-invoice');
  if (!invoice.payment?.id) {
    await db.doc(`billingAccounts/${uid}/periods/${safeId(invoice.id)}`).set({ from: 0, through: 0, providerStatus: 'pending', updatedAt: FieldValue.serverTimestamp() });
    return;
  }
  const paymentId = safeId(invoice.payment?.id);
  const payment = await api(`/v1/payments/${paymentId}`);
  const testPayerEmail = mode.value() === 'test' ? (await db.doc(`billingTesters/${uid}`).get()).data()?.payerEmail : undefined;
  const period = paidPeriod(invoice, payment, String(invoice.preapproval_id), collectorId.value(), mode.value() === 'live', testPayerEmail, binding.planId);
  const batch = db.batch();
  batch.set(db.doc(`billingPayments/${paymentId}`), { uid, invoiceId: safeId(invoice.id) });
  batch.set(db.doc(`billingAccounts/${uid}/periods/${safeId(invoice.id)}`), {
    from: period?.from ?? 0, through: period?.through ?? 0, paymentId, planId: binding.planId ?? 'presupuestos',
    providerStatus: payment.status, updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();
}
async function publishAccess(uid, remote) {
  const periods = await db.collection(`billingAccounts/${uid}/periods`).where('through', '>', Date.now()).get();
  const now = Date.now();
  const active = periods.docs.map(doc => doc.data()).filter(p => p.from <= now);
  const full = active.filter(p => p.planId === 'croquis');
  const eligible = full.length ? full : active.filter(p => !p.planId || p.planId === 'presupuestos');
  const through = Math.max(0, ...eligible.map(p => p.through));
  await subscriptionRef(uid).set({ planId: full.length ? 'croquis' : 'presupuestos', status: through > now ? 'active' : 'inactive',
    paidThrough: Timestamp.fromMillis(through), providerStatus: remote.status, manageable: true,
    updatedAt: FieldValue.serverTimestamp() }, { merge: true });
  return { status: through > now ? 'active' : 'inactive' };
}
async function reconcile(uid, stored, api) {
  const remote = await api(`/preapproval/${safeId(stored.providerId)}`);
  validateRemote(remote, stored);
  // Fetch all pages: never interpret a truncated history as a complete payment record.
  for (let offset = 0; ; offset += 5) {
    if (offset >= 5000) throw new Error('history-requires-review');
    // The subscription API rejects limit=100 (and even 20); 5 is supported.
    const page = await api(`/authorized_payments/search?preapproval_id=${safeId(remote.id)}&limit=5&offset=${offset}`);
    if (!Array.isArray(page.results)) throw new Error('invalid-history');
    for (const invoice of page.results) {
      if (String(invoice.preapproval_id) !== String(remote.id)) throw new Error('invalid-history');
      await updateInvoice(uid, invoice, api);
    }
    if (page.results.length < 5) break;
  }
  return publishAccess(uid, remote);
}
export const refreshSubscription = onCall(options, async request => {
  const { uid } = identity(request); await permitted(uid);
  return withAccountLock(uid, async () => {
    const stored = (await checkoutRef(uid).get()).data();
    if (!stored?.providerId || stored.mode !== mode.value()) return { status: 'inactive' };
    return reconcile(uid, stored, await provider());
  });
});
export const cancelSubscription = onCall(options, async request => {
  const { uid } = identity(request); await permitted(uid);
  if (request.data?.confirm !== true) throw new HttpsError('invalid-argument', 'Confirmá la cancelación de la renovación.');
  return withAccountLock(uid, async () => {
    const stored = (await checkoutRef(uid).get()).data();
    if (!stored?.providerId || stored.mode !== mode.value()) throw new HttpsError('not-found', 'No hay una suscripción para cancelar.');
    const api = await provider(), path = `/preapproval/${safeId(stored.providerId)}`;
    const remote = await api(path); validateRemote(remote, stored);
    if (remote.status !== 'cancelled') await api(path, { method: 'PUT', body: { status: 'cancelled' } });
    // Cancellation stops renewals. Previously paid periods remain usable.
    return reconcile(uid, stored, api);
  });
});
export async function handleMercadoPagoWebhook(req, res) {
  if (req.method !== 'POST') return res.sendStatus(405);
  if (!['test', 'live'].includes(mode.value())) return res.sendStatus(503);
  let id;
  try { id = safeId(req.query['data.id']); } catch { return res.sendStatus(400); }
  if (!verifySignature({ id, requestId: req.get('x-request-id'), signature: req.get('x-signature'), secret: webhookSecret.value() })) return res.sendStatus(401);
  const topic = req.body?.type;
  if (!['subscription_preapproval', 'subscription_authorized_payment', 'payment'].includes(topic)) return res.sendStatus(200);
  try {
    const api = await provider();
    let binding, invoice;
    if (topic === 'subscription_preapproval') binding = (await db.doc(`billingBindings/${id}`).get()).data();
    else if (topic === 'subscription_authorized_payment') {
      invoice = await api(`/authorized_payments/${id}`);
      binding = (await db.doc(`billingBindings/${safeId(invoice.preapproval_id)}`).get()).data();
    } else {
      const payment = (await db.doc(`billingPayments/${id}`).get()).data();
      if (payment) { binding = { uid: payment.uid }; invoice = await api(`/authorized_payments/${safeId(payment.invoiceId)}`); }
    }
    // Unknown/pre-binding events retry, allowing creation to finish without losing the first payment.
    if (!binding) return res.sendStatus(503);
    await withAccountLock(binding.uid, async () => {
      const stored = (await checkoutRef(binding.uid).get()).data();
      if (!stored || stored.mode !== mode.value()) throw new Error('mode-mismatch');
      // Refetch inside the account lock so a concurrent older event cannot undo a refund.
      if (invoice) await updateInvoice(binding.uid, await api(`/authorized_payments/${safeId(invoice.id)}`), api);
      const remote = await api(`/preapproval/${safeId(stored.providerId)}`);
      validateRemote(remote, stored);
      await publishAccess(binding.uid, remote);
    });
    return res.sendStatus(200);
  } catch {
    // Keep provider payloads, signatures, payer data and credentials out of logs.
    return res.sendStatus(503);
  }
}
export const mercadoPagoWebhook = onRequest({ ...options, secrets: [accessToken, webhookSecret], cors: false }, handleMercadoPagoWebhook);

const turnstileSecret = defineSecret('TURNSTILE_SECRET');
export const registerAccount = onCall({ region: 'us-central1', minInstances: 0, maxInstances: 1, concurrency: 5, timeoutSeconds: 20, memory: '256MiB',
  cors: ['https://electricistaxpress.com.ar', 'https://www.electricistaxpress.com.ar'], secrets: [turnstileSecret] }, async request => {
  try { return await registerProtected({ data: request.data, ip: request.rawRequest.ip, secret: turnstileSecret.value(), db, auth: getAuth(), Timestamp }); }
  catch { throw new HttpsError('failed-precondition', 'No se pudo completar el registro. Revisá la verificación o reintentá más tarde. Si ya tenés cuenta, ingresá o recuperá tu contraseña.'); }
});
