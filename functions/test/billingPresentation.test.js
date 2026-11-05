import {test} from 'node:test';import assert from 'node:assert/strict';
import {paymentPresentation,subscriptionPresentation} from '../billingPresentation.js';
test('exposes separate provider dates and only bounded payment fields',()=>{
 const invoice={debit_date:'2026-11-01T10:00:00Z'},payment={status:'approved',date_approved:'2026-11-02T12:00:00Z',payer:{email:'private@example.invalid'},card:{number:'never-expose'}};
 const p=paymentPresentation(invoice,payment,19900,'croquis',true);
 assert.notEqual(p.scheduledAt,p.paidAt);assert.equal(p.status,'approved');assert.equal(p.successfulAt,p.paidAt);assert.equal('payer' in p,false);assert.equal('card' in p,false);
 assert.equal(paymentPresentation(invoice,{...payment,status:'rejected'},19900,'croquis',true).successfulAt,0);
 assert.equal(paymentPresentation(invoice,{...payment,transaction_amount_refunded:1},19900,'croquis',true).status,'refunded');
 assert.equal(paymentPresentation(invoice,payment,19900,'croquis',false).status,'review');
 assert.equal(paymentPresentation(invoice,payment,19900,'croquis',false).paidAt,null);
 assert.equal(paymentPresentation(invoice,null,19900,'croquis',false).status,'pending');
});
test('does not derive the next debit from paid-through or invent missing approval dates',()=>{
 const remote={status:'authorized',date_created:'2026-11-01T10:00:00Z',next_payment_date:'2026-12-03T10:00:00Z'};
 assert.equal(subscriptionPresentation(remote,{}).nextPaymentAt,Date.parse(remote.next_payment_date));
 assert.equal(subscriptionPresentation({...remote,status:'cancelled'},{}).nextPaymentAt,null);
 assert.equal(subscriptionPresentation({},{}).contractedAt,null);
 assert.equal(paymentPresentation({debit_date:'2026-11-01T10:00:00Z'},{status:'approved'},12000,'presupuestos',true).paidAt,null);
});
