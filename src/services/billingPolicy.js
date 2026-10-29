export const PLANS = Object.freeze([
  Object.freeze({ id: 'presupuestos', name: 'Presupuestos', amount: 12000, currency: 'ARS', available: true }),
  Object.freeze({ id: 'croquis', name: 'Presupuestos + croquis', amount: 25000, currency: 'ARS', available: false }),
]);
export const isAdministrator = (user, record) => user?.emailVerified === true && record?.enabled === true;
export const TRIAL_MS = 30 * 86400000;
export const subscriptionRequired = () => Object.assign(new Error('Tu prueba gratuita de 30 días terminó. Necesitás una suscripción para crear proyectos o guardar cambios. Podés consultar tus proyectos y descargar sus PDF.'), { code: 'billing/subscription-required' });
export function projectAccess({ admin = false, trialStartedAt = null, subscription = null }, projectId, now = Date.now()) {
  const paid = subscription?.planId === 'presupuestos' && subscription?.status === 'active' &&
    Number.isFinite(subscription?.paidThrough) && subscription.paidThrough > now;
  return admin || paid || (Number.isFinite(trialStartedAt) && trialStartedAt <= now && now < trialStartedAt + TRIAL_MS);
}
