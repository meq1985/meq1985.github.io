import { it, expect } from 'vitest';
import { PLANS, isAdministrator, projectAccess } from '../src/services/billingPolicy';
it('reserves administration for the verified existing account, never a profile flag', () => {
  expect(isAdministrator({ emailVerified: true }, { enabled: true })).toBe(true);
  expect(isAdministrator({ emailVerified: true }, null)).toBe(false);
  expect(isAdministrator({ emailVerified: false }, { enabled: true })).toBe(false);
  expect(isAdministrator({ email: 'other@example.invalid', admin: true, emailVerified: true })).toBe(false);
});
it('allows one project without a clock-based trial and preserves editing', () => {
  expect(projectAccess({ enabled: true }, 'first')).toBe(true);
  expect(projectAccess({ enabled: true, freeProjectId: 'first' }, 'first')).toBe(true);
  expect(projectAccess({ enabled: true, freeProjectId: 'first' }, 'second')).toBe(false);
  expect(projectAccess({ enabled: true, freeProjectId: 'first' }, undefined)).toBe(false);
  expect(projectAccess({ enabled: true, freeProjectId: 'first', admin: true }, 'second')).toBe(true);
});
it('requires a paid basic subscription that has not expired; an authorized checkout is not payment', () => {
  const base = { enabled: true, freeProjectId: 'first' };
  expect(projectAccess({ ...base, subscription: { planId: 'presupuestos', status: 'active', paidThrough: 2000 } }, 'second', 1000)).toBe(true);
  for (const subscription of [{ planId: 'presupuestos', status: 'authorized', paidThrough: 2000 }, { planId: 'presupuestos', status: 'active', paidThrough: 1000 }, { planId: 'croquis', status: 'active', paidThrough: 2000 }]) {
    expect(projectAccess({ ...base, subscription }, 'second', 1000)).toBe(false);
  }
});
it('offers ARS monthly prices and does not sell the unfinished sketch plan', () => {
  expect(PLANS.map(p => [p.amount, p.currency, p.available])).toEqual([[12000, 'ARS', true], [25000, 'ARS', false]]);
});
