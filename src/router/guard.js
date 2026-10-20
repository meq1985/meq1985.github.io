export function createAuthGuard(auth, waitForAuth) {
  return async to => {
    await waitForAuth();
    const authenticated = Boolean(auth.currentUser?.emailVerified);
    if (to.matched.some(record => record.meta.auth) && !authenticated) return '/';
    if (to.path === '/' && authenticated) return '/config';
    return true;
  };
}
