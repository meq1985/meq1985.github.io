import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
export async function createProtectedUser(email, password, token) {
  if (import.meta.env.VITE_USE_EMULATORS === 'true') return createUserWithEmailAndPassword(auth, email, password);
  if (!token) throw new Error('Completá la verificación de seguridad.');
  const { getFunctions, httpsCallable } = await import('firebase/functions');
  await httpsCallable(getFunctions(auth.app, 'us-central1'), 'registerAccount')({ email, password, token, consent: true });
  return signInWithEmailAndPassword(auth, email, password);
}
