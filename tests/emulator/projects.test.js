import { beforeAll, afterAll, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, updateDoc, deleteDoc, setDoc, serverTimestamp, disableNetwork, enableNetwork } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendEmailVerification, applyActionCode, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { deleteApp } from 'firebase/app';
import { auth, db } from '../../src/firebase';
import { saveProject, loadProject, listProjects, loadProjectVersion, listProjectVersions, importLocalBudget } from '../../src/services/projects';
const project = 'demo-presupuesto-electrico';
let env, uid;
const email = 'cloud-projects@example.invalid', password = 'Demo-only-Password42';
const input = (id, expectedRevision = 0) => ({ id, expectedRevision, name: 'Reforma de vivienda', budget: { cliente: 'Cliente de prueba', tipoInmueble: 'Departamento', createdAt: '2026-10-21T12:00:00Z', items: [{ codigo: 'A26-008', descripcion: 'Canalización', cantidad: 2, unidad: 'boca', precioUnitario: 57000 }] }, profile: { nombre1: 'Profesional de prueba', empresa1: null, cuit1: '20-12345678-9', matricula1: 'MAT-10' } });
const ref = id => doc(db, 'cuentas', uid, 'proyectos', id);
beforeAll(async () => {
  if (auth.app.options.projectId !== project || process.env.FIRESTORE_EMULATOR_HOST !== '127.0.0.1:8080') throw Error('Solo emuladores aislados.');
  env = await initializeTestEnvironment({ projectId: project, firestore: { host: '127.0.0.1', port: 8080, rules: await readFile(new URL('../../firestore.rules', import.meta.url), 'utf8') } });
  await env.clearFirestore();
  try { await createUserWithEmailAndPassword(auth, email, password); }
  catch (error) { if (error.code !== 'auth/email-already-in-use') throw error; await signInWithEmailAndPassword(auth, email, password); }
  await sendEmailVerification(auth.currentUser);
  const response = await fetch(`http://127.0.0.1:9099/emulator/v1/projects/${project}/oobCodes`);
  const code = (await response.json()).oobCodes.filter(item => item.email === email).at(-1).oobCode;
  await applyActionCode(auth, code); await signOut(auth); await signInWithEmailAndPassword(auth, email, password); uid = auth.currentUser.uid;
});
afterAll(async () => { await signOut(auth); await env?.cleanup(); await deleteApp(auth.app); });
it('saves metadata and immutable snapshot atomically and retries without duplicates', async () => {
  const data = input('first');
  expect(await saveProject(data)).toEqual({ id: 'first', revision: 1 });
  expect(await saveProject(data)).toEqual({ id: 'first', revision: 1 });
  const loaded = await loadProject('first');
  expect(loaded.version.budget).toMatchObject({ total: 114000, tipoInmueble: 'Departamento' });
  expect(loaded.version.profile).toMatchObject({ nombre1: 'Profesional de prueba', empresa1: '', correo: email });
  expect((await listProjectVersions('first')).items).toHaveLength(1);
});
it('preserves historical prices and profile and rejects concurrent stale writers', async () => {
  const data = input('first', 1); data.budget.items[0].precioUnitario = 60000; data.profile.nombre1 = 'Nombre actual';
  await saveProject(data);
  expect((await loadProject('first')).version.budget.total).toBe(120000);
  expect((await loadProjectVersion('first', 1)).budget.total).toBe(114000);
  expect((await loadProjectVersion('first', 1)).profile.nombre1).toBe('Profesional de prueba');
  await expect(saveProject(input('first', 1))).rejects.toThrow('otra pestaña');
  const a = input('first', 2), b = input('first', 2); b.name = 'Otra pestaña';
  const results = await Promise.allSettled([saveProject(a), saveProject(b)]);
  expect(results.filter(item => item.status === 'fulfilled')).toHaveLength(1);
});
it('denies access to other accounts, anonymous sessions and unverified owners', async () => {
  for (const context of [env.unauthenticatedContext(), env.authenticatedContext('other', { email: 'other@example.invalid', email_verified: true }), env.authenticatedContext(uid, { email, email_verified: false })]) {
    const database = context.firestore();
    await assertFails(getDoc(doc(database, 'cuentas', uid, 'proyectos', 'first')));
    await assertFails(getDocs(collection(database, 'cuentas', uid, 'proyectos')));
    await assertFails(getDoc(doc(database, 'cuentas', uid, 'proyectos', 'first', 'versiones', '1')));
    await assertFails(setDoc(doc(database, 'cuentas', uid, 'proyectos', 'stolen'), { name: 'Intruso' }));
  }
  await assertFails(getDocs(collection(db, 'cuentas')));
});
it('rejects mutations, deletions, orphan versions and metadata-only saves', async () => {
  await assertFails(updateDoc(ref('first'), { revision: 4, updatedAt: serverTimestamp() }));
  await assertFails(updateDoc(ref('first'), { ownerUid: 'other' })); await assertFails(deleteDoc(ref('first')));
  const version = doc(ref('first'), 'versiones', '1');
  await assertFails(updateDoc(version, { name: 'Modificado' })); await assertFails(deleteDoc(version));
  await assertFails(setDoc(doc(ref('missing'), 'versiones', '1'), { ...(await getDoc(version)).data(), createdAt: serverTimestamp() }));
});
it('imports source once, keeps later edits and does not store or delete the original PDF', async () => {
  const record = { ...input('ignored').budget, owner: uid, id: 'local-demo', pdf: new Blob(['original']) };
  const id = await importLocalBudget(record);
  expect((await loadProject(id)).version.profile).toBe(null);
  expect((await getDoc(doc(ref(id), 'versiones', '1'))).data()).not.toHaveProperty('pdf');
  await saveProject({ ...input(id, 1), name: 'Editado' });
  expect(await importLocalBudget(record)).toBe(id); expect((await loadProject(id)).revision).toBe(2);
  expect((await loadProjectVersion(id, 1)).profile).toBe(null);
  expect(await record.pdf.text()).toBe('original');
  await expect(importLocalBudget({ ...record, owner: 'other' })).rejects.toThrow('no corresponde');
});
it('paginates projects and versions without duplicates or omissions', async () => {
  await Promise.all(Array.from({ length: 20 }, (_, index) => saveProject(input('page-' + index))));
  const first = await listProjects(), second = await listProjects(first.cursor);
  expect(first.items).toHaveLength(20);
  expect(new Set([...first.items, ...second.items].map(item => item.id)).size).toBe(22);
  for (let revision = 3; revision < 12; revision++) await saveProject(input('first', revision));
  const versions = await listProjectVersions('first'); expect(versions.items).toHaveLength(10);
  expect(versions.items[0].revision).toBe(12);
  expect((await listProjectVersions('first', versions.cursor)).items.map(item => item.revision)).toEqual([2, 1]);
});
it('does not report a cached list as a successful cloud read when offline', async () => {
  await listProjects(); await disableNetwork(db);
  try { await expect(listProjects()).rejects.toThrow(); }
  finally { await enableNetwork(db); }
});
it('refuses writes and reads after logout', async () => {
  await signOut(auth); await expect(saveProject(input('no-session'))).rejects.toThrow('sesión'); await expect(listProjects()).rejects.toThrow('sesión');
});
