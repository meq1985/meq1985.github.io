export const INSTALLMENTS = [3, 6, 12];
export const emptyPaymentOptions = () => ({ discountPercent: 0, installments: [] });
export const defaultPromotionSettings = () => ({ discountPercent: 0, installments: INSTALLMENTS.map(count => ({ count, surchargePercent: 0 })) });
const percent = (value, max) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > max) throw new Error(`Revisá el porcentaje: debe estar entre 0 y ${max}.`);
  return Math.round(value * 100) / 100;
};
export function validatePaymentOptions(input = emptyPaymentOptions()) {
  if (!input || !Array.isArray(input.installments) || input.installments.length > 3) throw new Error('Revisá las opciones de pago.');
  const used = new Set();
  const installments = input.installments.map(plan => {
    if (!INSTALLMENTS.includes(plan?.count) || used.has(plan.count)) throw new Error('Elegí una sola opción para 3, 6 o 12 cuotas.');
    used.add(plan.count); return { count: plan.count, surchargePercent: percent(plan.surchargePercent, 1000) };
  }).sort((a, b) => a.count - b.count);
  return { discountPercent: percent(input.discountPercent, 100), installments };
}
export function validatePromotionSettings(input = defaultPromotionSettings()) {
  const result = validatePaymentOptions(input);
  if (result.installments.length !== 3) throw new Error('Configurá los recargos de 3, 6 y 12 cuotas.');
  return result;
}
const cents = value => {
  const result = Math.round((value + Number.EPSILON) * 100);
  if (!Number.isSafeInteger(result) || result < 0) throw new Error('El importe es demasiado grande.');
  return result;
};
export function paymentSummary(total, input) {
  const base = cents(total), options = validatePaymentOptions(input);
  const discount = Number((BigInt(base) * BigInt(Math.round(options.discountPercent * 100)) + 5000n) / 10000n);
  const plans = options.installments.map(plan => {
    const financed = Number((BigInt(base) * (10000n + BigInt(Math.round(plan.surchargePercent * 100))) + 5000n) / 10000n);
    if (!Number.isSafeInteger(financed)) throw new Error('El importe financiado es demasiado grande.');
    const installment = Math.floor(financed / plan.count);
    return { ...plan, total: financed / 100, installment: installment / 100, lastInstallment: (financed - installment * (plan.count - 1)) / 100 };
  });
  return { base: base / 100, discountPercent: options.discountPercent, discount: discount / 100, cashTotal: (base - discount) / 100, plans };
}
