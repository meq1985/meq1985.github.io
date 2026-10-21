import { collection, doc, getDocFromServer, getDocsFromServer, query, orderBy, limit, startAfter, runTransaction, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { requireUser, assertCurrentUser } from '../firebase/session';
import { projectBudget, projectProfile, projectName, validProjectId, validRevision } from './projectValidation';

export const newProjectId = () => crypto.randomUUID();
const projects = user => collection(db, 'cuentas', user.uid, 'proyectos');
const projectRef = (user, id) => doc(projects(user), validProjectId(id));
const versionRef = (reference, revision) => doc(reference, 'versiones', String(validRevision(revision)));
const offlineError = error => {
  if (['unavailable', 'deadline-exceeded', 'failed-precondition'].includes(error.code)) return new Error('No se pudo confirmar el guardado en la cuenta. Revisá tu conexión y reintentá sin cerrar el proyecto.');
  return error;
};
function versionData(snapshot) {
  if (!snapshot.exists()) throw new Error('No se encontró esa versión del proyecto.');
  const data = snapshot.data();
  return { ...data, budget: projectBudget(data.budget), profile: data.profile === null ? null : projectProfile(data.profile, data.profile?.correo) };
}
export async function listProjects(cursor = null) {
  const user = await requireUser();
  const page = await getDocsFromServer(query(projects(user), orderBy('updatedAt', 'desc'), ...(cursor ? [startAfter(cursor)] : []), limit(20)));
  assertCurrentUser(user);
  return { items: page.docs.map(item => ({ id: item.id, ...item.data() })), cursor: page.docs.at(-1) ?? null, hasMore: page.size === 20 };
}
export async function loadProject(id) {
  const user = await requireUser();
  const reference = projectRef(user, id);
  const metadata = await getDocFromServer(reference);
  if (!metadata.exists()) throw new Error('No se encontró el proyecto en tu cuenta.');
  const version = versionData(await getDocFromServer(versionRef(reference, metadata.data().revision)));
  assertCurrentUser(user);
  return { id, ...metadata.data(), version };
}
export async function listProjectVersions(id, cursor = null) {
  const user = await requireUser();
  const page = await getDocsFromServer(query(collection(projectRef(user, id), 'versiones'), orderBy('revision', 'desc'), ...(cursor ? [startAfter(cursor)] : []), limit(10)));
  assertCurrentUser(user);
  return { items: page.docs.map(versionData), cursor: page.docs.at(-1) ?? null, hasMore: page.size === 10 };
}
export async function loadProjectVersion(id, revision) {
  const user = await requireUser();
  const version = versionData(await getDocFromServer(versionRef(projectRef(user, id), revision)));
  assertCurrentUser(user);
  return version;
}

async function writeProject(user, input) {
  const budget = projectBudget(input.budget);
  const name = projectName(input.name, budget.cliente);
  const profile = input.profile === null ? null : projectProfile(input.profile, user.email);
  const sourceLocalId = input.sourceLocalId ?? null;
  const expected = input.expectedRevision;
  if (!Number.isSafeInteger(expected) || expected < 0) throw new Error('Recargá el proyecto antes de guardar.');
  const revision = validRevision(expected + 1);
  const reference = projectRef(user, input.id);
  const target = versionRef(reference, revision);
  const payload = { schema: 1, revision, name, budget, profile, sourceLocalId };
  try {
    await runTransaction(db, async transaction => {
      const [existing, previous] = await Promise.all([transaction.get(reference), transaction.get(target)]);
      assertCurrentUser(user);
      const current = existing.data();
      // Import is idempotent even after the imported project has been edited elsewhere.
      if (sourceLocalId && current?.sourceLocalId === sourceLocalId) return;
      // A retry after a lost response recognizes the exact same committed version.
      if (current?.revision === revision && previous.exists()) {
        const saved = previous.data();
        if (JSON.stringify({ ...payload, budget: projectBudget(saved.budget), profile: saved.profile === null ? null : projectProfile(saved.profile, saved.profile?.correo), name: saved.name, sourceLocalId: saved.sourceLocalId }) === JSON.stringify(payload)) return;
      }
      if ((current?.revision ?? 0) !== expected || previous.exists() || (expected && !existing.exists())) {
        throw new Error('El proyecto cambió en otra pestaña o dispositivo. Guardá una copia local de tus cambios y volvé a abrir el proyecto desde Mis proyectos.');
      }
      if (current && current.ownerUid !== user.uid) throw new Error('El proyecto no corresponde a tu cuenta.');
      const now = serverTimestamp();
      transaction.set(target, { ...payload, createdAt: now });
      const metadata = { name, cliente: budget.cliente, tipoInmueble: budget.tipoInmueble ?? '', total: budget.total, revision, updatedAt: now };
      if (existing.exists()) transaction.update(reference, metadata);
      else transaction.set(reference, { ...metadata, schema: 1, ownerUid: user.uid, createdAt: now, sourceLocalId });
    });
    assertCurrentUser(user);
    return { id: input.id, revision };
  } catch (error) { throw offlineError(error); }
}
export async function saveProject(input) {
  const user = await requireUser();
  return writeProject(user, { ...input, sourceLocalId: null, profile: input.profile ?? {} });
}
export async function importLocalBudget(record) {
  const user = await requireUser();
  if (record.owner !== user.uid) throw new Error('El presupuesto local no corresponde a tu cuenta.');
  const localId = validProjectId(record.id);
  const id = validProjectId('local_' + localId);
  await writeProject(user, { id, expectedRevision: 0, name: record.cliente, budget: record, profile: null, sourceLocalId: localId });
  return id;
}
