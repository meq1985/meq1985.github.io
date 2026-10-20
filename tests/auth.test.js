import { beforeEach, describe, it, expect, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
vi.mock('../src/firebase', () => ({ auth: { currentUser: null } }));
vi.mock('../src/services/accountProvisioning', () => ({ ensureAccountReady: vi.fn() }));
vi.mock('firebase/auth', () => ({ createUserWithEmailAndPassword: vi.fn(), signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(), sendEmailVerification: vi.fn(), sendPasswordResetEmail: vi.fn() }));
import { auth } from '../src/firebase';
import { ensureAccountReady } from '../src/services/accountProvisioning';
import { createUserWithEmailAndPassword as createUser, signInWithEmailAndPassword as signIn,
  signOut, sendEmailVerification, sendPasswordResetEmail } from 'firebase/auth';
import { useUserStore } from '../src/stores/user';
const pending = { uid: 'one', email: 'user@example.com', emailVerified: false };
const verified = { ...pending, emailVerified: true };
let store;
beforeEach(() => {
  vi.resetAllMocks(); auth.currentUser = null;
  setActivePinia(createPinia()); store = useUserStore(); store.$router = { push: vi.fn() };
  signOut.mockImplementation(async () => { auth.currentUser = null; });
});
describe('recoverable registration', () => {
  it('waits for Auth, sends verification, and never writes Firestore before verification', async () => {
    let complete;
    createUser.mockReturnValue(new Promise(resolve => { complete = resolve; }));
    const registration = store.register(pending.email, 'secret');
    expect(sendEmailVerification).not.toHaveBeenCalled();
    expect(store.busy).toBe(true);
    auth.currentUser = pending; complete({ user: pending });
    expect(await registration).toBe(true);
    expect(sendEmailVerification).toHaveBeenCalledWith(pending);
    expect(ensureAccountReady).not.toHaveBeenCalled();
    expect(signOut).toHaveBeenCalledOnce();
    expect(store.notice).toContain('verificar');
  });
  it('recovers an existing unverified account only with a valid password', async () => {
    createUser.mockRejectedValue({ code: 'auth/email-already-in-use' });
    signIn.mockResolvedValue({ user: pending });
    expect(await store.register(pending.email, 'secret')).toBe(true);
    expect(signIn).toHaveBeenCalledWith(auth, pending.email, 'secret');
    expect(sendEmailVerification).toHaveBeenCalledWith(pending);
    expect(ensureAccountReady).not.toHaveBeenCalled();
  });
  it('does not send verification or touch documents for invalid credentials', async () => {
    createUser.mockRejectedValue({ code: 'auth/email-already-in-use' });
    signIn.mockRejectedValue({ code: 'auth/invalid-credential' });
    expect(await store.register(pending.email, 'wrong')).toBe(false);
    expect(sendEmailVerification).not.toHaveBeenCalled();
    expect(ensureAccountReady).not.toHaveBeenCalled();
  });
  it('allows retry after a failed verification delivery and clears busy state', async () => {
    createUser.mockResolvedValue({ user: pending });
    sendEmailVerification.mockRejectedValueOnce(new Error('offline'));
    expect(await store.register(pending.email, 'secret')).toBe(false);
    expect(store.error).toContain('recuperar');
    expect(store.busy).toBe(false);
    expect(await store.register(pending.email, 'secret')).toBe(true);
  });
  it('prevents repeated submits while pending', async () => {
    createUser.mockResolvedValue({ user: pending });
    await Promise.all([store.register(pending.email, 'secret'), store.register(pending.email, 'secret')]);
    expect(createUser).toHaveBeenCalledOnce();
  });
  it('repairs a verified account when registration is retried', async () => {
    createUser.mockRejectedValue({ code: 'auth/email-already-in-use' });
    signIn.mockResolvedValue({ user: verified });
    expect(await store.register(verified.email, 'secret')).toBe(true);
    expect(ensureAccountReady).toHaveBeenCalledWith(verified);
    expect(store.$router.push).toHaveBeenCalledWith('/config');
  });
});
describe('login and recovery', () => {
  it('does not navigate until atomic provisioning succeeds', async () => {
    signIn.mockResolvedValue({ user: verified });
    ensureAccountReady.mockRejectedValueOnce(new Error('offline'));
    expect(await store.login(verified.email, 'secret')).toBe(false);
    expect(store.$router.push).not.toHaveBeenCalled();
    expect(await store.login(verified.email, 'secret')).toBe(true);
    expect(store.$router.push).toHaveBeenCalledWith('/config');
  });
  it('resends verification and blocks unverified login', async () => {
    signIn.mockResolvedValue({ user: pending });
    expect(await store.login(pending.email, 'secret')).toBe(false);
    expect(sendEmailVerification).toHaveBeenCalledWith(pending);
    expect(ensureAccountReady).not.toHaveBeenCalled();
    expect(store.$router.push).not.toHaveBeenCalled();
  });
  it('recovers passwords and logs out', async () => {
    await store.resetPassword(' user@example.com ');
    expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, pending.email);
    await store.logout();
    expect(store.$router.push).toHaveBeenCalledWith('/');
  });
});
