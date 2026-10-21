import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createHmac } from 'node:crypto';
import { verifySignature, checkoutUrl, subscriptionBody, validSubscription, paidPeriod, createProvider, periodEnd, safeId } from '../mercadopago.js';

test('signatures reject missing, forged, wrong-resource and malformed notifications', () => {
  const fields = { id: 'ABC123', secret: 'test-secret', requestId: 'request' };
  const hash = createHmac('sha256', fields.secret).update('id:abc123;request-id:request;ts:123;').digest('hex');
  assert.equal(verifySignature({ ...fields, signature: `ts=123,v1=${hash}` }), true);
  for (const signature of [undefined, 'ts=123,v1=aa', `ts=124,v1=${hash}`, `ts=123,v1=${'0'.repeat(64)}`]) assert.equal(verifySignature({ ...fields, signature }), false);
  assert.equal(verifySignature({ ...fields, id: 'other', signature: `ts=123,v1=${hash}` }), false);
});
test('checkout accepts only the HTTPS Mercado Pago Argentina host', () => {
  assert.equal(checkoutUrl('https://www.mercadopago.com.ar/subscriptions/checkout?id=1'), 'https://www.mercadopago.com.ar/subscriptions/checkout?id=1');
  for (const url of ['http://www.mercadopago.com.ar/', 'https://www.mercadopago.com.ar.evil.invalid/', 'https://user@www.mercadopago.com.ar/']) assert.throws(() => checkoutUrl(url));
  assert.throws(() => safeId('../payment'));
});
test('changing frontend domain changes only the return URL and leaves fixed pricing and webhook', () => {
  const input = { email: 'buyer@example.invalid', reference: 'opaque-reference', webhook: 'https://fixed.example.invalid/webhook' };
  const before = subscriptionBody({ ...input, returnOrigin: 'https://electricistaxpress.web.app' });
  const after = subscriptionBody({ ...input, returnOrigin: 'https://new.example.invalid' });
  assert.equal(after.back_url, 'https://new.example.invalid/planes');
  delete before.back_url; delete after.back_url; assert.deepEqual(before, after);
  assert.equal(after.status, 'pending'); assert.equal(after.auto_recurring.transaction_amount, 12000);
});
test('remote subscription must belong to the merchant and match the fixed monthly plan', () => {
  const remote = { external_reference: 'ref', collector_id: 123, auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: 12000, currency_id: 'ARS' } };
  assert.equal(validSubscription(remote, 'ref', '123'), true);
  assert.equal(validSubscription(remote, 'other', '123'), false);
  assert.equal(validSubscription(remote, 'ref', '456'), false);
  assert.equal(validSubscription({ ...remote, auto_recurring: { ...remote.auto_recurring, transaction_amount: 1 } }, 'ref', '123'), false);
});
test('calendar months clamp month-end, preserve offset and support leap years', () => {
  assert.equal(periodEnd('2028-01-31T10:00:00-03:00'), Date.parse('2028-02-29T10:00:00-03:00'));
  assert.equal(periodEnd('2026-01-31T10:00:00Z'), Date.parse('2026-02-28T10:00:00Z'));
  assert.equal(periodEnd('2026-12-21T10:00:00Z'), Date.parse('2027-01-21T10:00:00Z'));
  assert.throws(() => periodEnd('invalid'));
});
test('only exact confirmed, unreversed payments for this subscription/merchant/environment grant a period', () => {
  const invoice = { preapproval_id: 'sub', payment: { id: 100 }, debit_date: '2026-10-20T10:00:00Z', currency_id: 'ARS', transaction_amount: '12000' };
  const payment = { id: 100, status: 'approved', currency_id: 'ARS', transaction_amount: 12000, collector_id: 123, live_mode: false };
  const args = ['sub', '123', false];
  assert.equal(paidPeriod(invoice, payment, ...args).through, Date.parse('2026-11-20T10:00:00Z'));
  for (const patch of [{ status: 'pending' }, { status: 'rejected' }, { status: 'charged_back' }, { transaction_amount_refunded: 1 }, { collector_id: 456 }, { transaction_amount: 25000 }, { live_mode: true }, { currency_id: 'USD' }, { id: 200 }]) assert.equal(paidPeriod(invoice, { ...payment, ...patch }, ...args), null);
  assert.equal(paidPeriod({ ...invoice, preapproval_id: 'other' }, payment, ...args), null);
});
test('provider never follows redirects or exposes financial error bodies', async () => {
  let options;
  const api = createProvider('fake-test-token', async (_url, input) => { options = input; return { ok: false, json() { throw new Error('must not read'); } }; });
  await assert.rejects(api('/preapproval'), /provider-unavailable/);
  assert.equal(options.redirect, 'error');
});
