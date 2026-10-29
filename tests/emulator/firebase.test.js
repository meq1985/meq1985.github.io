import { beforeAll, afterAll, describe, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { createPinia, setActivePinia } from 'pinia';
import { initializeTestEnvironment, assertFails, assertSucceeds } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, setDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { applyActionCode, confirmPasswordReset, signOut, signInWithEmailAndPassword,
  createUserWithEmailAndPassword } from 'firebase/auth';
import { deleteApp } from 'firebase/app';
import { auth, db } from '../../src/firebase';
import { ensureAccountReady } from '../../src/services/accountProvisioning';
import { useUserStore } from '../../src/stores/user';
import { PostStore } from '../../src/stores/dbUsers';
import { costoStore } from '../../src/stores/dbCostos';
import { LABOR_CATALOG } from '../../src/data/laborCatalog';
import { adjustPrices } from '../../src/services/catalogPrices';
import { loadCatalog, loadSuggestedCatalog, saveCatalogPrices } from '../../src/services/catalogPersistence';

const projectId = 'demo-presupuesto-electrico';
let environment;
const email = 'rules-owner@example.invalid';
beforeAll(async () => {
  if (auth.app.options.projectId !== projectId || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') {
    throw new Error('These tests require the isolated demo emulators.');
  }
  environment = await initializeTestEnvironment({ projectId, firestore: {
    host: '127.0.0.1', port: 8080, rules: await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8')
  } });
  await environment.clearFirestore();
  await environment.withSecurityRulesDisabled(async context => {
    await setDoc(doc(context.firestore(), 'usuarios', email), { nombre: 'Existing owner' });
    await setDoc(doc(context.firestore(), 'costos', email), { canalizacion: { canalizacionLosa: 12.5 } });
    await setDoc(doc(context.firestore(), 'costos', 'codigos'), { canalizacion: { codigoLosa: 101 } });
  });
});
afterAll(async () => { await signOut(auth); await environment?.cleanup(); await deleteApp(auth.app); });

describe('server rules on the actual Firestore emulator', () => {
  const own = () => environment.authenticatedContext('owner', { email, email_verified: true }).firestore();
  const unverified = () => environment.authenticatedContext('owner', { email, email_verified: false }).firestore();
  const other = () => environment.authenticatedContext('other', { email: 'other@example.invalid', email_verified: true }).firestore();
  const anon = () => environment.unauthenticatedContext().firestore();
  it('rejects anonymous reads and writes', async () => {
    await assertFails(getDoc(doc(anon(), 'usuarios', email)));
    await assertFails(getDoc(doc(anon(), 'costos', 'codigos')));
    await assertFails(setDoc(doc(anon(), 'usuarios', 'new@example.invalid'), {}));
  });
  it('rejects access between accounts', async () => {
    await assertFails(getDoc(doc(other(), 'usuarios', email)));
    await assertFails(getDoc(doc(other(), 'costos', email)));
    await assertFails(updateDoc(doc(other(), 'usuarios', email), { nombre: 'intruder' }));
    await assertFails(updateDoc(doc(other(), 'costos', email), { price: 0 }));
  });
  it('permits verified owners to read and update their own documents', async () => {
    await assertSucceeds(getDoc(doc(own(), 'usuarios', email)));
    await assertSucceeds(getDoc(doc(own(), 'costos', email)));
    await assertSucceeds(updateDoc(doc(own(), 'usuarios', email), { nombre: 'Existing owner' }));
    await assertSucceeds(updateDoc(doc(own(), 'costos', email), { price: 5 }));
  });
  it('protects existing data from unverified email reuse', async () => {
    await assertFails(setDoc(doc(unverified(), 'usuarios', 'new-unverified@example.invalid'), {}));
    await assertFails(setDoc(doc(unverified(), 'costos', 'new-unverified@example.invalid'), {}));
    await assertFails(getDoc(doc(unverified(), 'usuarios', email)));
    await assertFails(getDoc(doc(unverified(), 'costos', email)));
    await assertFails(updateDoc(doc(unverified(), 'usuarios', email), { nombre: 'invalid' }));
  });
  it('permits only verified catalog reads and rejects all client catalog writes', async () => {
    await assertSucceeds(getDoc(doc(own(), 'costos', 'codigos')));
    await assertFails(getDoc(doc(unverified(), 'costos', 'codigos')));
    await assertFails(setDoc(doc(own(), 'costos', 'codigos'), {}));
    await assertFails(deleteDoc(doc(own(), 'costos', 'codigos')));
  });
  it('rejects collection lists, deletes, and unknown paths', async () => {
    await assertFails(getDocs(collection(own(), 'usuarios')));
    await assertFails(getDocs(collection(own(), 'costos')));
    await assertFails(deleteDoc(doc(own(), 'usuarios', email)));
    await assertFails(setDoc(doc(own(), 'unknown', 'x'), {}));
  });
});

async function actionCode(address, type) {
  const response = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${projectId}/oobCodes`);
  const codes = (await response.json()).oobCodes;
  const code = codes.filter(item => item.email === address && item.requestType === type).at(-1);
  if (!code) throw new Error(`Missing ${type} action code in the demo emulator.`);
  return code.oobCode;
}
describe('registration, recovery and atomic provisioning against Auth + Firestore', () => {
  it('completes registration, password recovery, configuration and legacy repair without partial documents', async () => {
    const address = `registration-${Date.now()}@example.invalid`;
    const password = 'Demo-only-Password42';
    setActivePinia(createPinia());
    const store = useUserStore();
    const routes = [];
    store.$router = { push: async route => { routes.push(route); } };
    expect(await store.register(address, password)).toBe(true);
    expect(auth.currentUser).toBe(null);
    // No profile/costs are written before email verification.
    await environment.withSecurityRulesDisabled(async context => {
      expect((await getDoc(doc(context.firestore(), 'usuarios', address))).exists()).toBe(false);
      expect((await getDoc(doc(context.firestore(), 'costos', address))).exists()).toBe(false);
    });
    // Repeated signup resumes the same account instead of an email-already-in-use dead end.
    expect(await store.register(address, password)).toBe(true);
    expect(await store.login(address, password)).toBe(false);
    expect(routes).toEqual([]);
    await applyActionCode(auth, await actionCode(address, 'VERIFY_EMAIL'));
    expect(await store.login(address, password)).toBe(true);
    expect(routes).toEqual(['/config']);
    const profile = doc(db, 'usuarios', address), costs = doc(db, 'costos', address);
    expect((await getDoc(profile)).exists()).toBe(true);
    expect((await getDoc(costs)).exists()).toBe(true);
    expect(Object.keys((await getDoc(costs)).data().catalog.prices)).toHaveLength(98);
    expect((await getDoc(costs)).data().catalog.prices.visita).toBe(56393);
    await PostStore().updateItem('Demo', 'Test', '123', 'Demo', '456', '555', 'Demo street');
    await costoStore().updateCostosCanalizacion(1.25, 2, 3, 4, 5, 6);
    expect((await getDoc(profile)).data().nombre).toBe('Demo');
    expect((await getDoc(costs)).data().canalizacion.canalizacionLosa).toBe(1.25);
    // Concurrent and repeated provisioning never overwrites the saved profile or prices.
    await Promise.all([ensureAccountReady(), ensureAccountReady()]);
    expect((await getDoc(profile)).data().nombre).toBe('Demo');
    expect((await getDoc(costs)).data().canalizacion.canalizacionLosa).toBe(1.25);
    // Repair an interrupted legacy account with only its profile, preserving it.
    await environment.withSecurityRulesDisabled(context => deleteDoc(doc(context.firestore(), 'costos', address)));
    await ensureAccountReady();
    expect((await getDoc(profile)).data().nombre).toBe('Demo');
    expect((await getDoc(costs)).exists()).toBe(true);
    await store.resetPassword(address);
    await confirmPasswordReset(auth, await actionCode(address, 'PASSWORD_RESET'), password + '-new');
    await store.logout();
    expect(auth.currentUser).toBe(null);
    expect(await store.login(address, password + '-new')).toBe(true);
    await store.logout();
  });
  it('commits neither document if a single write is denied, and recovers after rules are restored', async () => {
    const address = `atomic-${Date.now()}@example.invalid`;
    await createUserWithEmailAndPassword(auth, address, 'Demo-only-Password42');
    await expect(ensureAccountReady()).rejects.toThrow('Verificá');
    await signOut(auth);
    // Testing context uses a verified token, but the test service checks auth.currentUser.
    const { sendEmailVerification } = await import('firebase/auth');
    await signInWithEmailAndPassword(auth, address, 'Demo-only-Password42');
    await sendEmailVerification(auth.currentUser);
    await applyActionCode(auth, await actionCode(address, 'VERIFY_EMAIL'));
    await signOut(auth);
    await signInWithEmailAndPassword(auth, address, 'Demo-only-Password42');
    const restrictive = `rules_version = '2'; service cloud.firestore { match /databases/{database}/documents { match /usuarios/{email} { allow read, write: if request.auth.token.email == email; } match /costos/{email} { allow read: if request.auth.token.email == email; } } }`;
    await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8080, rules: restrictive } });
    await expect(ensureAccountReady()).rejects.toThrow();
    await environment.withSecurityRulesDisabled(async context => {
      expect((await getDoc(doc(context.firestore(), 'usuarios', address))).exists()).toBe(false);
      expect((await getDoc(doc(context.firestore(), 'costos', address))).exists()).toBe(false);
    });
    await initializeTestEnvironment({ projectId, firestore: { host: '127.0.0.1', port: 8080,
      rules: await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8') } });
    await ensureAccountReady();
    expect((await getDoc(doc(db, 'usuarios', address))).exists()).toBe(true);
    expect((await getDoc(doc(db, 'costos', address))).exists()).toBe(true);
  });
  it('migrates an existing account, persists adjustments and rejects stale concurrent edits', async () => {
    const address = auth.currentUser.email;
    const reference = doc(db, 'costos', address);
    await environment.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'costos', address), {
      canalizacion: { canalizacionLosa: 123.45, canalizacionALaVistaPvc: 0 }, retained: 'original data'
    }));
    await Promise.all([ensureAccountReady(), ensureAccountReady()]);
    const migrated = (await getDoc(reference)).data();
    expect(migrated.canalizacion.canalizacionLosa).toBe(123.45);
    expect(migrated.retained).toBe('original data');
    expect(migrated.catalog.prices.legacy_canalizacionLosa).toBe(123.45);
    expect(migrated.catalog.prices.legacy_canalizacionALaVistaPVC).toBe(0);
    expect(await loadCatalog()).toHaveLength(LABOR_CATALOG.length + 2);
    const initial = migrated.catalog.prices;
    const increased = adjustPrices(initial, 20, 'increase');
    await saveCatalogPrices(increased, initial);
    await ensureAccountReady();
    expect((await getDoc(reference)).data().catalog.prices).toEqual(increased);
    expect((await loadCatalog()).find(item => item.id === 'losa_metal').price).toBe(68400);
    await expect(saveCatalogPrices(increased, initial)).rejects.toThrow('otra pestaña');
    const current = (await getDoc(reference)).data().catalog.prices;
    const concurrent = await Promise.allSettled([
      saveCatalogPrices({ visita: 10 }, current), saveCatalogPrices({ visita: 20 }, current)
    ]);
    expect(concurrent.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    expect(concurrent.filter(result => result.status === 'rejected')).toHaveLength(1);
    expect([10, 20]).toContain((await getDoc(reference)).data().catalog.prices.visita);
    await saveCatalogPrices({ losa_metal: 57000 }, { losa_metal: 68400 });
    expect((await getDoc(reference)).data().catalog.prices.losa_metal).toBe(57000);
    expect((await getDoc(reference)).data().retained).toBe('original data');
    await signOut(auth);
    await expect(saveCatalogPrices({ visita: 0 }, current)).rejects.toThrow('sesión');
    await expect(loadCatalog()).rejects.toThrow('sesión');
  });
  it('loads optional monthly defaults for new accounts and requires explicit, current review for existing accounts', async () => {
    const suggested = { version: '2026-11-v1', label: 'Noviembre 2026', prices: Object.fromEntries(LABOR_CATALOG.map(item => [item.id, item.price * 2])) };
    const shared = async value => environment.withSecurityRulesDisabled(context => setDoc(doc(context.firestore(), 'costos', 'codigos'), { suggestedCatalog: value }, { merge: true }));
    await shared(JSON.stringify(suggested));
    const address = `monthly-${Date.now()}@example.invalid`;
    const password = 'Demo-only-Password42';
    await createUserWithEmailAndPassword(auth, address, password);
    const { sendEmailVerification } = await import('firebase/auth');
    await sendEmailVerification(auth.currentUser);
    await applyActionCode(auth, await actionCode(address, 'VERIFY_EMAIL'));
    await signOut(auth); await signInWithEmailAndPassword(auth, address, password);
    await ensureAccountReady();
    const reference = doc(db, 'costos', address);
    expect((await getDoc(reference)).data().catalog.prices).toEqual(suggested.prices);
    await saveCatalogPrices({ visita: 123 }, suggested.prices);
    const next = { ...suggested, version: '2026-12-v1', label: 'Diciembre 2026', prices: { ...suggested.prices, visita: 456 } };
    await shared(next);
    await ensureAccountReady();
    expect((await getDoc(reference)).data().catalog.prices.visita).toBe(123);
    const baseline = (await getDoc(reference)).data().catalog.prices;
    const reviewed = await loadSuggestedCatalog();
    await shared({ ...next, prices: { ...next.prices, visita: 789 } });
    await expect(saveCatalogPrices(reviewed.prices, baseline, reviewed)).rejects.toThrow('se actualizaron');
    expect((await getDoc(reference)).data().catalog.prices.visita).toBe(123);
    const current = await loadSuggestedCatalog();
    await saveCatalogPrices(current.prices, baseline, current);
    expect((await getDoc(reference)).data().catalog).toMatchObject({ suggestedVersion: '2026-12-v1', prices: current.prices });
    await expect(saveCatalogPrices(current.prices, baseline, current)).rejects.toThrow('otra pestaña');
    await signOut(auth);
    await expect(loadSuggestedCatalog()).rejects.toThrow('sesión');
  });
});
