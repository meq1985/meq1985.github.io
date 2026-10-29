import { createHmac } from 'node:crypto';
export const REGISTRATION_HOSTS = ['electricistaxpress.com.ar', 'www.electricistaxpress.com.ar'];
export function validRegistration(data) {
  return data?.consent === true && typeof data.email === 'string' && data.email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email) &&
    typeof data.password === 'string' && data.password.length >= 6 && data.password.length <= 128 &&
    typeof data.token === 'string' && data.token.length > 0 && data.token.length <= 2048;
}
export async function verifyRegistration(secret, token, fetcher = fetch) {
  const response = await fetcher('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, redirect: 'error', signal: AbortSignal.timeout(8000),
    body: JSON.stringify({ secret, response: token }),
  });
  if (!response.ok) return false;
  const result = await response.json();
  return result.success === true && result.action === 'signup' && REGISTRATION_HOSTS.includes(result.hostname);
}
export function registrationCounter(current, now, maximum) {
  const expired = !current || now >= current.startedAt.toMillis() + 86400000;
  const count = expired ? 1 : current.count + 1;
  if (count > maximum) throw new Error('registration-limit');
  return { count, startedAt: expired ? now : current.startedAt.toMillis() };
}
export async function registerProtected({ data, ip, secret, db, auth, Timestamp, verify = verifyRegistration }) {
  if (!validRegistration(data)) throw new Error('invalid-registration');
  // Validate the single-use token before accessing the database or Authentication.
  if (!await verify(secret, data.token)) throw new Error('invalid-challenge');
  const hash = createHmac('sha256', secret).update(ip || 'unknown').digest('hex');
  const global = db.doc('registrationLimits/global'), address = db.doc('registrationLimits/ip-' + hash);
  await db.runTransaction(async tx => {
    const [g, a] = await Promise.all([tx.get(global), tx.get(address)]), now = Date.now();
    const globalUsage = registrationCounter(g.data(), now, 25), ipUsage = registrationCounter(a.data(), now, 3);
    tx.set(global, { count: globalUsage.count, startedAt: Timestamp.fromMillis(globalUsage.startedAt) });
    tx.set(address, { count: ipUsage.count, startedAt: Timestamp.fromMillis(ipUsage.startedAt), expiresAt: Timestamp.fromMillis(now + 7 * 86400000) });
  });
  try { await auth.createUser({ email: data.email.trim(), password: data.password }); }
  catch (error) { if (error.code !== 'auth/email-already-exists') throw new Error('registration-failed'); }
  // Do not reveal whether the email already exists. The client must authenticate.
  return { accepted: true };
}
