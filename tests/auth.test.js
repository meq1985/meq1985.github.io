import { beforeEach, describe, it, expect, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';

vi.mock('../src/firebase', () => ({ auth: { currentUser: null }, db: {} }));
vi.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: vi.fn(), signInWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(), sendEmailVerification: vi.fn(), sendPasswordResetEmail: vi.fn()
}));
vi.mock('../src/stores/dbUsers', () => ({ PostStore: () => ({ addItem: profile }) }));
vi.mock('../src/stores/dbCostos', () => ({ costoStore: () => ({ addCostos: costs }) }));
const { profile, costs } = vi.hoisted(() => ({ profile: vi.fn(), costs: vi.fn() }));
import { createUserWithEmailAndPassword as createUser, sendEmailVerification, signOut } from 'firebase/auth';
import { useUserStore } from '../src/stores/user';

beforeEach(() => {
  vi.resetAllMocks();
  setActivePinia(createPinia());
  vi.stubGlobal('alert', vi.fn());
});
describe('registration', () => {
  it('does not write before authentication completes and awaits all initialization', async () => {
    let complete;
    createUser.mockReturnValue(new Promise(resolve => { complete = resolve; }));
    const store = useUserStore();
    const registration = store.register('user@example.com', 'secret');
    expect(profile).not.toHaveBeenCalled();
    expect(costs).not.toHaveBeenCalled();
    expect(store.busy).toBe(true);
    complete({ user: { email: 'user@example.com' } });
    await registration;
    expect(profile).toHaveBeenCalledWith('user@example.com');
    expect(costs).toHaveBeenCalledWith('user@example.com');
    expect(sendEmailVerification).toHaveBeenCalledOnce();
    expect(signOut).toHaveBeenCalledOnce();
    expect(store.busy).toBe(false);
  });
  it('never initializes documents after failed account creation', async () => {
    createUser.mockRejectedValue({ code: 'auth/email-already-in-use' });
    await useUserStore().register('user@example.com', 'secret');
    expect(profile).not.toHaveBeenCalled();
    expect(costs).not.toHaveBeenCalled();
    expect(signOut).not.toHaveBeenCalled();
  });
  it('signs out even when verification delivery fails', async () => {
    createUser.mockResolvedValue({ user: { email: 'user@example.com' } });
    sendEmailVerification.mockRejectedValue(new Error('offline'));
    const store = useUserStore();
    await store.register('user@example.com', 'secret');
    expect(signOut).toHaveBeenCalledOnce();
    expect(store.busy).toBe(false);
  });
  it('prevents repeated submits while pending', async () => {
    createUser.mockResolvedValue({ user: { email: 'user@example.com' } });
    const store = useUserStore();
    await Promise.all([store.register('user@example.com', 'secret'), store.register('user@example.com', 'secret')]);
    expect(createUser).toHaveBeenCalledOnce();
  });
});
