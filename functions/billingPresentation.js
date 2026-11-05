// Owner-facing projections only; never expose provider payloads, payer or card data.
export function providerTime(value) {
  const n=typeof value==='string' && /^\d{4}-\d{2}-\d{2}T/.test(value) ? Date.parse(value) : NaN;
  return Number.isFinite(n) && n>0 ? n : null;
}
export function paymentPresentation(invoice,payment,amount,planId,validContext) {
  const allowed=['approved','rejected','pending','in_process','cancelled','refunded','charged_back','authorized'];
  let status=validContext && allowed.includes(payment?.status) ? payment.status : payment ? 'review' : 'pending';
  if(status==='approved' && Number(payment.transaction_amount_refunded ?? 0)>0) status='refunded';
  const paidAt=validContext?providerTime(payment?.date_approved):null;
  const scheduledAt=providerTime(invoice.debit_date);
  return {planId,amount,currency:'ARS',status,scheduledAt,paidAt,
    successfulAt:status==='approved'?(paidAt ?? scheduledAt ?? 0):0};
}
export function subscriptionPresentation(remote,stored) {
  return {contractedAt:providerTime(remote.date_created) ?? stored?.createdAt?.toMillis?.() ?? null,
    nextPaymentAt:remote.status==='authorized'?providerTime(remote.next_payment_date):null};
}
