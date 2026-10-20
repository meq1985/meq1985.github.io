import { onAuthStateChanged } from 'firebase/auth';
import { auth } from './index';

let ready;
export function waitForAuth() {
  if (!ready) {
    ready = new Promise((resolve, reject) => {
      const unsubscribe = onAuthStateChanged(auth, () => {
        unsubscribe();
        resolve();
      }, reject);
    }).catch(error => { ready = undefined; throw error; });
  }
  return ready;
}

export async function requireUser({ verified = true, email } = {}) {
  await waitForAuth();
  const user = auth.currentUser;
  if (!user || !user.email || (verified && !user.emailVerified)) {
    throw new Error('Iniciá sesión con un correo verificado para continuar.');
  }
  if (email && email !== user.email) throw new Error('No podés acceder a otra cuenta.');
  return user;
}

export function assertCurrentUser(user) {
  if (auth.currentUser?.uid !== user.uid) throw new Error('La sesión cambió. Volvé a intentar.');
}
