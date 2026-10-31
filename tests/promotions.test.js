import { expect,it } from 'vitest';
import { paymentSummary, validatePaymentOptions, validatePromotionSettings } from '../src/services/promotions';
it('discounts cash only and calculates each financed alternative from the original amount',()=>{
 const result=paymentSummary(1000,{discountPercent:10,installments:[{count:3,surchargePercent:20},{count:6,surchargePercent:50},{count:12,surchargePercent:100}]});
 expect(result.cashTotal).toBe(900);expect(result.discount).toBe(100);
 expect(result.plans.map(p=>p.total)).toEqual([1200,1500,2000]);expect(result.plans[0].installment).toBe(400);
});
it('preserves exact cents with a separately adjusted final installment',()=>{
 const p=paymentSummary(100,{discountPercent:0,installments:[{count:3,surchargePercent:0}]}).plans[0];
 expect(p.installment).toBe(33.33);expect(p.lastInstallment).toBe(33.34);
 expect(Math.round((p.installment*2+p.lastInstallment)*100)).toBe(10000);
 expect(paymentSummary(100.55,{discountPercent:12.5,installments:[]}).cashTotal).toBe(87.98);
});
it('rejects duplicate counts, unsupported counts, blank, negative, non-finite and excessive percentages',()=>{
 for(const discountPercent of ['',null,NaN,Infinity,-1,101])expect(()=>validatePaymentOptions({discountPercent,installments:[]})).toThrow();
 for(const plan of [{count:4,surchargePercent:0},{count:3,surchargePercent:1001},{count:3,surchargePercent:null}])expect(()=>validatePaymentOptions({discountPercent:0,installments:[plan]})).toThrow();
 expect(()=>validatePaymentOptions({discountPercent:0,installments:[{count:3,surchargePercent:0},{count:3,surchargePercent:10}]})).toThrow();
 expect(()=>paymentSummary(Number.MAX_SAFE_INTEGER/100,{discountPercent:0,installments:[{count:12,surchargePercent:1000}]})).toThrow();
 expect(validatePromotionSettings().installments.map(p=>p.count)).toEqual([3,6,12]);
 expect(()=>validatePromotionSettings({discountPercent:0,installments:[]})).toThrow();
});
