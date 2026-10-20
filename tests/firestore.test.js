import { beforeEach, describe, it, expect, vi } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
vi.mock('../src/firebase', () => ({ db: {} }));
vi.mock('../src/firebase/session', () => ({ requireUser: vi.fn(), assertCurrentUser: vi.fn() }));
vi.mock('../src/services/accountProvisioning', () => ({ ensureAccountReady: vi.fn() }));
vi.mock('firebase/firestore', () => ({ doc: vi.fn((db, collection, id) => ({ collection, id })),
  getDoc: vi.fn(), setDoc: vi.fn(), updateDoc: vi.fn() }));
import { requireUser } from '../src/firebase/session';
import { ensureAccountReady } from '../src/services/accountProvisioning';
import { getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { PostStore } from '../src/stores/dbUsers';
import { costoStore } from '../src/stores/dbCostos';

beforeEach(() => { vi.resetAllMocks(); setActivePinia(createPinia()); });
describe('Firestore client protection', () => {
  it('does not issue reads or writes when authentication is rejected', async () => {
    requireUser.mockRejectedValue(new Error('unauthorized'));
    const profiles = PostStore();
    const costs = costoStore();
    for (const action of [() => profiles.obtenerDato(), () => profiles.addItem('other@example.com'),
      () => profiles.updateItem(), () => costs.addCostos('other@example.com'),
      () => costs.obtenerCostos(), () => costs.obtenerCodigos(),
      ...Object.keys(costs).filter(key => key.startsWith('updateCostos')).map(key => () => costs[key]())]) {
      await expect(action()).rejects.toThrow('unauthorized');
    }
    expect(getDoc).not.toHaveBeenCalled();
    expect(setDoc).not.toHaveBeenCalled();
    expect(updateDoc).not.toHaveBeenCalled();
  });
  it('does not overwrite existing profiles or costs during initialization', async () => {
    requireUser.mockResolvedValue({ email: 'owner@example.com' });
    getDoc.mockResolvedValue({ exists: () => true });
    await PostStore().addItem('owner@example.com');
    await costoStore().addCostos('owner@example.com');
    expect(setDoc).not.toHaveBeenCalled();
    expect(requireUser).toHaveBeenCalledWith({ email: 'owner@example.com' });
    expect(ensureAccountReady).toHaveBeenCalledTimes(2);
  });
  it('handles missing documents without reading undefined fields', async () => {
    requireUser.mockResolvedValue({ email: 'owner@example.com' });
    getDoc.mockResolvedValue({ exists: () => false });
    await PostStore().obtenerDato();
    await costoStore().obtenerCostos();
    await costoStore().obtenerCodigos();
  });
});
