import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
if (process.env.GCLOUD_PROJECT !== 'demo-presupuesto-electrico' || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw new Error('Isolated demo emulator required.');
process.env.MP_ACCESS_TOKEN = 'fake-no-real-network';
process.env.MP_WEBHOOK_SECRET = 'fake-signature';
process.env.MP_MODE = 'test';
process.env.MP_COLLECTOR_ID = '123';
process.env.APP_ORIGIN = 'https://electricistaxpress.web.app';
process.env.MP_WEBHOOK_URL = 'https://fixed.example.invalid/webhook';
const { getFirestore } = await import('firebase-admin/firestore');
const { deleteApp, getApp } = await import('firebase-admin/app');
const billing = await import('../index.js');
const db = getFirestore();
after(async () => { await db.terminate(); await deleteApp(getApp()); });
let posts = 0, failPost = false, realMerchant = false;
const subscriptions = new Map(), invoices = new Map(), payments = new Map();
globalThis.fetch = async (url, options) => {
  assert.equal(new URL(url).origin, 'https://api.mercadopago.com');
  const path = new URL(url).pathname, query = new URL(url).searchParams;
  let result;
  if (path === '/users/me') result = { id: 123, site_id: 'MLA', tags: realMerchant ? ['normal'] : ['test_user'] };
  else if (path === '/preapproval' && options.method === 'POST') {
    posts++; const body = JSON.parse(options.body), id = `sub${posts}`;
    result = { ...body, id, collector_id: 123, init_point: `https://www.mercadopago.com.ar/subscriptions/checkout?id=${id}` };
    subscriptions.set(id, result);
    if (failPost) throw new Error('simulated-lost-response');
  } else if (path === '/preapproval/search') result = { results: [...subscriptions.values()].filter(s => s.external_reference === query.get('external_reference')) };
  else if (path.startsWith('/preapproval/')) {
    result = subscriptions.get(path.split('/').at(-1));
    if (options.method === 'PUT') Object.assign(result, JSON.parse(options.body));
  } else if (path === '/authorized_payments/search') {
    assert.equal(query.get('limit'), '5');
    const offset = Number(query.get('offset'));
    result = { results: [...invoices.values()].filter(i => i.preapproval_id === query.get('preapproval_id')).slice(offset, offset + 5) };
  }
  else if (path.startsWith('/authorized_payments/')) result = invoices.get(path.split('/').at(-1));
  else if (path.startsWith('/v1/payments/')) result = payments.get(path.split('/').at(-1));
  assert.ok(result, `Unexpected provider request: ${path}`);
  return { ok: true, json: async () => structuredClone(result) };
};
const request = (uid = 'billing-owner', data = { planId: 'presupuestos', consent: true }) => ({ auth: { uid, token: { email_verified: true, email: `${uid}@example.invalid` } }, data });
const webhook = async (id, type = 'subscription_authorized_payment', signed = true) => {
  const hash = createHmac('sha256', 'fake-signature').update(`id:${id};request-id:test-request;ts:123;`).digest('hex');
  const req = { method: 'POST', query: { 'data.id': id }, body: { type }, get: name => ({ 'x-signature': signed ? `ts=123,v1=${hash}` : '', 'x-request-id': 'test-request' })[name] };
  let status;
  await billing.handleMercadoPagoWebhook(req, { sendStatus: code => { status = code; } });
  return status;
};
test('complete billing lifecycle uses only the emulator and a simulated provider', async t => {
  await db.doc('billingTesters/billing-owner').set({ enabled: true, payerEmail: 'buyer@testuser.com' });
  await t.test('rejects anonymous, unverified, non-testers and future croquis plan', async () => {
    await assert.rejects(billing.createSubscription.run({ data: {} }), /correo verificado/);
    await assert.rejects(billing.createSubscription.run({ ...request(), auth: { ...request().auth, token: { email_verified: false } } }), /correo verificado/);
    await assert.rejects(billing.createSubscription.run(request('not-tester')), /privado/);
    await assert.rejects(billing.createSubscription.run(request('billing-owner', { planId: 'croquis', consent: true })), /mensualidad/);
  });
  await t.test('administrator cannot accidentally buy a subscription', async () => {
    await db.doc('administradores/billing-owner').set({ enabled: true });
    await assert.rejects(billing.createSubscription.run(request()), /no está habilitada/);
    await db.doc('administradores/billing-owner').delete();
  });
  await t.test('test checkout requires a privately configured fictitious payer', async () => {
    await db.doc('billingTesters/missing-payer').set({ enabled: true });
    const before = posts;
    await assert.rejects(billing.createSubscription.run(request('missing-payer', {
      planId: 'presupuestos', consent: true, payerEmail: 'injected@testuser.com',
    })), /comprador ficticio/);
    await db.doc('billingTesters/missing-payer').update({ payerEmail: 'real@example.com' });
    await assert.rejects(billing.createSubscription.run(request('missing-payer')), /comprador ficticio/);
    assert.equal(posts, before);
    assert.equal((await billing.refreshSubscription.run(request('missing-payer'))).status, 'inactive');
  });
  await t.test('test mode rejects real seller credentials before creating a subscription', async () => {
    const before = posts; realMerchant = true;
    await assert.rejects(billing.createSubscription.run(request()), /credenciales no corresponden/);
    assert.equal(posts, before); realMerchant = false;
  });
  await t.test('repeated checkout resumes one subscription and never trusts client price', async () => {
    await billing.createSubscription.run(request('billing-owner', { planId: 'presupuestos', consent: true, amount: 1, payerEmail: 'injected@example.com' }));
    await billing.createSubscription.run(request());
    assert.equal(posts, 1); assert.equal(subscriptions.get('sub1').auto_recurring.transaction_amount, 12000);
    assert.equal(subscriptions.get('sub1').payer_email, 'buyer@testuser.com');
    assert.equal((await db.doc('suscripciones/billing-owner').get()).data().status, undefined);
  });
  await t.test('authorization alone grants no access', async () => {
    subscriptions.get('sub1').status = 'authorized';
    assert.equal((await billing.refreshSubscription.run(request())).status, 'inactive');
  });
  const debit = new Date(Date.now() - 60000).toISOString();
  invoices.set('inv1', { id: 'inv1', preapproval_id: 'sub1', payment: { id: 'pay1' }, debit_date: debit, currency_id: 'ARS', transaction_amount: 12000 });
  payments.set('pay1', { id: 'pay1', status: 'approved', collector_id: 123, currency_id: 'ARS', transaction_amount: 12000, live_mode: true, payer: { email: 'buyer@testuser.com' } });
  let originalExpiry;
  await t.test('forged webhook is denied and confirmed payment activates only its owner', async () => {
    assert.equal(await webhook('inv1', undefined, false), 401);
    assert.equal(await webhook('inv1'), 200);
    const subscription = (await db.doc('suscripciones/billing-owner').get()).data();
    assert.equal(subscription.status, 'active'); originalExpiry = subscription.paidThrough.toMillis();
    assert.equal((await db.doc('suscripciones/not-tester').get()).exists, false);
  });
  await t.test('duplicates and old events cannot extend the period', async () => {
    assert.equal(await webhook('inv1'), 200); assert.equal(await webhook('sub1', 'subscription_preapproval'), 200);
    assert.equal((await db.doc('suscripciones/billing-owner').get()).data().paidThrough.toMillis(), originalExpiry);
  });
  await t.test('cancellation stops renewals and retains the paid period', async () => {
    await billing.cancelSubscription.run(request('billing-owner', { confirm: true }));
    assert.equal(subscriptions.get('sub1').status, 'cancelled');
    const subscription = (await db.doc('suscripciones/billing-owner').get()).data();
    assert.equal(subscription.providerStatus, 'cancelled'); assert.equal(subscription.paidThrough.toMillis(), originalExpiry);
  });
  await t.test('a refund removes paid access even after a duplicate old invoice event', async () => {
    payments.get('pay1').transaction_amount_refunded = 12000;
    assert.equal(await webhook('pay1', 'payment'), 200);
    assert.equal(await webhook('inv1'), 200);
    assert.equal((await db.doc('suscripciones/billing-owner').get()).data().status, 'inactive');
  });
  await t.test('lost create response recovers by reference without charging twice', async () => {
    await db.doc('billingTesters/billing-recovery').set({ enabled: true, payerEmail: 'buyer@testuser.com' });
    failPost = true;
    await assert.rejects(billing.createSubscription.run(request('billing-recovery')), /lost-response/);
    failPost = false;
    const result = await billing.createSubscription.run(request('billing-recovery'));
    assert.ok(result.url.includes('sub2')); assert.equal(posts, 2);
  });
  await t.test('two simultaneous checkout requests create only one subscription', async () => {
    await db.doc('billingTesters/billing-concurrent').set({ enabled: true, payerEmail: 'buyer@testuser.com' });
    const before = posts;
    const results = await Promise.allSettled([billing.createSubscription.run(request('billing-concurrent')), billing.createSubscription.run(request('billing-concurrent'))]);
    assert.equal(results.some(result => result.status === 'fulfilled'), true);
    assert.equal(posts, before + 1);
  });
  await t.test('a confirmed renewal preserves access when an older payment is reversed', async () => {
    invoices.set('inv2', { ...invoices.get('inv1'), id: 'inv2', payment: { id: 'pay2' } });
    payments.set('pay2', { ...payments.get('pay1'), id: 'pay2', transaction_amount_refunded: 0 });
    assert.equal(await webhook('inv2'), 200);
    assert.equal(await webhook('inv1'), 200);
    assert.equal((await db.doc('suscripciones/billing-owner').get()).data().status, 'active');
  });
  await t.test('live mode stays closed without both production activation flags', async () => {
    process.env.MP_MODE = 'live';
    await assert.rejects(billing.createSubscription.run(request('new-live-user')), /no está habilitada/);
    process.env.MP_MODE = 'test';
  });
  await t.test('reconciliation reaches a paid invoice beyond the first five results', async () => {
    await db.doc('billingTesters/billing-pages').set({ enabled: true, payerEmail: 'buyer@testuser.com' });
    await billing.createSubscription.run(request('billing-pages'));
    const sub = `sub${posts}`;
    for (let n = 0; n < 6; n++) invoices.set(`page${n}`, {
      ...invoices.get('inv1'), id: `page${n}`, preapproval_id: sub, payment: n === 5 ? { id: 'pagepay' } : {},
    });
    payments.set('pagepay', { ...payments.get('pay1'), id: 'pagepay', transaction_amount_refunded: 0 });
    assert.equal((await billing.refreshSubscription.run(request('billing-pages'))).status, 'active');
  });
});
