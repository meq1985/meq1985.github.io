import { paymentSummary } from './promotions';

const limits = { reference: 40, workAddress: 200, scope: 800, exclusions: 800, paymentTerms: 400, executionPeriod: 120 };
const labels = { reference: 'Referencia', workAddress: 'Dirección de obra', scope: 'Alcance', exclusions: 'Exclusiones', paymentTerms: 'Condiciones de pago', executionPeriod: 'Plazo estimado' };
export function calendarDate(value) {
  if (typeof value !== 'string' || !/^[12]\d{3}-\d{2}-\d{2}$/.test(value)) throw new Error('Revisá la fecha de emisión.');
  const date = new Date(value + 'T00:00:00Z');
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== value) throw new Error('Revisá la fecha de emisión.');
  return value;
}
export function localDate(value = new Date()) {
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) throw new Error('Revisá la fecha de emisión.');
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  return ['year', 'month', 'day'].map(type => parts.find(p => p.type === type).value).join('-');
}
export function newCommercialTerms(projectId, date = new Date()) {
  return { reference: `EX-${String(projectId).replace(/[^a-zA-Z0-9]/g, '').slice(0, 12).toUpperCase()}`,
    issuedOn: localDate(date), validityDays: 15, workAddress: '', scope: '', exclusions: '', paymentTerms: '', executionPeriod: '', advancePercent: 0 };
}
export function validateCommercialTerms(input) {
  if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Revisá las condiciones comerciales.');
  const result = {};
  for (const [key, max] of Object.entries(limits)) {
    if (typeof input[key] !== 'string' || input[key].length > max) throw new Error(`${labels[key]}: ingresá un texto de hasta ${max} caracteres.`);
    result[key] = input[key].trim();
  }
  result.issuedOn = calendarDate(input.issuedOn);
  if (!Number.isInteger(input.validityDays) || input.validityDays < 0 || input.validityDays > 365) throw new Error('La vigencia debe estar entre 0 y 365 días.');
  if (typeof input.advancePercent !== 'number' || !Number.isFinite(input.advancePercent) || input.advancePercent < 0 || input.advancePercent > 100) throw new Error('El anticipo debe estar entre 0 y 100 %.');
  return { ...result, validityDays: input.validityDays, advancePercent: Math.round(input.advancePercent * 100) / 100 };
}
export function validityEnd(input) {
  const terms = validateCommercialTerms(input);
  if (!terms.validityDays) return null;
  const date = new Date(terms.issuedOn + 'T00:00:00Z');
  date.setUTCDate(date.getUTCDate() + terms.validityDays);
  return date.toISOString().slice(0, 10);
}
export const displayDate = value => calendarDate(value).split('-').reverse().join('/');
export function advanceSummary(total, options, input) {
  const terms = validateCommercialTerms(input), payment = paymentSummary(total, options);
  const base = Math.round(payment.cashTotal * 100);
  const advance = Number((BigInt(base) * BigInt(Math.round(terms.advancePercent * 100)) + 5000n) / 10000n);
  return { cashTotal: payment.cashTotal, percent: terms.advancePercent, advance: advance / 100, balance: (base - advance) / 100 };
}
