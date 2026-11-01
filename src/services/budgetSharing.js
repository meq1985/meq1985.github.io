import { currency } from '../data/laborCatalog';
import { paymentSummary } from './promotions';
import { validityEnd, displayDate } from './commercialTerms';

const singleLine = value => String(value ?? '').replace(/[\r\n\u0000-\u001f\u007f]/g, ' ').trim();
export function budgetFilename(name, revision) {
  const safe = singleLine(name).normalize('NFKD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_').slice(0, 80) || 'proyecto';
  return `presupuesto-${safe}${Number.isSafeInteger(revision) && revision > 0 ? '-v' + revision : ''}.pdf`;
}
export function sharePayload(document, budget, profile, { name, revision = null } = {}) {
  const reference = singleLine(budget.commercialTerms?.reference);
  const identifier = `${reference ? ' ' + reference : ''}${revision ? ' · versión ' + revision : ''}`;
  const title = `Presupuesto${identifier}`;
  const payment = paymentSummary(budget.total, budget.paymentOptions);
  const end = budget.commercialTerms ? validityEnd(budget.commercialTerms) : null;
  const author = singleLine(profile.empresa1) || [singleLine(profile.nombre1), singleLine(profile.apellido1)].filter(Boolean).join(' ');
  const message = [`Hola ${singleLine(budget.cliente)}.`, `Te comparto el presupuesto${identifier}.`,
    `Total de mano de obra: ${currency(payment.base)} ARS.`,
    payment.discountPercent ? `Al contado: ${currency(payment.cashTotal)} ARS (${payment.discountPercent} % de descuento).` : '',
    end ? `Válido hasta el ${displayDate(end)}.` : '', 'Revisá el detalle y las condiciones en el PDF.', author].filter(Boolean).join('\n');
  const filename = budgetFilename(name || budget.cliente, revision);
  return { title, message, filename, file: new File([document.output('blob')], filename, { type: 'application/pdf' }) };
}
export function whatsappLink(phone, message) {
  const value = String(phone ?? '').trim();
  if (value && !/^\+?[\d\s().-]+$/.test(value)) throw new Error('Ingresá un teléfono con código de país.');
  const digits = value.replace(/\D/g, '');
  if (value && (digits.length < 8 || digits.length > 15 || digits.startsWith('0'))) throw new Error('Ingresá un teléfono con código de país, sin el 0 inicial.');
  return `https://wa.me/${digits}?${new URLSearchParams({ text: message })}`;
}
export function emailLink(email, title, message) {
  const address = String(email ?? '').trim();
  if (address && (!/^[^\s@,;<>:]+@(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+[a-z]{2,63}$/i.test(address) || address.length > 254)) throw new Error('Revisá el correo del destinatario.');
  const recipient = address ? address.split('@').map((part,index)=>index ? part : encodeURIComponent(part)).join('@') : '';
  return `mailto:${recipient}?subject=${encodeURIComponent(singleLine(title))}&body=${encodeURIComponent(message)}`;
}
