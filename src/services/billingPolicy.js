export const PLANS = Object.freeze([
  Object.freeze({ id: 'presupuestos', name: 'Presupuestos', amount: 12000, currency: 'ARS', available: true }),
  Object.freeze({ id: 'croquis', name: 'Presupuestos + croquis', amount: 25000, currency: 'ARS', available: true }),
]);
export const isAdministrator = (user, record) => user?.emailVerified === true && record?.enabled === true;
export const TRIAL_MS = 30 * 86400000;
export const subscriptionRequired = () => Object.assign(new Error('Tu prueba gratuita de 30 días terminó. Necesitás una suscripción para crear proyectos o guardar cambios. Podés consultar tus proyectos y descargar sus PDF.'), { code: 'billing/subscription-required' });
export function paidPlan(subscription, now = Date.now()) {
  return PLANS.some(p => p.id === subscription?.planId) && subscription.status === 'active' &&
    Number.isFinite(subscription.paidThrough) && subscription.paidThrough > now ? subscription.planId : null;
}
export function trialAccess({ trialStartedAt = null }, now = Date.now()) {
  return Number.isFinite(trialStartedAt) && trialStartedAt <= now && now < trialStartedAt + TRIAL_MS;
}
export function projectAccess(state, projectId, now = Date.now()) {
  return state.admin === true || !!paidPlan(state.subscription, now) || trialAccess(state, now);
}
export function sketchAccess(state, now = Date.now()) {
  const plan = paidPlan(state.subscription, now);
  return state.admin === true || plan === 'croquis' || (!plan && trialAccess(state, now));
}
