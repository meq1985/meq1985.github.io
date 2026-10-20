export function createAuthGuard(auth, waitForAuth, ensureAccountReady = async () => {}) {
  return async to => {
    await waitForAuth();
    const authenticated = Boolean(auth.currentUser?.emailVerified);
    if (to.matched.some(record => record.meta.auth) && !authenticated) return '/';
    if (authenticated) {
      try { await ensureAccountReady(auth.currentUser); }
      catch (error) { return to.path === '/' ? true : { path: '/', query: { setup: 'pending' } }; }
      if (to.path === '/') return '/config';
    }
    return true;
  };
}
