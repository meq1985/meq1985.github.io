import { describe, it, expect } from 'vitest';
import { createAuthGuard } from '../src/router/guard';

describe('navigation', () => {
  const protectedRoute = { path: '/dashboard', matched: [{ meta: { auth: true } }] };
  const home = { path: '/', matched: [{ meta: {} }] };
  it('waits for restored authentication before deciding', async () => {
    let resolve;
    const ready = new Promise(r => { resolve = r; });
    const auth = { currentUser: null };
    const navigation = createAuthGuard(auth, () => ready)(protectedRoute);
    auth.currentUser = { emailVerified: true };
    resolve();
    expect(await navigation).toBe(true);
  });
  it.each([null, { emailVerified: false }])('rejects anonymous and unverified users', async currentUser => {
    expect(await createAuthGuard({ currentUser }, async () => {})(protectedRoute)).toBe('/');
  });
  it('uses config as the single landing route', async () => {
    expect(await createAuthGuard({ currentUser: { emailVerified: true } }, async () => {})(home)).toBe('/config');
  });
});
