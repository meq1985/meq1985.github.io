import { createHmac, timingSafeEqual } from 'node:crypto';

export const PRICE = 12000;
export function safeId(value) {
  const id = String(value ?? '');
  if (!/^[A-Za-z0-9_-]{1,100}$/.test(id)) throw new Error('invalid-resource');
  return id;
}
export function verifySignature({ signature, requestId, id, secret }) {
  if (!secret || typeof signature !== 'string' || typeof requestId !== 'string' || !requestId || !id) return false;
  const parts = Object.fromEntries(signature.split(',').map(part => part.trim().split('=')));
  if (!/^\d+$/.test(parts.ts ?? '') || !/^[a-f0-9]{64}$/i.test(parts.v1 ?? '')) return false;
  const digest = createHmac('sha256', secret).update(`id:${String(id).toLowerCase()};request-id:${requestId};ts:${parts.ts};`).digest();
  return timingSafeEqual(digest, Buffer.from(parts.v1, 'hex'));
}
export function checkoutUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.hostname !== 'www.mercadopago.com.ar' || url.username || url.password) throw new Error('invalid-checkout');
  return url.href;
}
export function siteUrl(value) {
  const url = new URL(value);
  if (url.protocol !== 'https:' || url.username || url.password || url.search || url.hash || url.pathname !== '/') throw new Error('invalid-site');
  return url.origin;
}
export function createProvider(token, fetcher = fetch) {
  return async (path, { method = 'GET', body, key } = {}) => {
    const response = await fetcher(`https://api.mercadopago.com${path}`, {
      method, redirect: 'error', signal: AbortSignal.timeout(12000),
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', ...(key ? { 'X-Idempotency-Key': key } : {}) },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
    // Never expose provider bodies: they may contain financial data or credentials.
    if (!response.ok) throw new Error('provider-unavailable');
    return response.json();
  };
}
export function subscriptionBody({ email, reference, returnOrigin, webhook }) {
  return {
    reason: 'Electricista Xpress — Presupuestos mensual', external_reference: reference,
    payer_email: email, status: 'pending', back_url: `${siteUrl(returnOrigin)}/planes`,
    notification_url: webhook,
    auto_recurring: { frequency: 1, frequency_type: 'months', transaction_amount: PRICE, currency_id: 'ARS' },
  };
}
export function validSubscription(subscription, reference, collectorId) {
  return subscription.external_reference === reference && String(subscription.collector_id) === String(collectorId) &&
    subscription.auto_recurring?.frequency === 1 && subscription.auto_recurring?.frequency_type === 'months' &&
    Number(subscription.auto_recurring?.transaction_amount) === PRICE && subscription.auto_recurring?.currency_id === 'ARS';
}
// Calendar month from the provider's scheduled debit, retaining its timezone offset.
// A delayed approval or repeated webhook cannot extend the same billing period.
export function periodEnd(debitDate) {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(.+?)(Z|[+-]\d{2}:\d{2})$/.exec(debitDate ?? '');
  if (!match || !Number.isFinite(Date.parse(debitDate))) throw new Error('invalid-period');
  const month = Number(match[2]), year = Number(match[1]);
  const nextYear = month === 12 ? year + 1 : year, nextMonth = month === 12 ? 1 : month + 1;
  const day = Math.min(Number(match[3]), new Date(Date.UTC(nextYear, nextMonth, 0)).getUTCDate());
  return Date.parse(`${nextYear}-${String(nextMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}T${match[4]}${match[5]}`);
}
export function paidPeriod(invoice, payment, subscriptionId, collectorId, liveMode) {
  if (String(invoice.preapproval_id) !== subscriptionId || String(invoice.payment?.id) !== String(payment.id) ||
      String(payment.collector_id) !== String(collectorId) || payment.live_mode !== liveMode ||
      invoice.currency_id !== 'ARS' || Number(invoice.transaction_amount) !== PRICE ||
      payment.currency_id !== 'ARS' || Number(payment.transaction_amount) !== PRICE ||
      payment.status !== 'approved' || Number(payment.transaction_amount_refunded ?? 0) !== 0) return null;
  return { from: Date.parse(invoice.debit_date), through: periodEnd(invoice.debit_date) };
}
