// PDFs and source data stay on this browser. No Firebase Storage or paid services.
function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('presupuestos-electricos-v2', 1);
    request.onupgradeneeded = () => {
      const store = request.result.createObjectStore('budgets', { keyPath: 'id' });
      store.createIndex('owner', 'owner');
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

async function transaction(mode, action) {
  const db = await openDatabase();
  try {
    return await new Promise((resolve, reject) => {
      const tx = db.transaction('budgets', mode);
      let result;
      tx.oncomplete = () => resolve(result);
      tx.onerror = () => reject(tx.error);
      tx.onabort = () => reject(tx.error || new Error('No se pudo guardar el presupuesto.'));
      action(tx.objectStore('budgets'), value => { result = value; });
    });
  } finally { db.close(); }
}

export function saveBudget(owner, budget, pdf) {
  if (!owner) throw new Error('Falta la cuenta del usuario.');
  const record = { ...budget, owner, pdf, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  return transaction('readwrite', (store, done) => { store.add(record); done(record); });
}

export function listBudgets(owner) {
  if (!owner) throw new Error('Falta la cuenta del usuario.');
  return transaction('readonly', (store, done) => {
    const request = store.index('owner').getAll(owner);
    request.onsuccess = () => done(request.result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
  });
}

export function deleteBudget(owner, id) {
  return transaction('readwrite', (store, done) => {
    const request = store.get(id);
    request.onsuccess = () => {
      if (request.result?.owner === owner) store.delete(id);
      done();
    };
  });
}

export function downloadBudget(record) {
  const url = URL.createObjectURL(record.pdf);
  const link = document.createElement('a');
  link.href = url;
  link.download = `presupuesto-${record.cliente.replace(/[^a-zA-Z0-9_-]/g, '_')}.pdf`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
