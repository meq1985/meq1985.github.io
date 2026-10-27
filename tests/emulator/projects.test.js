import { beforeAll, afterAll, it, expect } from 'vitest';
import { readFile } from 'node:fs/promises';
import { initializeTestEnvironment, assertFails } from '@firebase/rules-unit-testing';
import { doc, getDoc, getDocs, collection, updateDoc, deleteDoc, setDoc, serverTimestamp, Timestamp, writeBatch, disableNetwork, enableNetwork } from 'firebase/firestore';
import { createUserWithEmailAndPassword, sendEmailVerification, applyActionCode, signOut, signInWithEmailAndPassword } from 'firebase/auth';
import { deleteApp } from 'firebase/app';
import { auth, db } from '../../src/firebase';
import { saveProject, loadProject, listProjects, loadProjectVersion, listProjectVersions } from '../../src/services/projects';
import { emptySketch, encodeSketch } from '../../src/services/sketch';
import { emptyQuoteSettings } from '../../src/services/sketchQuoteSettings';
import { emptyMaterialNetwork } from '../../src/services/materialNetwork';
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
it('paginates projects and versions without duplicates or omissions', async () => {
  await Promise.all(Array.from({ length: 20 }, (_, index) => saveProject(input('page-' + index))));
  const first = await listProjects(), second = await listProjects(first.cursor);
  expect(first.items).toHaveLength(20);
  expect(new Set([...first.items, ...second.items].map(item => item.id)).size).toBe(21);
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
it('enforces one free project atomically, blocks resets and denies forged subscriptions', async () => {
  const config = doc(db, 'configuracion', 'facturacion');
  const allowance = doc(db, 'accesos', uid), subscription = doc(db, 'suscripciones', uid);
  await env.withSecurityRulesDisabled(async context => { await setDoc(doc(context.firestore(), 'configuracion', 'facturacion'), { enabled: true }); });
  try {
    const attempts = await Promise.allSettled([saveProject(input('free-a')), saveProject(input('free-b'))]);
    expect(attempts.filter(result => result.status === 'fulfilled')).toHaveLength(1);
    const freeId = (await getDoc(allowance)).data().freeProjectId;
    await saveProject(input(freeId, 1));
    await expect(saveProject(input('free-c'))).rejects.toThrow('suscripción');
    await assertFails(updateDoc(allowance, { freeProjectId: 'free-c' })); await assertFails(deleteDoc(allowance));
    await assertFails(setDoc(subscription, { planId: 'presupuestos', status: 'active', paidThrough: Timestamp.fromMillis(Date.now() + 86400000) }));
    await assertFails(setDoc(config, { enabled: false }));
    await assertFails(setDoc(doc(db, 'administradores', uid), { enabled: true }));
    await assertFails(getDoc(doc(db, 'suscripciones', 'other')));
    for (const path of ['billingCheckouts', 'billingBindings', 'billingPayments', 'billingLocks', 'billingTesters']) {
      await assertFails(getDoc(doc(db, path, uid)));
      await assertFails(setDoc(doc(db, path, uid), { enabled: true }));
    }
    await assertFails(setDoc(doc(db, 'accesos', 'other'), { freeProjectId: freeId, claimedAt: serverTimestamp() }));
    // An allowance cannot refer to a nonexistent project, even in a forged batch.
    const intruder = env.authenticatedContext('unused', { email: 'unused@example.invalid', email_verified: true }).firestore();
    await assertFails(setDoc(doc(intruder, 'accesos', 'unused'), { freeProjectId: 'nonexistent', claimedAt: serverTimestamp() }));
    await env.withSecurityRulesDisabled(async context => { await setDoc(doc(context.firestore(), 'suscripciones', uid), { planId: 'presupuestos', status: 'active', paidThrough: Timestamp.fromMillis(Date.now() + 86400000) }); });
    await saveProject(input('paid-project'));
    await env.withSecurityRulesDisabled(async context => { await updateDoc(doc(context.firestore(), 'suscripciones', uid), { paidThrough: Timestamp.fromMillis(Date.now() - 1000) }); });
    await expect(saveProject(input('paid-project', 1))).rejects.toThrow('suscripción');
    await saveProject(input(freeId, 2));
    expect((await loadProject('paid-project')).revision).toBe(1);
  } finally { await env.withSecurityRulesDisabled(async context => { await deleteDoc(doc(context.firestore(), 'configuracion', 'facturacion')); }); }
});
it('gives only the verified designated administrator unlimited own projects', async () => {
  const adminUid = 'administrator-demo';
  await env.withSecurityRulesDisabled(async context => { await setDoc(doc(context.firestore(), 'administradores', adminUid), { enabled: true }); });
  await env.withSecurityRulesDisabled(async context => { await setDoc(doc(context.firestore(), 'configuracion', 'facturacion'), { enabled: true }); });
  const base = (await getDoc(ref('first'))).data(), version = (await getDoc(doc(ref('first'), 'versiones', '1'))).data();
  try {
    for (const verified of [true, false]) {
      const database = env.authenticatedContext(adminUid, { email: 'admin@example.invalid', email_verified: verified }).firestore();
      for (const id of ['admin-a', 'admin-b']) {
        const batch = writeBatch(database), target = doc(database, 'cuentas', adminUid, 'proyectos', id);
        batch.set(target, { ...base, ownerUid: adminUid, revision: 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        batch.set(doc(target, 'versiones', '1'), { ...version, name: base.name, revision: 1, createdAt: serverTimestamp() });
        if (verified) await batch.commit(); else await assertFails(batch.commit());
      }
      await assertFails(getDoc(doc(database, 'cuentas', uid, 'proyectos', 'first')));
    }
  } finally { await env.withSecurityRulesDisabled(async context => { await deleteDoc(doc(context.firestore(), 'configuracion', 'facturacion')); }); }
});
it('versions drawings with budgets and does not confuse changed drawings with a successful retry', async () => {
  const data = { ...input('drawing'), sketch: { ...emptySketch(), rooms: [{ id: 'room', levelId: 'planta-baja', name: 'Cocina', x: 0, y: 0, width: 4, depth: 3, points: [{ id: 'p', type: 'toma', x: 0.3, y: 0.6 }] }] } };
  data.sketch.quote = { ...emptyQuoteSettings(), heights: { toma: 0.4, llave: 1.1, techo: 2.8 }, board: 'tp_mono' };
  data.sketch.equipment = [{ id: 'meter', type: 'medidor_tp', name: 'Pilar', levelId: 'planta-baja', x: 0, y: 0, itemId: 'pilar' }, { id: 'tg', type: 'general', name: 'General', levelId: 'planta-baja', x: 6, y: 8, itemId: 'seccional_8' }];
  data.sketch.feeders = [{ id: 'feed', fromId: 'meter', toId: 'tg', bends: [{ x: 0, y: 8 }], verticalMeters: 2, itemId: 'subterraneo_tierra' }];
  await saveProject(data); await saveProject(data);
  expect((await loadProject('drawing')).version.sketch).toEqual(data.sketch);
  const next = structuredClone(data); next.sketch.rooms[0].width = 6;
  await expect(saveProject(next)).rejects.toThrow('otra pestaña');
  next.expectedRevision = 1; await saveProject(next);
  expect((await loadProjectVersion('drawing', 1)).sketch.rooms[0].width).toBe(4);
  expect((await loadProject('drawing')).version.sketch.rooms[0].width).toBe(6);
  expect((await loadProjectVersion('first', 1)).sketch).toBeNull();
  const other = env.authenticatedContext('drawing-intruder', { email: 'other@example.invalid', email_verified: true }).firestore();
  await assertFails(getDoc(doc(other, 'cuentas', uid, 'proyectos', 'drawing', 'versiones', '1')));
  const old = (await getDoc(ref('drawing'))).data(), version = (await getDoc(doc(ref('drawing'), 'versiones', '2'))).data();
  for (const sketch of [{ schema: 1 }, 'x'.repeat(80001)]) {
    const target = ref('bad-drawing'), batch = writeBatch(db);
    batch.set(target, { ...old, revision: 1, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    batch.set(doc(target, 'versiones', '1'), { ...version, revision: 1, sketch, createdAt: serverTimestamp() });
    await assertFails(batch.commit());
  }
  expect(encodeSketch(next.sketch)).toBeTypeOf('string');
});
it('saves material networks with immutable budget versions using the existing owner-scoped rules', async () => {
  const data = { ...input('material-network'), sketch: { ...emptySketch(), schema: 2,
    rooms: [{ id: 'room', levelId: 'planta-baja', name: 'Estar', x: 0, y: 0, width: 4, depth: 3,
      points: [{ id: 'p1', type: 'luminaria', x: 0, y: 0 }, { id: 'p2', type: 'toma', x: 1, y: 1 }] }],
    materials: { ...emptyMaterialNetwork(), circuits: [{ id: 'c1', name: 'Luces', type: 'IUG' }], routes: [
      { id: 'r1', fromId: 'p1', toId: 'p2', feederId: null, bends: [], verticalMeters: 2, conduit: 'Caño elegido',
        assignments: [{ circuitId: 'c1', wires: [{ role: 'phase', section: 2.5, count: 1 }] }] },
    ] } } };
  await saveProject(data);
  expect((await loadProject('material-network')).version.sketch).toEqual(data.sketch);
  const next = structuredClone(data); next.expectedRevision = 1; next.sketch.materials.reservePercent = 20;
  next.sketch.materials.calculation = { profile: 'cu-pvc-b1-v1', voltage: 220, limitPercent: 2, totalLimitPercent: 3, feederLimitPercent: 1, upstreamPercent: 0.2, correctionFactor: 1, boardHeight: 1.5 };
  next.sketch.levels.push({ id: 'upper', name: 'Alta', elevation: 3.2 });
  next.sketch.rooms.push({ id: 'up-room', levelId: 'upper', name: 'Dormitorio', x: 2, y: 1, width: 4, depth: 3, points: [{ id: 'up-light', type: 'luminaria', x: 0.5, y: 0.5 }] });
  next.sketch.materials.routes.push({ id: 'cross-floor', fromId: 'p1', toId: 'up-light', feederId: null, bends: [{ x: 1, y: 0, levelId: 'planta-baja' }, { x: 1, y: 1, levelId: 'upper' }], verticalMeters: 0, conduit: '', assignments: [] });
  await saveProject(next);
  expect((await loadProjectVersion('material-network', 1)).sketch.materials.reservePercent).toBe(0);
  expect((await loadProject('material-network')).version.sketch.materials.reservePercent).toBe(20);
  expect((await loadProject('material-network')).version.sketch).toEqual(next.sketch);
  expect((await loadProjectVersion('material-network', 1)).sketch.levels).toHaveLength(1);
  await assertFails(updateDoc(doc(ref('material-network'), 'versiones', '1'), { sketch: encodeSketch(next.sketch) }));
});
it('refuses writes and reads after logout', async () => {
  await signOut(auth); await expect(saveProject(input('no-session'))).rejects.toThrow('sesión'); await expect(listProjects()).rejects.toThrow('sesión');
});
