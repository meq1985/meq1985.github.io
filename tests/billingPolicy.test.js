import { it, expect } from 'vitest';
import { PLANS, isAdministrator, projectAccess } from '../src/services/billingPolicy';
it('reserves administration for the verified existing account, never a profile flag', () => {
  expect(isAdministrator({ emailVerified: true }, { enabled: true })).toBe(true);
  expect(isAdministrator({ emailVerified: true }, null)).toBe(false);
  expect(isAdministrator({ emailVerified: false }, { enabled: true })).toBe(false);
  expect(isAdministrator({ email: 'other@example.invalid', admin: true, emailVerified: true })).toBe(false);
});
it('allows every project for 30 days and expires at the boundary without a reset', () => {
  const start = 1000, end = start + 30 * 86400000;
  for (const id of ['first', 'second', undefined]) {
    expect(projectAccess({ trialStartedAt: start }, id, start)).toBe(true);
    expect(projectAccess({ trialStartedAt: start }, id, end - 1)).toBe(true);
    expect(projectAccess({ trialStartedAt: start }, id, end)).toBe(false);
  }
  expect(projectAccess({ enabled: false }, 'first', start)).toBe(false);
  expect(projectAccess({ trialStartedAt: start + 1 }, 'first', start)).toBe(false);
  expect(projectAccess({ admin: true }, 'second', end)).toBe(true);
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
