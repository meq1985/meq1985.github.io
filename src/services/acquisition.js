import { collection, getDocsFromServer, query, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase';
import { requireUser, assertCurrentUser } from '../firebase/session';
export async function loadAcquisitionDays() {
  const user = await requireUser();
  const page = await getDocsFromServer(query(collection(db, 'acquisitionDays'), orderBy('__name__', 'desc'), limit(31)));
  assertCurrentUser(user);
  return page.docs.map(row => ({ day: row.id, ...row.data() }));
}
