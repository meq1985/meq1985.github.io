// Only confirmed server milestones, never arbitrary browser events or PII.
export const ACQUISITION_STAGES = ['registrations', 'trials', 'firstProjects', 'firstSubscriptions'];
export async function recordAcquisition({ db, uid, stage, now = Date.now() }) {
  if (!uid || !ACQUISITION_STAGES.includes(stage)) throw new Error('invalid-milestone');
  const account = db.doc(`acquisitionAccounts/${uid}`);
  const day = new Date(now).toISOString().slice(0, 10); // UTC, stated explicitly in the dashboard.
  const daily = db.doc(`acquisitionDays/${day}`);
  return db.runTransaction(async tx => {
    const [marker, admin, tester] = await Promise.all([
      tx.get(account), tx.get(db.doc(`administradores/${uid}`)), tx.get(db.doc(`billingTesters/${uid}`)),
    ]);
    if (admin.data()?.enabled === true || tester.exists || marker.data()?.[stage]) return false;
    // Do not backfill older accounts as newly acquired customers.
    if (stage !== 'registrations' && !marker.data()?.registrations) return false;
    const summary = await tx.get(daily);
    tx.set(account, { [stage]: now }, { merge: true });
    tx.set(daily, { [stage]: (summary.data()?.[stage] ?? 0) + 1 }, { merge: true });
    return true;
  });
}
