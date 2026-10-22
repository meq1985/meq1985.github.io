export const PLANS = Object.freeze([
  Object.freeze({ id: 'presupuestos', name: 'Presupuestos', amount: 12000, currency: 'ARS', available: true }),
  Object.freeze({ id: 'croquis', name: 'Presupuestos + croquis', amount: 25000, currency: 'ARS', available: false }),
]);
export const isAdministrator = (user, record) => user?.emailVerified === true && record?.enabled === true;
export const subscriptionRequired = () => Object.assign(new Error('Tu cuenta incluye un proyecto gratuito. Para crear o trabajar en otros proyectos necesitás una suscripción.'), { code: 'billing/subscription-required' });
export function projectAccess({ enabled = false, admin = false, freeProjectId = null, subscription = null }, projectId, now = Date.now()) {
  const paid = subscription?.planId === 'presupuestos' && subscription?.status === 'active' &&
    Number.isFinite(subscription?.paidThrough) && subscription.paidThrough > now;
  return !enabled || admin || paid || !freeProjectId || freeProjectId === projectId;
}
